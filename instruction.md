Build a fast, mobile-first Single Page Application (SPA) called "Daily Tracker" using a modern **React** frontend and a lightweight **PHP REST API** backend powered by a single **MySQL** database (with seamless local SQLite fallback). The app is specifically designed for tracking routines, mood, sleep, dynamic medications, sensory behaviors, and calming interventions for a neurodivergent teenager (Zeba). It must deploy smoothly on standard Hostinger shared hosting limits and offer an instantaneous, app-like mobile experience with zero full-page reloads.

Use a warm, pediatric-friendly design system with oversized, high-contrast touch targets (minimum 48px), soothing modern typography (Plus Jakarta Sans / Outfit), optimistic UI updates, and smooth micro-animations.

---

## 🗄️ DATABASE REQUIREMENTS (MySQL / SQLite Fallback)
Maintain a single database with the following tables:
1. `users` (`id`, `passcode_hash`, `role` ENUM('parent', 'teacher'))
2. `master_settings` (`id`, `z_name`, `z_age`, `z_class`, `z_school`)
3. `master_lists` (`id`, `category` ENUM('mood', 'medication', 'food', 'behavior', 'intervention', 'exercise', 'activity'), `item_name`, `is_active` DEFAULT 1)
4. `z_logs` (`id`, `log_date` DATE UNIQUE, `created_at`, `updated_at`, `overall_mood`, `sleep_hours` DECIMAL(4,1), `medications_json` TEXT, `sensory_behavior_json` TEXT, `interventions_json` TEXT, `activities_json` TEXT, `food_json` TEXT, `notes` TEXT)

### Initial Data Seeding:
- **Default Passcodes:**
  - Parent Passcode: `0023` (Full interactive access, log editing, calendar, master admin)
  - Teacher Passcode: `5678` (View-only summary of today's or any historical day's log, medications administered, strictly no edit/admin access)
- **Profile Defaults (`master_settings`):** Name: 'Zeba', Age: 15, Class: 'Grade 9', School: 'Greenwood High'
- **Master List Seed Items (`master_lists`):**
  - **Mood:** Calm, Happy, Aggressive, Anxiety, Hyperactive, Sensory Overload, Withdrawn
  - **Medication:** Focalin (Morning), Melatonin (Night) *(Extensible: parents can add, edit, or soft-delete any future prescription/supplement via Admin)*
  - **Food:** High-Protein/High-Fat, High-Sugar, Salty/Crunchy, General Meal
  - **Sensory Behavior:** Ear Covering, Food Grabbing, Cover with Blanket (Cocooning), Impulsive Pacing, Sound Sensitivity, Self-Regulation (Stimming)
  - **Interventions:** Joint Compression, Neutral Warmth, Walk, Earmuffs (Walker's Electronics), Visual Timer, Oral Sensory (Gum/Crunch), Visual Board Prompt
  - **Creative & Skill:** Music Class, Keyboard, Speech
  - **Exercise:** Pickleball, Badminton, Yoga, Exercise General

---

## 🔌 BACKEND REST API (PHP PDO)
Create lightweight, secure PHP endpoints under `/api/` returning UTF-8 JSON with prepared statements and session authentication:
1. `POST /api/auth.php`: Verify numeric passcode against `users` table via `password_verify()`. Sets session and returns role.
2. `GET /api/auth.php`: Returns current authentication and role state (`{ authenticated: bool, role: 'parent' | 'teacher' }`).
3. `POST /api/auth.php?action=logout`: Destroys session and clears cookie.
4. `GET /api/settings.php`: Returns Zeba's profile (`z_name`, `z_age`, `z_class`, `z_school`).
5. `POST /api/settings.php`: Updates profile (Parent role strictly required).
6. `GET /api/lists.php`: Returns active master list items grouped by category. Accepts `?all=1` to include inactive items for Admin view.
7. `POST /api/lists.php`: Add new item or toggle `is_active` soft-delete state (Parent role strictly required).
8. `GET /api/logs.php?date=YYYY-MM-DD`: Fetches log for requested date, parsing JSON fields into native JSON arrays.
9. `POST /api/logs.php`: Upserts daily log for date using `INSERT ... ON DUPLICATE KEY UPDATE` (or SQLite fallback). Parent role strictly required.
10. `POST /api/passcodes.php`: Updates parent and teacher numeric PINs with validation (Parent role strictly required).

---

## ⚛️ FRONTEND REQUIREMENTS (React + Vite)
Build a single-page React app with client-side state management and instant, optimistic UI feedback:

### 1. Numeric Keypad Lock Screen
- Mobile-optimized 3x4 numeric keypad (1-9, Clear, 0, Backspace).
- Visual PIN dot indicators (auto-submits on 4 digits).
- Shake animation and clear error message on incorrect PIN.
- Hardware keyboard support (0-9, Backspace, Escape/Clear).

### 2. Header & Quick Actions
- Brand title: "Daily Tracker - Neurodivergent Care Log" with calming leaf icon.
- Profile Chip: Displays Zeba's current Name, Age, Class, School, and active Role badge ("Parent: Full Access" vs "Teacher: View Only").
- **Sensory SOS Trigger Button:** Prominent high-contrast button that opens an emergency modal detailing immediate calming protocols (Noise dampening with Walker's earmuffs, joint compression, neutral warmth, visual timer, and oral sensory chewing).
- Admin button (Parent only) and Lock/Logout button.

### 3. Date Navigation (Instant AJAX Switching)
- Date carousel with Previous Day (<), Next Day (>), formatted date display, and "TODAY" / "HISTORICAL" badge.
- Native date-picker trigger for jumping to any historical date.
- Instant client-side state transition without browser reload.

### 4. Interactive Daily Log Dashboard
- **Sleep Duration:** Stepper buttons (- / + 0.5 hrs) and quick preset chips (6h, 7h, 7.5h, 8h, 8.5h, 9h, 10h).
- **Dynamic Medication Tracking (Multi-Select & Extensible):**
  - Renders all active medications fetched from `master_lists`.
  - Parent view: Interactive multi-select pill buttons with checkmark badges.
  - Teacher view: Read-only summary showing which medications were administered on that date.
- **Mood & Energy (Single Select):** Intuitive grid of emotional state cards with pediatric emojis.
- **Sensory Behaviors (Multi-Select Tags):** Color-coded chips for behaviors observed.
- **Calming Interventions (Multi-Select Tags):** Toggles for supports applied (deep pressure, earmuffs, etc.).
- **Creative & Skill Activities (Multi-Select Tags):** Music, keyboard, speech.
- **Exercise & Sports (Multi-Select Tags):** Pickleball, badminton, walks, yoga.
- **Food Categories (Multi-Select Tags):** High-protein, high-sugar, crunchy/salty, general meal.
- **Narrative Notes:** Voice-friendly large textarea for observations and teacher notes.
- **Sticky Save Footer (Parent Only):** Sticky footer with high-contrast "Save Daily Log" button and toast notification on save.

### 5. Admin Configuration Modal (Parent-Only)
- **Tab 1: Lists & Medications:** Select category, add custom items (e.g. new prescription medication), and toggle active/inactive (soft delete) to keep the daily logging checklist clean without database schema modifications.
- **Tab 2: Profile & Bio:** Update Teenager Name, Age, Class, and School.
- **Tab 3: Passcodes:** Securely change Parent and Teacher numeric passcodes (minimum 4 digits).

---

## 🎨 DESIGN AESTHETICS & QUALITY
- **Theme:** Warm, soothing pediatric palette (Muted teal `#1e7b75`, coral accent `#e76f51`, sunny amber `#f4a261`, deep slate navy `#264653`).
- **Typography:** Plus Jakarta Sans & Outfit via Google Fonts.
- **Responsiveness:** Flawless on iPhone/Android mobile viewports up to desktop tablets.
- **Performance:** Optimistic updates, smooth CSS transitions (`transform: scale(0.97)` active states), and micro-animations.