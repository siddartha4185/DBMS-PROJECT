import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection Status Telemetry
export const dbStatus = {
    connected: false,
    mode: 'Simulated (In-Memory Fallback)',
    error: null,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'aether_academy'
};

// ==========================================
// SIMULATED DATABASE LAYER (FALLBACK)
// ==========================================
class SimulatedDatabase {
    constructor() {
        this.instructors = [
            { instructor_id: 1, name: 'Dr. Evelyn Carter', email: 'evelyn@aether.io', bio: 'Former Principal AI Researcher at Google Brain. Passionate about machine learning pipelines and real-world system designs.', expertise: 'Machine Learning & Deep Learning', rating: 4.95, avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
            { instructor_id: 2, name: 'Marcus Chen', email: 'marcus@aether.io', bio: 'Lead Systems Architect. Expert in scalable database topologies, high-throughput microservices, and distributed real-time systems.', expertise: 'Distributed Systems & DBs', rating: 4.88, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
            { instructor_id: 3, name: 'Sarah Jenkins', email: 'sarah@aether.io', bio: 'Creative Director and UX Visionary. Award-winning frontend designer specializing in interactive WebGL experiences and glassmorphism styling.', expertise: 'Next-Gen UI/UX & Creative Tech', rating: 4.97, avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }
        ];

        this.courses = [
            { course_id: 1, instructor_id: 1, title: 'Deep Neural Networks & Neuromorphic AI', category: 'AI & Machine Learning', description: 'Delve into multi-layered architectures, backpropagation mathematics, and the latest trends in hardware-accelerated neuromorphic computing models.', difficulty: 'Advanced', duration: '28 hours', rating: 4.94, price: 189.99, syllabus: ["Foundations of Neural Networks", "Backpropagation Calculus", "CNNs & Spatial Processing", "Transformers & Attention Mechanism", "Neuromorphic Hardware & Spiking Nets", "Designing Your Own Custom Net"] },
            { course_id: 2, instructor_id: 2, title: 'Distributed SQL Topologies & High-Scale Systems', category: 'Database Engineering', description: 'Master modern scale-out databases, consensus protocols (Raft/Paxos), multi-region sharding, and optimized query routing for transactional reliability.', difficulty: 'Advanced', duration: '24 hours', rating: 4.89, price: 149.99, syllabus: ["SQL vs NoSQL Paradigms", "ACID & Distributed Transactions", "Paxos & Raft Consensus", "Sharding & Query Partitioning", "Designing for 99.999% Availability", "SQL Trigger Design & Auto-Optimization"] },
            { course_id: 3, instructor_id: 3, title: 'Glassmorphism & Immersive Frontend Engineering', category: 'Design & Web Apps', description: 'Learn to construct breathtaking 3D-feeling CSS layouts. Master animations, glow shadows, dynamic variables, and micro-interactions for a premium look.', difficulty: 'Intermediate', duration: '16 hours', rating: 4.98, price: 99.99, syllabus: ["CSS Variables & Responsive Architecture", "Glassmorphism & Material Glow", "SVG Micro-animations", "Transitions & Keyframe Mastery", "State-Driven Animations in React", "High-Performance Layout Optimization"] },
            { course_id: 4, instructor_id: 1, title: 'AI Product Management & Predictive Analytics', category: 'AI & Machine Learning', description: 'Bridge the gap between pure ML models and actual product value. Design product telemetry, forecasting models, and personalized recommendations.', difficulty: 'Intermediate', duration: '20 hours', rating: 4.85, price: 129.99, syllabus: ["Understanding AI telemetry", "Building Heuristic Scoring Models", "Designing Dynamic Recommendation Engines", "A/B Testing AI Features", "Managing Ethics in User Data", "Final Project: AI Recommendation Deck"] }
        ];

        this.learners = [
            { learner_id: 1, name: 'Alex Mercer', email: 'alex.mercer@aether.io', current_skills: 'HTML, CSS, Basic JavaScript, Python Basics', goal_career: 'Senior AI Frontend Engineer' }
        ];

        this.enrollments = [
            { enrollment_id: 1, learner_id: 1, course_id: 3, enrolled_at: new Date().toISOString(), overall_progress: 50.00, status: 'In Progress' },
            { enrollment_id: 2, learner_id: 1, course_id: 4, enrolled_at: new Date().toISOString(), overall_progress: 0.00, status: 'Active' }
        ];

        this.learner_progress = [
            { progress_id: 1, enrollment_id: 1, completed_modules: 6, total_modules: 12, last_studied: new Date().toISOString(), quiz_average: 85.50, study_hours: 12.5 },
            { progress_id: 2, enrollment_id: 2, completed_modules: 0, total_modules: 12, last_studied: new Date().toISOString(), quiz_average: 0.00, study_hours: 0.0 }
        ];
    }

    // Trigger simulation helper: Auto-updates overall progress when progress changes
    _simulateTrigger(enrollmentId, completed, total) {
        const pct = parseFloat(((completed / total) * 100).toFixed(2));
        const status = pct === 0 ? 'Active' : pct >= 100 ? 'Completed' : 'In Progress';
        
        const enrollment = this.enrollments.find(e => e.enrollment_id === enrollmentId);
        if (enrollment) {
            enrollment.overall_progress = pct;
            enrollment.status = status;
        }
    }

    async getInstructors() {
        return this.instructors;
    }

    async getCourses() {
        return this.courses.map(c => {
            const instructor = this.instructors.find(i => i.instructor_id === c.instructor_id);
            return { ...c, instructor_name: instructor?.name, instructor_avatar: instructor?.avatar_url };
        });
    }

    async getLearners() {
        return this.learners;
    }

    async createLearner(name, email, currentSkills, goalCareer) {
        const exists = this.learners.find(l => l.email.toLowerCase() === email.toLowerCase());
        if (exists) {
            throw new Error('Email is already registered.');
        }
        const learnerId = this.learners.length + 1;
        const newLearner = {
            learner_id: learnerId,
            name,
            email,
            current_skills: currentSkills,
            goal_career: goalCareer
        };
        this.learners.push(newLearner);
        return newLearner;
    }

    async getEnrollments(learnerId = 1) {
        const list = this.enrollments.filter(e => e.learner_id === Number(learnerId));
        return list.map(e => {
            const course = this.courses.find(c => c.course_id === e.course_id);
            const progress = this.learner_progress.find(lp => lp.enrollment_id === e.enrollment_id);
            const instructor = this.instructors.find(inst => inst.instructor_id === course?.instructor_id);
            return {
                ...e,
                course_title: course?.title,
                course_category: course?.category,
                course_difficulty: course?.difficulty,
                course_duration: course?.duration,
                instructor_name: instructor?.name,
                completed_modules: progress?.completed_modules || 0,
                total_modules: progress?.total_modules || 12,
                quiz_average: progress?.quiz_average || 0,
                study_hours: progress?.study_hours || 0,
                last_studied: progress?.last_studied
            };
        });
    }

    async enrollLearner(learnerId, courseId) {
        const parsedLearnerId = Number(learnerId);
        const parsedCourseId = Number(courseId);

        // Check if already enrolled
        const exists = this.enrollments.find(e => e.learner_id === parsedLearnerId && e.course_id === parsedCourseId);
        if (exists) {
            throw new Error('Learner is already enrolled in this course.');
        }

        const enrollmentId = this.enrollments.length + 1;
        const newEnrollment = {
            enrollment_id: enrollmentId,
            learner_id: parsedLearnerId,
            course_id: parsedCourseId,
            enrolled_at: new Date().toISOString(),
            overall_progress: 0.00,
            status: 'Active'
        };

        this.enrollments.push(newEnrollment);

        // Simulating the MySQL SQL Trigger 'trg_init_progress_on_enrollment'
        const progressId = this.learner_progress.length + 1;
        this.learner_progress.push({
            progress_id: progressId,
            enrollment_id: enrollmentId,
            completed_modules: 0,
            total_modules: 12,
            last_studied: new Date().toISOString(),
            quiz_average: 0.00,
            study_hours: 0.0
        });

        return { enrollmentId, status: 'Active' };
    }

    async updateProgress(enrollmentId, completedModules, quizAverage, studyHours) {
        const parsedEnrollmentId = Number(enrollmentId);
        const progress = this.learner_progress.find(p => p.enrollment_id === parsedEnrollmentId);
        
        if (!progress) {
            throw new Error('Progress record not found.');
        }

        progress.completed_modules = Number(completedModules);
        progress.quiz_average = parseFloat(Number(quizAverage).toFixed(2));
        progress.study_hours = parseFloat(Number(studyHours).toFixed(2));
        progress.last_studied = new Date().toISOString();

        // Simulating the MySQL SQL Trigger 'trg_auto_update_progress'
        this._simulateTrigger(parsedEnrollmentId, progress.completed_modules, progress.total_modules);

        // Return updated progress and parent enrollment state
        const parentEnrollment = this.enrollments.find(e => e.enrollment_id === parsedEnrollmentId);
        return {
            progress,
            overall_progress: parentEnrollment?.overall_progress,
            status: parentEnrollment?.status
        };
    }

    async createInstructor(name, email, bio, expertise, avatarUrl) {
        const exists = this.instructors.find(i => (i.email && i.email.toLowerCase() === email.toLowerCase()) || i.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            throw new Error('Instructor already exists.');
        }
        const instructorId = this.instructors.length + 1;
        const newInstructor = {
            instructor_id: instructorId,
            name,
            email,
            bio,
            expertise,
            rating: 5.0,
            avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
        };
        this.instructors.push(newInstructor);
        return newInstructor;
    }

    async createCourse(instructorId, title, category, description, difficulty, duration, price, syllabus) {
        const courseId = this.courses.length + 1;
        const newCourse = {
            course_id: courseId,
            instructor_id: Number(instructorId),
            title,
            category,
            description,
            difficulty: difficulty || 'Intermediate',
            duration: duration || '10 hours',
            rating: 5.0,
            price: parseFloat(price) || 0.0,
            syllabus: Array.isArray(syllabus) ? syllabus : JSON.parse(syllabus || '[]')
        };
        this.courses.push(newCourse);
        return newCourse;
    }

    async getInstructorStats(instructorId) {
        const instId = Number(instructorId);
        const myCourses = this.courses.filter(c => c.instructor_id === instId);
        const myCourseIds = myCourses.map(c => c.course_id);
        const myEnrollments = this.enrollments.filter(e => myCourseIds.includes(e.course_id));
        
        const totalStudents = myEnrollments.length;
        const totalCourses = myCourses.length;
        const avgRating = myCourses.length > 0
            ? parseFloat((myCourses.reduce((acc, curr) => acc + curr.rating, 0) / myCourses.length).toFixed(2))
            : 5.0;
        const totalRevenue = myCourses.reduce((acc, curr) => {
            const count = this.enrollments.filter(e => e.course_id === curr.course_id).length;
            return acc + (curr.price * count);
        }, 0);

        return {
            total_students: totalStudents,
            total_courses: totalCourses,
            avg_rating: avgRating,
            total_revenue: parseFloat(totalRevenue.toFixed(2))
        };
    }

    async getInstructorStudents(instructorId) {
        const instId = Number(instructorId);
        const myCourses = this.courses.filter(c => c.instructor_id === instId);
        const results = [];

        myCourses.forEach(course => {
            const enrolls = this.enrollments.filter(e => e.course_id === course.course_id);
            enrolls.forEach(e => {
                const learner = this.learners.find(l => l.learner_id === e.learner_id);
                const progress = this.learner_progress.find(lp => lp.enrollment_id === e.enrollment_id);
                results.push({
                    learner_name: learner?.name,
                    learner_email: learner?.email,
                    course_title: course.title,
                    overall_progress: e.overall_progress,
                    status: e.status,
                    quiz_average: progress?.quiz_average || 0,
                    study_hours: progress?.study_hours || 0,
                    last_studied: progress?.last_studied
                });
            });
        });

        return results;
    }
}

const mockDb = new SimulatedDatabase();

// ==========================================
// REAL MYSQL DATABASE LAYER
// ==========================================
let pool = null;

export async function initDatabase() {
    try {
        console.log(`[Database] Attempting connection to MySQL server at ${dbStatus.host}:${dbStatus.port}...`);
        
        // 1. Establish connection to MySQL server (without selecting DB first)
        const initConnection = await mysql.createConnection({
            host: dbStatus.host,
            port: dbStatus.port,
            user: dbStatus.user,
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('[Database] Connected to MySQL service! Checking/Creating "aether_academy" database...');

        // 2. Create database if not exists
        await initConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbStatus.database};`);
        await initConnection.end();

        // 3. Create pool pointing directly to the target database
        pool = mysql.createPool({
            host: dbStatus.host,
            port: dbStatus.port,
            user: dbStatus.user,
            password: process.env.DB_PASSWORD || '',
            database: dbStatus.database,
            multipleStatements: true,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // 4. Test connection and verify schema
        const connection = await pool.getConnection();
        
        // Check if "courses" table exists to see if we need to run migrations
        const [tables] = await connection.query(`
            SHOW TABLES LIKE 'courses';
        `);

        if (tables.length === 0) {
            console.log('[Database] First-time setup detected. Loading schema.sql, tables, triggers, and seed data...');
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            
            // Execute the full schema script (supported by multipleStatements: true)
            await connection.query(schemaSql);
            console.log('[Database] Schema, triggers, and seed data successfully initialized in MySQL!');
        } else {
            console.log('[Database] Schema exists. Database is ready.');
        }
        
        connection.release();

        // Graceful schema migration: Alter instructors table to append email column
        const dbConn = await pool.getConnection();
        try {
            await dbConn.query(`
                ALTER TABLE instructors ADD COLUMN email VARCHAR(255) UNIQUE;
            `);
            console.log('[Database Migration] Successfully added "email" column to "instructors" table.');
            
            // Populate defaults for pre-existing seeds
            await dbConn.query("UPDATE instructors SET email = 'evelyn@aether.io' WHERE instructor_id = 1 AND email IS NULL;");
            await dbConn.query("UPDATE instructors SET email = 'marcus@aether.io' WHERE instructor_id = 2 AND email IS NULL;");
            await dbConn.query("UPDATE instructors SET email = 'sarah@aether.io' WHERE instructor_id = 3 AND email IS NULL;");
        } catch (alterErr) {
            if (alterErr.errno !== 1060 && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.warn('[Database Migration Warning] Failed to alter instructors table:', alterErr.message);
            }
        }
        dbConn.release();

        dbStatus.connected = true;
        dbStatus.mode = 'Live MySQL Database';
        dbStatus.error = null;
        console.log(`[Database] Database initialized successfully in LIVE MySQL mode.`);

    } catch (err) {
        dbStatus.connected = false;
        dbStatus.mode = 'Simulated (In-Memory Fallback)';
        dbStatus.error = err.message;
        console.warn(`\n[Database Warning] MySQL connection failed: ${err.message}`);
        console.warn(`[Database Warning] Falling back to the Simulated (In-Memory) Database Mode.\n`);
    }
}

// Automatically initiate database on import
initDatabase();

// ==========================================
// UNIFIED DATA ACCESS INTERFACE
// ==========================================
export const db = {
    getInstructors: async () => {
        if (!dbStatus.connected) return mockDb.getInstructors();
        const [rows] = await pool.query('SELECT * FROM instructors');
        return rows;
    },

    getCourses: async () => {
        if (!dbStatus.connected) return mockDb.getCourses();
        const [rows] = await pool.query(`
            SELECT c.*, i.name as instructor_name, i.avatar_url as instructor_avatar
            FROM courses c
            LEFT JOIN instructors i ON c.instructor_id = i.instructor_id
        `);
        return rows;
    },

    getLearners: async () => {
        if (!dbStatus.connected) return mockDb.getLearners();
        const [rows] = await pool.query('SELECT * FROM learners');
        return rows;
    },

    createLearner: async (name, email, currentSkills, goalCareer) => {
        if (!dbStatus.connected) return mockDb.createLearner(name, email, currentSkills, goalCareer);
        try {
            const [result] = await pool.query(
                'INSERT INTO learners (name, email, current_skills, goal_career) VALUES (?, ?, ?, ?)',
                [name, email, currentSkills, goalCareer]
            );
            return {
                learner_id: result.insertId,
                name,
                email,
                current_skills: currentSkills,
                goal_career: goalCareer
            };
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new Error('Email is already registered.');
            }
            throw err;
        }
    },

    getEnrollments: async (learnerId = 1) => {
        if (!dbStatus.connected) return mockDb.getEnrollments(learnerId);
        const [rows] = await pool.query(`
            SELECT e.*, 
                   c.title as course_title, 
                   c.category as course_category, 
                   c.difficulty as course_difficulty, 
                   c.duration as course_duration,
                   i.name as instructor_name,
                   lp.completed_modules, 
                   lp.total_modules, 
                   lp.quiz_average, 
                   lp.study_hours, 
                   lp.last_studied
            FROM enrollments e
            JOIN courses c ON e.course_id = c.course_id
            LEFT JOIN instructors i ON c.instructor_id = i.instructor_id
            LEFT JOIN learner_progress lp ON e.enrollment_id = lp.enrollment_id
            WHERE e.learner_id = ?
        `, [learnerId]);
        return rows;
    },

    enrollLearner: async (learnerId, courseId) => {
        if (!dbStatus.connected) return mockDb.enrollLearner(learnerId, courseId);
        
        try {
            const [result] = await pool.query(
                'INSERT INTO enrollments (learner_id, course_id) VALUES (?, ?)',
                [learnerId, courseId]
            );
            
            // NOTE: MySQL trigger 'trg_init_progress_on_enrollment' automatically runs here
            // and inserts a matching record in the 'learner_progress' table!
            
            return { enrollmentId: result.insertId, status: 'Active' };
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new Error('Learner is already enrolled in this course.');
            }
            throw err;
        }
    },

    updateProgress: async (enrollmentId, completedModules, quizAverage, studyHours) => {
        if (!dbStatus.connected) {
            return mockDb.updateProgress(enrollmentId, completedModules, quizAverage, studyHours);
        }

        // Update the granular details in learner_progress
        await pool.query(`
            UPDATE learner_progress
            SET completed_modules = ?,
                quiz_average = ?,
                study_hours = ?
            WHERE enrollment_id = ?
        `, [completedModules, quizAverage, studyHours, enrollmentId]);

        // NOTE: MySQL trigger 'trg_auto_update_progress' automatically executes on the database side
        // to re-calculate enrollments.overall_progress and enrollments.status!

        // Let's fetch and return the updated state so the frontend updates instantly!
        const [updatedRows] = await pool.query(`
            SELECT lp.*, e.overall_progress, e.status
            FROM learner_progress lp
            JOIN enrollments e ON lp.enrollment_id = e.enrollment_id
            WHERE lp.enrollment_id = ?
        `, [enrollmentId]);

        if (updatedRows.length === 0) {
            throw new Error('Progress record not found.');
        }

        const row = updatedRows[0];
        return {
            progress: {
                progress_id: row.progress_id,
                enrollment_id: row.enrollment_id,
                completed_modules: row.completed_modules,
                total_modules: row.total_modules,
                last_studied: row.last_studied,
                quiz_average: row.quiz_average,
                study_hours: row.study_hours
            },
            overall_progress: row.overall_progress,
            status: row.status
        };
    },

    createInstructor: async (name, email, bio, expertise, avatarUrl) => {
        if (!dbStatus.connected) return mockDb.createInstructor(name, email, bio, expertise, avatarUrl);
        try {
            const [result] = await pool.query(
                'INSERT INTO instructors (name, email, bio, expertise, avatar_url) VALUES (?, ?, ?, ?, ?)',
                [name, email, bio, expertise, avatarUrl]
            );
            return {
                instructor_id: result.insertId,
                name,
                email,
                bio,
                expertise,
                avatar_url: avatarUrl
            };
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new Error('Email is already registered for an instructor.');
            }
            throw err;
        }
    },

    createCourse: async (instructorId, title, category, description, difficulty, duration, price, syllabus) => {
        if (!dbStatus.connected) return mockDb.createCourse(instructorId, title, category, description, difficulty, duration, price, syllabus);
        try {
            const syllabusJson = Array.isArray(syllabus) ? JSON.stringify(syllabus) : syllabus;
            const [result] = await pool.query(
                'INSERT INTO courses (instructor_id, title, category, description, difficulty, duration, price, syllabus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [instructorId, title, category, description, difficulty, duration, price, syllabusJson]
            );
            return {
                course_id: result.insertId,
                instructor_id: instructorId,
                title,
                category,
                description,
                difficulty,
                duration,
                price,
                syllabus
            };
        } catch (err) {
            throw err;
        }
    },

    getInstructorStats: async (instructorId) => {
        if (!dbStatus.connected) return mockDb.getInstructorStats(instructorId);
        const [rows] = await pool.query(`
            SELECT 
                COUNT(e.enrollment_id) as total_students,
                COUNT(DISTINCT c.course_id) as total_courses,
                COALESCE(AVG(c.rating), 5.0) as avg_rating,
                COALESCE(SUM(CASE WHEN e.enrollment_id IS NOT NULL THEN c.price ELSE 0 END), 0.0) as total_revenue
            FROM courses c
            LEFT JOIN enrollments e ON c.course_id = e.course_id
            WHERE c.instructor_id = ?
        `, [instructorId]);
        
        const r = rows[0];
        return {
            total_students: Number(r.total_students || 0),
            total_courses: Number(r.total_courses || 0),
            avg_rating: parseFloat(Number(r.avg_rating || 5.0).toFixed(2)),
            total_revenue: parseFloat(Number(r.total_revenue || 0.0).toFixed(2))
        };
    },

    getInstructorStudents: async (instructorId) => {
        if (!dbStatus.connected) return mockDb.getInstructorStudents(instructorId);
        const [rows] = await pool.query(`
            SELECT l.name as learner_name, l.email as learner_email, 
                   c.title as course_title, e.overall_progress, e.status,
                   lp.quiz_average, lp.study_hours, lp.last_studied
            FROM enrollments e
            JOIN courses c ON e.course_id = c.course_id
            JOIN learners l ON e.learner_id = l.learner_id
            LEFT JOIN learner_progress lp ON e.enrollment_id = lp.enrollment_id
            WHERE c.instructor_id = ?
        `, [instructorId]);
        return rows;
    }
};
