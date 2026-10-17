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

## 🚀 Local Testing & Development

### 1. Start the PHP API Server (Backend)
In one terminal window, start the PHP server to handle REST endpoints and the database:
```bash
php -S localhost:8000
```
*Note: If MySQL is not running locally, `config.php` automatically uses the local SQLite database (`tracker_local.sqlite`) so you can test immediately with zero database setup.*

### 2. Start the React Dev Server (Frontend)
In a second terminal window, run the Vite development server:
```bash
npm run dev
```
Open your browser to: **http://localhost:5173** (Vite proxies all `/api/*` calls automatically to port 8000).

---

## 🌐 Building & Deploying to Hostinger Shared Hosting

1. **Build Production React Bundle:**
   ```bash
   npm run build
   ```
   This generates optimized, minified static files in the `dist/` directory.

2. **Upload to Hostinger `public_html`:**
   - Upload the contents of `dist/` (`index.html`, `assets/`, etc.) into your Hostinger `public_html` directory.
   - Upload the `api/` folder and `config.php` to `public_html`.
   - Upload `.htaccess` to ensure API routes and permissions are preserved.

3. **Configure MySQL on Hostinger:**
   - In Hostinger hPanel, create a MySQL database and user under **Databases > MySQL Databases**.
   - Edit `config.php` with your database credentials:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'your_database_name');
     define('DB_USER', 'your_database_user');
     define('DB_PASS', 'your_database_password');
     ```
   - On first visit, `config.php` will **automatically create all tables and seed default data**!

---

## 📱 Architecture & Endpoints

- **Frontend:** React 19 + Vite with tactile mobile touch targets, instant optimistic state updates, Plus Jakarta Sans & Outfit typography.
- **Backend Endpoints:**
  - `POST /api/auth.php`: Keypad login with role detection.
  - `GET /api/auth.php`: Session check (`parent` or `teacher`).
  - `GET /api/settings.php` & `POST /api/settings.php`: Profile management.
  - `GET /api/lists.php` & `POST /api/lists.php`: Dynamic master lists & soft-delete toggles.
  - `GET /api/logs.php?date=YYYY-MM-DD`: Date-based routine retrieval.
  - `POST /api/logs.php`: Save/update daily log.
  - `POST /api/passcodes.php`: Change parent and teacher PINs.
