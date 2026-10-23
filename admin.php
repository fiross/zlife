<?php
/**
 * Daily Tracker - Admin Configuration Dashboard
 * Parent-Only Access: Manage Profile, Passcodes, and Dynamic Master Lists (Medications, Moods, Behaviors, etc.)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// Strict Parent Access Enforced
require_parent();

$pdo = get_db_connection();
$flashSuccess = '';
$flashError = '';

// -------------------------------------------------------------
// Handle Profile / Bio Update
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_profile') {
    $name = trim($_POST['z_name'] ?? '');
    $age = intval($_POST['z_age'] ?? 0);
    $class = trim($_POST['z_class'] ?? '');
    $school = trim($_POST['z_school'] ?? '');

    if ($name !== '' && $age > 0) {
        $stmt = $pdo->prepare("UPDATE master_settings SET z_name = ?, z_age = ?, z_class = ?, z_school = ? WHERE id = 1");
        $stmt->execute([$name, $age, $class, $school]);
        $flashSuccess = "Profile details updated successfully!";
    } else {
        $flashError = "Name and Age are required.";
    }
}

// -------------------------------------------------------------
// Handle Passcode Management
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_passcodes') {
    $parentPass = trim($_POST['parent_passcode'] ?? '');
    $teacherPass = trim($_POST['teacher_passcode'] ?? '');

    if ($parentPass !== '') {
        if (!ctype_digit($parentPass) || strlen($parentPass) < 4) {
            $flashError = "Parent passcode must be at least 4 digits.";
        } else {
            $stmt = $pdo->prepare("UPDATE users SET passcode_hash = ? WHERE role = 'parent'");
            $stmt->execute([password_hash($parentPass, PASSWORD_DEFAULT)]);
            $flashSuccess = "Parent passcode successfully updated!";
        }
    }

    if ($teacherPass !== '' && empty($flashError)) {
        if (!ctype_digit($teacherPass) || strlen($teacherPass) < 4) {
            $flashError = "Teacher passcode must be at least 4 digits.";
        } else {
            $stmt = $pdo->prepare("UPDATE users SET passcode_hash = ? WHERE role = 'teacher'");
            $stmt->execute([password_hash($teacherPass, PASSWORD_DEFAULT)]);
            $flashSuccess = ($flashSuccess ? $flashSuccess . " " : "") . "Teacher passcode successfully updated!";
        }
    }
}

// -------------------------------------------------------------
// Handle Master Lists Item Add
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_item') {
    $category = trim($_POST['category'] ?? '');
    $itemName = trim($_POST['item_name'] ?? '');

    $allowedCategories = ['medication', 'mood', 'behavior', 'intervention', 'activity', 'exercise', 'food'];
    if (in_array($category, $allowedCategories) && $itemName !== '') {
        $stmt = $pdo->prepare("INSERT INTO master_lists (category, item_name, is_active) VALUES (?, ?, 1)");
        $stmt->execute([$category, $itemName]);
        $flashSuccess = "Added '" . htmlspecialchars($itemName) . "' to " . ucfirst($category) . " list!";
    } else {
        $flashError = "Item name cannot be blank.";
    }
}

// -------------------------------------------------------------
// Handle Master Lists Toggle Active / Inactive
// -------------------------------------------------------------
if (isset($_GET['action']) && $_GET['action'] === 'toggle_item' && !empty($_GET['id'])) {
    $itemId = intval($_GET['id']);
    $stmt = $pdo->prepare("UPDATE master_lists SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?");
    $stmt->execute([$itemId]);
    header("Location: admin.php?active_tab=" . urlencode($_GET['cat'] ?? 'medication'));
    exit;
}

// -------------------------------------------------------------
// Handle Master Lists Delete
// -------------------------------------------------------------
if (isset($_GET['action']) && $_GET['action'] === 'delete_item' && !empty($_GET['id'])) {
    $itemId = intval($_GET['id']);
    $stmt = $pdo->prepare("DELETE FROM master_lists WHERE id = ?");
    $stmt->execute([$itemId]);
    header("Location: admin.php?active_tab=" . urlencode($_GET['cat'] ?? 'medication'));
    exit;
}

// Fetch Data for Display
$settings = get_master_settings($pdo);
$allMasterLists = get_master_list_items($pdo, false); // Include inactive
$activeTab = $_GET['active_tab'] ?? 'medication';

require_once __DIR__ . '/header.php';
?>

<main class="container py-3" style="max-width: 720px;">

    <!-- Top Action Breadcrumb -->
    <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
            <h3 class="fw-bold text-slate mb-0">Admin Configuration</h3>
            <div class="text-muted small">Manage profile, passcodes & custom tracking lists</div>
        </div>
        <a href="index.php" class="btn btn-primary rounded-pill px-3 py-2 fw-bold text-decoration-none shadow-sm">
            ← Back to Tracker
        </a>
    </div>

    <!-- Flash Notifications -->
    <?php if ($flashSuccess): ?>
        <div class="alert alert-success alert-dismissible fade show rounded-3 shadow-xs border-0 mb-3" role="alert">
            <strong>Success:</strong> <?= $flashSuccess ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>

    <?php if ($flashError): ?>
        <div class="alert alert-danger alert-dismissible fade show rounded-3 shadow-xs border-0 mb-3" role="alert">
            <strong>Error:</strong> <?= $flashError ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>

    <!-- Nav Tabs -->
    <ul class="nav nav-pills nav-fill bg-white p-2 rounded-4 shadow-sm border mb-4 gap-1" id="adminTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link rounded-3 fw-bold active" id="tab-lists-btn" data-bs-toggle="pill" data-bs-target="#tab-lists" type="button" role="tab">
                📋 Lists & Medications
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link rounded-3 fw-bold" id="tab-profile-btn" data-bs-toggle="pill" data-bs-target="#tab-profile" type="button" role="tab">
                👤 Student Bio
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link rounded-3 fw-bold" id="tab-passcodes-btn" data-bs-toggle="pill" data-bs-target="#tab-passcodes" type="button" role="tab">
                🔑 Passcodes
            </button>
        </li>
    </ul>

    <div class="tab-content" id="adminTabsContent">

        <!-- ========================================================= -->
        <!-- TAB 1: MASTER LISTS & MEDICATION MANAGER                 -->
        <!-- ========================================================= -->
        <div class="tab-pane fade show active" id="tab-lists" role="tabpanel">

            <!-- Sub Category Tabs -->
            <?php
            $categories = [
                'medication'   => ['name' => 'Medications', 'icon' => '💊', 'badge' => 'bg-success'],
                'mood'         => ['name' => 'Moods', 'icon' => '😊', 'badge' => 'bg-primary'],
                'behavior'     => ['name' => 'Behaviors', 'icon' => '⚡', 'badge' => 'bg-warning'],
                'intervention' => ['name' => 'Interventions', 'icon' => '🛡️', 'badge' => 'bg-info'],
                'activity'     => ['name' => 'Activities', 'icon' => '🎨', 'badge' => 'bg-purple'],
                'exercise'     => ['name' => 'Exercise', 'icon' => '🏃', 'badge' => 'bg-secondary'],
                'food'         => ['name' => 'Food', 'icon' => '🍎', 'badge' => 'bg-danger'],
            ];
            ?>

            <div class="d-flex overflow-auto gap-2 pb-2 mb-3">
                <?php foreach ($categories as $catKey => $catMeta): ?>
                    <button type="button" 
                            class="btn btn-sm rounded-pill px-3 py-2 fw-bold text-nowrap cat-pill-btn <?= ($activeTab === $catKey) ? 'btn-dark' : 'btn-light border' ?>" 
                            onclick="switchCategoryTab('<?= $catKey ?>')">
                        <?= $catMeta['icon'] ?> <?= $catMeta['name'] ?>
                    </button>
                <?php endforeach; ?>
            </div>

            <!-- Category Detail Card -->
            <?php foreach ($categories as $catKey => $catMeta): ?>
                <div class="category-pane <?= ($activeTab === $catKey) ? '' : 'd-none' ?>" id="pane-<?= $catKey ?>">
                    <div class="tracker-section-card">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="fw-bold text-slate mb-0 d-flex align-items-center gap-2">
                                <span><?= $catMeta['icon'] ?></span>
                                <span><?= $catMeta['name'] ?> Manager</span>
                            </h5>
                            <?php if ($catKey === 'medication'): ?>
                                <span class="badge bg-success-subtle text-success-emphasis border rounded-pill px-3 py-1">
                                    Dynamic Multiple Medications
                                </span>
                            <?php endif; ?>
                        </div>

                        <?php if ($catKey === 'medication'): ?>
                            <div class="alert alert-info border-0 rounded-3 small mb-3">
                                <strong>💡 Flexible Medications:</strong> Add any current or future prescription, supplement, or PRN medication (e.g. <em>Guanfacine 1mg</em>, <em>Magnesium Chelate</em>). Active items immediately appear as multi-select toggles on the daily logging page.
                            </div>
                        <?php endif; ?>

                        <!-- Add Item Form -->
                        <form method="POST" action="admin.php" class="mb-4">
                            <input type="hidden" name="action" value="add_item">
                            <input type="hidden" name="category" value="<?= $catKey ?>">
                            <div class="input-group">
                                <input type="text" name="item_name" class="form-control rounded-start-pill py-2 px-3" 
                                       placeholder="Add new <?= strtolower(rtrim($catMeta['name'], 's')) ?> (e.g., <?= $catKey === 'medication' ? 'Guanfacine (Evening)' : 'New item name' ?>)..." required>
                                <button type="submit" class="btn btn-primary rounded-end-pill px-4 fw-bold">
                                    + Add
                                </button>
                            </div>
                        </form>

                        <!-- Items List Table -->
                        <div class="list-group rounded-3 border">
                            <?php 
                            $items = $allMasterLists[$catKey] ?? [];
                            if (!empty($items)):
                                foreach ($items as $item): 
                                    $isActive = (int)$item['is_active'] === 1;
                            ?>
                                <div class="list-group-item d-flex justify-content-between align-items-center py-3 px-3 <?= $isActive ? '' : 'bg-light text-muted' ?>">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="badge rounded-circle p-1 <?= $isActive ? 'bg-success' : 'bg-secondary' ?>" style="width: 10px; height: 10px; display: inline-block;"></span>
                                        <span class="fw-bold <?= $isActive ? 'text-dark' : 'text-decoration-line-through text-muted' ?>">
                                            <?= htmlspecialchars($item['item_name']) ?>
                                        </span>
                                        <?php if (!$isActive): ?>
                                            <span class="badge bg-secondary-subtle text-secondary rounded-pill x-small">Inactive</span>
                                        <?php endif; ?>
                                    </div>
                                    <div class="d-flex align-items-center gap-2">
                                        <!-- Toggle Active Button -->
                                        <a href="admin.php?action=toggle_item&id=<?= $item['id'] ?>&cat=<?= $catKey ?>" 
                                           class="btn btn-sm <?= $isActive ? 'btn-outline-warning' : 'btn-outline-success' ?> rounded-pill px-2 py-1 x-small fw-bold"
                                           title="Toggle active status">
                                            <?= $isActive ? 'Hide' : 'Show' ?>
                                        </a>
                                        <!-- Delete Item Button -->
                                        <a href="admin.php?action=delete_item&id=<?= $item['id'] ?>&cat=<?= $catKey ?>" 
                                           class="btn btn-sm btn-outline-danger rounded-pill px-2 py-1 x-small"
                                           onclick="return confirm('Permanently remove this item from master list?');"
                                           title="Delete permanently">
                                            ✕
                                        </a>
                                    </div>
                                </div>
                            <?php 
                                endforeach;
                            else: 
                            ?>
                                <div class="p-3 text-center text-muted small">No items configured in this category yet.</div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>

        </div>

        <!-- ========================================================= -->
        <!-- TAB 2: STUDENT PROFILE & BIO                             -->
        <!-- ========================================================= -->
        <div class="tab-pane fade" id="tab-profile" role="tabpanel">
            <div class="tracker-section-card">
                <h5 class="fw-bold text-slate mb-3">Student Bio & School Details</h5>
                <form method="POST" action="admin.php">
                    <input type="hidden" name="action" value="update_profile">
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold text-secondary">Student Name</label>
                        <input type="text" name="z_name" class="form-control rounded-3 py-2 px-3" value="<?= htmlspecialchars($settings['z_name']) ?>" required>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-6">
                            <label class="form-label fw-bold text-secondary">Age</label>
                            <input type="number" name="z_age" class="form-control rounded-3 py-2 px-3" value="<?= htmlspecialchars($settings['z_age']) ?>" min="1" max="99" required>
                        </div>
                        <div class="col-6">
                            <label class="form-label fw-bold text-secondary">Grade / Class</label>
                            <input type="text" name="z_class" class="form-control rounded-3 py-2 px-3" value="<?= htmlspecialchars($settings['z_class']) ?>" required>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-bold text-secondary">School / Program</label>
                        <input type="text" name="z_school" class="form-control rounded-3 py-2 px-3" value="<?= htmlspecialchars($settings['z_school']) ?>" required>
                    </div>

                    <button type="submit" class="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm">
                        Save Profile Settings
                    </button>
                </form>
            </div>
        </div>

        <!-- ========================================================= -->
        <!-- TAB 3: PASSCODE MANAGEMENT                               -->
        <!-- ========================================================= -->
        <div class="tab-pane fade" id="tab-passcodes" role="tabpanel">
            <div class="tracker-section-card">
                <h5 class="fw-bold text-slate mb-2">Change Passcodes</h5>
                <p class="text-muted small mb-4">Passcodes are encrypted using standard bcrypt hashing. Enter 4 or more numeric digits.</p>

                <form method="POST" action="admin.php">
                    <input type="hidden" name="action" value="update_passcodes">

                    <div class="mb-3">
                        <label class="form-label fw-bold text-secondary">New Parent Passcode (Numeric)</label>
                        <input type="password" inputmode="numeric" pattern="[0-9]*" name="parent_passcode" class="form-control rounded-3 py-2 px-3" placeholder="Leave blank to keep current (default 1234)">
                        <div class="text-muted x-small mt-1">Grants full editing, calendar, and admin configuration rights.</div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-bold text-secondary">New Teacher Passcode (Numeric)</label>
                        <input type="password" inputmode="numeric" pattern="[0-9]*" name="teacher_passcode" class="form-control rounded-3 py-2 px-3" placeholder="Leave blank to keep current (default 5678)">
                        <div class="text-muted x-small mt-1">Grants read-only access to daily summaries; blocks editing & admin.</div>
                    </div>

                    <button type="submit" class="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm">
                        Update Passcodes
                    </button>
                </form>
            </div>
        </div>

    </div>

</main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
    function switchCategoryTab(cat) {
        document.querySelectorAll('.cat-pill-btn').forEach(btn => {
            btn.classList.remove('btn-dark');
            btn.classList.add('btn-light', 'border');
        });
        document.querySelectorAll('.category-pane').forEach(pane => {
            pane.classList.add('d-none');
        });

        const activePane = document.getElementById('pane-' + cat);
        if (activePane) {
            activePane.classList.remove('d-none');
        }

        event.currentTarget.classList.remove('btn-light', 'border');
        event.currentTarget.classList.add('btn-dark');
    }

    // Auto-select tab if URL has hash
    window.addEventListener('DOMContentLoaded', () => {
        if (window.location.hash === '#tab-medication') {
            switchCategoryTab('medication');
        }
    });
</script>
</body>
</html>
