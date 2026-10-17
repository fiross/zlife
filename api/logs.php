<?php
/**
 * API: Daily Logs (Read & Save Tracker Logs)
 */

require_once __DIR__ . '/bootstrap.php';

require_api_role(); // Enforce authentication

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $date = $_GET['date'] ?? date('Y-m-d');
    
    // Validate date format YYYY-MM-DD
    $d = DateTime::createFromFormat('Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) {
        $date = date('Y-m-d');
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
    require_api_role('parent'); // Only parents can modify logs
    $input = get_json_input();

    $date = trim($input['log_date'] ?? date('Y-m-d'));
    $d = DateTime::createFromFormat('Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) {
        json_response(['success' => false, 'error' => 'Invalid date format (YYYY-MM-DD expected).'], 400);
    }

    $sleepHours = floatval($input['sleep_hours'] ?? 0);
    $overallMood = trim($input['overall_mood'] ?? '');

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
        $savedId = (int)$existingId;
    } else {
        $insertSql = "
            INSERT INTO z_logs 
                (log_date, overall_mood, sleep_hours, medications_json, sensory_behavior_json, interventions_json, activities_json, food_json, notes)
            VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            $date,
            $overallMood,
            $sleepHours,
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
