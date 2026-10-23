<?php
/**
 * API: Master Settings (Profile & Bio)
 */

require_once __DIR__ . '/bootstrap.php';

require_api_role(); // Must be logged in

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $settings = get_master_settings($pdo);
    json_response(['success' => true, 'data' => $settings]);
}

if ($method === 'POST') {
    require_api_role('parent'); // Parent only
    $input = get_json_input();

    $name = trim($input['z_name'] ?? '');
    $age = intval($input['z_age'] ?? 0);
    $class = trim($input['z_class'] ?? '');
    $school = trim($input['z_school'] ?? '');
    $email1 = trim($input['parent_email_1'] ?? '');
    $email2 = trim($input['parent_email_2'] ?? '');

    // Active Challenges (Dynamic List)
    $rawChallenges = $input['active_challenges'] ?? [];
    if (is_string($rawChallenges)) {
        $decoded = json_decode($rawChallenges, true);
        $rawChallenges = is_array($decoded) ? $decoded : explode("\n", $rawChallenges);
    }
    $challenges = [];
    if (is_array($rawChallenges)) {
        foreach ($rawChallenges as $item) {
            $trimmed = trim(is_string($item) ? $item : '');
            if ($trimmed !== '' && !in_array($trimmed, $challenges)) {
                $challenges[] = $trimmed;
            }
        }
    }
    $challengesJson = json_encode(array_values($challenges), JSON_UNESCAPED_UNICODE);

    // Diagnostic Summary (Multi-line clinical context)
    $diagnosticSummary = trim($input['diagnostic_summary'] ?? '');

    if ($name === '' || $age <= 0) {
        json_response(['success' => false, 'error' => 'Name and a valid Age are required.'], 400);
    }

    if ($email1 !== '' && !filter_var($email1, FILTER_VALIDATE_EMAIL)) {
        json_response(['success' => false, 'error' => 'Parent Email 1 must be a valid email address.'], 400);
    }

    if ($email2 !== '' && !filter_var($email2, FILTER_VALIDATE_EMAIL)) {
        json_response(['success' => false, 'error' => 'Parent Email 2 must be a valid email address.'], 400);
    }

    $stmt = $pdo->prepare("
        UPDATE master_settings 
        SET z_name = ?, z_age = ?, z_class = ?, z_school = ?, parent_email_1 = ?, parent_email_2 = ?, active_challenges = ?, diagnostic_summary = ? 
        WHERE id = 1
    ");
    $stmt->execute([
        $name,
        $age,
        $class,
        $school,
        $email1 ?: null,
        $email2 ?: null,
        $challengesJson,
        $diagnosticSummary ?: null
    ]);

    $updated = get_master_settings($pdo);
    json_response([
        'success' => true,
        'message' => 'Profile, active challenges, and diagnostic summary updated successfully!',
        'data' => $updated
    ]);
}

json_response(['error' => 'Method not allowed'], 405);
