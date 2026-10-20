<?php
/**
 * Daily Tracker - Configuration & Database Initialization
 * Designed for lightweight, high-performance execution on Hostinger Shared Hosting (PHP 7.4 - 8.3+)
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Timezone configuration (avoids UTC drift when server defaults to UTC)
if (getenv('APP_TIMEZONE')) {
    date_default_timezone_set(getenv('APP_TIMEZONE'));
} elseif (!ini_get('date.timezone')) {
    date_default_timezone_set('America/Chicago');
}

// -------------------------------------------------------------
// Database Connection Settings
// -------------------------------------------------------------
// For Hostinger: update DB_NAME, DB_USER, DB_PASS to match your MySQL database
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'daily_tracker');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// SQLite local fallback support (for local testing when MySQL is not running)
define('USE_SQLITE_FALLBACK', true);
define('SQLITE_FILE', __DIR__ . '/tracker_local.sqlite');

/**
 * Get PDO Database Connection
 * Tries MySQL first; if unavailable and fallback is enabled, connects via SQLite.
 */
function get_db_connection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $driver = 'mysql';
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // If MySQL fails and SQLite fallback is permitted, use SQLite for effortless local testing
        if (USE_SQLITE_FALLBACK) {
            try {
                $pdo = new PDO("sqlite:" . SQLITE_FILE);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                $driver = 'sqlite';
            } catch (PDOException $sqle) {
                die("Database Connection Error: " . htmlspecialchars($sqle->getMessage()));
            }
        } else {
            die("Database Connection Error: " . htmlspecialchars($e->getMessage()));
        }
    }

    // Auto-initialize schema & seed data if needed
    init_database($pdo, $driver);

    return $pdo;
}

/**
 * Initialize Tables and Seed Default Data
 */
function init_database(PDO $pdo, $driver = 'mysql') {
    // 1. Users Table (Passcode-based auth)
    if ($driver === 'sqlite') {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                passcode_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('parent', 'teacher'))
            )
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS master_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                z_name TEXT NOT NULL,
                z_age INTEGER NOT NULL,
                z_class TEXT NOT NULL,
                z_school TEXT NOT NULL
            )
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS master_lists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                item_name TEXT NOT NULL,
                is_active INTEGER DEFAULT 1
            )
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS z_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                log_date TEXT UNIQUE NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                overall_mood TEXT,
                sleep_hours REAL DEFAULT 0,
                medications_json TEXT,
                sensory_behavior_json TEXT,
                interventions_json TEXT,
                activities_json TEXT,
                food_json TEXT,
                notes TEXT
            )
        ");
    } else {
        // MySQL Engine
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                passcode_hash VARCHAR(255) NOT NULL,
                role ENUM('parent', 'teacher') NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS master_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                z_name VARCHAR(100) NOT NULL,
                z_age INT NOT NULL,
                z_class VARCHAR(100) NOT NULL,
                z_school VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS master_lists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category ENUM('mood', 'medication', 'food', 'behavior', 'intervention', 'exercise', 'activity') NOT NULL,
                item_name VARCHAR(255) NOT NULL,
                is_active TINYINT(1) DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS z_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                log_date DATE UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                overall_mood VARCHAR(100) NULL,
                sleep_hours DECIMAL(4,1) DEFAULT 0.0,
                medications_json TEXT NULL,
                sensory_behavior_json TEXT NULL,
                interventions_json TEXT NULL,
                activities_json TEXT NULL,
                food_json TEXT NULL,
                notes TEXT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }

    // 2. Seed Default Passcodes if empty
    $checkUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($checkUsers == 0) {
        $parentHash = password_hash('0023', PASSWORD_DEFAULT);
        $teacherHash = password_hash('5678', PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("INSERT INTO users (passcode_hash, role) VALUES (?, ?)");
        $stmt->execute([$parentHash, 'parent']);
        $stmt->execute([$teacherHash, 'teacher']);
    }

    // 3. Seed Default Master Settings if empty
    $checkSettings = $pdo->query("SELECT COUNT(*) FROM master_settings")->fetchColumn();
    if ($checkSettings == 0) {
        $stmt = $pdo->prepare("INSERT INTO master_settings (z_name, z_age, z_class, z_school) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Zeba', 15, 'Grade 9', 'Greenwood High']);
    }

    // 4. Seed Default Master Lists if empty
    $checkLists = $pdo->query("SELECT COUNT(*) FROM master_lists")->fetchColumn();
    if ($checkLists == 0) {
        $defaults = [
            'mood' => [
                'Calm', 'Happy', 'Aggressive', 'Anxiety', 'Hyperactive', 'Sensory Overload', 'Withdrawn'
            ],
            'medication' => [
                'Focalin (Morning)', 'Melatonin (Night)'
            ],
            'food' => [
                'High-Protein/High-Fat', 'High-Sugar', 'Salty/Crunchy', 'General Meal'
            ],
            'behavior' => [
                'Ear Covering', 'Food Grabbing', 'Cover with Blanket (Cocooning)', 'Impulsive Pacing', 'Sound Sensitivity', 'Self-Regulation (Stimming)'
            ],
            'intervention' => [
                'Joint Compression', 'Neutral Warmth', 'Walk', 'Earmuffs (Walker\'s Electronics)', 'Visual Timer', 'Oral Sensory (Gum/Crunch)', 'Visual Board Prompt'
            ],
            'activity' => [
                'Music Class', 'Keyboard', 'Speech'
            ],
            'exercise' => [
                'Pickleball', 'Badminton', 'Yoga', 'Exercise General'
            ]
        ];

        $stmt = $pdo->prepare("INSERT INTO master_lists (category, item_name, is_active) VALUES (?, ?, 1)");
        foreach ($defaults as $cat => $items) {
            foreach ($items as $item) {
                $stmt->execute([$cat, $item]);
            }
        }
    }
}

/**
 * Helper to get active master list items grouped by category
 */
function get_master_list_items(PDO $pdo, $activeOnly = true) {
    $sql = "SELECT * FROM master_lists";
    if ($activeOnly) {
        $sql .= " WHERE is_active = 1";
    }
    $sql .= " ORDER BY category ASC, id ASC";
    $rows = $pdo->query($sql)->fetchAll();

    $grouped = [];
    foreach ($rows as $row) {
        $grouped[$row['category']][] = $row;
    }
    return $grouped;
}

/**
 * Helper to get Zeba's current bio and settings
 */
function get_master_settings(PDO $pdo) {
    $stmt = $pdo->query("SELECT * FROM master_settings ORDER BY id ASC LIMIT 1");
    $settings = $stmt->fetch();
    if (!$settings) {
        return [
            'id' => 1,
            'z_name' => 'Zeba',
            'z_age' => 15,
            'z_class' => 'Grade 9',
            'z_school' => 'Greenwood High'
        ];
    }
    return $settings;
}
