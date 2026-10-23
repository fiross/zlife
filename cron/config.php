<?php
/**
 * ZeeHash Daily Tracker - Cron & SMTP Configuration
 * Designed for Hostinger Shared Hosting & Local Testing
 */

// Load main app configuration and database
require_once __DIR__ . '/../config.php';

// Ensure CST / CDT Timezone (America/Chicago)
date_default_timezone_set('America/Chicago');

// -------------------------------------------------------------
// SMTP Server Settings
// -------------------------------------------------------------
define('CRON_SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.hostinger.com');
define('CRON_SMTP_PORT', intval(getenv('SMTP_PORT') ?: 465));
define('CRON_SMTP_SECURE', getenv('SMTP_SECURE') ?: 'ssl'); // 'ssl' for 465, 'tls' for 587
define('CRON_SMTP_USER', getenv('SMTP_USER') ?: 'info@zeehash.com');

// Password: reads from environment variable SMTP_PASS or defaults to placeholder
// Once you obtain the actual password, set it in your hosting environment or in cron/.smtp_pass.php
$localPassFile = __DIR__ . '/.smtp_pass.php';
if (file_exists($localPassFile)) {
    $cronSmtpPass = require $localPassFile;
} else {
    $cronSmtpPass = getenv('SMTP_PASS') ?: 'willprovidelater';
}
define('CRON_SMTP_PASS', $cronSmtpPass);

define('CRON_FROM_EMAIL', getenv('SMTP_FROM') ?: 'info@zeehash.com');
define('CRON_FROM_NAME', getenv('SMTP_FROM_NAME') ?: 'ZeeHash Care Intelligence');

// App Web URL for direct email CTA links
define('APP_URL', getenv('SITE_URL') ?: 'https://zeba.zeehash.com');

// Secure secret token for triggering cron via HTTP (e.g., https://zeba.zeehash.com/cron/daily_reminder.php?token=SECRET)
define('CRON_SECURITY_TOKEN', getenv('CRON_TOKEN') ?: 'zeehash_care_cron_2026');

// File path for recording daily email deduplication
define('CRON_LOCK_FILE', __DIR__ . '/.last_email_sent.json');
