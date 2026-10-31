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
function init_database(PDO $pdo, $driver = null) {
    $driver = $driver ?: $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
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
                z_school TEXT NOT NULL,
                parent_email_1 TEXT DEFAULT NULL,
                parent_email_2 TEXT DEFAULT NULL,
                active_challenges TEXT DEFAULT NULL,
                diagnostic_summary TEXT DEFAULT NULL
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
                is_menstruating INTEGER DEFAULT 0,
                flow_intensity TEXT DEFAULT NULL,
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
                z_school VARCHAR(255) NOT NULL,
                parent_email_1 VARCHAR(255) NULL,
                parent_email_2 VARCHAR(255) NULL,
                active_challenges TEXT NULL,
                diagnostic_summary TEXT NULL
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
                is_menstruating TINYINT(1) DEFAULT 0,
                flow_intensity VARCHAR(20) NULL,
                medications_json TEXT NULL,
                sensory_behavior_json TEXT NULL,
                interventions_json TEXT NULL,
                activities_json TEXT NULL,
                food_json TEXT NULL,
                notes TEXT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }

    // Auto-migration 1: Ensure menstruation tracking columns exist on existing databases non-destructively
    try {
        if ($driver === 'sqlite') {
            $cols = $pdo->query("PRAGMA table_info(z_logs)")->fetchAll(PDO::FETCH_COLUMN, 1);
            if (!in_array('is_menstruating', $cols)) {
                $pdo->exec("ALTER TABLE z_logs ADD COLUMN is_menstruating INTEGER DEFAULT 0");
            }
            if (!in_array('flow_intensity', $cols)) {
                $pdo->exec("ALTER TABLE z_logs ADD COLUMN flow_intensity TEXT DEFAULT NULL");
            }
        } else {
            // MySQL Engine
            $colStmt = $pdo->query("SHOW COLUMNS FROM z_logs LIKE 'is_menstruating'");
            if (!$colStmt->fetch()) {
                $pdo->exec("ALTER TABLE z_logs ADD COLUMN is_menstruating TINYINT(1) DEFAULT 0 AFTER sleep_hours");
            }
            $colStmt2 = $pdo->query("SHOW COLUMNS FROM z_logs LIKE 'flow_intensity'");
            if (!$colStmt2->fetch()) {
                $pdo->exec("ALTER TABLE z_logs ADD COLUMN flow_intensity VARCHAR(20) NULL AFTER is_menstruating");
            }
        }
    } catch (Exception $e) {
        // Silently continue if columns already exist or altered
    }

    // Auto-migration 2: Ensure parent notification email columns exist in master_settings
    try {
        if ($driver === 'sqlite') {
            $settingsCols = $pdo->query("PRAGMA table_info(master_settings)")->fetchAll(PDO::FETCH_COLUMN, 1);
            if (!in_array('parent_email_1', $settingsCols)) {
                $pdo->exec("ALTER TABLE master_settings ADD COLUMN parent_email_1 TEXT DEFAULT NULL");
            }
            if (!in_array('parent_email_2', $settingsCols)) {
                $pdo->exec("ALTER TABLE master_settings ADD COLUMN parent_email_2 TEXT DEFAULT NULL");
            }
        } else {
            // MySQL Engine
            $colStmtEmail1 = $pdo->query("SHOW COLUMNS FROM master_settings LIKE 'parent_email_1'");
            if (!$colStmtEmail1->fetch()) {
                $pdo->exec("ALTER TABLE master_settings ADD COLUMN parent_email_1 VARCHAR(255) NULL AFTER z_school");
            }
            $colStmtEmail2 = $pdo->query("SHOW COLUMNS FROM master_settings LIKE 'parent_email_2'");
            if (!$colStmtEmail2->fetch()) {
                $pdo->exec("ALTER TABLE master_settings ADD COLUMN parent_email_2 VARCHAR(255) NULL AFTER parent_email_1");
            }
        }
    } catch (Exception $e) {
        // Silently continue if columns already exist or altered
    }

    // Auto-migration 3: Ensure active_challenges and diagnostic_summary exist in master_settings
    try {
        if ($driver === 'sqlite') {
            $settingsCols = $pdo->query("PRAGMA table_info(master_settings)")->fetchAll(PDO::FETCH_COLUMN, 1);
            if (!in_array('active_challenges', $settingsCols)) {
                $pdo->exec("ALTER TABLE master_settings ADD COLUMN active_challenges TEXT DEFAULT NULL");
            }
            if (!in_array('diagnostic_summary', $settingsCols)) {
                $pdo->exec("ALTER TABLE master_settings ADD COLUMN diagnostic_summary TEXT DEFAULT NULL");
            }
        } else {
            // MySQL Engine
            $colStmtChallenges = $pdo->query("SHOW COLUMNS FROM master_settings LIKE 'active_challenges'");
            if (!$colStmtChallenges->fetch()) {
                $pdo->exec("ALTER TABLE master_settings ADD COLUMN active_challenges TEXT NULL AFTER parent_email_2");
            }
            $colStmtSummary = $pdo->query("SHOW COLUMNS FROM master_settings LIKE 'diagnostic_summary'");
            if (!$colStmtSummary->fetch()) {
                $pdo->exec("ALTER TABLE master_settings ADD COLUMN diagnostic_summary TEXT NULL AFTER active_challenges");
            }
        }
    } catch (Exception $e) {
        // Silently continue if columns already exist or altered
    }

    // Auto-migration 4: Migrate legacy parent passcode away from fixed Demo PIN 1234 to 4321
    try {
        $parentRow = $pdo->query("SELECT id, passcode_hash FROM users WHERE role = 'parent' LIMIT 1")->fetch();
        if ($parentRow && password_verify('1234', $parentRow['passcode_hash'])) {
            $newParentHash = password_hash('4321', PASSWORD_DEFAULT);
            $migStmt = $pdo->prepare("UPDATE users SET passcode_hash = ? WHERE id = ?");
            $migStmt->execute([$newParentHash, $parentRow['id']]);
        }
    } catch (Exception $e) {
        // Silently continue
    }

    // 2. Seed Default Passcodes if empty (Parent: 4321, Teacher: 5678, Demo: 1234 fixed)
    $checkUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($checkUsers == 0) {
        $parentHash = password_hash('4321', PASSWORD_DEFAULT);
        $teacherHash = password_hash('5678', PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("INSERT INTO users (passcode_hash, role) VALUES (?, ?)");
        $stmt->execute([$parentHash, 'parent']);
        $stmt->execute([$teacherHash, 'teacher']);
    }

    // 3. Seed Default Master Settings if empty
    $checkSettings = $pdo->query("SELECT COUNT(*) FROM master_settings")->fetchColumn();
    if ($checkSettings == 0) {
        $defaultChallenges = json_encode(['Auditory Sensitivity', 'Sensory Overload', 'Transitions & Routine Changes', 'Emotional Regulation'], JSON_UNESCAPED_UNICODE);
        $defaultSummary = 'Level 2 Autism Spectrum Disorder (ASD) and ADHD Combined Type. Highly responsive to deep pressure compression, calm sensory pacing, noise-dampening earmuffs, and predictable visual task timers.';
        $stmt = $pdo->prepare("INSERT INTO master_settings (z_name, z_age, z_class, z_school, active_challenges, diagnostic_summary) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute(['Zeba', 15, 'Grade 9', 'Greenwood High', $defaultChallenges, $defaultSummary]);
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
 * Helper to get child's current bio and settings
 */
function get_master_settings(PDO $pdo) {
    $stmt = $pdo->query("SELECT * FROM master_settings ORDER BY id ASC LIMIT 1");
    $settings = $stmt->fetch();
    if (!$settings) {
        return [
            'id' => 1,
            'z_name' => 'Child',
            'z_age' => 0,
            'z_class' => '',
            'z_school' => '',
            'parent_email_1' => '',
            'parent_email_2' => '',
            'active_challenges' => ['Auditory Sensitivity', 'Sensory Overload', 'Transitions & Routine Changes', 'Emotional Regulation'],
            'diagnostic_summary' => 'Level 2 Autism Spectrum Disorder (ASD) and ADHD Combined Type. Highly responsive to deep pressure compression, calm sensory pacing, noise-dampening earmuffs, and predictable visual task timers.'
        ];
    }
    // Ensure email keys exist even if null in database
    $settings['parent_email_1'] = $settings['parent_email_1'] ?? '';
    $settings['parent_email_2'] = $settings['parent_email_2'] ?? '';
    $settings['diagnostic_summary'] = $settings['diagnostic_summary'] ?? '';

    // Handle active_challenges JSON decode
    if (isset($settings['active_challenges']) && is_string($settings['active_challenges']) && trim($settings['active_challenges']) !== '') {
        $decoded = json_decode($settings['active_challenges'], true);
        $settings['active_challenges'] = is_array($decoded) ? $decoded : [];
    } else {
        $settings['active_challenges'] = is_array($settings['active_challenges'] ?? null) ? $settings['active_challenges'] : [];
    }

    return $settings;
}
