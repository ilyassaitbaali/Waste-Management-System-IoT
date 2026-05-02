"""
============================================
SMART WASTE MANAGEMENT SYSTEM
Python Sensor Simulator
Simulates Arduino + 3 Ultrasonic Sensors
sending data to the Node.js API
============================================
"""

import requests
import random
import time
import json
from datetime import datetime

# ============================================
# CONFIGURATION
# ============================================
API_URL        = "http://localhost:3000/api/sensorData"
SCAN_INTERVAL  = 15   # seconds between full scans (use 15 for demo, 900 for real = 15 min)
CONTAINER_HEIGHT = 20  # cm (same as database)

# Containers to simulate (must match IDs in your database)
CONTAINERS = [
    {"id": "con-001", "name": "Container Downtown A",  "fill_trend": "increasing"},
    {"id": "con-002", "name": "Container Downtown B",  "fill_trend": "stable"},
    {"id": "con-003", "name": "Container North A",     "fill_trend": "increasing"},
    {"id": "con-004", "name": "Container North B",     "fill_trend": "decreasing"},
    {"id": "con-005", "name": "Container South A",     "fill_trend": "increasing"},
    {"id": "con-006", "name": "Container East A",      "fill_trend": "stable"},
    {"id": "con-007", "name": "Container West A",      "fill_trend": "increasing"},
]

# ============================================
# FILL LEVEL SIMULATOR
# Each container has a current fill level
# that changes over time realistically
# ============================================
container_states = {}

def init_container_states():
    """Initialize each container with a random starting fill level"""
    for container in CONTAINERS:
        container_states[container["id"]] = {
            "fill_level": random.uniform(5, 40),  # start between 5-40%
            "trend":      container["fill_trend"]
        }
    print("📦 Container states initialized:")
    for cid, state in container_states.items():
        name = next(c["name"] for c in CONTAINERS if c["id"] == cid)
        print(f"   {name}: {state['fill_level']:.1f}% ({state['trend']})")
    print()

def update_fill_level(container_id):
    """Simulate realistic fill level change over time"""
    state = container_states[container_id]
    current = state["fill_level"]
    trend   = state["trend"]

    if trend == "increasing":
        # Fills up gradually (2-5% per scan)
        change = random.uniform(2, 5)
        current += change
        # If full, reset to empty (simulates collection)
        if current >= 95:
            print(f"   🚛 Container collected! Resetting to 0%")
            current = random.uniform(0, 5)

    elif trend == "decreasing":
        # Slowly decreasing
        change = random.uniform(1, 3)
        current -= change
        if current < 0:
            current = random.uniform(0, 10)

    elif trend == "stable":
        # Small random fluctuation
        change = random.uniform(-2, 2)
        current += change
        current = max(0, min(100, current))

    container_states[container_id]["fill_level"] = current
    return current

def fill_level_to_distance(fill_percent):
    """
    Convert fill level % to sensor distance (cm)
    fill=0%   → distance=20cm (empty container)
    fill=100% → distance=0cm  (full container)
    """
    distance = CONTAINER_HEIGHT * (1 - fill_percent / 100)
    # Add small sensor noise (±0.5cm)
    noise = random.uniform(-0.5, 0.5)
    return max(0.1, distance + noise)

# ============================================
# SEND DATA TO API
# ============================================
def send_sensor_scan(container_id, fill_level):
    """
    Simulate a full 180° servo scan
    Sends readings at each 15° step
    Position 180 = end of scan → triggers fill calculation
    """
    positions = list(range(0, 181, 15))  # [0, 15, 30, ... 180]
    success_count = 0

    for pos in positions:
        # Calculate distance based on fill level + slight variation per angle
        base_distance = fill_level_to_distance(fill_level)
        
        # Each sensor reads slightly differently
        s1_r = round(base_distance + random.uniform(-0.3, 0.3), 2)
        s2_r = round(base_distance + random.uniform(-0.3, 0.3), 2)
        s3_r = round(base_distance + random.uniform(-0.3, 0.3), 2)

        payload = {
            "sensor_id": container_id,
            "s1_r": s1_r,   "s1_o": pos,
            "s2_r": s2_r,   "s2_o": pos,
            "s3_r": s3_r,   "s3_o": pos,
            "position": pos
        }

        try:
            response = requests.post(API_URL, json=payload, timeout=5)
            if response.status_code == 201:
                success_count += 1
                # Only print the final position (180°) result
                if pos == 180:
                    data = response.json()
                    print(f"   ✅ {data['message']}")
            else:
                print(f"   ⚠️  Position {pos}° failed: {response.text}")
        except requests.exceptions.ConnectionError:
            print("   ❌ Cannot connect to API. Is the server running?")
            return False
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False

        # Small delay between each servo position (like real Arduino)
        time.sleep(0.1)

    return success_count == len(positions)

# ============================================
# FILL STATUS DISPLAY
# ============================================
def get_status_icon(fill_level):
    if fill_level is None:
        return "⚪"
    elif fill_level < 33:
        return "🟢"
    elif fill_level < 67:
        return "🟡"
    else:
        return "🔴"

def print_status_table():
    """Print current status of all containers"""
    print("\n" + "="*60)
    print("📊 CURRENT CONTAINER STATUS")
    print("="*60)
    print(f"{'Container':<25} {'Fill %':<10} {'Status':<10}")
    print("-"*60)
    for cid, state in container_states.items():
        name = next(c["name"] for c in CONTAINERS if c["id"] == cid)
        fill = state["fill_level"]
        icon = get_status_icon(fill)
        status = "LOW" if fill < 33 else "MODERATE" if fill < 67 else "HIGH ⚠️"
        print(f"{name:<25} {fill:<10.1f} {icon} {status}")
    print("="*60 + "\n")

# ============================================
# MAIN LOOP
# ============================================
def main():
    print()
    print("🗑️  SMART WASTE SENSOR SIMULATOR")
    print("==================================")
    print(f"📡 API URL:       {API_URL}")
    print(f"⏱️  Scan interval: {SCAN_INTERVAL} seconds")
    print(f"📦 Containers:    {len(CONTAINERS)}")
    print()

    # Test API connection first
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        print("✅ API connection successful!")
    except:
        print("❌ Cannot reach API at http://localhost:3000")
        print("   Make sure your Node.js server is running: node index.js")
        return

    # Initialize container states
    init_container_states()

    scan_number = 0

    print("🚀 Starting sensor simulation... (Press Ctrl+C to stop)\n")

    while True:
        scan_number += 1
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] 🔄 Scan #{scan_number} starting...")
        print()

        # Simulate each container
        for container in CONTAINERS:
            cid  = container["id"]
            name = container["name"]

            # Update fill level
            fill = update_fill_level(cid)
            icon = get_status_icon(fill)

            print(f"   📡 {name}")
            print(f"      Fill level: {fill:.1f}% {icon}")

            # Send full scan to API
            success = send_sensor_scan(cid, fill)

            if not success:
                print(f"      ❌ Scan failed for {name}")

            print()
            time.sleep(0.5)  # small delay between containers

        # Print status table after each full round
        print_status_table()

        # Wait before next scan
        print(f"⏳ Next scan in {SCAN_INTERVAL} seconds... (Press Ctrl+C to stop)")
        print()
        time.sleep(SCAN_INTERVAL)

# ============================================
# RUN
# ============================================
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Simulator stopped by user.")
        print("✅ All data has been saved to the database.")
        print()
