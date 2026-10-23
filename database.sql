-- ========================================================
-- Daily Tracker - Database Schema & Initial Data
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- For Hostinger Shared Hosting (phpMyAdmin Import)
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `passcode_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('parent', 'teacher') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `master_settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `master_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `z_name` VARCHAR(100) NOT NULL,
  `z_age` INT NOT NULL,
  `z_class` VARCHAR(100) NOT NULL,
  `z_school` VARCHAR(255) NOT NULL,
  `parent_email_1` VARCHAR(255) NULL,
  `parent_email_2` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `master_lists`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `master_lists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` ENUM('mood', 'medication', 'food', 'behavior', 'intervention', 'exercise', 'activity') NOT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `z_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `z_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `log_date` DATE UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `overall_mood` VARCHAR(100) NULL,
  `sleep_hours` DECIMAL(4,1) DEFAULT 0.0,
  `is_menstruating` TINYINT(1) DEFAULT 0,
  `flow_intensity` VARCHAR(20) NULL,
  `medications_json` TEXT NULL,
  `sensory_behavior_json` TEXT NULL,
  `interventions_json` TEXT NULL,
  `activities_json` TEXT NULL,
  `food_json` TEXT NULL,
  `notes` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Initial Data Seeding
-- --------------------------------------------------------

-- Default Passcodes:
-- Parent passcode: '1234' (verified bcrypt hash)
-- Teacher passcode: '5678' (verified bcrypt hash)
INSERT INTO `users` (`id`, `passcode_hash`, `role`) VALUES
(1, '$2y$12$WNsX4fxS3PHEZkyFqxJ10e6ihws9mbB0WUgD7A2Rrt16SCNk7YwhC', 'parent'),
(2, '$2y$10$8p1pl02PzSIfzoiT5n0W4eqGXFzMabbraDFMyfHNGXGby1svz7A.m', 'teacher')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Default Student Settings
INSERT INTO `master_settings` (`id`, `z_name`, `z_age`, `z_class`, `z_school`, `parent_email_1`, `parent_email_2`) VALUES
(1, 'Zeba', 15, 'Grade 9', 'Greenwood High', NULL, NULL)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Default Master Lists
INSERT INTO `master_lists` (`category`, `item_name`, `is_active`) VALUES
('mood', 'Calm', 1),
('mood', 'Happy', 1),
('mood', 'Aggressive', 1),
('mood', 'Anxiety', 1),
('mood', 'Hyperactive', 1),
('mood', 'Sensory Overload', 1),
('mood', 'Withdrawn', 1),
('mood', 'Sensory Seeking', 1),
('medication', 'Focalin (Morning)', 1),
('medication', 'Melatonin (Night)', 1),
('medication', 'Guanfacine (Evening)', 1),
('food', 'High-Protein/High-Fat', 1),
('food', 'High-Sugar', 1),
('food', 'Salty/Crunchy', 1),
('food', 'General Meal', 1),
('behavior', 'Ear Covering', 1),
('behavior', 'Food Grabbing', 1),
('behavior', 'Cover with Blanket (Cocooning)', 1),
('behavior', 'Impulsive Pacing', 1),
('behavior', 'Sound Sensitivity', 1),
('behavior', 'Self-Regulation (Stimming)', 1),
('intervention', 'Joint Compression', 1),
('intervention', 'Neutral Warmth', 1),
('intervention', 'Walk', 1),
('intervention', 'Earmuffs (Walker\'s Electronics)', 1),
('intervention', 'Visual Timer', 1),
('intervention', 'Oral Sensory (Gum/Crunch)', 1),
('intervention', 'Visual Board Prompt', 1),
('activity', 'Music Class', 1),
('activity', 'Keyboard', 1),
('activity', 'Speech', 1),
('exercise', 'Pickleball', 1),
('exercise', 'Badminton', 1),
('exercise', 'Yoga', 1),
('exercise', 'Exercise General', 1);

SET FOREIGN_KEY_CHECKS = 1;
