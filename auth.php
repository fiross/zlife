<?php
/**
 * Daily Tracker - Authentication & Access Control
 * Mobile-First numeric keypad lock with role-based routing (Parent vs. Teacher)
 */

require_once __DIR__ . '/config.php';

// Handle Logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    header("Location: index.php");
    exit;
}

// Authentication Check Helpers
function is_logged_in() {
    return !empty($_SESSION['user_id']) && !empty($_SESSION['role']);
}

function is_parent() {
    return is_logged_in() && $_SESSION['role'] === 'parent';
}

function is_teacher() {
    return is_logged_in() && $_SESSION['role'] === 'teacher';
}

function get_user_role() {
    return $_SESSION['role'] ?? null;
}

/**
 * Require Login - If not authenticated, displays the full Mobile Passcode Keypad
 */
function require_login() {
    if (!is_logged_in()) {
        render_passcode_lock_screen();
        exit;
    }
}

/**
 * Require Parent - Denies teachers access to admin/configuration
 */
function require_parent() {
    require_login();
    if (!is_parent()) {
        http_response_code(403);
        include __DIR__ . '/header.php';
        ?>
        <div class="container py-5 text-center">
            <div class="card border-0 shadow-sm rounded-4 p-4 mx-auto" style="max-width: 450px;">
                <div class="display-1 text-warning mb-3">🔒</div>
                <h3 class="fw-bold text-dark">Parent Access Only</h3>
                <p class="text-muted">Teacher mode has view-only permissions and cannot access settings or configuration.</p>
                <a href="index.php" class="btn btn-primary rounded-pill px-4 py-2 mt-3 fw-bold">Return to Dashboard</a>
            </div>
        </div>
        </body></html>
        <?php
        exit;
    }
}

// Handle Passcode POST Submission
$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'verify_passcode') {
    $passcode = trim($_POST['passcode'] ?? '');
    if ($passcode !== '') {
        $pdo = get_db_connection();
        $users = $pdo->query("SELECT id, passcode_hash, role FROM users")->fetchAll();
        $authenticated = false;

        foreach ($users as $user) {
            if (password_verify($passcode, $user['passcode_hash'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role'] = $user['role'];
                $authenticated = true;
                break;
            }
        }

        if ($authenticated) {
            $redirect = $_POST['redirect_to'] ?? 'index.php';
            header("Location: " . $redirect);
            exit;
        } else {
            $loginError = "Incorrect passcode. Please check and try again.";
        }
    } else {
        $loginError = "Please enter your passcode.";
    }
}

/**
 * Render Mobile-Optimized Numeric Lock Screen
 */
function render_passcode_lock_screen($error = '') {
    global $loginError;
    $errorMessage = $error ?: $loginError;
    $pdo = get_db_connection();
    $settings = get_master_settings($pdo);
    $redirectTo = htmlspecialchars($_SERVER['REQUEST_URI'] ?? 'index.php');
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Daily Tracker - Passcode Lock</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="bg-warm-light d-flex align-items-center justify-content-center min-vh-100 py-3">

<div class="container" style="max-width: 400px;">
    <div class="card border-0 shadow-lg rounded-4 p-4 text-center bg-white">
        <!-- Logo & Title -->
        <div class="mb-3">
            <span class="badge rounded-pill bg-primary-soft text-primary px-3 py-2 fw-bold text-uppercase tracking-wider">
                Daily Tracker
            </span>
            <h2 class="fw-bold mt-2 mb-1 text-slate">Welcome</h2>
            <p class="text-muted small mb-0">Tracking for <?= htmlspecialchars($settings['z_name']) ?> &bull; <?= htmlspecialchars($settings['z_class']) ?></p>
        </div>

        <?php if ($errorMessage): ?>
            <div class="alert alert-danger py-2 px-3 rounded-3 small fw-bold mb-3 animate-shake">
                <?= htmlspecialchars($errorMessage) ?>
            </div>
        <?php endif; ?>

        <!-- Passcode Display Dots / Input -->
        <form id="passcodeForm" method="POST" action="auth.php">
            <input type="hidden" name="action" value="verify_passcode">
            <input type="hidden" name="redirect_to" value="<?= $redirectTo ?>">
            <input type="password" id="passcodeInput" name="passcode" maxlength="8" class="visually-hidden" autocomplete="off" autofocus>

            <div class="d-flex justify-content-center gap-2 mb-4" id="pinDots">
                <span class="pin-dot"></span>
                <span class="pin-dot"></span>
                <span class="pin-dot"></span>
                <span class="pin-dot"></span>
            </div>

            <!-- Mobile Numeric Keypad -->
            <div class="keypad-grid mb-3">
                <button type="button" class="btn keypad-btn" data-val="1">1</button>
                <button type="button" class="btn keypad-btn" data-val="2">2</button>
                <button type="button" class="btn keypad-btn" data-val="3">3</button>

                <button type="button" class="btn keypad-btn" data-val="4">4</button>
                <button type="button" class="btn keypad-btn" data-val="5">5</button>
                <button type="button" class="btn keypad-btn" data-val="6">6</button>

                <button type="button" class="btn keypad-btn" data-val="7">7</button>
                <button type="button" class="btn keypad-btn" data-val="8">8</button>
                <button type="button" class="btn keypad-btn" data-val="9">9</button>

                <button type="button" class="btn keypad-btn btn-secondary-action" id="btnClear" title="Clear">C</button>
                <button type="button" class="btn keypad-btn" data-val="0">0</button>
                <button type="button" class="btn keypad-btn btn-secondary-action" id="btnBackspace" title="Backspace">⌫</button>
            </div>

            <button type="submit" id="btnUnlock" class="btn btn-primary w-100 py-3 rounded-pill fw-bold text-uppercase letter-spacing shadow-sm">
                Unlock
            </button>
        </form>

        <div class="mt-4 pt-2 border-top">
            <p class="text-muted x-small mb-1">Enter <strong>Parent Passcode</strong> for full access</p>
            <p class="text-muted x-small mb-0">Enter <strong>Teacher Passcode</strong> for view-only summary</p>
        </div>
    </div>
</div>

<script>
    const input = document.getElementById('passcodeInput');
    const dots = document.querySelectorAll('.pin-dot');
    const form = document.getElementById('passcodeForm');

    function updateDots() {
        const len = input.value.length;
        dots.forEach((dot, index) => {
            if (index < len) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
        // Auto-submit if 4 digits entered
        if (len === 4) {
            setTimeout(() => {
                form.submit();
            }, 150);
        }
    }

    document.querySelectorAll('.keypad-btn[data-val]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (input.value.length < 8) {
                input.value += btn.getAttribute('data-val');
                updateDots();
            }
        });
    });

    document.getElementById('btnClear').addEventListener('click', () => {
        input.value = '';
        updateDots();
    });

    document.getElementById('btnBackspace').addEventListener('click', () => {
        input.value = input.value.slice(0, -1);
        updateDots();
    });

    // Also allow physical keyboard entry
    document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') {
            if (input.value.length < 8) {
                input.value += e.key;
                updateDots();
            }
        } else if (e.key === 'Backspace') {
            input.value = input.value.slice(0, -1);
            updateDots();
        } else if (e.key === 'Enter') {
            form.submit();
        }
    });
</script>
</body>
</html>
    <?php
}
