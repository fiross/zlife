# Daily Tracker - Neurodivergent Care & Routine Logging System

A fast, mobile-first Single Page Application (SPA) designed specifically for tracking daily routines, emotional states, sleep duration, dynamic medications, sensory behaviors, and calming interventions for **Zeba** (a neurodivergent teenager).

Built with **React 19** (Vite), a lightweight **PHP REST API** backend, and a single **MySQL database** (featuring an automatic zero-config **SQLite fallback** for local development). Fully optimized for standard shared hosting environments (such as **Hostinger**) with an app-like, zero-page-reload mobile experience.

---

## 👧 Child Profile & Clinical Care Context

This application is customized for **Zeba**:
- **Student Profile:** Zeba, 15 years old, Grade 9 at Greenwood High.
- **Neurodivergent Profile:** ADHD, Autism Spectrum, and Sensory Processing differences.
- **Key Challenges:** Auditory sensitivity (sound overload), emotional dysregulation when sleep-deprived, impulsive motor pacing, and transition stress between home and school.
- **Sensory Needs:** Requires a structured sensory diet including joint compression (deep pressure), neutral warmth, oral sensory chewies, noise dampening, and high-protein nutrition for metabolic and neurotransmitter stability.
- **Primary Objective:** Provide seamless daily communication between parents and school staff, enabling real-time visibility into sleep quality, morning medication administration, sensory dysregulation triggers, and effective calming interventions.

---

## 👥 Dual-Role Operational Workflow

The application enforces a strict role-based separation:

```
                      ┌──────────────────────────────────────┐
                      │        Daily Tracker Login           │
                      │   (Mobile-First Numeric Keypad)      │
                      └──────────────────┬───────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
      Parent Passcode: 0023                     Teacher Passcode: 5678
      (Full Interactive Access)                 (View-Only Summary)
  • Record sleep, mood, notes                • View morning sleep & mood
  • Toggle medications & behaviors           • Verify morning meds administered
  • Access All Logs History & CSV Export     • Access Emergency Sensory SOS
  • Admin: add new medications/items         • Blocked from editing or admin
  • Admin: update profile & passcodes
```

### 1. Morning Routine (Parent at Home)
- Parent enters passcode (`0023`).
- Logs previous night's sleep duration (stepper or quick chip).
- Records morning emotional mood.
- Toggles morning prescription medications (e.g., `Focalin (Morning)`).
- Saves daily log.

### 2. School Drop-Off & Day Routine (Teacher at School)
- Teacher enters passcode (`5678`).
- Sees a clean, read-only summary for today: knows immediately how much sleep Zeba had and confirms morning medications were given.
- If Zeba experiences sensory overload or emotional distress during class, the teacher taps the high-contrast **SENSORY SOS** button for immediate step-by-step calming protocols.

### 3. Evening Routine (Parent at Home)
- Parent opens today's log.
- Logs afternoon/evening activities (e.g., keyboard practice, speech, badminton).
- Toggles sensory behaviors observed (e.g., ear covering, pacing) and interventions applied (e.g., earmuffs, joint compression).
- Logs evening/night medications (e.g., `Melatonin (Night)`).
- Types narrative observations and notes into the voice-friendly comments textarea.
- Saves daily log (optimistic UI with instant confirmation).

---

## 🔑 Authentication & Default Passcodes

The app uses a 3x4 numeric keypad with visual dot indicators and hardware keyboard support:

| Role | Default Passcode | Permissions |
| :--- | :--- | :--- |
| **Parent** | `0023` | **Full Access:** Create, edit, and save daily logs; browse historical logs; export CSV; manage master lists, medications, profile, and passcodes. |
| **Teacher** | `5678` | **View-Only Access:** View current and historical day summaries; access Sensory SOS emergency protocols. Editing, saving, admin settings, and CSV export are strictly blocked. |

*Passcodes can be securely updated at any time by parents via **Admin Configuration (`⚙️`) > Passcodes**.*

---

## 🧠 Core Care & Tracking Domains

The application tracks 10 specialized domains tailored to Zeba's needs:

### 1. Sleep Duration
- **Input:** Stepper buttons (`-` / `+` 0.5 hours) plus quick preset chips (`6h`, `7h`, `7.5h`, `8h`, `8.5h`, `9h`, `10h`).
- **Clinical Importance:** Sleep deficit is the primary predictor of sensory sensitivity and behavioral dysregulation in Zeba.

### 2. Overall Mood & Emotional State (Single Select)
Curated pediatric cards with distinct color themes and emojis:
- 😌 **Calm** (Regulated baseline)
- 😊 **Happy** (Positive engagement)
- 😰 **Anxiety** (Worry, hesitation, sensory apprehension)
- 😡 **Aggressive** (Fight response, physical or verbal frustration)
- ⚡ **Hyperactive** (High motor drive, inability to settle)
- 💥 **Sensory Overload** (Sensory threshold breached; pre-meltdown or meltdown state)
- 😶 **Withdrawn** (Freeze/shutdown response, non-verbal retreat)
- ✨ **Sensory Seeking** (High craving for movement, deep pressure, or oral input)

### 3. Dynamic Multi-Select Medication Tracking
- **Multi-Select Checkboxes:** Parents tap multiple medications given throughout the day.
- **Fully Extensible:** Add any new medication, supplement, or PRN medicine at any time via **Admin > Lists & Meds**.
- **No Schema Changes:** Stored dynamically as a JSON array (`medications_json`) in the database.
- **Soft Delete / Hide:** Easily toggle medications inactive when no longer prescribed without losing historical log data.
- **Teacher View:** Teachers see clean green checkmarks of all medications administered.
- *Default Seeds:* `Focalin (Morning)`, `Melatonin (Night)`, `Guanfacine (Evening)`.

### 4. Cycle & Menstruation Tracking
- **Daily Toggle:** Quick tactile Yes / No switch for *"Menstruating Today?"* (defaults to `No`).
- **Flow Intensity Dropdown & Pills:** When active, shows dropdown and quick-select pills (`Light`, `Medium`, `Heavy`), defaulting to `Medium`.
- **Sensory & Physical Correlation:** Tracks the hormonal cycle's impact on tactile discomfort, abdominal pain, fatigue, and heightened sensory sensitivities.
- **Teacher Mode Notification:** When active, teachers see a discreet, compassionate awareness banner highlighting that Zeba is currently on her cycle, prompting teachers to provide unhurried bathroom access, neutral warmth/heating packs, and extra hydration.

### 5. Sensory Behaviors (Multi-Select Tags)
Identifies sensory triggers and stress indicators:
- 🎧 `Ear Covering` (Response to loud/sudden noise)
- 🔊 `Sound Sensitivity` (Auditory overwhelm in cafeterias, hallways, or busy rooms)
- 🥪 `Food Grabbing` (Impulsive oral seeking or hunger-driven dysregulation)
- 🛋️ `Cover with Blanket (Cocooning)` (Seeking visual and tactile isolation)
- 👣 `Impulsive Pacing` (Motor agitation, vestibular/proprioceptive discharge)
- 🌀 `Self-Regulation (Stimming)` (Repetitive self-soothing behaviors)

### 6. Calming Interventions (Multi-Select Tags)
Evidence-based sensory supports:
- 🤲 `Joint Compression` (Proprioceptive deep pressure input to shoulders, arms, and joints)
- 🧣 `Neutral Warmth` (Calming nervous system through weighted blanket or warm wrap)
- 🚶 `Walk` (Gross motor regulation break)
- 🎧 `Earmuffs (Walker's Electronics)` (Active sound suppression during auditory overload)
- ⏳ `Visual Timer` (Concrete time display for transitions)
- 🍬 `Oral Sensory (Gum/Crunch)` (Oral motor input for focus and calming)
- 📋 `Visual Board Prompt` (Structured visual schedule prompts)

### 7. Creative & Skill Activities (Multi-Select Tags)
Therapeutic and educational enrichment:
- 🎵 `Music Class`
- 🎹 `Keyboard` (Piano practice, fine motor skill and auditory joy)
- 💬 `Speech` (Speech-language pathology therapy)

### 8. Exercise & Sports (Multi-Select Tags)
Vestibular and gross motor coordination:
- 🏓 `Pickleball`
- 🏸 `Badminton`
- 🧘 `Yoga`
- 🏃 `Exercise General`

### 9. Food & Nutrition (Multi-Select Tags)
Metabolic tracking for focus and mood stability:
- 🥑 `High-Protein/High-Fat` (Stabilizes blood sugar and dopamine synthesis)
- 🧁 `High-Sugar` (Monitors sugar spikes that trigger hyperactivity or crashes)
- 🥨 `Salty/Crunchy` (Proprioceptive oral sensory seeking)
- 🍽️ `General Meal`

### 10. Narrative Observations & Teacher Notes
- Voice-friendly large textarea for daily qualitative notes.
- Captures triggers, successes, classroom transitions, and doctor observations.

---

## 🚨 Sensory SOS Emergency Protocols

Accessible via the prominent red/pink **SENSORY SOS** button in the header bar. Designed for immediate reference during sensory meltdowns or severe dysregulation:

1. **Noise Dampening First:** Immediately place Walker's electronic earmuffs on Zeba. Reduce background classroom noise.
2. **Proprioceptive Input (Joint Compression):** Apply firm, steady, rhythmic pressure to shoulders and elbows (10–15 seconds each).
3. **Neutral Warmth / Cocooning:** Offer a weighted blanket or wrap her in a neutral-temperature blanket to reset the tactile sensory system.
4. **Visual Timer:** Set a visual timer for 10 minutes. Avoid verbal demands while timer runs.
5. **Oral Sensory:** Offer crunchy sensory snacks or chewing gum to engage the trigeminal nerve and induce parasympathetic calming.

---

## 📊 All Logs History & CSV Export Suite (Parent Feature)

Accessible via the **Spreadsheet icon (`📊`)** in the header or **Admin Configuration (`⚙️`) > "All Logs & Export"** tab:

- **Reverse-Chronological Scroll:** Scroll down through all past dates (newest first).
- **Comprehensive Daily Cards:**
  - Date header with formatted day (e.g., `Mon, Oct 19, 2026`) and `TODAY` indicator.
  - Sleep duration badge (`💤 8.5h`), mood state pill with color-coded theme, and menstruation cycle badge (`🩸 Medium Flow`) when active.
  - Tagged checklists: Medications, Sensory Behaviors, Calming Interventions, Activities, and Nutrition.
  - **Prominent Parent Observations Box:** Displays full daily notes and teacher transition comments.
  - **"Open" Action Button:** Tap "Open" on any historical card to load that exact date directly into the main dashboard for review or edits.
- **Search & Filter:** Search by keywords across comments, medicine names, behavior tags, or cycle terms ("period", "menstruating", "flow"), and filter by mood.
- **Summary Metrics Strip:** Displays total days recorded, average sleep hours, and count of logs containing narrative comments.
- **Instant CSV Export:** Tap **"Export CSV"** to download an Excel-ready spreadsheet with standardized column headers:
  1. `Date`
  2. `Day of Week`
  3. `Sleep (Hours)`
  4. `Overall Mood`
  5. `Menstruating Today`
  6. `Flow Intensity`
  7. `Medications`
  8. `Sensory Behaviors`
  9. `Calming Interventions`
  10. `Activities & Sports`
  11. `Food & Nutrition`
  12. `Comments & Observations`
  13. `Last Saved`
  *(Includes UTF-8 BOM so Microsoft Excel, Apple Numbers, and Google Sheets render emojis and text without encoding errors).*

---

## 🛠️ Master Admin & Dynamic Checklist Suite

Parents can configure master options without code changes via the **Admin Configuration (`⚙️`)** modal:

1. **Tab 1: All Logs & Export:** Scrollable history list, keyword search, mood filter, and CSV download.
2. **Tab 2: Lists & Medications:**
   - Select category (Medications, Moods, Behaviors, Interventions, Activities, Exercise, Food).
   - Add new custom checklist items (e.g. newly prescribed supplements or sensory tools).
   - Toggle active/inactive (`is_active` soft-delete): hides discontinued items from daily checklists without corrupting historical logs.
3. **Tab 3: Student Profile:** Update Zeba's Name, Age, Class/Grade, and School.
4. **Tab 4: Passcodes:** Securely update Parent and Teacher numeric PINs with validation (minimum 4 digits).

---

## 🏗️ Architecture & Component Directory Map

```
zlife-new/
├── api/                             # PHP REST API Backend (PDO)
│   ├── bootstrap.php                # CORS, session, and role authentication helpers
│   ├── auth.php                     # Login, session verification, logout
│   ├── settings.php                 # Student profile CRUD
│   ├── lists.php                    # Dynamic master checklists & toggles
│   ├── logs.php                     # Single-date retrieval, bulk history, CSV export, upsert
│   └── passcodes.php                # Parent/Teacher PIN updates (password_hash)
├── src/                             # React 19 Frontend (Vite)
│   ├── main.jsx                     # React entry point
│   ├── App.jsx                      # App root: session, local date state, modals, alerts
│   ├── api.js                       # Unified REST API client (fetch with credentials)
│   ├── index.css                    # Design system tokens, warm pediatric palette, responsive CSS
│   ├── components/
│   │   ├── PasscodeLock.jsx         # 3x4 numeric keypad with auto-submit and shake animation
│   │   ├── Header.jsx               # Brand, student meta, SOS button, History button, Settings
│   │   ├── DateNavigator.jsx        # Carousel, native datepicker, today/historical badge
│   │   ├── LogDashboard.jsx         # 9 tracking sections, steppers, multi-select chips, save bar
│   │   ├── LogHistoryTab.jsx        # Scrollable history feed, search, mood filter, CSV export
│   │   ├── AdminModal.jsx           # 4-tab admin portal (History, Lists, Profile, Passcodes)
│   │   └── SensorySOSModal.jsx      # Emergency calming protocol drawer
│   └── utils/
│       ├── date.js                  # Timezone-safe date utilities (avoids UTC drift)
│       └── exportCsv.js             # RFC 4180 CSV export engine with UTF-8 BOM
├── scripts/
│   └── deploy.js                    # Automated FTP deployment script for Hostinger
├── config.php                       # Database connection, MySQL + SQLite auto-fallback, schema init
├── tracker_local.sqlite             # Local SQLite database (auto-created for zero-config testing)
├── vite.config.js                   # Vite config with API proxy to localhost:8000
└── package.json                     # Scripts and dependencies
```

---

## 🗄️ Database Schema & Data Models

The system maintains 4 tables. Supported in both **MySQL (Hostinger)** and **SQLite (Local fallback)**:

### 1. `users`
Passcode-based role authentication.
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    passcode_hash VARCHAR(255) NOT NULL,
    role ENUM('parent', 'teacher') NOT NULL
);
```

### 2. `master_settings`
Zeba's core profile information.
```sql
CREATE TABLE master_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    z_name VARCHAR(100) NOT NULL DEFAULT 'Zeba',
    z_age INT NOT NULL DEFAULT 15,
    z_class VARCHAR(100) NOT NULL DEFAULT 'Grade 9',
    z_school VARCHAR(255) NOT NULL DEFAULT 'Greenwood High'
);
```

### 3. `master_lists`
Dynamic options for checklists, medications, and categories.
```sql
CREATE TABLE master_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('mood', 'medication', 'food', 'behavior', 'intervention', 'exercise', 'activity') NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1
);
```

### 4. `z_logs`
Daily tracking records. Stored with one unique row per calendar date.
```sql
CREATE TABLE z_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_date DATE UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    overall_mood VARCHAR(100) NULL,
    sleep_hours DECIMAL(4,1) DEFAULT 0.0,
    is_menstruating TINYINT(1) DEFAULT 0,  -- 0 = No, 1 = Yes
    flow_intensity VARCHAR(20) DEFAULT NULL, -- 'Light', 'Medium', 'Heavy'
    medications_json TEXT NULL,            -- JSON array: ["Focalin (Morning)", "Melatonin (Night)"]
    sensory_behavior_json TEXT NULL,       -- JSON array: ["Ear Covering", "Sound Sensitivity"]
    interventions_json TEXT NULL,          -- JSON array: ["Walker's Earmuffs", "Joint Compression"]
    activities_json TEXT NULL,             -- JSON array: ["Music Class", "Keyboard"]
    food_json TEXT NULL,                   -- JSON array: ["High-Protein", "General Meal"]
    notes TEXT NULL                        -- Long text observation notes
);
```

### 🛡️ Non-Destructive Database Migrations (Zero Data Loss)

When updating databases with existing tracking history:
1. **Automated Self-Healing Migration (Zero manual work needed):**
   - Inside `config.php`, `init_database()` automatically inspects existing table columns on startup.
   - For MySQL: runs `SHOW COLUMNS FROM z_logs LIKE 'is_menstruating'`. If not found, it runs `ALTER TABLE z_logs ADD COLUMN is_menstruating TINYINT(1) DEFAULT 0`.
   - For SQLite: runs `PRAGMA table_info(z_logs)`. If not found, it runs `ALTER TABLE z_logs ADD COLUMN is_menstruating INTEGER DEFAULT 0`.
   - **Result:** Existing records are 100% preserved with default values (`0` and `NULL`).
2. **Manual Migration Script (Optional for phpMyAdmin / Hostinger):**
   - A standalone idempotent script is located at [`scripts/migrate_menstruation.sql`](file:///Users/firos/zlife-new/scripts/migrate_menstruation.sql):
   ```sql
   ALTER TABLE `z_logs`
     ADD COLUMN `is_menstruating` TINYINT(1) DEFAULT 0 AFTER `sleep_hours`,
     ADD COLUMN `flow_intensity` VARCHAR(20) DEFAULT NULL AFTER `is_menstruating`;
   ```
   Can be executed directly in phpMyAdmin without affecting any existing logs.

---

## 🔌 Complete REST API Endpoints Reference

All API requests accept and return UTF-8 JSON. Cookies (`PHPSESSID`) maintain role sessions.

| Method | Endpoint | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth.php` | Public | Verify PIN (`{ passcode: "0023" }`), start session, return role. |
| `GET` | `/api/auth.php` | Public | Check active session (`{ authenticated: bool, role: string }`). |
| `POST` | `/api/auth.php?action=logout` | Public | Destroy session and clear authentication cookie. |
| `GET` | `/api/settings.php` | Authenticated | Retrieve Zeba's current profile details. |
| `POST` | `/api/settings.php` | Parent | Update Zeba's profile (`z_name`, `z_age`, `z_class`, `z_school`). |
| `GET` | `/api/lists.php` | Authenticated | Retrieve active checklist items. Pass `?all=1` for all (including inactive). |
| `POST` | `/api/lists.php` | Parent | Add new item (`action: "add"`) or toggle active status (`action: "toggle"`). |
| `GET` | `/api/logs.php?date=YYYY-MM-DD` | Authenticated | Fetch daily log for a specific date (returns empty template if non-existent). |
| `GET` | `/api/logs.php?all=1` | Parent | Fetch all historical logs in reverse chronological order (`log_date DESC`). |
| `GET` | `/api/logs.php?export=csv` | Parent | Stream formatted UTF-8 CSV download with column headers. |
| `POST` | `/api/logs.php` | Parent | Upsert daily log for date (`log_date`, `sleep_hours`, `overall_mood`, `is_menstruating`, `flow_intensity`, arrays, `notes`). |
| `POST` | `/api/passcodes.php` | Parent | Update parent and teacher numeric PINs with hashing. |

---

## 🚀 How to Run Locally

### Do I need MySQL running locally?
**No.** The app includes an **automatic SQLite local fallback** (`USE_SQLITE_FALLBACK = true` in [`config.php`](file:///Users/firos/zlife-new/config.php)):
- If MySQL is not running or not installed on your machine, `config.php` automatically connects to [`tracker_local.sqlite`](file:///Users/firos/zlife-new/tracker_local.sqlite).
- Table schemas and seed data are created automatically on first access.
- You can develop, test, and preview everything immediately with **zero database setup**.

### Starting the Local Development Servers

Open two terminal tabs in the project directory:

```bash
# Terminal 1: Start PHP API Backend
npm run api
# Alternatively: php -S localhost:8000

# Terminal 2: Start Vite Dev Server (Frontend)
npm run dev
```

1. Open your browser to: **[http://localhost:5173](http://localhost:5173)**
2. Vite automatically proxies all `/api/*` network requests to the PHP backend at `http://localhost:8000`.
3. Log in with:
   - **Parent PIN:** `0023`
   - **Teacher PIN:** `5678`

---

## 🕒 Timezone & Local Date Handling System

### Why it matters:
Standard JavaScript `new Date().toISOString().split('T')[0]` converts dates to **UTC (GMT+0)**. In late evenings (e.g. 9:45 PM Central Time), UTC is already tomorrow morning, causing trackers to prematurely jump to the next day.

### How it is solved:
All client-side dates are handled strictly through [`src/utils/date.js`](file:///Users/firos/zlife-new/src/utils/date.js):
- `getLocalDateString()`: Uses `date.getFullYear()`, `date.getMonth() + 1`, and `date.getDate()` to extract the user's device calendar date.
- `shiftDate(dateStr, days)`: Parses `YYYY-MM-DD` at 12:00:00 noon local time, completely preventing Daylight Saving Time (DST) midnight rollover bugs.
- `isToday(dateStr)`: Compares against device local date.
- `config.php`: Configured with timezone fallback (`date_default_timezone_set('America/Chicago')` or `APP_TIMEZONE` env variable).

---

## 🌐 Step-by-Step Deployment to Hostinger

You can deploy updates directly from your development environment to Hostinger with a single command.

### Step 1: Configure Deployment Credentials
Copy `.env.deploy.example` to `.env.deploy` (git-ignored for security):
```bash
cp .env.deploy.example .env.deploy
```

Open `.env.deploy` and configure your Hostinger FTP credentials:
```env
FTP_HOST=ftp.yourdomain.com
FTP_USER=your_ftp_username
FTP_PASS=your_ftp_password
FTP_PORT=21
FTP_REMOTE_DIR=/public_html    # Or target folder on Hostinger
SITE_URL=https://yourdomain.com
```

### Step 2: Deploy to Hostinger
Run the automated deployment script:
```bash
npm run deploy
```

**What the deployment script does automatically:**
1. Executes `npm run build` to generate the production React bundle in `dist/` with relative asset links (`base: './'`).
2. Securely connects to your Hostinger FTP server.
3. Removes default placeholder files (like Hostinger's `default.php`) if present.
4. **Preserves your remote `config.php`** so production database credentials are never overwritten.
5. Uploads `dist/index.html` → `index.html`.
6. Synchronizes `dist/assets/` → `assets/` (compiled JS, CSS, fonts, SVG icons).
7. Synchronizes `api/` → `api/` (PHP REST endpoints).
8. Uploads `.htaccess` (with clean routing, gzip compression, and security headers).

### Quick Deploy (Skip Build)
If you only changed PHP backend endpoints or `.htaccess` and didn't touch React code:
```bash
npm run deploy:quick
```

### Step 3: MySQL Database Setup on Hostinger (First-time Only)
1. Log in to Hostinger hPanel.
2. Navigate to **Databases > MySQL Databases** and create a new database and user.
3. Edit `config.php` on the server (or deploy once with `npm run deploy -- --config`) with your database credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u123456789_daily_tracker');
   define('DB_USER', 'u123456789_tracker_user');
   define('DB_PASS', 'YourStrongPasswordHere');
   ```
4. On your first visit to the live site, `config.php` will **automatically create all MySQL tables and seed default passcodes & data**!

---

## 💡 Gemini AI Enhancement & Extension Guidelines

When using Gemini to plan or implement future features for Zeba, adhere to these guidelines:

1. **Keep the Single-Page Ergonomics:** Never introduce full-page reloads. All mutations must use optimistic state updates with instant tactile feedback.
2. **Respect the Dual-Role Model:**
   - Teachers must NEVER have access to editing, saving, admin tabs, or CSV exports.
   - Teachers MUST have instant 1-tap access to the **SENSORY SOS** protocols.
3. **Preserve Timezone Integrity:** Never use `new Date().toISOString().split('T')[0]`. Always use `getLocalDateString()` from [`src/utils/date.js`](file:///Users/firos/zlife-new/src/utils/date.js).
4. **Dynamic Checklist Architecture:** New items (medications, interventions, behaviors) should be added to `master_lists` dynamically via the Admin UI, not hardcoded into React components or SQL schemas.
5. **High-Value Future Roadmap Ideas for Zeba:**
   - **Correlation Insights:** Visual charts correlating Sleep Duration with Sensory Overload incidents.
   - **Doctor/IEP Summary Generator:** 1-page printable or PDF summary for pediatrician and school IEP meetings.
   - **Quick Mood-Trend Sparklines:** Showing 7-day and 30-day emotional baseline trends.
   - **Teacher Transition Hand-off Notes:** Dedicated quick-note field for afternoon school-to-home transitions.
