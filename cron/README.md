# ZeeHash Daily Tracker - Automated Evening Care Cron Job

This cron job sends automated evening care notifications to both registered parent emails (`parent_email_1` and `parent_email_2`).

---

## 📋 What It Delivers Every Evening

### 1. Daily Evening Delivery to Both Parents
- The cron runs nightly (e.g. at 9:30 PM CST) and **always sends a comprehensive daily care email** to both registered parent emails (`parent_email_1` and `parent_email_2`).
- **If today's log is missing before 10:00 PM CST:** The email displays an urgent action banner reminding parents to record today's routine with a direct one-click button.
- **If today's log was already submitted:** The email celebrates today's completion with today's recorded mood and sleep.

### 2. Full Yesterday Care Summary (What Was Given)
- The email includes a complete, categorized breakdown of yesterday's care:
  - 😌 **Recorded Mood & Sleep Duration** (with colorful badge and sleep hours)
  - 💊 **Medications Administered** (e.g., Focalin, Melatonin)
  - 🤲 **Calming Interventions Given** (e.g., Joint compression, Walker's earmuffs, weighted cocoon, visual timer)
  - 🎵 **Creative & Skill Activities** (e.g., Music class, keyboard, speech therapy)
  - 🏃 **Exercise & Physical Movement** (e.g., Pickleball, badminton, gross motor walk, yoga)
  - 🎧 **Sensory Behaviors Observed** (e.g., Sound sensitivity, pacing, stimming)
  - 🥑 **Food & Nutrition**
  - 📝 **Caregiver & Teacher Observations & Notes**

### 3. Gap Analysis & Mood-Tailored Clinical Coaching
- The email checks if any core pillars (Calming Interventions, Creative Skills, or Exercise) were missed on that day.
- Explains the pediatric clinical importance of each missed routine based directly on the child's recorded mood:
  - **Aggressive, Sensory Overload, or Anxiety:** Explains how tactile deep pressure halts sensory escalation before meltdowns, and how gross motor movement burns off restlessness for restful sleep.
  - **Withdrawn:** Explains gentle warmth safety and non-demanding musical pathways.
  - **Calm or Happy:** Explains how routine preservation builds resilience and fine-motor learning retention.
- Includes the **Sensory SOS Emergency Calm Protocol Card**.

---

## ⚙️ Hostinger Cron Job Setup

### Step 1: Open Hostinger hPanel
1. Log in to your Hostinger account.
2. Select your hosting account and navigate to **Advanced > Cron Jobs**.

### Step 2: Configure Schedule (Before 10:00 PM CST)
Under **Common Settings**, select **Custom** or set:
- **Minute:** `30` (or `0`)
- **Hour:** `21` (9:30 PM CST)
- **Day of Month:** `*` (every day)
- **Month:** `*` (every month)
- **Day of Week:** `*` (every day of the week)
*(Cron expression: `30 21 * * *`)*

### Step 3: Command to Run

#### Option A: Command Line (CLI - Recommended)
Replace `USERNAME` with your Hostinger username (e.g. `u764747485`):
```bash
/usr/bin/php /home/USERNAME/public_html/cron/daily_reminder.php >> /home/USERNAME/public_html/cron/cron.log 2>&1
```

#### Option B: Web Cron (Via URL with Security Token)
If you prefer triggering via HTTP or an external cron service (like cron-job.org):
```
https://zeba.zeehash.com/cron/daily_reminder.php?token=zeehash_care_cron_2026
```

---

## 🔐 SMTP Password Setup

The SMTP host, port (465 SSL), and username (`info@zeehash.com`) are pre-configured in `cron/config.php`.

When you are ready to provide your actual Hostinger email password, you can either:

### Method 1: Environment Variable (Recommended for security)
Set in your Hostinger environment or `.htaccess`:
```apache
SetEnv SMTP_PASS "YourActualHostingerEmailPassword"
```

### Method 2: Create `cron/.smtp_pass.php` (Git-Ignored)
Create a file at `cron/.smtp_pass.php` containing:
```php
<?php
return 'YourActualHostingerEmailPassword';
```
*(This file is in `.gitignore` and will never be committed to GitHub).*

---

## 🧪 Local Testing & Email Preview

You can test either script locally anytime from terminal:

### 1. Test AI Behavioral & Mood Forecast Email:
```bash
# Force run AI forecast cron and generate preview
php cron/daily_forecast_cron.php --test --force

# Preview the rendered AI forecast email in your browser
open cron/preview_ai_forecast_email.html
```

### 2. Test Evening Care Reminder Email:
```bash
# Force run reminder email and generate preview
php cron/daily_reminder.php --force

# Preview the rendered reminder email in your browser
open cron/preview_latest_email.html
```

---

## 🤖 AI Daily Forecast Cron Job (`daily_forecast_cron.php`)

Sends automated daily AI care forecast emails synthesizing 30 days of longitudinal logs, active challenges, and the student's pediatric diagnostic profile.

### Hostinger Cron Setup (e.g. 7:00 AM CST)
- **Schedule:** `0 7 * * *` (Daily at 7:00 AM)
- **Command (CLI):**
  ```bash
  /usr/bin/php /home/USERNAME/public_html/cron/daily_forecast_cron.php >> /home/USERNAME/public_html/cron/cron_forecast.log 2>&1
  ```
- **Web Cron Trigger:**
  ```
  https://zeba.zeehash.com/cron/daily_forecast_cron.php?token=zeehash_care_cron_2026
  ```
