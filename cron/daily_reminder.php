<?php
/**
 * ZeeHash Daily Tracker - Evening Care Reminder Cron Job
 * 
 * Scheduled to run on Hostinger before 10:00 PM CST (e.g., 9:00 PM or 9:30 PM CST)
 * 
 * Hostinger Cron Command:
 * /usr/bin/php /home/USER/public_html/cron/daily_reminder.php >> /home/USER/public_html/cron/cron.log 2>&1
 * 
 * Or via Secure HTTP:
 * https://zeba.zeehash.com/cron/daily_reminder.php?token=zeehash_care_cron_2026
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/SmtpMailer.php';
require_once __DIR__ . '/EmailTemplate.php';

// Check execution authorization
$isCli = (php_sapi_name() === 'cli');
$passedToken = $_GET['token'] ?? '';
$isForce = isset($_GET['force']) || (isset($argv) && in_array('--force', $argv));
$isTest = isset($_GET['test']) || (isset($argv) && in_array('--test', $argv));

if (!$isCli && $passedToken !== CRON_SECURITY_TOKEN) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden. Invalid security token.']);
    exit;
}

// Log helper
function cron_log($msg) {
    $timestamp = date('Y-m-d H:i:s T');
    echo "[{$timestamp}] {$msg}\n";
}

cron_log("=== ZeeHash Evening Care Cron Started ===");

$pdo = get_db_connection();
$settings = get_master_settings($pdo);

$childName = !empty($settings['z_name']) ? trim($settings['z_name']) : 'Child';
$email1 = trim($settings['parent_email_1'] ?? '');
$email2 = trim($settings['parent_email_2'] ?? '');

$recipients = [];
if ($email1 && filter_var($email1, FILTER_VALIDATE_EMAIL)) $recipients[] = $email1;
if ($email2 && filter_var($email2, FILTER_VALIDATE_EMAIL) && !in_array($email2, $recipients)) $recipients[] = $email2;

if (empty($recipients)) {
    cron_log("[WARNING] No parent email addresses found in master_settings. Add them via Admin > Profile.");
    if (!$isTest) {
        exit(0);
    }
    $recipients = ['parent-preview@example.com'];
}

$today = date('Y-m-d');
$currentTimeFormatted = date('g:i A T');

// Deduplication check (unless forced)
if (file_exists(CRON_LOCK_FILE) && !$isForce && !$isTest) {
    $lockData = json_decode(@file_get_contents(CRON_LOCK_FILE), true);
    if (isset($lockData['last_date']) && $lockData['last_date'] === $today) {
        cron_log("[INFO] Reminder email has already been sent for today ({$today}). Pass --force to resend.");
        exit(0);
    }
}

// -------------------------------------------------------------
// 1. Check if Today's Log Exists
// -------------------------------------------------------------
$stmt = $pdo->prepare("SELECT * FROM z_logs WHERE log_date = ? LIMIT 1");
$stmt->execute([$today]);
$todayLog = $stmt->fetch();

$isTodayMissing = empty($todayLog);
$todayMood = $todayLog ? trim($todayLog['overall_mood'] ?? '') : '';
$todaySleep = $todayLog ? (float)($todayLog['sleep_hours'] ?? 0) : 0;

if ($isTodayMissing) {
    cron_log("[STATUS] Today's log ({$today}) has not been submitted yet before 10:00 PM CST. Sending missing alert + yesterday summary.");
} else {
    cron_log("[STATUS] Today's log ({$today}) is already logged (Mood: {$todayMood}). Sending daily care summary & routine analysis.");
}

// -------------------------------------------------------------
// 2. Fetch and Analyze the Last Day Log
// -------------------------------------------------------------
$stmtLast = $pdo->prepare("SELECT * FROM z_logs WHERE log_date < ? ORDER BY log_date DESC LIMIT 1");
$stmtLast->execute([$today]);
$lastLog = $stmtLast->fetch();

$hasLastLog = !empty($lastLog);
$lastDate = $lastLog['log_date'] ?? 'N/A';
$lastMood = trim($lastLog['overall_mood'] ?? 'Not Recorded');
$lastSleep = (float)($lastLog['sleep_hours'] ?? 0);
$lastNotes = $lastLog ? trim($lastLog['notes'] ?? '') : '';
$lastMenstruating = !empty($lastLog['is_menstruating']);
$lastFlow = $lastLog['flow_intensity'] ?? 'Medium';

// Detailed items given/performed on last day
$doneMeds = $lastLog ? (json_decode($lastLog['medications_json'] ?: '[]', true) ?: []) : [];
$doneSensory = $lastLog ? (json_decode($lastLog['sensory_behavior_json'] ?: '[]', true) ?: []) : [];
$doneInterventions = $lastLog ? (json_decode($lastLog['interventions_json'] ?: '[]', true) ?: []) : [];
$doneFood = $lastLog ? (json_decode($lastLog['food_json'] ?: '[]', true) ?: []) : [];
$allLastActivities = $lastLog ? (json_decode($lastLog['activities_json'] ?: '[]', true) ?: []) : [];

// Retrieve master lists categories for accurate classification
$creativeCatalog = ['Music Class', 'Keyboard', 'Speech'];
$exerciseCatalog = ['Pickleball', 'Badminton', 'Yoga', 'Exercise General', 'Walk'];

try {
    $masterGrouped = get_master_list_items($pdo, false);
    if (!empty($masterGrouped['activity'])) {
        $creativeCatalog = array_column($masterGrouped['activity'], 'item_name');
    }
    if (!empty($masterGrouped['exercise'])) {
        $exerciseCatalog = array_column($masterGrouped['exercise'], 'item_name');
    }
} catch (Exception $e) {
    // Keep defaults
}

$doneCreative = array_values(array_intersect($allLastActivities, $creativeCatalog));
$doneExercise = array_values(array_intersect($allLastActivities, $exerciseCatalog));

$missedInterventions = empty($doneInterventions);
$missedCreative = empty($doneCreative);
$missedExercise = empty($doneExercise);

cron_log("Last Log Date: {$lastDate} | Mood: {$lastMood} | Sleep: {$lastSleep} hrs");
cron_log("Medications: " . (empty($doneMeds) ? 'None' : implode(', ', $doneMeds)));
cron_log("Interventions Given: " . ($missedInterventions ? 'MISSED / NONE' : implode(', ', $doneInterventions)));
cron_log("Creative Skills: " . ($missedCreative ? 'MISSED' : implode(', ', $doneCreative)));
cron_log("Exercise & Play: " . ($missedExercise ? 'MISSED' : implode(', ', $doneExercise)));

// -------------------------------------------------------------
// 3. Generate Clinical Rationale Based on Recorded Mood
// -------------------------------------------------------------
$clinicalRationales = [];
$normMood = strtolower($lastMood);

if (in_array($normMood, ['aggressive', 'sensory overload', 'anxiety', 'hyperactive'])) {
    if ($missedInterventions) {
        $clinicalRationales[] = "<strong>Calming Interventions are Essential during \"{$lastMood}\" episodes:</strong> {$childName}'s central nervous system was in fight-or-flight. Applying tactile deep pressure (joint compression, weighted blanket cocooning) and noise dampening (earmuffs) triggers the parasympathetic nervous system, lowering cortisol and halting sensory escalation before prolonged meltdowns.";
    }
    if ($missedExercise) {
        $clinicalRationales[] = "<strong>Heavy Work & Physical Movement releases motor tension:</strong> Agility movement (pickleball, gross motor walks, agility badminton) provides crucial proprioceptive feedback that burns off motor restlessness and helps {$childName} settle into deep evening sleep.";
    }
    if ($missedCreative) {
        $clinicalRationales[] = "<strong>Creative Structured Rhythm redirects cognitive fixation:</strong> Structured rhythm (music class, keyboard repetition, speech therapy) channels agitated neurodivergent energy into orderly, predictable sensory patterns.";
    }
} elseif (in_array($normMood, ['withdrawn', 'sad', 'tired'])) {
    if ($missedInterventions) {
        $clinicalRationales[] = "<strong>Gentle Sensory Grounding restores nervous system security:</strong> Neutral warmth (warm neck wrap, weighted shoulder blanket) provides soothing, non-demanding sensory safety for a withdrawn state.";
    }
    if ($missedExercise) {
        $clinicalRationales[] = "<strong>Gentle Aerobic Movement boosts serotonin & circulation:</strong> Low-pressure movement (short sensory walk, gentle yoga stretching) oxygenates the brain and lifts withdrawn moods without triggering sensory overwhelm.";
    }
    if ($missedCreative) {
        $clinicalRationales[] = "<strong>Music & Expression stimulate positive dopamine:</strong> Non-verbal keyboard or music listening invites gentle emotional reconnection without conversational pressure.";
    }
} else {
    // Calm, Happy, or default
    if ($missedInterventions) {
        $clinicalRationales[] = "<strong>Proactive Calming preserves emotional regulation:</strong> Even when {$childName} is calm and happy, maintaining consistent calming routines strengthens their emotional resilience for unexpected sensory changes.";
    }
    if ($missedExercise) {
        $clinicalRationales[] = "<strong>Daily Gross Motor Exercise maintains circadian sleep rhythm:</strong> Consistent daily physical play maintains joint stability and ensures smooth melatonin onset at night.";
    }
    if ($missedCreative) {
        $clinicalRationales[] = "<strong>Creative Practice on Happy Days accelerates learning retention:</strong> Fine motor skills (keyboard, speech practice) assimilate 3x faster when the brain is happy and relaxed.";
    }
}

if (empty($clinicalRationales)) {
    $clinicalRationales[] = "<strong>Outstanding Consistency:</strong> All core calming interventions, creative activities, and physical exercises were actively logged on {$lastDate}. Keep up this wonderful routine!";
}

// -------------------------------------------------------------
// 4. Render Email Template
// -------------------------------------------------------------
$subject = $isTodayMissing 
    ? "🚨 Reminder: {$childName}'s Daily Care Log Missing ({$today}) • Evening Routine Check"
    : "📊 Care Summary: {$childName}'s Daily Report & Mood Analysis ({$lastDate})";

$htmlBody = EmailTemplate::render([
    'child_name' => $childName,
    'today_date' => date('l, F j, Y'),
    'current_time' => $currentTimeFormatted,
    'app_url' => APP_URL,
    'is_today_missing' => $isTodayMissing,
    'today_mood' => $todayMood,
    'today_sleep' => $todaySleep,
    'has_last_log' => $hasLastLog,
    'last_date' => $lastDate,
    'last_mood' => $lastMood,
    'last_sleep' => $lastSleep,
    'last_notes' => $lastNotes,
    'last_menstruating' => $lastMenstruating,
    'last_flow' => $lastFlow,
    'done_meds' => $doneMeds,
    'done_sensory' => $doneSensory,
    'done_interventions' => $doneInterventions,
    'done_creative' => $doneCreative,
    'done_exercise' => $doneExercise,
    'done_food' => $doneFood,
    'missed_interventions' => $missedInterventions,
    'missed_creative' => $missedCreative,
    'missed_exercise' => $missedExercise,
    'clinical_rationales' => $clinicalRationales
]);

// Always save a local preview HTML file for inspection
$previewFile = __DIR__ . '/preview_latest_email.html';
file_put_contents($previewFile, $htmlBody);
cron_log("Saved rendered email preview to: {$previewFile}");

// -------------------------------------------------------------
// 5. Send via SMTP
// -------------------------------------------------------------
cron_log("Connecting to SMTP: " . CRON_SMTP_HOST . ":" . CRON_SMTP_PORT . " (" . CRON_SMTP_SECURE . ") as " . CRON_SMTP_USER);

$mailer = new SmtpMailer(
    CRON_SMTP_HOST,
    CRON_SMTP_PORT,
    CRON_SMTP_SECURE,
    CRON_SMTP_USER,
    CRON_SMTP_PASS
);

$success = $mailer->send(
    $recipients,
    $subject,
    $htmlBody,
    CRON_FROM_EMAIL,
    CRON_FROM_NAME
);

if ($success) {
    cron_log("[SUCCESS] Email sent successfully to: " . implode(', ', $recipients));
    // Write lock file
    file_put_contents(CRON_LOCK_FILE, json_encode([
        'last_date' => $today,
        'timestamp' => date('c'),
        'recipients' => $recipients
    ]));
} else {
    cron_log("[NOTICE] Email sending completed with notes:");
    foreach ($mailer->getDebugLog() as $line) {
        cron_log("   {$line}");
    }
    cron_log("ℹ Note: When ready, set your Hostinger email password in cron/config.php or environment variable SMTP_PASS.");
}

cron_log("=== ZeeHash Evening Care Cron Finished ===");
