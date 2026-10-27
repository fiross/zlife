<?php
/**
 * Daily Tracker - Common Navigation Header
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

$pdo = get_db_connection();
$settings = get_master_settings($pdo);
$role = get_user_role();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Z-Life - Daily Tracker - <?= htmlspecialchars($settings['z_name']) ?></title>
    <link rel="icon" type="image/png" href="assets/logo-icon.png">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="bg-warm-light">

<!-- Top Navigation Bar -->
<header class="navbar navbar-expand bg-white border-bottom sticky-top py-2 px-3 shadow-xs">
    <div class="container-fluid px-0 d-flex justify-content-between align-items-center">
        <!-- Brand & Student Badge -->
        <div class="d-flex align-items-center gap-2">
            <a href="index.php" class="text-decoration-none d-flex align-items-center">
                <img src="assets/logo.png" alt="Z-Life Daily Tracker - Autism Care" class="app-navbar-logo">
            </a>
            <div class="d-none d-md-block border-start ps-2 py-1">
                <div class="text-muted x-small">
                    <strong><?= htmlspecialchars($settings['z_name']) ?></strong> (<?= htmlspecialchars($settings['z_age']) ?>y) &bull; <?= htmlspecialchars($settings['z_class']) ?>
                </div>
            </div>
        </div>

        <!-- Action Buttons: Sensory SOS & Role Navigation -->
        <div class="d-flex align-items-center gap-2">
            <!-- Sensory SOS Button -->
            <button type="button" class="btn btn-sos btn-sm rounded-pill" data-bs-toggle="modal" data-bs-target="#sensorySosModal" title="Sensory SOS Protocol">
                <span>🚨</span>
                <span class="d-none d-sm-inline">Sensory SOS</span>
            </button>

            <?php if (is_parent()): ?>
                <a href="admin.php" class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 fw-bold" title="Admin Settings">
                    ⚙️ <span class="d-none d-md-inline">Admin</span>
                </a>
            <?php else: ?>
                <span class="badge bg-info-subtle text-info-emphasis rounded-pill px-2 py-1 small">
                    Teacher Mode
                </span>
            <?php endif; ?>

            <a href="auth.php?action=logout" class="btn btn-light btn-sm rounded-pill px-2 py-1 text-muted" title="Lock App">
                🔒
            </a>
        </div>
    </div>
</header>

<!-- Sensory SOS Modal -->
<div class="modal fade" id="sensorySosModal" tabindex="-1" aria-labelledby="sensorySosModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
            <div class="modal-header bg-danger text-white rounded-top-4 py-3">
                <h5 class="modal-title fw-bold d-flex align-items-center gap-2" id="sensorySosModalLabel">
                    <span>🚨</span> Sensory SOS Calming Protocol
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
                <div class="alert alert-warning border-0 rounded-3 mb-3 small">
                    <strong>Immediate Priority:</strong> Minimize auditory and visual stimulation immediately. Do not demand verbal replies.
                </div>
                
                <h6 class="fw-bold text-slate mb-2">Recommended Steps:</h6>
                <ul class="list-group list-group-flush rounded-3 border mb-3">
                    <li class="list-group-item d-flex align-items-center gap-2 py-2">
                        <span class="badge bg-primary rounded-circle">1</span>
                        <span>Put on <strong>Walker's Electronics Earmuffs</strong> or noise cancelling gear</span>
                    </li>
                    <li class="list-group-item d-flex align-items-center gap-2 py-2">
                        <span class="badge bg-primary rounded-circle">2</span>
                        <span>Provide <strong>Cocooning Blanket</strong> or deep pressure joint compressions</span>
                    </li>
                    <li class="list-group-item d-flex align-items-center gap-2 py-2">
                        <span class="badge bg-primary rounded-circle">3</span>
                        <span>Offer <strong>Oral Sensory</strong> item (chew gum or crunchy snack)</span>
                    </li>
                    <li class="list-group-item d-flex align-items-center gap-2 py-2">
                        <span class="badge bg-primary rounded-circle">4</span>
                        <span>Transition to low-light, quiet area with a visual timer</span>
                    </li>
                </ul>

                <p class="text-muted x-small mb-0">Emergency contact: Parent &bull; School: <?= htmlspecialchars($settings['z_school']) ?></p>
            </div>
            <div class="modal-footer border-0 pt-0">
                <button type="button" class="btn btn-secondary w-100 rounded-pill py-2 fw-bold" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
