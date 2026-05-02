# Step 2: Node.js API — Setup & Testing Guide

---

## Folder Structure
```
server/
├── index.js              ← Main server file
├── db.js                 ← Database connection
├── .env                  ← Config (port, DB credentials)
├── package.json
├── middleware/
│   └── auth.js           ← JWT token verification
└── routes/
    ├── auth.js           ← Login
    ├── regions.js        ← Regions CRUD
    ├── containers.js     ← Containers CRUD
    ├── sensorData.js     ← Receive sensor data
    ├── employees.js      ← Employee management
    └── analytics.js      ← Charts & statistics
```

---

## How to Start the Server

```bash
# 1. Make sure XAMPP MySQL is running!

# 2. Go to the server folder
cd server

# 3. Install dependencies (first time only)
npm install

# 4. Start the server
node index.js
```

You should see:
```
✅ Connected to MySQL database (smart_waste_db)
🚀 Server running on http://localhost:3000
```

---

## Test All Endpoints

### 1. Health Check (no login needed)
Open browser → `http://localhost:3000`
Should show all available endpoints

---

### 2. Login
```
POST http://localhost:3000/api/auth/login
Body (JSON):
{
  "email": "admin@wasteco.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "name": "Admin User", "role": "admin" }
}
```
**Copy the token** — you need it for all other requests!

---

### 3. Get All Containers
```
GET http://localhost:3000/api/containers
Headers: Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 4. Send Sensor Data (simulating Arduino)
```
POST http://localhost:3000/api/sensorData
Body (JSON):
{
  "sensor_id": "con-001",
  "s1_r": 8.0, "s1_o": 180,
  "s2_r": 8.5, "s2_o": 180,
  "s3_r": 7.5, "s3_o": 180,
  "position": 180
}
```
This triggers the MySQL trigger → fill level calculated automatically!

---

### 5. Get Analytics Summary
```
GET http://localhost:3000/api/analytics/summary
Headers: Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 6. Get Alerts (containers > 67% full)
```
GET http://localhost:3000/api/analytics/alerts
Headers: Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Easy Testing with a Browser Extension
Install **Thunder Client** (VS Code extension) or use **Postman**:
1. Create a new request
2. Set method + URL
3. Add header: `Authorization: Bearer TOKEN`
4. Add JSON body where needed
5. Send!

---

## API Endpoints Summary

| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | /api/auth/login | ❌ | any | Login |
| GET | /api/regions | ✅ | any | List regions |
| POST | /api/regions | ✅ | admin | Add region |
| DELETE | /api/regions/:id | ✅ | admin | Delete region |
| GET | /api/containers | ✅ | any | All containers + fill % |
| GET | /api/containers/:id | ✅ | any | One container |
| GET | /api/containers/:id/history | ✅ | any | Fill level history |
| POST | /api/containers | ✅ | admin | Add container |
| PUT | /api/containers/:id | ✅ | admin | Update container |
| DELETE | /api/containers/:id | ✅ | admin | Delete container |
| POST | /api/sensorData | ❌ | IoT | Receive sensor data |
| GET | /api/employees | ✅ | admin | List employees |
| POST | /api/employees | ✅ | admin | Add employee |
| DELETE | /api/employees/:id | ✅ | admin | Delete employee |
| GET | /api/analytics/summary | ✅ | any | System overview |
| GET | /api/analytics/by-region | ✅ | any | Fill by region |
| GET | /api/analytics/alerts | ✅ | any | High fill containers |
| GET | /api/analytics/fill-history/:id | ✅ | any | Container history chart |

---

## Next Step
Once the API is running → **Step 3: Python Sensor Simulator**
The Python script will automatically send fake sensor data to this API every few seconds!
