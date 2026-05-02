-- ============================================
-- SMART WASTE MANAGEMENT SYSTEM
-- Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS smart_waste_db;
USE smart_waste_db;

-- ============================================
-- TABLE 1: Companie (Employees / Users)
-- ============================================
CREATE TABLE IF NOT EXISTS Companie (
    ID_Employee VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,  -- store hashed passwords
    role        ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 2: Regions
-- ============================================
CREATE TABLE IF NOT EXISTS Regions (
    ID_Region   VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name_region VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================
-- TABLE 3: Containers
-- ============================================
CREATE TABLE IF NOT EXISTS Containers (
    ID_Container VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    region_id    VARCHAR(36) NOT NULL,
    latitude     FLOAT NOT NULL,
    longitude    FLOAT NOT NULL,
    name         VARCHAR(100),
    height_cm    FLOAT NOT NULL DEFAULT 20,  -- container height in cm
    status       ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (region_id) REFERENCES Regions(ID_Region) ON DELETE CASCADE
);

-- ============================================
-- TABLE 4: SensorData (Raw sensor readings)
-- ============================================
CREATE TABLE IF NOT EXISTS SensorData (
    ID_Record    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ID_Container VARCHAR(36) NOT NULL,
    s1_r         FLOAT,   -- sensor 1 distance (cm)
    s1_o         FLOAT,   -- sensor 1 angle (degrees)
    s2_r         FLOAT,   -- sensor 2 distance (cm)
    s2_o         FLOAT,   -- sensor 2 angle (degrees)
    s3_r         FLOAT,   -- sensor 3 distance (cm)
    s3_o         FLOAT,   -- sensor 3 angle (degrees)
    position     INT,     -- servo motor position (0-180)
    timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Container) REFERENCES Containers(ID_Container) ON DELETE CASCADE
);

-- ============================================
-- TABLE 5: Final_Stats (Processed fill levels)
-- ============================================
CREATE TABLE IF NOT EXISTS Final_Stats (
    ID_Result    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ID_Container VARCHAR(36) NOT NULL,
    fill_level   FLOAT NOT NULL,  -- percentage 0-100
    timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Container) REFERENCES Containers(ID_Container) ON DELETE CASCADE
);

-- ============================================
-- TRIGGER: Auto-calculate fill level
-- Fires after every INSERT into SensorData
-- Only calculates when position = 180 (full scan done)
-- ============================================
DELIMITER //

DROP TRIGGER IF EXISTS after_sensor_insert //

CREATE TRIGGER after_sensor_insert
AFTER INSERT ON SensorData
FOR EACH ROW
BEGIN
    DECLARE i            INT DEFAULT 0;
    DECLARE total_dist   FLOAT DEFAULT 0;
    DECLARE avg_dist     FLOAT DEFAULT 0;
    DECLARE bin_height   FLOAT;
    DECLARE fill_pct     FLOAT;
    DECLARE r1           FLOAT;
    DECLARE r2           FLOAT;
    DECLARE r3           FLOAT;

    -- Only calculate after a full 180° scan
    IF NEW.position = 180 THEN

        -- Get the container height
        SELECT height_cm INTO bin_height
        FROM Containers
        WHERE ID_Container = NEW.ID_Container;

        -- Get last 10 sensor readings for this container
        -- and sum all 3 sensor distances per row
        SELECT SUM(s1_r + s2_r + s3_r), COUNT(*)
        INTO total_dist, i
        FROM (
            SELECT s1_r, s2_r, s3_r
            FROM SensorData
            WHERE ID_Container = NEW.ID_Container
            ORDER BY timestamp DESC
            LIMIT 10
        ) AS recent;

        -- Avoid division by zero
        IF i > 0 THEN
            -- Average distance across all sensors and readings
            SET avg_dist = total_dist / (i * 3);

            -- Fill level: how much of the container is occupied
            -- avg_dist is distance from sensor to trash surface
            -- smaller distance = more trash = higher fill level
            SET fill_pct = ((bin_height - avg_dist) / bin_height) * 100;

            -- Clamp between 0 and 100
            IF fill_pct < 0 THEN SET fill_pct = 0; END IF;
            IF fill_pct > 100 THEN SET fill_pct = 100; END IF;

            -- Store the result
            INSERT INTO Final_Stats (ID_Container, fill_level, timestamp)
            VALUES (NEW.ID_Container, fill_pct, NOW());
        END IF;

    END IF;
END //

DELIMITER ;

-- ============================================
-- SEED DATA: Initial test data
-- ============================================

-- Admin user (password: admin123 - in real app this would be hashed)
INSERT INTO Companie (ID_Employee, email, password, role, name) VALUES
('emp-001', 'admin@wasteco.com', 'admin123', 'admin', 'Admin User'),
('emp-002', 'employee1@wasteco.com', 'emp123', 'employee', 'John Employee'),
('emp-003', 'employee2@wasteco.com', 'emp123', 'employee', 'Sara Employee');

-- Regions
INSERT INTO Regions (ID_Region, name_region) VALUES
('reg-001', 'Downtown'),
('reg-002', 'North District'),
('reg-003', 'South District'),
('reg-004', 'East Side'),
('reg-005', 'West Side');

-- Containers (with fake GPS coordinates)
INSERT INTO Containers (ID_Container, region_id, latitude, longitude, name, height_cm) VALUES
('con-001', 'reg-001', 34.0522,  -118.2437, 'Container Downtown A', 20),
('con-002', 'reg-001', 34.0530,  -118.2450, 'Container Downtown B', 20),
('con-003', 'reg-002', 34.0800,  -118.2600, 'Container North A',    20),
('con-004', 'reg-002', 34.0820,  -118.2620, 'Container North B',    20),
('con-005', 'reg-003', 33.9900,  -118.2500, 'Container South A',    20),
('con-006', 'reg-004', 34.0600,  -118.2100, 'Container East A',     20),
('con-007', 'reg-005', 34.0550,  -118.3000, 'Container West A',     20);

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- View: Latest fill level per container
CREATE OR REPLACE VIEW v_container_status AS
SELECT
    c.ID_Container,
    c.name           AS container_name,
    r.name_region    AS region,
    c.latitude,
    c.longitude,
    c.status,
    fs.fill_level,
    fs.timestamp     AS last_updated,
    CASE
        WHEN fs.fill_level IS NULL    THEN 'unknown'
        WHEN fs.fill_level < 33       THEN 'low'
        WHEN fs.fill_level < 67       THEN 'moderate'
        ELSE                               'high'
    END AS fill_status
FROM Containers c
JOIN Regions r ON c.region_id = r.ID_Region
LEFT JOIN Final_Stats fs ON c.ID_Container = fs.ID_Container
    AND fs.timestamp = (
        SELECT MAX(timestamp)
        FROM Final_Stats
        WHERE ID_Container = c.ID_Container
    );

-- View: Fill level history (last 7 days)
CREATE OR REPLACE VIEW v_fill_history AS
SELECT
    c.name    AS container_name,
    r.name_region AS region,
    fs.fill_level,
    fs.timestamp
FROM Final_Stats fs
JOIN Containers c ON fs.ID_Container = c.ID_Container
JOIN Regions r ON c.region_id = r.ID_Region
WHERE fs.timestamp >= NOW() - INTERVAL 7 DAY
ORDER BY fs.timestamp DESC;

-- ============================================
-- DONE
-- ============================================
SELECT 'Database setup complete!' AS message;
