<?php
/**
 * API: Authentication (Mobile Passcode Login, Session Check, Logout)
 */

require_once __DIR__ . '/bootstrap.php';

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$input = get_json_input();

if ($action === 'logout' || ($method === 'POST' && isset($input['action']) && $input['action'] === 'logout')) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    session_destroy();
    json_response(['success' => true, 'message' => 'Logged out successfully']);
}

if ($method === 'GET') {
    json_response([
        'authenticated' => is_api_authenticated(),
        'role' => $_SESSION['role'] ?? null,
        'user_id' => $_SESSION['user_id'] ?? null
    ]);
}

if ($method === 'POST') {
    $passcode = trim($input['passcode'] ?? '');

    if (empty($passcode)) {
        json_response(['success' => false, 'error' => 'Passcode is required.'], 400);
    }

    // Verify passcode against users table
    $stmt = $pdo->query("SELECT id, passcode_hash, role FROM users");
    $users = $stmt->fetchAll();

    foreach ($users as $user) {
        if (password_verify($passcode, $user['passcode_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            
            json_response([
                'success' => true,
                'role' => $user['role'],
                'message' => 'Welcome ' . ucfirst($user['role']) . '!'
            ]);
        }
    }

    json_response([
        'success' => false,
        'error' => 'Invalid passcode. Please try again.'
    ], 401);
}

json_response(['error' => 'Method not allowed'], 405);
