# Daily Tracker - Mobile-First Neurodivergent Teenager Logging System (React + MySQL)

A lightweight, mobile-responsive Single Page Application (SPA) designed for parents and teachers to track daily routines, mood, sleep, dynamic medications, sensory behaviors, and calming interventions for Zeba.

Built using **React** (Vite), a clean **PHP REST API** backend, and a single **MySQL database** (with automatic SQLite fallback for zero-friction local testing). Fully optimized for standard **Hostinger Shared Hosting**.

---

## 🔑 Default Passcodes

The app uses a mobile-optimized numeric lock screen:
- **Parent Passcode:** `0023` (Full access: view, edit, calendar navigation, master admin configuration)
- **Teacher Passcode:** `5678` (View-only summary access; editing and admin access strictly blocked)

*Passcodes can be updated securely in the Admin Configuration portal.*

---

## 💊 Dynamic Medication Tracking

Unlike static trackers with hardcoded pills, Daily Tracker features **fully dynamic medication management**:
- **Multiple Medications:** Parents can tap to select and save multiple medications given throughout the day.
- **Future Extensibility:** Add any new medication, supplement, or PRN medicine at any time via **Admin > Lists & Medications**.
- **No Schema Changes:** All selections are saved dynamically as JSON (`medications_json`) in the database.
- **Soft Delete / Hide:** Easily toggle medicines inactive if no longer prescribed so the daily checklist remains uncluttered without losing historical records.
- **Teacher Summary:** Teachers see clear checkmark badges of all medications administered on that day.

---

## 📊 All Logs History & CSV Export (Parent Feature)

Parents have access to a comprehensive historical review and export suite:
- **How to Access:**
  - Click the **Spreadsheet icon** (`📊`) in the top navigation bar, OR
  - Open **Admin Configuration (`⚙️`) > "All Logs & Export"** tab.
- **Scroll to Any Date:** Seamlessly scroll down through all historical care logs in reverse chronological order (newest to oldest).
- **Complete Observation Data:**
  - Date header with formatted day (e.g. `Mon, Oct 19, 2026`) and `TODAY` indicator.
  - Sleep duration badge (`💤 8.5h`) and mood state pill with color-coded theme.
  - Tagged checklists: 💊 Medications, 🎧 Sensory Behaviors, 🤲 Calming Interventions, 🎵 Activities, and 🥑 Food.
  - **Prominent Parent Observations Box:** Displays full daily notes and teacher transition comments.
  - **"Open" Action Button:** Tap "Open" on any card to instantly load that historical date in the main interactive dashboard.
- **Search & Filter:** Search by keywords across comments, medicine names, or behavior tags, and filter by emotional state.
- **Instant CSV Export:** Tap **"Export CSV"** to download an Excel-ready spreadsheet with standardized column headers:
  1. `Date`
  2. `Day of Week`
  3. `Sleep (Hours)`
  4. `Overall Mood`
  5. `Medications`
  6. `Sensory Behaviors`
  7. `Calming Interventions`
  8. `Activities & Sports`
  9. `Food & Nutrition`
  10. `Comments & Observations`
  11. `Last Saved`
  *(Includes UTF-8 BOM so Microsoft Excel, Apple Numbers, and Google Sheets render emojis and text without encoding errors).*

---

## 🚀 How to Run Locally

### Do I need MySQL running locally?
**No.** The app includes an **automatic SQLite local fallback** (`USE_SQLITE_FALLBACK = true` in [`config.php`](file:///Users/firos/zlife-new/config.php)):
- If MySQL is not running or not installed, the app automatically connects to the local SQLite database ([`tracker_local.sqlite`](file:///Users/firos/zlife-new/tracker_local.sqlite)).
- You can test and develop immediately with **zero database configuration**.

### Starting the Servers

Open two terminal tabs in the project directory:

```bash
# Terminal 1: Start PHP API Server (Backend)
npm run api
# Alternatively: php -S localhost:8000

# Terminal 2: Start Vite Dev Server (Frontend)
npm run dev
```

1. Open your browser to: **[http://localhost:5173](http://localhost:5173)**
2. Vite automatically proxies all `/api/*` network requests to the PHP backend at `http://localhost:8000`.
3. Enter your passcode (`0023` for Parent, `5678` for Teacher) to log in.

> **Local Timezone Note:** The application uses client-side local date calculation (`src/utils/date.js`). Even in the late evening, the app always reflects the client device's current date and never prematurely advances to tomorrow due to UTC offsets.

---

## 🌐 Step-by-Step Deployment to Hostinger

You can deploy updates directly to Hostinger with a single command.

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
Run the deployment script:
```bash
npm run deploy
```

**What the deploy script does automatically:**
1. Executes `npm run build` to generate the optimized production React bundle in `dist/`.
2. Connects to your Hostinger FTP server securely.
3. Removes default placeholder files (like Hostinger's `default.php`) if present.
4. **Preserves your remote `config.php`** so production database credentials are never overwritten.
5. Uploads `dist/index.html` → `index.html`.
6. Synchronizes `dist/assets/` → `assets/` (compiled JS, CSS, fonts, SVG icons).
7. Synchronizes `api/` → `api/` (PHP REST endpoints).
8. Uploads `.htaccess` (with clean routing, compression, and security headers).

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

## 📱 Architecture & Endpoints

- **Frontend:** React 19 + Vite with tactile mobile touch targets, Plus Jakarta Sans & Outfit typography, and local timezone handling.
- **Backend Endpoints:**
  - `POST /api/auth.php`: Keypad login with role detection.
  - `GET /api/auth.php`: Session check (`parent` or `teacher`).
  - `POST /api/auth.php?action=logout`: Destroys session.
  - `GET /api/settings.php` & `POST /api/settings.php`: Profile management.
  - `GET /api/lists.php` & `POST /api/lists.php`: Dynamic master lists & soft-delete toggles.
  - `GET /api/logs.php?date=YYYY-MM-DD`: Fetch daily log for specific date.
  - `GET /api/logs.php?all=1`: Fetch all historical logs in reverse chronological order (Parent only).
  - `GET /api/logs.php?export=csv`: Download complete logs as UTF-8 CSV with column headers (Parent only).
  - `POST /api/logs.php`: Save/update daily log (Parent only).
  - `POST /api/passcodes.php`: Change parent and teacher PINs (Parent only).
