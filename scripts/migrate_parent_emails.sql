-- ========================================================
-- Migration: Add Parent Notification Emails to Settings (master_settings)
-- Safe & Non-Destructive: Preserves all existing profile records
-- For MySQL (phpMyAdmin on Hostinger)
-- ========================================================

-- 1. Add parent_email_1 column (Primary parent notification email)
ALTER TABLE `master_settings`
  ADD COLUMN `parent_email_1` VARCHAR(255) NULL DEFAULT NULL AFTER `z_school`;

-- 2. Add parent_email_2 column (Secondary parent notification email)
ALTER TABLE `master_settings`
  ADD COLUMN `parent_email_2` VARCHAR(255) NULL DEFAULT NULL AFTER `parent_email_1`;
