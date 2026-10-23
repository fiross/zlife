-- ========================================================
-- Migration: Add Active Challenges & Diagnostic Summary to master_settings
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- Run this in phpMyAdmin or MySQL CLI on Hostinger
-- ========================================================

ALTER TABLE `master_settings`
  ADD COLUMN `active_challenges` TEXT NULL AFTER `parent_email_2`,
  ADD COLUMN `diagnostic_summary` TEXT NULL AFTER `active_challenges`;
