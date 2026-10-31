<?php
/**
 * API: Daily Logs (Read & Save Tracker Logs)
 */

require_once __DIR__ . '/bootstrap.php';

require_api_role(); // Enforce authentication

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $isDemo = is_api_demo();

    // If requesting all logs (for History & Export)
    if (isset($_GET['all']) || (isset($_GET['action']) && $_GET['action'] === 'all') || isset($_GET['export'])) {
        if ($isDemo) {
            // Return sample demonstration logs for Alex - ZERO data from real database
            $today = date('Y-m-d');
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            $twoDaysAgo = date('Y-m-d', strtotime('-2 days'));
            $threeDaysAgo = date('Y-m-d', strtotime('-3 days'));

            $demoLogs = [
                [
                    'id' => 901,
                    'log_date' => $today,
                    'created_at' => date('Y-m-d 08:30:00'),
                    'updated_at' => date('Y-m-d 08:30:00'),
                    'overall_mood' => 'Calm',
                    'sleep_hours' => 8.5,
                    'is_menstruating' => false,
                    'flow_intensity' => '',
                    'medications' => ['Focalin (Morning)'],
                    'sensory_behaviors' => ['Sound Sensitivity'],
                    'interventions' => ['Earmuffs (Walker\'s Electronics)', 'Joint Compression'],
                    'activities' => ['Music Class'],
                    'food' => ['High-Protein/High-Fat'],
                    'notes' => 'Sample demo log: Serene morning transition. Responded very positively to earmuffs during hall transition.',
                    'exists' => true,
                    'is_demo' => true
                ],
                [
                    'id' => 902,
                    'log_date' => $yesterday,
                    'created_at' => date('Y-m-d 20:15:00', strtotime('-1 day')),
                    'updated_at' => date('Y-m-d 20:15:00', strtotime('-1 day')),
                    'overall_mood' => 'Happy',
                    'sleep_hours' => 8.0,
                    'is_menstruating' => false,
                    'flow_intensity' => '',
                    'medications' => ['Focalin (Morning)', 'Melatonin (Night)'],
                    'sensory_behaviors' => ['Self-Regulation (Stimming)'],
                    'interventions' => ['Walk', 'Visual Timer'],
                    'activities' => ['Keyboard', 'Pickleball'],
                    'food' => ['General Meal'],
                    'notes' => 'Sample demo log: Excellent engagement in keyboard practice and gross motor sports.',
                    'exists' => true,
                    'is_demo' => true
                ],
                [
                    'id' => 903,
                    'log_date' => $twoDaysAgo,
                    'created_at' => date('Y-m-d 19:40:00', strtotime('-2 days')),
                    'updated_at' => date('Y-m-d 19:40:00', strtotime('-2 days')),
                    'overall_mood' => 'Sensory Overload',
                    'sleep_hours' => 7.0,
                    'is_menstruating' => false,
                    'flow_intensity' => '',
                    'medications' => ['Focalin (Morning)'],
                    'sensory_behaviors' => ['Ear Covering', 'Impulsive Pacing'],
                    'interventions' => ['Joint Compression', 'Neutral Warmth', 'Earmuffs (Walker\'s Electronics)'],
                    'activities' => ['Speech'],
                    'food' => ['Salty/Crunchy'],
                    'notes' => 'Sample demo log: High noise during cafeteria transition caused sensory overload. Successfully regulated using deep pressure compression.',
                    'exists' => true,
                    'is_demo' => true
                ],
                [
                    'id' => 904,
                    'log_date' => $threeDaysAgo,
                    'created_at' => date('Y-m-d 21:00:00', strtotime('-3 days')),
                    'updated_at' => date('Y-m-d 21:00:00', strtotime('-3 days')),
                    'overall_mood' => 'Calm',
                    'sleep_hours' => 9.0,
                    'is_menstruating' => false,
                    'flow_intensity' => '',
                    'medications' => ['Focalin (Morning)', 'Melatonin (Night)'],
                    'sensory_behaviors' => ['Cover with Blanket (Cocooning)'],
                    'interventions' => ['Visual Board Prompt', 'Neutral Warmth'],
                    'activities' => ['Yoga'],
                    'food' => ['High-Protein/High-Fat'],
                    'notes' => 'Sample demo log: Peaceful evening routine. Slept deeply after sensory yoga.',
                    'exists' => true,
                    'is_demo' => true
                ]
            ];

            if (isset($_GET['export']) && $_GET['export'] === 'csv') {
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename="sample_demo_care_logs_' . date('Y-m-d') . '.csv"');
                $out = fopen('php://output', 'w');
                fputs($out, "\xEF\xBB\xBF");
                fputcsv($out, [
                    'Log Date', 'Day of Week', 'Sleep (Hours)', 'Overall Mood',
                    'Menstruating Today', 'Flow Intensity', 'Medications',
                    'Sensory Behaviors', 'Calming Interventions', 'Activities & Sports',
                    'Food & Nutrition', 'Comments & Observations', 'Created At', 'Updated At'
                ], ',', '"', "\\");
                foreach ($demoLogs as $l) {
                    $dayName = date('l', strtotime($l['log_date']));
                    fputcsv($out, [
                        $l['log_date'], $dayName, $l['sleep_hours'], $l['overall_mood'],
                        $l['is_menstruating'] ? 'Yes' : 'No', $l['flow_intensity'] ?: 'None',
                        implode('; ', $l['medications']), implode('; ', $l['sensory_behaviors']),
                        implode('; ', $l['interventions']), implode('; ', $l['activities']),
                        implode('; ', $l['food']), $l['notes'], $l['created_at'], $l['updated_at']
                    ], ',', '"', "\\");
                }
                fclose($out);
                exit;
            }

            json_response(['success' => true, 'data' => $demoLogs, 'count' => count($demoLogs), 'is_demo' => true]);
        }

        require_api_role('parent'); // Real logs require Parent role
        
        $limit = isset($_GET['limit']) ? max(1, min(5000, intval($_GET['limit']))) : 2000;
        $stmt = $pdo->prepare("SELECT * FROM z_logs ORDER BY log_date DESC LIMIT :limit");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        
        $logs = [];
        foreach ($rows as $row) {
            $logs[] = [
                'id' => (int)$row['id'],
                'log_date' => $row['log_date'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'overall_mood' => $row['overall_mood'] ?? '',
                'sleep_hours' => (float)$row['sleep_hours'],
                'is_menstruating' => !empty($row['is_menstruating']),
                'flow_intensity' => !empty($row['is_menstruating']) ? ($row['flow_intensity'] ?: 'Medium') : '',
                'medications' => json_decode($row['medications_json'] ?: '[]', true) ?: [],
                'sensory_behaviors' => json_decode($row['sensory_behavior_json'] ?: '[]', true) ?: [],
                'interventions' => json_decode($row['interventions_json'] ?: '[]', true) ?: [],
                'activities' => json_decode($row['activities_json'] ?: '[]', true) ?: [],
                'food' => json_decode($row['food_json'] ?: '[]', true) ?: [],
                'notes' => $row['notes'] ?? '',
                'exists' => true
            ];
        }

        if (isset($_GET['export']) && $_GET['export'] === 'csv') {
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="care_logs_' . date('Y-m-d') . '.csv"');
            $out = fopen('php://output', 'w');
            fputs($out, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel
            fputcsv($out, [
                'Log Date',
                'Day of Week',
                'Sleep (Hours)',
                'Overall Mood',
                'Menstruating Today',
                'Flow Intensity',
                'Medications',
                'Sensory Behaviors',
                'Calming Interventions',
                'Activities & Sports',
                'Food & Nutrition',
                'Comments & Observations',
                'Created At',
                'Updated At'
            ], ',', '"', "\\");
            foreach ($logs as $l) {
                $dayName = date('l', strtotime($l['log_date']));
                fputcsv($out, [
                    $l['log_date'],
                    $dayName,
                    $l['sleep_hours'],
                    $l['overall_mood'],
                    $l['is_menstruating'] ? 'Yes' : 'No',
                    $l['is_menstruating'] ? ($l['flow_intensity'] ?: 'Medium') : 'None',
                    implode('; ', $l['medications']),
                    implode('; ', $l['sensory_behaviors']),
                    implode('; ', $l['interventions']),
                    implode('; ', $l['activities']),
                    implode('; ', $l['food']),
                    $l['notes'],
                    $l['created_at'],
                    $l['updated_at']
                ], ',', '"', "\\");
            }
            fclose($out);
            exit;
        }

        json_response(['success' => true, 'data' => $logs, 'count' => count($logs)]);
    }

    $date = $_GET['date'] ?? date('Y-m-d');
    
    // Validate date format YYYY-MM-DD
    $d = DateTime::createFromFormat('Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) {
        $date = date('Y-m-d');
    }

    // In Demo Mode: Serve clean interactive starter log without querying real database (z_logs)
    if ($isDemo) {
        $sampleLog = [
            'id' => null,
            'log_date' => $date,
            'created_at' => null,
            'updated_at' => null,
            'overall_mood' => 'Calm',
            'sleep_hours' => 8.0,
            'is_menstruating' => false,
            'flow_intensity' => 'Medium',
            'medications' => ['Focalin (Morning)'],
            'sensory_behaviors' => ['Sound Sensitivity'],
            'interventions' => ['Earmuffs (Walker\'s Electronics)', 'Joint Compression'],
            'activities' => ['Music Class'],
            'food' => ['High-Protein/High-Fat'],
            'notes' => 'Sample demo observation: Alex had a calm morning routine. Buttons and steppers can be clicked freely in this demo. Saving is disabled.',
            'exists' => false,
            'is_demo' => true
        ];
        json_response(['success' => true, 'data' => $sampleLog, 'is_demo' => true]);
    }

    $stmt = $pdo->prepare("SELECT * FROM z_logs WHERE log_date = ? LIMIT 1");
    $stmt->execute([$date]);
    $row = $stmt->fetch();

    if ($row) {
        $log = [
            'id' => (int)$row['id'],
            'log_date' => $row['log_date'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'overall_mood' => $row['overall_mood'] ?? '',
            'sleep_hours' => (float)$row['sleep_hours'],
            'is_menstruating' => !empty($row['is_menstruating']),
            'flow_intensity' => !empty($row['is_menstruating']) ? ($row['flow_intensity'] ?: 'Medium') : 'Medium',
            'medications' => json_decode($row['medications_json'] ?: '[]', true) ?: [],
            'sensory_behaviors' => json_decode($row['sensory_behavior_json'] ?: '[]', true) ?: [],
            'interventions' => json_decode($row['interventions_json'] ?: '[]', true) ?: [],
            'activities' => json_decode($row['activities_json'] ?: '[]', true) ?: [],
            'food' => json_decode($row['food_json'] ?: '[]', true) ?: [],
            'notes' => $row['notes'] ?? '',
            'exists' => true
        ];
    } else {
        $log = [
            'id' => null,
            'log_date' => $date,
            'created_at' => null,
            'updated_at' => null,
            'overall_mood' => '',
            'sleep_hours' => 0.0,
            'is_menstruating' => false,
            'flow_intensity' => 'Medium',
            'medications' => [],
            'sensory_behaviors' => [],
            'interventions' => [],
            'activities' => [],
            'food' => [],
            'notes' => '',
            'exists' => false
        ];
    }

    json_response(['success' => true, 'data' => $log]);
}

if ($method === 'POST') {
    if (is_api_demo()) {
        json_response([
            'success' => false,
            'error' => 'Saving is disabled in Demo Mode. Interactive options are for demonstration only.',
            'is_demo' => true
        ], 403);
    }

    require_api_role('parent'); // Only parents can modify logs
    $input = get_json_input();

    $date = trim($input['log_date'] ?? date('Y-m-d'));
    $d = DateTime::createFromFormat('Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) {
        json_response(['success' => false, 'error' => 'Invalid date format (YYYY-MM-DD expected).'], 400);
    }

    $sleepHours = floatval($input['sleep_hours'] ?? 0);
    $overallMood = trim($input['overall_mood'] ?? '');

    $isMenstruating = !empty($input['is_menstruating']) ? 1 : 0;
    $flowIntensity = $isMenstruating ? (trim($input['flow_intensity'] ?? 'Medium') ?: 'Medium') : null;

    $medications = (array)($input['medications'] ?? []);
    $medicationsJson = json_encode(array_values(array_filter($medications)));

    $sensoryBehaviors = (array)($input['sensory_behaviors'] ?? []);
    $sensoryJson = json_encode(array_values(array_filter($sensoryBehaviors)));

    $interventions = (array)($input['interventions'] ?? []);
    $interventionsJson = json_encode(array_values(array_filter($interventions)));

    $activities = (array)($input['activities'] ?? []);
    $activitiesJson = json_encode(array_values(array_filter($activities)));

    $food = (array)($input['food'] ?? []);
    $foodJson = json_encode(array_values(array_filter($food)));

    $notes = trim($input['notes'] ?? '');

    // Check if log exists for this date
    $checkStmt = $pdo->prepare("SELECT id FROM z_logs WHERE log_date = ? LIMIT 1");
    $checkStmt->execute([$date]);
    $existingId = $checkStmt->fetchColumn();

    if ($existingId) {
        $updateSql = "
            UPDATE z_logs SET 
                updated_at = CURRENT_TIMESTAMP,
                overall_mood = ?,
                sleep_hours = ?,
                is_menstruating = ?,
                flow_intensity = ?,
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
            $isMenstruating,
            $flowIntensity,
            $medicationsJson,
            $sensoryJson,
            $interventionsJson,
            $activitiesJson,
            $foodJson,
            $notes,
            $existingId
        ]);
        $savedId = (int)$existingId;
    } else {
        $insertSql = "
            INSERT INTO z_logs 
                (log_date, overall_mood, sleep_hours, is_menstruating, flow_intensity, medications_json, sensory_behavior_json, interventions_json, activities_json, food_json, notes)
            VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            $date,
            $overallMood,
            $sleepHours,
            $isMenstruating,
            $flowIntensity,
            $medicationsJson,
            $sensoryJson,
            $interventionsJson,
            $activitiesJson,
            $foodJson,
            $notes
        ]);
        $savedId = (int)$pdo->lastInsertId();
    }

    json_response([
        'success' => true,
        'message' => "Log saved successfully for $date!",
        'id' => $savedId
    ]);
}

json_response(['error' => 'Method not allowed'], 405);
