// AI Prediction & Recommendation Service for ZenLearn Academy

// Helper: Calculate standard grade based on score
function calculateGrade(score) {
    if (score >= 93) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 87) return 'A-';
    if (score >= 83) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'B-';
    if (score >= 70) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
}

/**
 * Predicts a learner's course progress metrics based on telemetry data.
 * @param {object} metrics 
 * @returns {object} predictions
 */
export function predictProgress(metrics) {
    const {
        completed_modules = 0,
        total_modules = 12,
        quiz_average = 0.0,
        study_hours = 0.0,
        difficulty = 'Intermediate'
    } = metrics;

    // 1. Calculate base pace (modules completed per hour studied)
    const hours = Math.max(study_hours, 0.5); // avoid divide by zero
    const pace = completed_modules / hours;

    // 2. Adjust completion probability based on quiz scores and engagement
    let completionProbability = 50.0; // baseline
    
    // Quiz score impact
    if (quiz_average > 85) completionProbability += 25;
    else if (quiz_average > 70) completionProbability += 15;
    else if (quiz_average > 50) completionProbability += 5;
    else completionProbability -= 15;

    // Hours studied impact
    const expectedHoursPerModule = difficulty === 'Advanced' ? 3.0 : difficulty === 'Intermediate' ? 2.0 : 1.0;
    const currentHoursPerModule = hours / Math.max(completed_modules, 1);
    const engagementRatio = currentHoursPerModule / expectedHoursPerModule;

    if (engagementRatio >= 1.0) completionProbability += 20;
    else if (engagementRatio >= 0.6) completionProbability += 10;
    else completionProbability -= 20;

    // Constrain probability between 5% and 99% (unless completed)
    if (completed_modules === total_modules) {
        completionProbability = 100.0;
    } else {
        completionProbability = Math.max(5, Math.min(99, completionProbability));
    }

    // 3. Forecast estimated completion time
    let estimatedWeeksRemaining = 0;
    if (completed_modules < total_modules) {
        const remainingModules = total_modules - completed_modules;
        
        // Assume learner studies an average of 5 hours per week
        const weeklyStudyHours = 5.0;
        
        // Hours needed to finish = remaining modules * expected hours per module (adjusted by pace)
        const paceModifier = Math.max(0.5, Math.min(2.0, 1 / (engagementRatio || 1)));
        const hoursNeeded = remainingModules * expectedHoursPerModule * paceModifier;
        
        estimatedWeeksRemaining = parseFloat((hoursNeeded / weeklyStudyHours).toFixed(1));
    }

    // 4. Forecast final grade
    // Start with current quiz average, apply slight regression to the mean if early in course
    const completionRatio = completed_modules / total_modules;
    const projectedFinalScore = (quiz_average * completionRatio) + (80.0 * (1 - completionRatio));
    const predictedGrade = calculateGrade(projectedFinalScore);

    // 5. Build dynamic insights
    let insight = '';
    if (completed_modules === 0) {
        insight = 'Welcome aboard! Initiate your study sessions and take your first milestone quiz to trigger AI trajectory updates.';
    } else if (completionProbability > 85) {
        insight = 'Outstanding engagement! Your current pace and stellar quiz performance project an exceptional finish. Keep up the high standard.';
    } else if (completionProbability > 65) {
        insight = 'Solid progress. Increasing weekly study sessions by 1.5 hours will solidify your comprehension and push you to an A grade.';
    } else {
        insight = 'Critical Alert: Engagement is trailing. We recommend scheduling a dedicated 2-hour study block this week and reviewing basic syllabus modules.';
    }

    return {
        completionProbability: parseFloat(completionProbability.toFixed(1)),
        estimatedWeeksRemaining,
        predictedGrade,
        paceModulesPerHour: parseFloat(pace.toFixed(2)),
        insight
    };
}

/**
 * Recommends a personalized learning path based on learner skills and goals.
 * @param {string} currentSkills 
 * @param {string} goalCareer 
 * @param {Array} allCourses 
 * @returns {object} recommendedPath
 */
export function recommendLearningPath(currentSkills = '', goalCareer = '', allCourses = []) {
    const skills = currentSkills.toLowerCase();
    const goal = goalCareer.toLowerCase();
    
    // Scrape courses matching the target skills/goals
    const recommendations = [];
    
    // Simple heuristic rules matching
    const hasAIInterest = goal.includes('ai') || goal.includes('machine') || goal.includes('intelligence') || goal.includes('data');
    const hasBackendInterest = goal.includes('backend') || goal.includes('database') || goal.includes('systems') || goal.includes('full-stack') || goal.includes('architect');
    const hasFrontendInterest = goal.includes('frontend') || goal.includes('design') || goal.includes('ui') || goal.includes('ux') || goal.includes('developer') || goal.includes('full-stack');

    // Build the prioritized recommended list based on rules
    if (hasFrontendInterest) {
        const c = allCourses.find(item => item.course_id === 3); // Glassmorphism & UI
        if (c) recommendations.push({ ...c, ai_reason: 'Highly recommended for your UI/UX and Frontend focus. Teaches dynamic responsive web layouts and high-performance design paradigms.' });
    }
    
    if (hasAIInterest) {
        const c1 = allCourses.find(item => item.course_id === 1); // Deep Neural Networks
        const c2 = allCourses.find(item => item.course_id === 4); // AI Product Management
        if (c1) recommendations.push({ ...c1, ai_reason: 'Core requirement for your AI/ML goals. Covers state-of-the-art multi-layer networks and neuromorphic systems.' });
        if (c2) recommendations.push({ ...c2, ai_reason: 'Fills the product side of AI. Helps build forecasting capabilities and predictive pipelines.' });
    }

    if (hasBackendInterest) {
        const c = allCourses.find(item => item.course_id === 2); // Distributed SQL
        if (c) recommendations.push({ ...c, ai_reason: 'Critical backend architecture skill. Essential for handling high concurrency, Raft replication, and complex sharding.' });
    }

    // Add any remaining courses as secondary electives
    allCourses.forEach(course => {
        const alreadyAdded = recommendations.find(r => r.course_id === course.course_id);
        if (!alreadyAdded) {
            recommendations.push({
                ...course,
                ai_reason: 'Valuable elective. Expands your horizontal skills and builds multidisciplinary capacity.'
            });
        }
    });

    // Generate flow-based milestones (Interactive roadmap nodes)
    const milestones = recommendations.map((rec, index) => {
        let type = 'core';
        if (index === 0) type = 'foundation';
        else if (index === recommendations.length - 1) type = 'capstone';

        return {
            id: `milestone-${rec.course_id}`,
            course_id: rec.course_id,
            title: rec.title,
            category: rec.category,
            difficulty: rec.difficulty,
            type: type,
            reason: rec.ai_reason,
            order: index + 1
        };
    });

    return {
        goalCareer,
        currentSkills,
        matchScore: goalCareer ? 88 : 50,
        milestones
    };
}

/**
 * Handles conversational queries as a personalized learning coach.
 */
export function generateCoachResponse(userMessage, context = {}) {
    const msg = userMessage.toLowerCase();
    const { enrolledCourses = [], userName = 'Learner' } = context;

    // Standard high-quality templates for the premium AI Coach
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        return `Hello **${userName}**! Welcome to the **ZenLearn AI Learning Hub**. 

I am your personal AI Study Coach. I analyze your current skills, track your progress, and help you map out custom paths. 

*   **Ask me** how to transition into roles like *Senior AI Frontend Engineer* or *Distributed Systems Architect*.
*   **Ask me** for advice on your current courses or study schedule.
*   **Or type** \`recommend\` to analyze your profile and construct a learning path!`;
    }

    if (msg.includes('recommend') || msg.includes('path') || msg.includes('career') || msg.includes('job')) {
        return `### 🗺️ AI Career Roadmap Generation

Based on your career objective, here is your customized ZenLearn learning path:

1.  **Phase 1 (Foundation):** [Glassmorphism & Immersive Frontend Engineering](course:3) - Core UI design tokens and micro-interactions.
2.  **Phase 2 (Specialization):** [AI Product Management & Predictive Analytics](course:4) - Telemetry analytics and data pipeline curation.
3.  **Phase 3 (Capstone):** [Deep Neural Networks & Neuromorphic AI](course:1) - High-end cognitive neural layers.

**AI Career Projection**: Enrolling in these modules will fill **92%** of your skill gaps for a *Senior AI Frontend Architect* role. Would you like me to enroll you in the next pending module?`;
    }

    if (msg.includes('mysql') || msg.includes('database') || msg.includes('trigger')) {
        return `### 🗄️ MySQL Database & Trigger Insights

Your **ZenLearn Academy** platform integrates a high-performance MySQL backend with active triggers:

*   **Auto-Initialization Trigger**: Instantly creates a granular progress tracking record when you enroll in any course.
*   **Auto-Update Progress Trigger**: Whenever you complete a module or update your study data, a MySQL trigger automatically runs on the database side to recalculate your exact progress percentage and re-evaluate your learning status (\`Active\`, \`In Progress\`, or \`Completed\`).

This ensures bulletproof transactional consistency without putting extra loads on the Node.js API server!`;
    }

    if (msg.includes('progress') || msg.includes('study') || msg.includes('completion')) {
        if (enrolledCourses.length === 0) {
            return `You aren't enrolled in any active courses yet! 
            
Visit the **Course Catalog** to find a premium course and enroll. Once enrolled, you can track your predicted completion dates here!`;
        }

        const active = enrolledCourses[0];
        const grade = active.quiz_average >= 85 ? 'A' : active.quiz_average >= 70 ? 'B' : 'C';
        
        return `### 📈 AI Trajectory Analysis for **${active.course_title || 'Your Active Course'}**

*   **Completion Confidence**: **${active.quiz_average >= 85 ? '94%' : '65%'}**
*   **Forecasted Final Grade**: **${grade}**
*   **AI Study Advice**: You have completed **${active.completed_modules}** modules out of **${active.total_modules}**. At your current pace, you are on track to finish in **${active.quiz_average >= 85 ? '1.5' : '3.2'}** weeks. 

*Action Item*: We recommend scoring above **85%** on your upcoming quiz to lock in your projected **${grade}** grade!`;
    }

    // Default Fallback Response
    return `I hear you, **${userName}**! That is a valuable question as you navigate your learning journey. 

To help me tailor my answer:
*   Are you currently looking to pivot your career towards **AI/ML Engineering** or **Distributed Systems**?
*   Or would you like to optimize your current study hours to get a higher predicted completion grade?

Feel free to ask me specifically about any of our courses: *Neuromorphic AI*, *Distributed Databases*, or *Glassmorphism UI Design*!`;
}
