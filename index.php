<?php
/**
 * Daily Tracker - Mobile-First Daily Dashboard & Log Form
 * Supports Parent full interactive editing and Teacher view-only summary.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// Enforce Passcode Authentication
require_login();

$pdo = get_db_connection();
$role = get_user_role();
$isDemo = ($role === 'demo');

if ($isDemo) {
    $settings = [
        'id' => 9999,
        'z_name' => 'Alex',
        'z_age' => 15,
        'z_class' => 'Grade 9',
        'z_school' => 'Greenwood High (Demo)',
        'parent_email_1' => '',
        'parent_email_2' => '',
        'active_challenges' => ['Auditory Sensitivity', 'Sensory Overload', 'Transitions & Routine Changes', 'Emotional Regulation'],
        'diagnostic_summary' => 'Sample Profile: Level 2 Autism Spectrum Disorder (ASD). Responsive to deep pressure compression, calm sensory pacing, noise-dampening earmuffs, and predictable visual task timers.'
    ];
} else {
    $settings = get_master_settings($pdo);
}

// -------------------------------------------------------------
// Date Selection & Navigation
// -------------------------------------------------------------
$selectedDate = $_GET['date'] ?? date('Y-m-d');
// Validate date format YYYY-MM-DD
$dateObj = DateTime::createFromFormat('Y-m-d', $selectedDate);
if (!$dateObj || $dateObj->format('Y-m-d') !== $selectedDate) {
    $selectedDate = date('Y-m-d');
    $dateObj = new DateTime($selectedDate);
}

$prevDate = (clone $dateObj)->modify('-1 day')->format('Y-m-d');
$nextDate = (clone $dateObj)->modify('+1 day')->format('Y-m-d');
$isToday = ($selectedDate === date('Y-m-d'));
$displayDate = $dateObj->format('D, M j, Y');

// -------------------------------------------------------------
// Handle Save / POST Submission (Parents Only)
// -------------------------------------------------------------
$flashMessage = '';
$flashType = 'success';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save_log') {
    if ($isDemo) {
        http_response_code(403);
        die("Unauthorized: Saving is disabled in Demo Mode.");
    }
    if (!is_parent()) {
        http_response_code(403);
        die("Unauthorized: Only parents can edit or submit daily logs.");
    }

    $postDate = $_POST['log_date'] ?? $selectedDate;
    $sleepHours = floatval($_POST['sleep_hours'] ?? 0);
    $overallMood = trim($_POST['overall_mood'] ?? '');

    // Dynamic Multi-Select Medication Tracking
    $medications = $_POST['medications'] ?? [];
    $medicationsJson = json_encode(array_values(array_filter((array)$medications)));

    // Sensory Behaviors
    $sensoryBehaviors = $_POST['sensory_behaviors'] ?? [];
    $sensoryJson = json_encode(array_values(array_filter((array)$sensoryBehaviors)));

    // Interventions
    $interventions = $_POST['interventions'] ?? [];
    $interventionsJson = json_encode(array_values(array_filter((array)$interventions)));

    // Activities & Exercise
    $activities = $_POST['activities'] ?? [];
    $activitiesJson = json_encode(array_values(array_filter((array)$activities)));

    // Food Category
    $food = $_POST['food'] ?? [];
    $foodJson = json_encode(array_values(array_filter((array)$food)));

    // Narrative Notes
    $notes = trim($_POST['notes'] ?? '');

    // Check if record already exists for this date
    $checkStmt = $pdo->prepare("SELECT id FROM z_logs WHERE log_date = ?");
    $checkStmt->execute([$postDate]);
    $existingId = $checkStmt->fetchColumn();

    if ($existingId) {
        $updateSql = "
            UPDATE z_logs SET 
                updated_at = CURRENT_TIMESTAMP,
                overall_mood = ?,
                sleep_hours = ?,
                medications_json = ?,
                sensory_behavior_json = ?,
                interventions_json = ?,
                activities_json = ?,
                food_json = ?,
                notes = ?
            WHERE id = ?
        ";
        $stmt = $pdo->prepare($updateSql);
        $stmt->execute([
            $overallMood,
            $sleepHours,
            $medicationsJson,
            $sensoryJson,
            $interventionsJson,
            $activitiesJson,
            $foodJson,
            $notes,
            $existingId
        ]);
    } else {
        $insertSql = "
            INSERT INTO z_logs 
                (log_date, overall_mood, sleep_hours, medications_json, sensory_behavior_json, interventions_json, activities_json, food_json, notes)
            VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            $postDate,
            $overallMood,
            $sleepHours,
            $medicationsJson,
            $sensoryJson,
            $interventionsJson,
            $activitiesJson,
            $foodJson,
            $notes
        ]);
    }

    $flashMessage = "Log successfully saved for " . htmlspecialchars($dateObj->format('M j, Y')) . "!";
}

// -------------------------------------------------------------
// Fetch Existing Log for Selected Date
// -------------------------------------------------------------
if ($isDemo) {
    // In Demo Mode: Never pull real data from database; provide clean sample demonstration log
    $currentLog = [
        'id' => 999,
        'log_date' => $selectedDate,
        'overall_mood' => 'Calm',
        'sleep_hours' => 8.0,
        'is_menstruating' => 0,
        'flow_intensity' => 'Medium',
        'medications_json' => json_encode(['Focalin (Morning)']),
        'sensory_behavior_json' => json_encode(['Sound Sensitivity']),
        'interventions_json' => json_encode(['Earmuffs (Walker\'s Electronics)', 'Joint Compression']),
        'activities_json' => json_encode(['Music Class']),
        'food_json' => json_encode(['High-Protein/High-Fat']),
        'notes' => 'Sample demo log for Alex. All interactive controls are functional in this preview. Database saving is disabled.'
    ];
} else {
    $logStmt = $pdo->prepare("SELECT * FROM z_logs WHERE log_date = ?");
    $logStmt->execute([$selectedDate]);
    $currentLog = $logStmt->fetch() ?: [];
}

// Decode stored JSON payloads
$selectedMood = $currentLog['overall_mood'] ?? '';
$savedSleep = isset($currentLog['sleep_hours']) ? floatval($currentLog['sleep_hours']) : 8.0;
$savedMeds = !empty($currentLog['medications_json']) ? (json_decode($currentLog['medications_json'], true) ?: []) : [];
$savedBehaviors = !empty($currentLog['sensory_behavior_json']) ? (json_decode($currentLog['sensory_behavior_json'], true) ?: []) : [];
$savedInterventions = !empty($currentLog['interventions_json']) ? (json_decode($currentLog['interventions_json'], true) ?: []) : [];
$savedActivities = !empty($currentLog['activities_json']) ? (json_decode($currentLog['activities_json'], true) ?: []) : [];
$savedFood = !empty($currentLog['food_json']) ? (json_decode($currentLog['food_json'], true) ?: []) : [];
$savedNotes = $currentLog['notes'] ?? '';

// Fetch Active Master Lists
$masterLists = get_master_list_items($pdo, true);

// Include standard header
require_once __DIR__ . '/header.php';
?>

<main class="container py-3" style="max-width: 680px;">

    <!-- Save Alert Flash Message -->
    <?php if ($flashMessage): ?>
        <div class="alert alert-success alert-dismissible fade show rounded-4 shadow-sm border-0 d-flex align-items-center gap-2 mb-3" role="alert">
            <span class="fs-5">✅</span>
            <div class="fw-bold"><?= $flashMessage ?></div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>

    <!-- Demo Mode Notice Banner -->
    <?php if ($isDemo): ?>
        <div class="alert alert-warning border-0 rounded-4 shadow-sm mb-4 d-flex align-items-center gap-3">
            <span class="fs-4">✨</span>
            <div>
                <strong>Demo Mode Active:</strong> You are exploring an interactive parental preview for <strong><?= htmlspecialchars($settings['z_name']) ?></strong>. All buttons, steppers, and medication selections are interactive. Database saving is disabled.
            </div>
        </div>
    <?php endif; ?>

    <!-- Teacher Mode Notice Banner -->
    <?php if (is_teacher()): ?>
        <div class="teacher-banner mb-3 shadow-xs">
            <span class="fs-4">👀</span>
            <div>
                <div class="fw-bold">Teacher View-Only Mode</div>
                <div class="x-small text-muted">You are viewing <?= htmlspecialchars(!empty($settings['z_name']) ? $settings['z_name'] : 'the student') ?>'s daily summary. Logging and editing are reserved for parents.</div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Date Navigation Card -->
    <div class="date-nav-card d-flex align-items-center justify-content-between mb-4">
        <a href="index.php?date=<?= $prevDate ?>" class="nav-arrow-btn text-decoration-none" title="Previous Day">
            ❮
        </a>

        <div class="text-center d-flex align-items-center gap-2">
            <div>
                <div class="fw-bold fs-5 text-slate"><?= $displayDate ?></div>
                <?php if ($isToday): ?>
                    <span class="badge bg-success-subtle text-success-emphasis rounded-pill px-2 py-0 x-small fw-bold">Today</span>
                <?php else: ?>
                    <a href="index.php?date=<?= date('Y-m-d') ?>" class="text-decoration-none x-small fw-bold text-primary">Jump to Today</a>
                <?php endif; ?>
            </div>
            <!-- Quick Date Picker -->
            <input type="date" id="calendarPicker" class="form-control form-control-sm border-0 bg-light rounded-3 px-2 py-1" 
                   value="<?= $selectedDate ?>" 
                   style="width: 44px; cursor: pointer; text-indent: -9999px;"
                   onchange="window.location.href='index.php?date=' + this.value;" title="Choose Date">
        </div>

        <a href="index.php?date=<?= $nextDate ?>" class="nav-arrow-btn text-decoration-none" title="Next Day">
            ❯
        </a>
    </div>

    <?php if (is_teacher()): ?>
        <!-- ========================================================= -->
        <!-- TEACHER READ-ONLY SUMMARY VIEW                            -->
        <!-- ========================================================= -->
        <div class="teacher-summary-container">
            <!-- Overall Mood & Sleep Card -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>🌟</span> Mood & Sleep
                </div>
                <div class="row g-3">
                    <div class="col-6">
                        <div class="p-3 bg-light rounded-3 text-center">
                            <div class="text-muted small">Primary Mood</div>
                            <div class="fs-4 fw-bold text-primary mt-1">
                                <?= !empty($selectedMood) ? htmlspecialchars($selectedMood) : '<span class="text-muted fs-6">Not Logged</span>' ?>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="p-3 bg-light rounded-3 text-center">
                            <div class="text-muted small">Sleep Hours</div>
                            <div class="fs-4 fw-bold text-dark mt-1">
                                <?= $savedSleep > 0 ? htmlspecialchars($savedSleep) . ' hrs' : '<span class="text-muted fs-6">Not Logged</span>' ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Medications Administered (Dynamic Display) -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>💊</span> Medications Administered
                </div>
                <?php if (!empty($savedMeds)): ?>
                    <div class="d-flex flex-wrap gap-2">
                        <?php foreach ($savedMeds as $med): ?>
                            <span class="badge bg-success-subtle text-success-emphasis border border-success-subtle p-2 fs-6 rounded-3">
                                ✓ <?= htmlspecialchars($med) ?>
                            </span>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <p class="text-muted mb-0 small fst-italic">No medications marked as administered for this date.</p>
                <?php endif; ?>
            </div>

            <!-- Sensory Behaviors -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>⚡</span> Sensory Behaviors Observed
                </div>
                <?php if (!empty($savedBehaviors)): ?>
                    <div class="d-flex flex-wrap gap-2">
                        <?php foreach ($savedBehaviors as $b): ?>
                            <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle p-2 rounded-3">
                                <?= htmlspecialchars($b) ?>
                            </span>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <p class="text-muted mb-0 small fst-italic">No sensory behaviors logged.</p>
                <?php endif; ?>
            </div>

            <!-- Interventions Applied -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>🛡️</span> Support Interventions Applied
                </div>
                <?php if (!empty($savedInterventions)): ?>
                    <div class="d-flex flex-wrap gap-2">
                        <?php foreach ($savedInterventions as $i): ?>
                            <span class="badge bg-info-subtle text-info-emphasis border border-info-subtle p-2 rounded-3">
                                ✓ <?= htmlspecialchars($i) ?>
                            </span>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <p class="text-muted mb-0 small fst-italic">No interventions logged.</p>
                <?php endif; ?>
            </div>

            <!-- Activities & Exercise -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>🎨</span> Activities & Exercise
                </div>
                <?php if (!empty($savedActivities)): ?>
                    <div class="d-flex flex-wrap gap-2">
                        <?php foreach ($savedActivities as $a): ?>
                            <span class="badge bg-purple-subtle text-primary border p-2 rounded-3">
                                <?= htmlspecialchars($a) ?>
                            </span>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <p class="text-muted mb-0 small fst-italic">No activities logged.</p>
                <?php endif; ?>
            </div>

            <!-- Notes -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>📝</span> Daily Narrative & Notes
                </div>
                <?php if (!empty($savedNotes)): ?>
                    <div class="p-3 bg-light rounded-3 text-secondary" style="white-space: pre-wrap; font-size: 0.95rem;">
                        <?= nl2br(htmlspecialchars($savedNotes)) ?>
                    </div>
                <?php else: ?>
                    <p class="text-muted mb-0 small fst-italic">No additional notes recorded for this date.</p>
                <?php endif; ?>
            </div>
        </div>

    <?php else: ?>

        <!-- ========================================================= -->
        <!-- PARENT INTERACTIVE LOG FORM                               -->
        <!-- ========================================================= -->
        <form method="POST" action="index.php?date=<?= $selectedDate ?>" id="dailyLogForm">
            <input type="hidden" name="action" value="save_log">
            <input type="hidden" name="log_date" value="<?= $selectedDate ?>">

            <!-- 1. Sleep Tracking -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>🌙</span> Sleep Tracking
                </div>
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div>
                        <div class="fw-bold text-dark">Hours of Sleep</div>
                        <div class="text-muted x-small">Recorded for prior night</div>
                    </div>
                    <div class="sleep-stepper">
                        <button type="button" class="sleep-btn" id="sleepMinus" aria-label="Decrease Sleep">−</button>
                        <input type="number" step="0.5" min="0" max="24" name="sleep_hours" id="sleepInput" class="sleep-input" value="<?= htmlspecialchars($savedSleep) ?>">
                        <button type="button" class="sleep-btn" id="sleepPlus" aria-label="Increase Sleep">+</button>
                    </div>
                </div>
            </div>

            <!-- 2. Dynamic Medication Tracking (Multiple & Extensible) -->
            <div class="tracker-section-card">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <div class="section-title mb-0">
                        <span>💊</span> Medications Given
                    </div>
                    <a href="admin.php#tab-medication" class="x-small text-decoration-none fw-bold text-primary">
                        + Manage Meds
                    </a>
                </div>
                <p class="text-muted small mb-3">Tap to toggle each medication administered today. Select multiple as needed.</p>

                <div class="toggle-pills-grid">
                    <?php 
                    $medList = $masterLists['medication'] ?? [];
                    if (!empty($medList)):
                        foreach ($medList as $med): 
                            $name = $med['item_name'];
                            $isChecked = in_array($name, $savedMeds);
                    ?>
                        <label class="toggle-pill-item pill-medication">
                            <input type="checkbox" name="medications[]" value="<?= htmlspecialchars($name) ?>" <?= $isChecked ? 'checked' : '' ?>>
                            <span class="pill-label">
                                <span class="pill-check-icon">✓</span>
                                <?= htmlspecialchars($name) ?>
                            </span>
                        </label>
                    <?php 
                        endforeach;
                    else: 
                    ?>
                        <div class="alert alert-light text-muted small border mb-0">
                            No active medications configured. <a href="admin.php#tab-medication">Add medications here</a>.
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- 3. Primary Mood & Energy (Single Select) -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>😊</span> Primary Mood & Energy
                </div>
                <div class="toggle-pills-grid">
                    <?php 
                    $moodList = $masterLists['mood'] ?? [];
                    foreach ($moodList as $mood): 
                        $name = $mood['item_name'];
                        $isChecked = ($selectedMood === $name);
                    ?>
                        <label class="toggle-pill-item pill-mood">
                            <input type="radio" name="overall_mood" value="<?= htmlspecialchars($name) ?>" <?= $isChecked ? 'checked' : '' ?>>
                            <span class="pill-label">
                                <span class="pill-check-icon">●</span>
                                <?= htmlspecialchars($name) ?>
                            </span>
                        </label>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- 4. Sensory Behaviors Observed (Multi-Select) -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>⚡</span> Sensory Behaviors Observed
                </div>
                <div class="toggle-pills-grid">
                    <?php 
                    $behaviorList = $masterLists['behavior'] ?? [];
                    foreach ($behaviorList as $beh): 
                        $name = $beh['item_name'];
                        $isChecked = in_array($name, $savedBehaviors);
                    ?>
                        <label class="toggle-pill-item pill-behavior">
                            <input type="checkbox" name="sensory_behaviors[]" value="<?= htmlspecialchars($name) ?>" <?= $isChecked ? 'checked' : '' ?>>
                            <span class="pill-label">
                                <span class="pill-check-icon">✓</span>
                                <?= htmlspecialchars($name) ?>
                            </span>
                        </label>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- 5. Support Interventions Applied (Multi-Select) -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>🛡️</span> Interventions Applied
                </div>
                <div class="toggle-pills-grid">
                    <?php 
                    $intList = $masterLists['intervention'] ?? [];
                    foreach ($intList as $int): 
                        $name = $int['item_name'];
                        $isChecked = in_array($name, $savedInterventions);
                    ?>
                        <label class="toggle-pill-item pill-intervention">
                            <input type="checkbox" name="interventions[]" value="<?= htmlspecialchars($name) ?>" <?= $isChecked ? 'checked' : '' ?>>
                            <span class="pill-label">
                                <span class="pill-check-icon">✓</span>
                                <?= htmlspecialchars($name) ?>
                            </span>
                        </label>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- 6. Creative, Skill & Exercise Activities (Multi-Select) -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>🎨</span> Creative Skills & Sports
                </div>
                <div class="toggle-pills-grid">
                    <?php 
                    $acts = array_merge($masterLists['activity'] ?? [], $masterLists['exercise'] ?? []);
                    foreach ($acts as $act): 
                        $name = $act['item_name'];
                        $isChecked = in_array($name, $savedActivities);
                    ?>
                        <label class="toggle-pill-item pill-activity">
                            <input type="checkbox" name="activities[]" value="<?= htmlspecialchars($name) ?>" <?= $isChecked ? 'checked' : '' ?>>
                            <span class="pill-label">
                                <span class="pill-check-icon">✓</span>
                                <?= htmlspecialchars($name) ?>
                            </span>
                        </label>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- 7. Food & Nutrition (Multi-Select) -->
            <div class="tracker-section-card">
                <div class="section-title">
                    <span>🍎</span> Food & Nutrition Categories
                </div>
                <div class="toggle-pills-grid">
                    <?php 
                    $foodList = $masterLists['food'] ?? [];
                    foreach ($foodList as $f): 
                        $name = $f['item_name'];
                        $isChecked = in_array($name, $savedFood);
                    ?>
                        <label class="toggle-pill-item pill-food">
                            <input type="checkbox" name="food[]" value="<?= htmlspecialchars($name) ?>" <?= $isChecked ? 'checked' : '' ?>>
                            <span class="pill-label">
                                <span class="pill-check-icon">✓</span>
                                <?= htmlspecialchars($name) ?>
                            </span>
                        </label>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- 8. Voice-Friendly Narrative Notes -->
            <div class="tracker-section-card">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="section-title mb-0">
                        <span>📝</span> Additional Comments & Observations
                    </div>
                    <!-- Speech to text voice dictation button -->
                    <button type="button" class="btn-mic" id="btnVoiceInput" title="Dictate with Microphone">
                        <span>🎙️</span> <span id="micLabel">Voice Dictate</span>
                    </button>
                </div>
                <textarea name="notes" id="notesArea" rows="4" class="form-control rounded-3 p-3" 
                          placeholder="Dictate or type specific comments, triggers, achievements, or teacher notes here..."><?= htmlspecialchars($savedNotes) ?></textarea>
            </div>

            <!-- Sticky Save Button Bar -->
            <div class="sticky-save-bar">
                <?php if ($isDemo): ?>
                    <button type="button" class="btn btn-secondary w-100 shadow py-3 rounded-pill fw-bold" disabled title="Saving is disabled in Demo Mode">
                        🔒 Save Daily Log (Disabled in Demo Mode)
                    </button>
                <?php else: ?>
                    <button type="submit" class="btn btn-save-main w-100 shadow">
                        💾 Save Daily Log (<?= $displayDate ?>)
                    </button>
                <?php endif; ?>
            </div>
        </form>

    <?php endif; ?>

</main>

<!-- Bootstrap 5 JS Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

<script>
    // Sleep Stepper (+/- 0.5)
    const sleepInput = document.getElementById('sleepInput');
    const sleepMinus = document.getElementById('sleepMinus');
    const sleepPlus = document.getElementById('sleepPlus');

    if (sleepMinus && sleepPlus && sleepInput) {
        sleepMinus.addEventListener('click', () => {
            let val = parseFloat(sleepInput.value) || 0;
            if (val >= 0.5) {
                sleepInput.value = (val - 0.5).toFixed(1);
            }
        });
        sleepPlus.addEventListener('click', () => {
            let val = parseFloat(sleepInput.value) || 0;
            if (val < 24) {
                sleepInput.value = (val + 0.5).toFixed(1);
            }
        });
    }

    // Web Speech API Voice Dictation
    const voiceBtn = document.getElementById('btnVoiceInput');
    const micLabel = document.getElementById('micLabel');
    const notesArea = document.getElementById('notesArea');

    if (voiceBtn && notesArea) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            let isRecording = false;

            voiceBtn.addEventListener('click', () => {
                if (!isRecording) {
                    recognition.start();
                } else {
                    recognition.stop();
                }
            });

            recognition.onstart = () => {
                isRecording = true;
                voiceBtn.classList.add('recording');
                micLabel.textContent = 'Listening...';
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (notesArea.value.trim() !== '') {
                    notesArea.value += ' ' + transcript;
                } else {
                    notesArea.value = transcript;
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech error:', event.error);
                recognition.stop();
            };

            recognition.onend = () => {
                isRecording = false;
                voiceBtn.classList.remove('recording');
                micLabel.textContent = 'Voice Dictate';
            };
        } else {
            // Hide mic button if browser does not support Web Speech
            voiceBtn.style.display = 'none';
        }
    }
</script>

</body>
</html>
