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

    if ($name === '' || $age <= 0) {
        json_response(['success' => false, 'error' => 'Name and a valid Age are required.'], 400);
    }

    $stmt = $pdo->prepare("UPDATE master_settings SET z_name = ?, z_age = ?, z_class = ?, z_school = ? WHERE id = 1");
    $stmt->execute([$name, $age, $class, $school]);

    $updated = get_master_settings($pdo);
    json_response([
        'success' => true,
        'message' => 'Profile updated successfully!',
        'data' => $updated
    ]);
}

json_response(['error' => 'Method not allowed'], 405);
