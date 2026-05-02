# 🗑️ Smart Waste Management System
### IoT Project — Universidade da Beira Interior

---

## What You Need Installed
- XAMPP (Apache + MySQL)
- Node.js
- Python 3
- A browser (Chrome recommended)

---

## Project Folder Structure
```
project/
├── database/
│   └── schema.sql          ← Database setup
├── server/                 ← Node.js API
│   ├── index.js
│   ├── db.js
│   ├── .env
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── containers.js
│       ├── regions.js
│       ├── sensorData.js
│       ├── employees.js
│       └── analytics.js
├── simulator/
│   └── simulator.py        ← Sensor data simulator
└── dashboard/
    ├── login.html          ← Open this in browser
    └── dashboard.html
```

---

## HOW TO RUN — Step by Step

---

### STEP 1 — Start XAMPP
1. Open **XAMPP Control Panel**
2. Click **Start** on **Apache**
3. Click **Start** on **MySQL**

---

### STEP 2 — Import the Database
1. Open browser → go to `http://localhost/phpmyadmin`
2. Click **New** on the left sidebar
3. Type `smart_waste_db` → click **Create**
4. Click on `smart_waste_db` to select it
5. Click the **Import** tab
6. Click **Choose File** → select `database/schema.sql`
7. Click **Go**

✅ You should see 5 tables created automatically

---

### STEP 3 — Start the API Server
Open a terminal in the `server/` folder:

```bash
npm install
node index.js
```

✅ You should see:
```
✅ Connected to MySQL database (smart_waste_db)
🚀 Server running on http://localhost:3000
```

> Keep this terminal open!

---

### STEP 4 — Start the Sensor Simulator
Open a **new terminal** in the `simulator/` folder:

```bash
pip install requests
python simulator.py
```

✅ You should see containers sending data every 15 seconds:
```
[14:23:01] 🔄 Scan #1 starting...
   📡 Container Downtown A
      Fill level: 26.1% 🟢
      ✅ Full scan received. Fill level calculated.
```

> Keep this terminal open!

---

### STEP 5 — Open the Dashboard
1. Open your browser
2. Go to → `http://localhost/phpmyadmin` to verify data is coming in
3. Open the `dashboard/login.html` file directly in browser

   Or serve it via XAMPP:
   - Copy the `dashboard/` folder into `C:/xampp/htdocs/waste/`
   - Open → `http://localhost/waste/login.html`

---

### STEP 6 — Login
Use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@wasteco.com | admin123 |
| Employee | employee1@wasteco.com | emp123 |

---

## What You Can Do in the Dashboard

### As Admin ✅
- View real-time fill levels of all containers
- See charts (fill by region, status distribution)
- View alerts (containers above 67%)
- Add / Delete containers
- Add / Delete regions
- Add / Delete employees

### As Employee ✅
- View real-time fill levels
- View alerts
- No management access

---

## How the System Works

```
[Python Simulator]
  Simulates Arduino sensors
        ↓
  HTTP POST every 15 sec
        ↓
[Node.js API :3000]
  Receives sensor data
        ↓
[MySQL Database]
  Trigger calculates fill level
        ↓
[Web Dashboard]
  Shows live data
```

---

## Fill Level Colors

| Color | Range | Meaning |
|-------|-------|---------|
| 🟢 Green | 0 — 33% | Low — OK |
| 🟡 Yellow | 34 — 66% | Moderate — Monitor |
| 🔴 Red | 67 — 100% | High — Send truck! |

---

## Troubleshooting

**API won't start?**
→ Make sure XAMPP MySQL is running
→ Check `.env` file has correct DB settings

**Database error?**
→ Make sure database name is exactly: `smart_waste_db`
→ Re-import `schema.sql`

**Dashboard shows no data?**
→ Make sure Node.js server is running on port 3000
→ Make sure Python simulator is running

**Login fails?**
→ Make sure you imported the schema (seed data includes users)

---

## Accounts Summary
```
admin@wasteco.com     / admin123  → Full access
employee1@wasteco.com / emp123    → View only
employee2@wasteco.com / emp123    → View only
```
