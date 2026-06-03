import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, dbStatus, initDatabase } from './db.js';
import { predictProgress, recommendLearningPath, generateCoachResponse } from './ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// ==========================================
// DATABASE STATUS ENDPOINT
// ==========================================
app.get('/api/db-status', async (req, res) => {
    if (!dbStatus.connected) {
        console.log('[Database] Reconnection check triggered via status endpoint...');
        await initDatabase();
    }
    res.json(dbStatus);
});

// ==========================================
// COURSE & INSTRUCTOR ENDPOINTS
// ==========================================
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await db.getCourses();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/instructors', async (req, res) => {
    try {
        const instructors = await db.getInstructors();
        res.json(instructors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// LEARNER PROFILE ENDPOINTS
// ==========================================
app.get('/api/learners', async (req, res) => {
    try {
        const learners = await db.getLearners();
        res.json(learners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/learners', async (req, res) => {
    const { name, email, currentSkills, goalCareer } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required.' });
    }

    try {
        const newLearner = await db.createLearner(name, email, currentSkills || '', goalCareer || '');
        res.status(201).json({
            message: 'Academic profile successfully created!',
            learner: newLearner
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ==========================================
// ENROLLMENT & PROGRESS ENDPOINTS
// ==========================================
// Get enrollments for the logged-in learner (default Alex Mercer ID = 1)
app.get('/api/enrollments', async (req, res) => {
    const learnerId = req.query.learnerId || 1;
    try {
        const enrollments = await db.getEnrollments(learnerId);
        res.json(enrollments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new enrollment
app.post('/api/enroll', async (req, res) => {
    const { learnerId = 1, courseId } = req.body;
    
    if (!courseId) {
        return res.status(400).json({ error: 'courseId is required.' });
    }

    try {
        const enrollment = await db.enrollLearner(learnerId, courseId);
        res.status(201).json({
            message: 'Successfully enrolled in course!',
            ...enrollment
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update learning progress metrics
// This fires the MySQL trigger (trg_auto_update_progress) to update overall enrollment progress
app.put('/api/progress', async (req, res) => {
    const { enrollmentId, completedModules, quizAverage, studyHours } = req.body;

    if (enrollmentId === undefined || completedModules === undefined || quizAverage === undefined || studyHours === undefined) {
        return res.status(400).json({ error: 'enrollmentId, completedModules, quizAverage, and studyHours are required.' });
    }

    try {
        const updated = await db.updateProgress(enrollmentId, completedModules, quizAverage, studyHours);
        res.json({
            message: 'Progress successfully updated! (Trigger fired on MySQL database)',
            ...updated
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ==========================================
// AI ENGINE ENDPOINTS
// ==========================================

// Predict progress metrics
app.get('/api/ai/predict', async (req, res) => {
    const { completedModules, totalModules, quizAverage, studyHours, difficulty } = req.query;

    if (completedModules === undefined || quizAverage === undefined || studyHours === undefined) {
        return res.status(400).json({ error: 'completedModules, quizAverage, and studyHours are required.' });
    }

    try {
        const prediction = predictProgress({
            completed_modules: Number(completedModules),
            total_modules: Number(totalModules || 12),
            quiz_average: parseFloat(quizAverage),
            study_hours: parseFloat(studyHours),
            difficulty: difficulty || 'Intermediate'
        });
        res.json(prediction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get personalized learning recommendation path
app.get('/api/ai/recommend', async (req, res) => {
    const { skills, goal } = req.query;
    try {
        const allCourses = await db.getCourses();
        const recommendation = recommendLearningPath(
            skills || 'None',
            goal || 'Full-Stack Developer',
            allCourses
        );
        res.json(recommendation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chat with AI Study Coach
app.post('/api/ai/coach', async (req, res) => {
    const { message, learnerId = 1 } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'message is required.' });
    }

    try {
        // Retrieve context: current user info and their enrolled courses
        const enrollments = await db.getEnrollments(learnerId);
        const learners = await db.getLearners();
        const learner = learners.find(l => l.learner_id === Number(learnerId)) || { name: 'Learner' };

        const reply = generateCoachResponse(message, {
            enrolledCourses: enrollments,
            userName: learner.name
        });

        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// INSTRUCTOR PORTAL ROUTINGS
// ==========================================

// Register a new instructor
app.post('/api/instructors', async (req, res) => {
    const { name, email, bio, expertise, avatarUrl } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Instructor name and email are required.' });
    }
    try {
        const newInst = await db.createInstructor(name, email, bio || '', expertise || '', avatarUrl || '');
        res.status(201).json({
            message: 'Instructor profile successfully created!',
            instructor: newInst
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Create a new course (by an instructor)
app.post('/api/courses', async (req, res) => {
    const { instructorId, title, category, description, difficulty, duration, price, syllabus } = req.body;
    if (!instructorId || !title) {
        return res.status(400).json({ error: 'instructorId and title are required.' });
    }
    try {
        const newCourse = await db.createCourse(
            instructorId, 
            title, 
            category || 'General', 
            description || '', 
            difficulty || 'Intermediate', 
            duration || '12 hours', 
            price || 0.0, 
            syllabus || '[]'
        );
        res.status(201).json({
            message: 'Course successfully created & published!',
            course: newCourse
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get metrics dashboard for specific instructor
app.get('/api/instructors/stats', async (req, res) => {
    const { instructorId } = req.query;
    if (!instructorId) {
        return res.status(400).json({ error: 'instructorId is required.' });
    }
    try {
        const stats = await db.getInstructorStats(instructorId);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get student progress monitoring list for instructor's courses
app.get('/api/instructors/students', async (req, res) => {
    const { instructorId } = req.query;
    if (!instructorId) {
        return res.status(400).json({ error: 'instructorId is required.' });
    }
    try {
        const students = await db.getInstructorStudents(instructorId);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 ZENLEARN ACADEMY SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});
