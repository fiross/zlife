<?php
/**
 * API: Passcode Management (Update Parent and Teacher Numeric Passcodes)
 */

require_once __DIR__ . '/bootstrap.php';

require_api_role('parent'); // Parent access only

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (is_api_demo()) {
        json_response(['success' => false, 'error' => 'Passcodes cannot be modified in Demo Mode.'], 403);
    }

    require_api_role('parent'); // Parent access only

    $input = get_json_input();

    $parentPass = trim($input['parent_passcode'] ?? '');
    $teacherPass = trim($input['teacher_passcode'] ?? '');

    $messages = [];

    if ($parentPass !== '') {
        if ($parentPass === '1234') {
            json_response(['success' => false, 'error' => 'Passcode 1234 is reserved for the Demo account. Please choose a different PIN.'], 400);
        }
        if (!ctype_digit($parentPass) || strlen($parentPass) < 4) {
            json_response(['success' => false, 'error' => 'Parent passcode must be at least 4 digits (numeric only).'], 400);
        }
        $stmt = $pdo->prepare("UPDATE users SET passcode_hash = ? WHERE role = 'parent'");
        $stmt->execute([password_hash($parentPass, PASSWORD_DEFAULT)]);
        $messages[] = 'Parent passcode updated.';
    }

    if ($teacherPass !== '') {
        if ($teacherPass === '1234') {
            json_response(['success' => false, 'error' => 'Passcode 1234 is reserved for the Demo account. Please choose a different PIN.'], 400);
        }
        if (!ctype_digit($teacherPass) || strlen($teacherPass) < 4) {
            json_response(['success' => false, 'error' => 'Teacher passcode must be at least 4 digits (numeric only).'], 400);
        }
        $stmt = $pdo->prepare("UPDATE users SET passcode_hash = ? WHERE role = 'teacher'");
        $stmt->execute([password_hash($teacherPass, PASSWORD_DEFAULT)]);
        $messages[] = 'Teacher passcode updated.';
    }

    if (empty($messages)) {
        json_response(['success' => false, 'error' => 'No passcode changes provided.'], 400);
    }

    json_response([
        'success' => true,
        'message' => implode(' ', $messages)
    ]);
}

json_response(['error' => 'Method not allowed'], 405);
