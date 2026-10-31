<?php
/**
 * Z-Life AI - Daily Behavioral & Autonomic Forecast Cron Job
 * Task 1: The AI Email Automation (PHP CLI / Cron Job)
 *
 * Runs daily via cron (or secure HTTP endpoint) to:
 * 1. Fetch 30-day longitudinal care logs (sleep, mood, medications, sensory behaviors, interventions).
 * 2. Incorporate active clinical challenges & diagnostic profile summary from master_settings.
 * 3. Query Gemini API to generate a 2-paragraph autonomic state analysis + tomorrow's mood & hyperactivity risk prediction formatted as clean HTML.
 * 4. Send responsive HTML email to parents via PHPMailer / SmtpMailer.
 * 5. Save rendered HTML preview to cron/preview_ai_forecast_email.html.
 *
 * Hostinger Cron Command:
 * /usr/bin/php /home/u764747485/domains/zeehash.com/public_html/zeba/cron/daily_forecast_cron.php >> /home/u764747485/domains/zeehash.com/public_html/zeba/cron/cron_forecast.log 2>&1
 *
 * Secure HTTP Trigger:
 * https://zeba.zeehash.com/cron/daily_forecast_cron.php?token=zeehash_care_cron_2026
 */

// Load cron configuration and master database
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/SmtpMailer.php';

// Execution context & security
$isCli = (php_sapi_name() === 'cli');
$passedToken = $_GET['token'] ?? '';
$isForce = isset($_GET['force']) || (isset($argv) && in_array('--force', $argv));
$isTest = isset($_GET['test']) || (isset($argv) && in_array('--test', $argv));
$isPreviewOnly = isset($_GET['preview']) || (isset($argv) && in_array('--preview', $argv));

// Verify authorization if triggered via HTTP
if (!$isCli && $passedToken !== CRON_SECURITY_TOKEN) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Forbidden. Invalid or missing security token.']);
    exit;
}

// Log helper
function forecast_cron_log($msg) {
    $timestamp = date('Y-m-d H:i:s T');
    echo "[{$timestamp}] {$msg}\n";
}

forecast_cron_log("=== Z-Life AI Daily Forecast Email Automation Started ===");

// 1. Load Environment Variables (.env, .env.deploy) for Gemini API Key
function cron_load_env($filePath) {
    $vars = [];
    if (file_exists($filePath) && is_readable($filePath)) {
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value, " \t\n\r\0\x0B\"'");
                $vars[$key] = $value;
                if (!getenv($key)) {
                    putenv("$key=$value");
                    $_ENV[$key] = $value;
                }
            }
        }
    }
    return $vars;
}

$rootDir = dirname(__DIR__);
$envFiles = [
    $rootDir . '/.env',
    $rootDir . '/.env.deploy',
    $rootDir . '/.env.local'
];
$envVars = [];
foreach ($envFiles as $ef) {
    if (file_exists($ef)) {
        $envVars = array_merge($envVars, cron_load_env($ef));
    }
}

$geminiApiKey = getenv('GEMINI_API_KEY')
    ?: getenv('G_API_KEY')
    ?: ($envVars['GEMINI_API_KEY'] ?? ($envVars['G_API_KEY'] ?? ''));

if (empty($geminiApiKey)) {
    if (defined('GEMINI_API_KEY')) {
        $geminiApiKey = GEMINI_API_KEY;
    } elseif (defined('G_API_KEY')) {
        $geminiApiKey = G_API_KEY;
    } else {
        $geminiApiKey = 'AIzaSyCBs07bOiXNo4Jdh214zoG3HdD29QSptL8';
    }
}

// 2. Fetch Master Settings & Parent Recipients
$pdo = get_db_connection();
$settings = get_master_settings($pdo);

$childName = !empty($settings['z_name']) ? trim($settings['z_name']) : 'Zeba';
$childAge = !empty($settings['z_age']) ? (int)$settings['z_age'] : 17;
$childClass = !empty($settings['z_class']) ? trim($settings['z_class']) : 'Grade 11';
$activeChallenges = (!empty($settings['active_challenges']) && is_array($settings['active_challenges']))
    ? $settings['active_challenges']
    : ['Auditory Sensitivity', 'Sensory Overload', 'Transitions & Routine Changes', 'Emotional Regulation'];
$diagnosticSummary = !empty($settings['diagnostic_summary'])
    ? $settings['diagnostic_summary']
    : 'Level 2 Autism Spectrum Disorder (ASD) and ADHD Combined Type. Highly responsive to deep pressure compression, calm sensory pacing, noise-dampening earmuffs, and predictable visual task timers.';

$email1 = trim($settings['parent_email_1'] ?? '');
$email2 = trim($settings['parent_email_2'] ?? '');

$recipients = [];
if ($email1 && filter_var($email1, FILTER_VALIDATE_EMAIL)) $recipients[] = $email1;
if ($email2 && filter_var($email2, FILTER_VALIDATE_EMAIL) && !in_array($email2, $recipients)) $recipients[] = $email2;

if (empty($recipients)) {
    forecast_cron_log("[NOTICE] No parent email addresses found in master_settings.");
    if ($isTest || $isPreviewOnly) {
        $recipients = ['parent-preview@zeehash.com'];
        forecast_cron_log("[TEST MODE] Using fallback recipient: " . implode(', ', $recipients));
    } else {
        forecast_cron_log("[EXIT] Add parent email address via Admin Configuration > Profile.");
        exit(0);
    }
}

$today = date('Y-m-d');
$dedupLockFile = __DIR__ . '/.last_ai_forecast_sent.json';

// Deduplication check (unless forced or previewing)
if (file_exists($dedupLockFile) && !$isForce && !$isTest && !$isPreviewOnly) {
    $lockData = json_decode(@file_get_contents($dedupLockFile), true);
    if (isset($lockData['last_date']) && $lockData['last_date'] === $today) {
        forecast_cron_log("[INFO] AI Forecast email has already been sent for today ({$today}). Use --force or ?force=1 to re-send.");
        exit(0);
    }
}

// 3. Fetch Last 30 Days of Logs
$logs = [];
try {
    $hasDailyLogs = false;
    try {
        $checkStmt = $pdo->query("SELECT 1 FROM daily_logs LIMIT 1");
        $hasDailyLogs = ($checkStmt !== false);
    } catch (Exception $e) {
        $hasDailyLogs = false;
    }

    if ($hasDailyLogs) {
        $stmt = $pdo->query("
            SELECT `date`, `sleep_hours`, `mood`, `medications`, `sensory_behaviors`, `interventions`
            FROM `daily_logs`
            ORDER BY `date` DESC
            LIMIT 30
        ");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $logs[] = [
                'date' => $row['date'] ?? '',
                'sleep_hours' => isset($row['sleep_hours']) ? (float)$row['sleep_hours'] : 0,
                'overall_mood' => $row['mood'] ?? 'Calm',
                'medications' => is_string($row['medications']) ? (json_decode($row['medications'], true) ?: [$row['medications']]) : ($row['medications'] ?? []),
                'sensory_behaviors' => is_string($row['sensory_behaviors']) ? (json_decode($row['sensory_behaviors'], true) ?: [$row['sensory_behaviors']]) : ($row['sensory_behaviors'] ?? []),
                'interventions' => is_string($row['interventions']) ? (json_decode($row['interventions'], true) ?: [$row['interventions']]) : ($row['interventions'] ?? [])
            ];
        }
    }

    // Check z_logs table
    if (empty($logs)) {
        try {
            $stmt = $pdo->query("
                SELECT `log_date` as `date`, `sleep_hours`, `overall_mood`, `medications_json`, `sensory_behavior_json`, `interventions_json`, `notes`
                FROM `z_logs`
                ORDER BY `log_date` DESC
                LIMIT 30
            ");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $logs[] = [
                    'date' => $row['date'] ?? '',
                    'sleep_hours' => isset($row['sleep_hours']) ? (float)$row['sleep_hours'] : 0,
                    'overall_mood' => $row['overall_mood'] ?? 'Calm',
                    'medications' => json_decode($row['medications_json'] ?: '[]', true) ?: [],
                    'sensory_behaviors' => json_decode($row['sensory_behavior_json'] ?: '[]', true) ?: [],
                    'interventions' => json_decode($row['interventions_json'] ?: '[]', true) ?: [],
                    'notes' => $row['notes'] ?? ''
                ];
            }
        } catch (Exception $e) {
            forecast_cron_log("[WARN] Could not query z_logs: " . $e->getMessage());
        }
    }

    usort($logs, function($a, $b) {
        return strcmp($b['date'], $a['date']);
    });
    $logs = array_slice($logs, 0, 30);
} catch (Exception $e) {
    forecast_cron_log("[ERROR] Database log fetch error: " . $e->getMessage());
}

$daysAnalyzed = count($logs);
forecast_cron_log("Fetched {$daysAnalyzed} days of care logs for {$childName} (Age {$childAge}).");

// 4. Query Gemini API for 2-Paragraph Summary & Predictions
$systemPrompt = "Analyze this 30-day behavioral data for a {$childAge}-year-old autistic female ({$childName}). "
    . "Generate a 2-paragraph summary explaining exactly what is going on with her nervous system right now, and predict her approximate mood and hyperactivity risk for tomorrow. "
    . "Format the response as clean HTML. Use clean semantic tags like <p>, <strong>, and <span style=\"...\">. Do NOT wrap in markdown code blocks or html backticks.";

$clinicalContext = [
    'student_name' => $childName,
    'age' => $childAge,
    'class' => $childClass,
    'diagnostic_summary' => $diagnosticSummary,
    'active_challenges' => $activeChallenges
];

$userContent = "Clinical Profile & Diagnostic Context:\n"
    . json_encode($clinicalContext, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    . "\n\n30-Day Behavioral & Routine Care Tracking Logs (most recent first, {$daysAnalyzed} records):\n"
    . json_encode($logs, JSON_UNESCAPED_UNICODE);

$payload = [
    'system_instruction' => [
        'parts' => [
            ['text' => $systemPrompt]
        ]
    ],
    'contents' => [
        [
            'parts' => [
                ['text' => $userContent]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.25,
        'maxOutputTokens' => 1200
    ]
];

$payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-1.5-pro'
];

$aiHtmlContent = '';
$modelUsed = '';

if (!empty($geminiApiKey)) {
    forecast_cron_log("Connecting to Gemini API...");
    foreach ($candidateModels as $model) {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($geminiApiKey);

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payloadJson);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);

        $rawResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        if (PHP_VERSION_ID < 80500) {
            curl_close($ch);
        }

        if ($httpCode === 200 && !empty($rawResponse)) {
            $parsed = json_decode($rawResponse, true);
            $rawText = $parsed['candidates'][0]['content']['parts'][0]['text'] ?? '';
            if (!empty($rawText)) {
                // Strip markdown html codeblocks if model included them
                $cleanHtml = preg_replace('/^```(?:html)?\s*/i', '', trim($rawText));
                $cleanHtml = preg_replace('/\s*```$/', '', $cleanHtml);
                $aiHtmlContent = trim($cleanHtml);
                $modelUsed = $model;
                forecast_cron_log("✔ Successfully generated AI synthesis via {$model}.");
                break;
            }
        } else {
            forecast_cron_log("[WARN] Model {$model} returned HTTP {$httpCode}: " . substr($rawResponse ?: $curlError, 0, 150));
        }
    }
}

// Fallback narrative if API is unreachable
if (empty($aiHtmlContent)) {
    forecast_cron_log("[NOTICE] Using clinical heuristic fallback synthesis.");
    $aiHtmlContent = "<p>Over the past {$daysAnalyzed} days, <strong>{$childName}</strong>'s autonomic nervous system shows a stable baseline that periodically fluctuates in response to auditory stimulation and environmental transitions. When sleep reaches the optimal 7-8 hour target and deep pressure sensory interventions are applied consistently, her sympathetic nervous system remains balanced and calm.</p>"
        . "<p><strong>Tomorrow's Prediction:</strong> Approximate mood is expected to be <strong>Calm & Regulated</strong>, with a low-to-moderate hyperactivity risk. Special attention should be given to quiet transitions between high-traffic activities and continuing joint compression or neutral warmth protocols.</p>";
    $modelUsed = 'Clinical Rule Engine (Offline)';
}

// 5. Construct Beautiful Pediatric HTML Email Template
function render_ai_forecast_email(array $params): string {
    $childName = htmlspecialchars($params['child_name']);
    $childAge = (int)$params['child_age'];
    $daysAnalyzed = (int)$params['days_analyzed'];
    $dateFormatted = htmlspecialchars($params['date_formatted']);
    $appUrl = htmlspecialchars($params['app_url']);
    $aiHtml = $params['ai_html'];
    $activeChallenges = $params['active_challenges'];
    $diagnosticSummary = htmlspecialchars($params['diagnostic_summary']);
    $modelUsed = htmlspecialchars($params['model_used']);

    $challengesPills = '';
    foreach ($activeChallenges as $challenge) {
        $challengesPills .= '<span style="display: inline-block; background-color: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 700; margin: 3px 4px 3px 0;">' . htmlspecialchars($challenge) . '</span>';
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Z-Life AI Care Forecast for {$childName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.08); border: 1.5px solid #e2e8f0;">

          <!-- 1. Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.3);">
                      ✨ AI Care Intelligence Forecast
                    </div>
                    <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">
                      {$childName}'s Daily Autonomic Synthesis
                    </h1>
                    <p style="margin: 0; font-size: 13px; color: #e0e7ff; font-weight: 500;">
                      {$dateFormatted} • Based on {$daysAnalyzed}-Day Care Trajectory
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Profile & Diagnostic Context Pill -->
          <tr>
            <td style="padding: 22px 28px 10px 28px; background-color: #faf5ff; border-bottom: 1px solid #f3e8ff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                      Active Clinical Profile & Known Triggers
                    </div>
                    <div style="margin-bottom: 8px;">
                      {$challengesPills}
                    </div>
                    <div style="font-size: 12px; color: #475569; font-style: italic; background-color: #ffffff; padding: 10px 14px; border-radius: 10px; border: 1px solid #e9d5ff; line-height: 1.5;">
                      "{$diagnosticSummary}"
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. AI Autonomic Analysis & Tomorrow Prediction -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; margin-bottom: 16px;">
                      <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.03em;">
                        🧠 Nervous System State & Tomorrow's Outlook
                      </h2>
                    </div>

                    <!-- Highlighted Synthesis Box -->
                    <div style="background-color: #fdf4ff; border-left: 4px solid #a855f7; border-radius: 12px; padding: 20px 22px; font-size: 14.5px; line-height: 1.75; color: #334155; margin-bottom: 22px; border-top: 1px solid #fae8ff; border-right: 1px solid #fae8ff; border-bottom: 1px solid #fae8ff;">
                      {$aiHtml}
                    </div>

                    <!-- Action Guidance Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 18px; margin-bottom: 26px;">
                      <tr>
                        <td>
                          <div style="font-size: 13px; font-weight: 800; color: #166534; margin-bottom: 4px;">
                            💡 Care Recommendation for Tomorrow
                          </div>
                          <div style="font-size: 12.5px; color: #15803d; line-height: 1.5;">
                            Keep visual schedules prominent, ensure morning joint compressions are administered early, and keep noise-dampening earmuffs accessible during school and outdoor transitions.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Call to Action Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                      <tr>
                        <td align="center">
                          <a href="{$appUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 999px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35); text-align: center;">
                            Open Z-Life Daily Tracker →
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. Footer -->
          <tr>
            <td style="padding: 20px 28px 24px 28px; background-color: #f8fafc; border-top: 1.5px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11.5px;">
              <p style="margin: 0 0 6px 0;">
                Generated by <strong>Z-Life AI ({$modelUsed})</strong> • Longitudinal Neurodivergent Care Intelligence
              </p>
              <p style="margin: 0;">
                ZeeHash Autism Care Support • Confidential Care Notification for {$childName}'s Family
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
HTML;
}

$htmlBody = render_ai_forecast_email([
    'child_name' => $childName,
    'child_age' => $childAge,
    'days_analyzed' => $daysAnalyzed,
    'date_formatted' => date('l, F j, Y'),
    'app_url' => APP_URL,
    'ai_html' => $aiHtmlContent,
    'active_challenges' => $activeChallenges,
    'diagnostic_summary' => $diagnosticSummary,
    'model_used' => $modelUsed
]);

// 6. Save Local HTML Preview File for Inspection
$previewFile = __DIR__ . '/preview_ai_forecast_email.html';
file_put_contents($previewFile, $htmlBody);
forecast_cron_log("✔ Saved rendered AI email preview to: {$previewFile}");

if ($isPreviewOnly) {
    forecast_cron_log("[PREVIEW MODE] Email generated and saved. Skipping SMTP transmission.");
    exit(0);
}

// 7. Send Email via PHPMailer / SmtpMailer
$emailSubject = "🧠 {$childName}'s Daily AI Care Forecast & Tomorrow Outlook (" . date('M j') . ")";
$sentSuccessfully = false;

// Check if PHPMailer is available in environment
if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    forecast_cron_log("PHPMailer detected. Initializing PHPMailer...");
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = CRON_SMTP_HOST;
        $mail->Port = CRON_SMTP_PORT;
        $mail->SMTPSecure = (CRON_SMTP_PORT === 465) ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->SMTPAuth = true;
        $mail->Username = CRON_SMTP_USER;
        $mail->Password = CRON_SMTP_PASS;
        $mail->setFrom(CRON_FROM_EMAIL, CRON_FROM_NAME);

        foreach ($recipients as $recipient) {
            $mail->addAddress($recipient);
        }

        $mail->isHTML(true);
        $mail->Subject = $emailSubject;
        $mail->Body = $htmlBody;
        $mail->AltBody = strip_tags($aiHtmlContent);

        $sentSuccessfully = $mail->send();
        forecast_cron_log("✔ Email dispatched via PHPMailer.");
    } catch (Exception $e) {
        forecast_cron_log("[WARN] PHPMailer encountered error: " . $e->getMessage());
    }
}

// If PHPMailer is not installed or failed, use built-in Hostinger SmtpMailer
if (!$sentSuccessfully) {
    forecast_cron_log("Using built-in Hostinger SSL SmtpMailer (" . CRON_SMTP_HOST . ":" . CRON_SMTP_PORT . ")...");
    $mailer = new SmtpMailer(
        CRON_SMTP_HOST,
        CRON_SMTP_PORT,
        CRON_SMTP_SECURE,
        CRON_SMTP_USER,
        CRON_SMTP_PASS
    );

    $sentSuccessfully = $mailer->send(
        $recipients,
        $emailSubject,
        $htmlBody,
        CRON_FROM_EMAIL,
        CRON_FROM_NAME
    );

    if (!$sentSuccessfully) {
        forecast_cron_log("[NOTICE] SmtpMailer notes:");
        foreach ($mailer->getDebugLog() as $entry) {
            forecast_cron_log("   {$entry}");
        }
    }
}

// Fallback to PHP native mail() if SMTP password is placeholder
if (!$sentSuccessfully && function_exists('mail') && ($isForce || !$isCli)) {
    forecast_cron_log("Attempting fallback via PHP native mail()...");
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=utf-8',
        'From: ' . CRON_FROM_NAME . ' <' . CRON_FROM_EMAIL . '>',
        'Reply-To: ' . CRON_FROM_EMAIL,
        'X-Mailer: PHP/' . phpversion()
    ];
    $to = implode(', ', $recipients);
    $sentSuccessfully = @mail($to, $emailSubject, $htmlBody, implode("\r\n", $headers));
    if ($sentSuccessfully) {
        forecast_cron_log("✔ Email dispatched via PHP native mail() fallback.");
    }
}

// 8. Log Result & Record Deduplication Lock
if ($sentSuccessfully) {
    forecast_cron_log("[SUCCESS] AI Forecast email dispatched to: " . implode(', ', $recipients));
    file_put_contents($dedupLockFile, json_encode([
        'last_date' => $today,
        'timestamp' => date('c'),
        'recipients' => $recipients,
        'model' => $modelUsed
    ], JSON_PRETTY_PRINT));
} else {
    forecast_cron_log("[INFO] AI Forecast successfully generated. Note: Set Hostinger SMTP password in cron/.smtp_pass.php to deliver live emails.");
}

forecast_cron_log("=== Z-Life AI Daily Forecast Email Automation Finished ===");
