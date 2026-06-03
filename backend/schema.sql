-- Active Schema for ZenLearn Academy (Premium E-Learning Platform)

-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS aether_academy;
USE aether_academy;

-- 1. Instructors Table
CREATE TABLE IF NOT EXISTS instructors (
    instructor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    bio TEXT,
    expertise VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 5.0,
    avatar_url VARCHAR(500)
) ENGINE=InnoDB;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    difficulty VARCHAR(50) DEFAULT 'Intermediate',
    duration VARCHAR(50) DEFAULT '10 hours',
    rating DECIMAL(3,2) DEFAULT 5.0,
    price DECIMAL(10,2) DEFAULT 0.0,
    syllabus JSON,
    FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Learners Table
CREATE TABLE IF NOT EXISTS learners (
    learner_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    current_skills TEXT,
    goal_career VARCHAR(255)
) ENGINE=InnoDB;

-- 4. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT,
    course_id INT,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_progress DECIMAL(5,2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'Active',
    FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_learner_course (learner_id, course_id)
) ENGINE=InnoDB;

-- 5. Learner Progress Table (Granular progress metrics per course enrollment)
CREATE TABLE IF NOT EXISTS learner_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT UNIQUE,
    completed_modules INT DEFAULT 0,
    total_modules INT DEFAULT 10,
    last_studied TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    quiz_average DECIMAL(5,2) DEFAULT 0.0,
    study_hours DECIMAL(5,2) DEFAULT 0.0,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- DROP TRIGGERS IF THEY EXIST TO PREVENT CONFLICTS IN INITIALIZATION
DROP TRIGGER IF EXISTS trg_init_progress_on_enrollment;
DROP TRIGGER IF EXISTS trg_auto_update_progress;

-- 6. Trigger A: Auto-initialize Learner Progress Tracker on Enrollment
CREATE TRIGGER trg_init_progress_on_enrollment
AFTER INSERT ON enrollments
FOR EACH ROW
BEGIN
    INSERT INTO learner_progress (enrollment_id, completed_modules, total_modules, quiz_average, study_hours)
    VALUES (NEW.enrollment_id, 0, 12, 0.0, 0.0);
END;

-- 7. Trigger B: Auto-update Learner Progress Percentage & Status in Enrollments
CREATE TRIGGER trg_auto_update_progress
AFTER UPDATE ON learner_progress
FOR EACH ROW
BEGIN
    DECLARE pct_progress DECIMAL(5,2);
    DECLARE current_status VARCHAR(50);
    
    -- Calculate percentage
    SET pct_progress = (NEW.completed_modules / NEW.total_modules) * 100.0;
    
    -- Bound to max 100% just in case
    IF pct_progress > 100.0 THEN
        SET pct_progress = 100.0;
    END IF;
    
    -- Determine status based on progress
    IF pct_progress = 0.0 THEN
        SET current_status = 'Active';
    ELSEIF pct_progress >= 100.0 THEN
        SET current_status = 'Completed';
    ELSE
        SET current_status = 'In Progress';
    END IF;

    -- Update parent enrollment
    UPDATE enrollments
    SET overall_progress = pct_progress,
        status = current_status
    WHERE enrollment_id = NEW.enrollment_id;
END;

-- 8. Seed Data for Premium Experience (will be populated automatically if database is fresh)
-- Instructors Seed
INSERT IGNORE INTO instructors (instructor_id, name, email, bio, expertise, rating, avatar_url) VALUES
(1, 'Dr. Evelyn Carter', 'evelyn@aether.io', 'Former Principal AI Researcher at Google Brain. Passionate about machine learning pipelines and real-world system designs.', 'Machine Learning & Deep Learning', 4.95, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
(2, 'Marcus Chen', 'marcus@aether.io', 'Lead Systems Architect. Expert in scalable database topologies, high-throughput microservices, and distributed real-time systems.', 'Distributed Systems & DBs', 4.88, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
(3, 'Sarah Jenkins', 'sarah@aether.io', 'Creative Director and UX Visionary. Award-winning frontend designer specializing in interactive WebGL experiences and glassmorphism styling.', 'Next-Gen UI/UX & Creative Tech', 4.97, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150');

-- Courses Seed
INSERT IGNORE INTO courses (course_id, instructor_id, title, category, description, difficulty, duration, rating, price, syllabus) VALUES
(1, 1, 'Deep Neural Networks & Neuromorphic AI', 'AI & Machine Learning', 'Delve into multi-layered architectures, backpropagation mathematics, and the latest trends in hardware-accelerated neuromorphic computing models.', 'Advanced', '28 hours', 4.94, 189.99, '["Foundations of Neural Networks", "Backpropagation Calculus", "CNNs & Spatial Processing", "Transformers & Attention Mechanism", "Neuromorphic Hardware & Spiking Nets", "Designing Your Own Custom Net"]'),
(2, 2, 'Distributed SQL Topologies & High-Scale Systems', 'Database Engineering', 'Master modern scale-out databases, consensus protocols (Raft/Paxos), multi-region sharding, and optimized query routing for transactional reliability.', 'Advanced', '24 hours', 4.89, 149.99, '["SQL vs NoSQL Paradigms", "ACID & Distributed Transactions", "Paxos & Raft Consensus", "Sharding & Query Partitioning", "Designing for 99.999% Availability", "SQL Trigger Design & Auto-Optimization"]'),
(3, 3, 'Glassmorphism & Immersive Frontend Engineering', 'Design & Web Apps', 'Learn to construct breathtaking 3D-feeling CSS layouts. Master animations, glow shadows, dynamic variables, and micro-interactions for a premium look.', 'Intermediate', '16 hours', 4.98, 99.99, '["CSS Variables & Responsive Architecture", "Glassmorphism & Material Glow", "SVG Micro-animations", "Transitions & Keyframe Mastery", "State-Driven Animations in React", "High-Performance Layout Optimization"]'),
(4, 1, 'AI Product Management & Predictive Analytics', 'AI & Machine Learning', 'Bridge the gap between pure ML models and actual product value. Design product telemetry, forecasting models, and personalized recommendations.', 'Intermediate', '20 hours', 4.85, 129.99, '["Understanding AI telemetry", "Building Heuristic Scoring Models", "Designing Dynamic Recommendation Engines", "A/B Testing AI Features", "Managing Ethics in User Data", "Final Project: AI Recommendation Deck"]');

-- Learners Seed (We seed one default learner to make the app ready to show)
INSERT IGNORE INTO learners (learner_id, name, email, current_skills, goal_career) VALUES
(1, 'Alex Mercer', 'alex.mercer@aether.io', 'HTML, CSS, Basic JavaScript, Python Basics', 'Senior AI Frontend Engineer');

-- Enrollments Seed for Alex Mercer
INSERT IGNORE INTO enrollments (enrollment_id, learner_id, course_id, overall_progress, status) VALUES
(1, 1, 3, 50.00, 'In Progress'),
(2, 1, 4, 0.00, 'Active');

-- Learner Progress Seed (matching the above enrollments)
-- Enrollment 1 (Course 3) progress: 6 out of 12 modules completed (50%)
INSERT IGNORE INTO learner_progress (progress_id, enrollment_id, completed_modules, total_modules, quiz_average, study_hours) VALUES
(1, 1, 6, 12, 85.50, 12.5),
-- Enrollment 2 (Course 4) progress: 0 out of 12 modules (0%)
(2, 2, 0, 12, 0.00, 0.0);
