-- ========================================================
-- Migration: Add Menstruation Tracking to Daily Tracker (z_logs)
-- Safe & Non-Destructive: Preserves all existing records
-- For MySQL (phpMyAdmin on Hostinger)
-- ========================================================

-- 1. Add is_menstruating column (0 = No, 1 = Yes)
ALTER TABLE `z_logs`
  ADD COLUMN `is_menstruating` TINYINT(1) NOT NULL DEFAULT 0 AFTER `sleep_hours`;

-- 2. Add flow_intensity column ('Light', 'Medium', 'Heavy', or NULL)
ALTER TABLE `z_logs`
  ADD COLUMN `flow_intensity` VARCHAR(20) NULL DEFAULT NULL AFTER `is_menstruating`;
