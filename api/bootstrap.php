<?php
/**
 * Daily Tracker - REST API Bootstrap & Helpers
 */

if (php_sapi_name() !== 'cli') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    if (!headers_sent()) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    }

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
}

require_once __DIR__ . '/../config.php';

/**
 * Send JSON response and terminate script
 */
function json_response($data, int $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Parse incoming JSON body or fallback to $_POST
 */
function get_json_input() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    return $_POST;
}

/**
 * Check if current session is authenticated
 */
function is_api_authenticated(): bool {
    return !empty($_SESSION['user_id']) && !empty($_SESSION['role']);
}

/**
 * Check if authenticated user is a parent
 */
function is_api_parent(): bool {
    return is_api_authenticated() && $_SESSION['role'] === 'parent';
}

/**
 * Check if authenticated user is demo
 */
function is_api_demo(): bool {
    return is_api_authenticated() && $_SESSION['role'] === 'demo';
}

/**
 * Enforce role authentication for API endpoints
 */
function require_api_role(?string $requiredRole = null) {
    if (!is_api_authenticated()) {
        json_response([
            'success' => false,
            'error' => 'Unauthorized: Please enter passcode to access.',
            'code' => 'AUTH_REQUIRED'
        ], 401);
    }

    if ($requiredRole !== null && $_SESSION['role'] !== $requiredRole) {
        json_response([
            'success' => false,
            'error' => "Forbidden: $requiredRole role required.",
            'code' => 'FORBIDDEN'
        ], 403);
    }
}
