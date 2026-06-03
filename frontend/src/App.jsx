import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  User, 
  TrendingUp, 
  Bot, 
  Database, 
  Cpu, 
  Award, 
  Search, 
  Send, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Loader,
  Clock,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Sparkles,
  BookOpenCheck,
  PlusCircle,
  Users
} from 'lucide-react';

const API_BASE = 'http://localhost:5050/api';

export default function App() {
  // Authentication & Users State
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserType, setCurrentUserType] = useState('student'); // 'student' or 'instructor'
  const [learners, setLearners] = useState([]);
  const [instructors, setInstructors] = useState([]);
  
  // Portal Navigation State
  const [portalRole, setPortalRole] = useState('student'); // 'student' or 'instructor'
  const [portalMode, setPortalMode] = useState('login'); // 'login' or 'register'
  const [loginInput, setLoginInput] = useState('');
  const [loginMethod, setLoginMethod] = useState('list'); // 'list' or 'direct'
  
  // Onboarding Form Inputs (Student)
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerSkills, setRegisterSkills] = useState('HTML, CSS, JavaScript');
  const [registerGoal, setRegisterGoal] = useState('Senior AI Frontend Engineer');
  
  // Onboarding Form Inputs (Instructor)
  const [registerInstName, setRegisterInstName] = useState('');
  const [registerInstEmail, setRegisterInstEmail] = useState('');
  const [registerInstBio, setRegisterInstBio] = useState('');
  const [registerInstExpertise, setRegisterInstExpertise] = useState('');
  const [registerInstAvatar, setRegisterInstAvatar] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Instructor Login Form Inputs
  const [loginInstName, setLoginInstName] = useState('');
  const [loginInstEmail, setLoginInstEmail] = useState('');

  // Application Tabs & Common Telemetry
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);
  
  // Progress telemetry sliders state (for active course being updated)
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [sliderModules, setSliderModules] = useState(0);
  const [sliderQuiz, setSliderQuiz] = useState(0);
  const [sliderHours, setSliderHours] = useState(0);
  const [isUpdatingDb, setIsUpdatingDb] = useState(false);
  const [triggerLog, setTriggerLog] = useState([]);

  // AI Career path recommendation state
  const [careerGoal, setCareerGoal] = useState('Senior AI Frontend Engineer');
  const [currentSkills, setCurrentSkills] = useState('HTML, CSS, Basic JavaScript, Python Basics');
  const [aiRoadmap, setAiRoadmap] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);

  // AI Chat Coach state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isCoachTyping, setIsCoachTyping] = useState(false);

  // Instructor dashboard telemetry
  const [instructorStats, setInstructorStats] = useState(null);
  const [instructorStudents, setInstructorStudents] = useState([]);
  const [isPublishingCourse, setIsPublishingCourse] = useState(false);

  // Instructor Course Creation Inputs
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('AI & Machine Learning');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseDifficulty, setCourseDifficulty] = useState('Intermediate');
  const [courseDuration, setCourseDuration] = useState('16 hours');
  const [coursePrice, setCoursePrice] = useState('99.99');
  const [courseSyllabus, setCourseSyllabus] = useState('Introduction, Module 1, Module 2, Assessment, Capstone');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // Success Notification toast
  const [toast, setToast] = useState(null);

  // 1. Initial Load: Core system parameters
  useEffect(() => {
    fetchDbStatus();
    fetchCourses();
    fetchLearners();
    fetchInstructors();
  }, []);

  // 2. Secondary Load: Session-scoped profile data
  useEffect(() => {
    if (currentUser) {
      if (currentUserType === 'student') {
        fetchEnrollments();
        generateAiRoadmap();
        
        // Initialize AI coach chat welcome message
        setChatMessages([
          {
            sender: 'ai',
            text: `Hello ${currentUser.name}! I am your ZenLearn AI Study Coach. I analyzed your profile and current skills. Ask me how to achieve your goal of becoming a "${currentUser.goal_career || 'Specialist'}"!`
          }
        ]);
      } else {
        // Instructor view data loading
        fetchInstructorData();
      }
    }
  }, [currentUser, currentUserType]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDbStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/db-status`);
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      setDbStatus({
        connected: false,
        mode: 'Simulated (In-Memory Fallback)',
        error: 'Failed to communicate with Node API server.'
      });
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/courses`);
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchLearners = async () => {
    try {
      const res = await fetch(`${API_BASE}/learners`);
      const data = await res.json();
      setLearners(data);
    } catch (err) {
      console.error('Error fetching learners:', err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await fetch(`${API_BASE}/instructors`);
      const data = await res.json();
      setInstructors(data);
    } catch (err) {
      console.error('Error fetching instructors:', err);
    }
  };

  const fetchEnrollments = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/enrollments?learnerId=${currentUser.learner_id}`);
      const data = await res.json();
      setEnrollments(data);
      if (data.length > 0) {
        selectCourseForTuning(data[0]);
      } else {
        setSelectedEnrollment(null);
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
  };

  const fetchInstructorData = async () => {
    if (!currentUser || currentUserType !== 'instructor') return;
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_BASE}/instructors/stats?instructorId=${currentUser.instructor_id}`);
      const statsData = await statsRes.json();
      setInstructorStats(statsData);

      // 2. Fetch Enrolled Students List
      const studentsRes = await fetch(`${API_BASE}/instructors/students?instructorId=${currentUser.instructor_id}`);
      const studentsData = await studentsRes.json();
      setInstructorStudents(studentsData);
    } catch (err) {
      console.error('Error loading instructor stats:', err);
    }
  };

  const selectCourseForTuning = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setSliderModules(enrollment.completed_modules);
    setSliderQuiz(Math.round(enrollment.quiz_average));
    setSliderHours(Math.round(enrollment.study_hours));
  };

  // Login handler
  const handleLogin = (user, type) => {
    setCurrentUserType(type);
    setCurrentUser(user);
    if (type === 'student') {
      setCareerGoal(user.goal_career || 'Senior AI Frontend Engineer');
      setCurrentSkills(user.current_skills || 'HTML, CSS');
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }
    showToast(`Welcome back, ${user.name}!`);
  };

  // Direct login by credentials
  const handleDirectLogin = (e) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      showToast('Please enter your credentials to log in.', 'error');
      return;
    }

    const input = loginInput.trim().toLowerCase();
    if (portalRole === 'student') {
      const match = learners.find(l => 
        (l.email && l.email.toLowerCase() === input) || 
        (l.name && l.name.toLowerCase() === input)
      );
      if (match) {
        handleLogin(match, 'student');
        setLoginInput('');
      } else {
        showToast(`No learner profile matches "${loginInput}".`, 'error');
      }
    } else {
      const match = instructors.find(i => 
        (i.name && i.name.toLowerCase() === input) ||
        (i.email && i.email.toLowerCase() === input)
      );
      if (match) {
        handleLogin(match, 'instructor');
        setLoginInput('');
      } else {
        showToast(`No educator profile matches "${loginInput}".`, 'error');
      }
    }
  };

  // Register Student handler
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerName.trim() || !registerEmail.trim()) {
      showToast('Name and email are required!', 'error');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/learners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          currentSkills: registerSkills,
          goalCareer: registerGoal
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Student profile successfully created!');
      await fetchLearners();
      handleLogin(data.learner, 'student');
      
      // Clear forms
      setRegisterName('');
      setRegisterEmail('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Register Instructor handler
  const handleRegisterInstructor = async (e) => {
    e.preventDefault();
    if (!registerInstName.trim() || !registerInstEmail.trim()) {
      showToast('Instructor name and email are required!', 'error');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerInstName,
          email: registerInstEmail,
          bio: registerInstBio,
          expertise: registerInstExpertise,
          avatarUrl: registerInstAvatar
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Educator profile successfully registered!');
      await fetchInstructors();
      handleLogin(data.instructor, 'instructor');

      // Clear Form
      setRegisterInstName('');
      setRegisterInstEmail('');
      setRegisterInstBio('');
      setRegisterInstExpertise('');
      setRegisterInstAvatar('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Instructor course publishing action
  const handlePublishCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle.trim() || !currentUser) return;
    setIsPublishingCourse(true);

    try {
      const syllabusArray = courseSyllabus.split(',').map(item => item.trim()).filter(Boolean);
      const res = await fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser.instructor_id,
          title: courseTitle,
          category: courseCategory,
          description: courseDesc,
          difficulty: courseDifficulty,
          duration: courseDuration,
          price: parseFloat(coursePrice) || 0.0,
          syllabus: syllabusArray
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Premium course successfully published to curriculum catalog!');
      await fetchCourses(); // Refresh courses list
      await fetchInstructorData(); // Refresh instructor totals
      
      // Reset form
      setCourseTitle('');
      setCourseDesc('');
      setCourseSyllabus('Introduction, Module 1, Module 2, Assessment, Capstone');
      
      // Go back to stats view
      setActiveTab('dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsPublishingCourse(false);
    }
  };

  // Enroll Action
  const handleEnroll = async (courseId) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learnerId: currentUser.learner_id, courseId })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      showToast(`Successfully enrolled in ${courses.find(c => c.course_id === courseId)?.title}!`);
      fetchEnrollments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Sync Progress (Triggers MySQL auto-update progress trigger)
  const handleSyncProgress = async () => {
    if (!selectedEnrollment || !currentUser) return;
    setIsUpdatingDb(true);
    setTriggerLog([
      '⏱️ [Client] Sending update request to API server...',
      `📦 [Data Payload] Completed Modules: ${sliderModules}, Quiz Score: ${sliderQuiz}%, Study Hours: ${sliderHours}h`
    ]);

    setTimeout(async () => {
      try {
        setTriggerLog(prev => [...prev, '🔍 [API] Authorizing learner credentials...']);
        
        const res = await fetch(`${API_BASE}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enrollmentId: selectedEnrollment.enrollment_id,
            completedModules: sliderModules,
            quizAverage: sliderQuiz,
            studyHours: sliderHours
          })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        setTriggerLog(prev => [
          ...prev,
          '⚙️ [MySQL Backend] Executing Transaction UPDATE on `learner_progress`...',
          '⚡ [MySQL TRIGGER ACTIVED] "trg_auto_update_progress" triggered!',
          `⚡ [SQL TRIGGER LOGIC] Recalculated overall progress: ${data.overall_progress}%`,
          `⚡ [SQL TRIGGER LOGIC] Evaluated enrollment status: "${data.status}"`,
          '💾 [MySQL Backend] Transaction committed and database state synchronized!'
        ]);

        showToast('Database Synced! MySQL SQL Trigger successfully executed.');
        fetchEnrollments();
        
        // Update local object view
        setSelectedEnrollment(prev => ({
          ...prev,
          completed_modules: sliderModules,
          quiz_average: sliderQuiz,
          study_hours: sliderHours,
          overall_progress: data.overall_progress,
          status: data.status
        }));

      } catch (err) {
        setTriggerLog(prev => [...prev, `❌ [Database Error] ${err.message}`]);
        showToast(err.message, 'error');
      } finally {
        setTimeout(() => setIsUpdatingDb(false), 2000);
      }
    }, 1200);
  };

  // Generate AI Career Roadmap Path
  const generateAiRoadmap = async () => {
    if (!currentUser) return;
    setIsGeneratingPath(true);
    try {
      const res = await fetch(`${API_BASE}/ai/recommend?skills=${encodeURIComponent(currentSkills)}&goal=${encodeURIComponent(careerGoal)}`);
      const data = await res.json();
      setAiRoadmap(data);
      if (data.milestones && data.milestones.length > 0) {
        setSelectedMilestone(data.milestones[0]);
      }
    } catch (err) {
      console.error('Error generating roadmap:', err);
    } finally {
      setIsGeneratingPath(false);
    }
  };

  // Send Message to AI Chat Coach
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsCoachTyping(true);

    try {
      const res = await fetch(`${API_BASE}/ai/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, learnerId: currentUser.learner_id })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Oops! I encountered an error checking your profile. Please check if the backend is running!' }]);
    } finally {
      setIsCoachTyping(false);
    }
  };

  // Helper metrics for Dashboard
  const activeEnrollments = enrollments.filter(e => e.status !== 'Completed');
  const completedEnrollments = enrollments.filter(e => e.status === 'Completed');
  const overallAverageScore = enrollments.length > 0 
    ? Math.round(enrollments.reduce((acc, curr) => acc + Number(curr.quiz_average), 0) / enrollments.length) 
    : 0;
  const totalStudyHours = enrollments.reduce((acc, curr) => acc + Number(curr.study_hours), 0);

  // Filtered courses for catalog
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || course.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  // ==========================================
  // IDENTITY PORTAL VIEW (IF NOT LOGGED IN)
  // ==========================================
  if (!currentUser) {
    return (
      <div className="portal-wrapper">
        <div className="portal-card">
          
          {/* Logo Section */}
          <div className="portal-logo-row">
            <div className="portal-logo-icon">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="portal-title">ZENLEARN IDENTITY</h1>
              <span className="portal-subtitle">ACADEMIC GATEWAY PORTAL</span>
            </div>
          </div>

          {/* Toggle Role Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              onClick={() => { setPortalRole('student'); setPortalMode('login'); }}
              className={`portal-toggle-btn ${portalRole === 'student' ? 'active' : ''}`}
              style={{ border: '1px solid var(--glass-border)', padding: '8px' }}
            >
              Learner Portal
            </button>
            <button 
              onClick={() => { setPortalRole('instructor'); setPortalMode('login'); }}
              className={`portal-toggle-btn ${portalRole === 'instructor' ? 'active' : ''}`}
              style={{ border: '1px solid var(--glass-border)', padding: '8px' }}
            >
              Instructor Portal
            </button>
          </div>

          {/* Toggle Action Tabs */}
          <div className="portal-toggle-tabs" style={{ marginBottom: '24px' }}>
            <button 
              onClick={() => setPortalMode('login')}
              className={`portal-toggle-btn ${portalMode === 'login' ? 'active' : ''}`}
            >
              Sign In Account
            </button>
            <button 
              onClick={() => setPortalMode('register')}
              className={`portal-toggle-btn ${portalMode === 'register' ? 'active' : ''}`}
            >
              Onboard Profile
            </button>
          </div>

          {/* Dynamic Forms (Student vs Instructor) */}
          {portalRole === 'student' ? (
            portalMode === 'login' ? (
              <form onSubmit={handleDirectLogin} className="tuning-deck-body" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px', background: 'rgba(255,255,255,0.01)' }}>
                <h3 className="selector-column-header" style={{ marginBottom: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Sign In to Learner Academy
                </h3>
                <div className="form-field-group">
                  <label style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered Email or Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. alex.mercer@aether.io" 
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    style={{ padding: '12px 16px', marginTop: '6px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none' }}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-premium btn-cyan" 
                  style={{ width: '100%', padding: '12px', marginTop: '20px', fontSize: '12px', justifyContent: 'center', fontWeight: 700 }}
                >
                  Sign In Account
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="tuning-deck-body">
                <div className="form-field-group">
                  <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>Full Academic Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Eleanor Vance" 
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    style={{ padding: '12px 16px', marginTop: '6px' }}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. eleanor.vance@aether.io" 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    style={{ padding: '12px 16px', marginTop: '6px' }}
                    required
                  />
                </div>

                <div className="form-fields-row" style={{ marginBottom: 0 }}>
                  <div className="form-field-group">
                    <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>Current Skills</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Python, SQL, JS" 
                      value={registerSkills}
                      onChange={(e) => setRegisterSkills(e.target.value)}
                      style={{ padding: '12px 16px', marginTop: '6px' }}
                    />
                  </div>
                  <div className="form-field-group">
                    <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>Dream Career Goal</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AI Engineer" 
                      value={registerGoal}
                      onChange={(e) => setRegisterGoal(e.target.value)}
                      style={{ padding: '12px 16px', marginTop: '6px' }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-premium btn-cyan" 
                  style={{ width: '100%', padding: '14px', marginTop: '10px', fontSize: '12px', justifyContent: 'center' }}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Writing to MySQL Database...' : 'Create Academic Profile & Sign In'}
                </button>
              </form>
            )
          ) : (
            // INSTRUCTOR FORMS
            portalMode === 'login' ? (
              <form onSubmit={handleDirectLogin} className="tuning-deck-body" style={{ border: '1px solid rgba(171,71,188,0.15)', borderRadius: '12px', padding: '24px', background: 'rgba(255,255,255,0.01)' }}>
                <h3 className="selector-column-header" style={{ marginBottom: '20px', textAlign: 'center', fontSize: '13px', color: '#d78cfc' }}>
                  Sign In to Faculty Portal
                </h3>
                <div className="form-field-group">
                  <label style={{ fontSize: '9.5px', fontWeight: 700, color: '#d78cfc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructor Name or Email</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dr. Evelyn Carter" 
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    style={{ padding: '12px 16px', marginTop: '6px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none' }}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-premium btn-cyan" 
                  style={{ width: '100%', padding: '12px', marginTop: '20px', fontSize: '12px', justifyContent: 'center', background: 'linear-gradient(135deg, #ab47bc 0%, #00e5ff 100%)', border: 'none', color: '#080b11', fontWeight: 700 }}
                >
                  Authenticate Faculty
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterInstructor} className="tuning-deck-body">
                <div className="form-field-group">
                  <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>Full Instructor Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Prof. Alan Turing" 
                    value={registerInstName}
                    onChange={(e) => setRegisterInstName(e.target.value)}
                    style={{ padding: '12px 16px', marginTop: '6px' }}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. alan.turing@aether.io" 
                    value={registerInstEmail}
                    onChange={(e) => setRegisterInstEmail(e.target.value)}
                    style={{ padding: '12px 16px', marginTop: '6px' }}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>Academic Bio Summary</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Researcher in Neuro-Computing and cognitive architectures." 
                    value={registerInstBio}
                    onChange={(e) => setRegisterInstBio(e.target.value)}
                    style={{ padding: '12px 16px', marginTop: '6px' }}
                  />
                </div>

                <div className="form-fields-row" style={{ marginBottom: 0 }}>
                  <div className="form-field-group">
                    <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>Core Expertise</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cognitive Systems" 
                      value={registerInstExpertise}
                      onChange={(e) => setRegisterInstExpertise(e.target.value)}
                      style={{ padding: '12px 16px', marginTop: '6px' }}
                    />
                  </div>
                  <div className="form-field-group">
                    <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>Avatar Image Link (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. http://..." 
                      value={registerInstAvatar}
                      onChange={(e) => setRegisterInstAvatar(e.target.value)}
                      style={{ padding: '12px 16px', marginTop: '6px' }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-premium btn-cyan" 
                  style={{ width: '100%', padding: '14px', marginTop: '10px', fontSize: '12px', justifyContent: 'center', background: 'linear-gradient(135deg, #ab47bc 0%, #00e5ff 100%)' }}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Writing to MySQL Database...' : 'Register Educator Profile & Sign In'}
                </button>
              </form>
            )
          )}



        </div>
      </div>
    );
  }

  // ==========================================
  // CORE PORTAL VIEW (LOGGED IN EXPERIENCE)
  // ==========================================
  return (
    <div className="app-wrapper">
      
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 999,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderLeft: toast.type === 'error' ? '4px solid var(--accent-rose)' : '4px solid var(--accent-cyan)',
          padding: '16px 24px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          color: toast.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-cyan)'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar-aside">
        <div>
          {/* Logo / Branding */}
          <div className="logo-section">
            <div className="logo-icon-wrapper" style={{
              background: currentUserType === 'instructor' 
                ? 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)'
                : 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)'
            }}>
              <Sparkles size={22} />
            </div>
            <div className="logo-title-wrap">
              <h1>ZENLEARN</h1>
              <span className="logo-sub">{currentUserType === 'instructor' ? 'FACULTY' : 'ACADEMY'}</span>
            </div>
          </div>

          {/* Nav Links (Student vs Instructor) */}
          <nav className="nav-list">
            {currentUserType === 'student' ? (
              <>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                >
                  <Cpu size={18} />
                  <span>AI Dashboard</span>
                </button>

                <button 
                  onClick={() => setActiveTab('catalog')}
                  className={`nav-item ${activeTab === 'catalog' ? 'active' : ''}`}
                >
                  <BookOpen size={18} />
                  <span>Course Catalog</span>
                </button>

                <button 
                  onClick={() => setActiveTab('academy')}
                  className={`nav-item ${activeTab === 'academy' ? 'active' : ''}`}
                >
                  <BookOpenCheck size={18} />
                  <span>My Academy</span>
                </button>

                <button 
                  onClick={() => setActiveTab('ai-hub')}
                  className={`nav-item ${activeTab === 'ai-hub' ? 'active' : ''}`}
                >
                  <Bot size={18} />
                  <span>AI Path Generator</span>
                </button>
              </>
            ) : (
              // INSTRUCTOR MENU
              <>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  style={{ borderColor: activeTab === 'dashboard' ? 'var(--accent-purple)' : '' }}
                >
                  <Cpu size={18} style={{ color: activeTab === 'dashboard' ? 'var(--accent-purple)' : '' }} />
                  <span style={{ color: activeTab === 'dashboard' ? '#d78cfc' : '' }}>Faculty Dashboard</span>
                </button>

                <button 
                  onClick={() => setActiveTab('inst-create')}
                  className={`nav-item ${activeTab === 'inst-create' ? 'active' : ''}`}
                  style={{ borderColor: activeTab === 'inst-create' ? 'var(--accent-purple)' : '' }}
                >
                  <PlusCircle size={18} style={{ color: activeTab === 'inst-create' ? 'var(--accent-purple)' : '' }} />
                  <span style={{ color: activeTab === 'inst-create' ? '#d78cfc' : '' }}>Create Course</span>
                </button>

                <button 
                  onClick={() => setActiveTab('inst-monitor')}
                  className={`nav-item ${activeTab === 'inst-monitor' ? 'active' : ''}`}
                  style={{ borderColor: activeTab === 'inst-monitor' ? 'var(--accent-purple)' : '' }}
                >
                  <Users size={18} style={{ color: activeTab === 'inst-monitor' ? 'var(--accent-purple)' : '' }} />
                  <span style={{ color: activeTab === 'inst-monitor' ? '#d78cfc' : '' }}>Student Tracker</span>
                </button>

                <button 
                  onClick={() => setActiveTab('catalog')}
                  className={`nav-item ${activeTab === 'catalog' ? 'active' : ''}`}
                  style={{ borderColor: activeTab === 'catalog' ? 'var(--accent-purple)' : '' }}
                >
                  <BookOpen size={18} style={{ color: activeTab === 'catalog' ? 'var(--accent-purple)' : '' }} />
                  <span style={{ color: activeTab === 'catalog' ? '#d78cfc' : '' }}>View Curriculum</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Database & Profile Switching widgets */}
        <div>
          


          {/* Active Profile Section */}
          <div style={{ marginTop: '20px', padding: '16px 0 0', borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="profile-avatar-glow" style={{ 
                width: '30px', 
                height: '30px', 
                padding: '1px',
                background: currentUserType === 'instructor' ? 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)' : ''
              }}>
                <div className="profile-avatar-inner" style={{ fontSize: '9px' }}>
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.name}
                </h4>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUserType === 'instructor' ? `${currentUser.expertise} Expert` : currentUser.email}
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                setCurrentUser(null);
                setEnrollments([]);
                setSelectedEnrollment(null);
                setInstructorStats(null);
                setInstructorStudents([]);
                showToast('Signed out of profile session.');
              }}
              className="switch-profile-btn"
              style={{
                background: currentUserType === 'instructor' ? 'rgba(171, 71, 188, 0.04)' : '',
                borderColor: currentUserType === 'instructor' ? 'rgba(171, 71, 188, 0.12)' : '',
                color: currentUserType === 'instructor' ? '#d78cfc' : ''
              }}
            >
              Switch Profile / Log Out
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-viewport">
        
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="header-left">
            <span className="workspace-label">Current Academic Profile: {currentUser.name}</span>
            <span className={`badge ${currentUserType === 'instructor' ? 'badge-purple' : 'badge-cyan'}`} style={{ cursor: 'default' }}>
              {currentUserType === 'instructor' ? 'Faculty Member' : 'Verified Learner'}
            </span>
          </div>
          
          <div className="header-right">
            <button 
              onClick={() => { fetchDbStatus(); fetchCourses(); fetchEnrollments(); fetchInstructorData(); }} 
              className="header-btn"
              title="Sync Database State"
            >
              <RefreshCw size={16} />
            </button>
            <div className="profile-avatar-glow" style={{
              background: currentUserType === 'instructor' ? 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)' : ''
            }}>
              <div className="profile-avatar-inner">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          </div>
        </header>

        {/* Viewport content */}
        <div className="content-body">
          
          {/* A. DATABASE WARNING BANNER IF OFFLINE */}
          {dbStatus && !dbStatus.connected && (
            <div className="db-warning-banner">
              <div className="warning-banner-left">
                <div className="warning-banner-icon">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="warning-banner-title">Simulated Database Mode Active (No local MySQL detected)</h3>
                  <p className="warning-banner-desc">
                    To test with your **live local MySQL database and run SQL triggers directly**, make sure your MySQL service is started (e.g. on XAMPP, Docker, or native Windows service) and update your database credentials in 
                    <code>backend/.env</code>. The Node server will automatically build the schemas and triggers on startup!
                  </p>
                </div>
              </div>
              <div className="warning-port-tag">
                PORT 3306 PROBED
              </div>
            </div>
          )}

          {/* B. TAB: DYNAMIC DASHBOARD (STUDENT VS INSTRUCTOR) */}
          {activeTab === 'dashboard' && (
            currentUserType === 'student' ? (
              // STUDENT DASHBOARD
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div className="view-header-row">
                  <div className="view-header-left">
                    <h2 className="gradient-text">Academic AI Dashboard</h2>
                    <p>Real-time predictive analytics and live database telemetry tracking.</p>
                  </div>
                  <div className="view-header-right">
                    <span>Target Career Path:</span>
                    <span className="badge badge-cyan" style={{ cursor: 'default' }}>{careerGoal}</span>
                  </div>
                </div>

                <div className="metrics-row">
                  <div className="metric-card">
                    <div className="metric-card-top">
                      <div>
                        <span className="metric-card-label">Enrolled Modules</span>
                        <h3 className="metric-card-value">{enrollments.length}</h3>
                      </div>
                      <div className="metric-card-icon icon-cyan">
                        <BookOpen size={20} />
                      </div>
                    </div>
                    <div className="metric-card-footer">
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{activeEnrollments.length} Active</span>
                      <span>•</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>{completedEnrollments.length} Completed</span>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-card-top">
                      <div>
                        <span className="metric-card-label">Avg Quiz Score</span>
                        <h3 className="metric-card-value">{overallAverageScore}%</h3>
                      </div>
                      <div className="metric-card-icon icon-purple">
                        <Award size={20} />
                      </div>
                    </div>
                    <div className="metric-card-footer">
                      <span style={{ color: overallAverageScore >= 80 ? 'var(--accent-cyan)' : 'var(--accent-gold)', fontWeight: 700 }}>
                        {overallAverageScore >= 85 ? 'Grade forecast: A' : overallAverageScore >= 70 ? 'Grade forecast: B' : 'Needs tuning'}
                      </span>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-card-top">
                      <div>
                        <span className="metric-card-label">Study Hours Logged</span>
                        <h3 className="metric-card-value">{totalStudyHours}h</h3>
                      </div>
                      <div className="metric-card-icon icon-gold">
                        <Clock size={20} />
                      </div>
                    </div>
                    <div className="metric-card-footer">
                      <span>Average {(totalStudyHours / Math.max(1, enrollments.length)).toFixed(1)} hrs per course</span>
                    </div>
                  </div>


                </div>

                <div className="dashboard-grid-layout">
                  <div className="panel-card" style={{ minHeight: '380px' }}>
                    <div>
                      <h3 className="panel-card-title">
                        <BookOpen size={16} style={{ color: 'var(--accent-cyan)' }} />
                        My Active Enrolled Courses
                      </h3>
                      
                      {enrollments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>You aren't enrolled in any active courses yet.</p>
                          <button 
                            onClick={() => setActiveTab('catalog')} 
                            className="btn-premium btn-cyan"
                            style={{ marginTop: '20px', fontSize: '11px', padding: '8px 16px' }}
                          >
                            Browse Course Catalog
                          </button>
                        </div>
                      ) : (
                        <div className="courses-list-stack">
                          {enrollments.map((item) => (
                            <div 
                              key={item.enrollment_id} 
                              onClick={() => {
                                selectCourseForTuning(item);
                                setActiveTab('academy');
                              }}
                              className="enrolled-course-item"
                            >
                              <div className="enrolled-course-top">
                                <div>
                                  <span className="course-cat-tag">{item.course_category}</span>
                                  <h4 className="enrolled-course-title">{item.course_title}</h4>
                                  <p className="enrolled-course-instructor">Instructor: {item.instructor_name}</p>
                                </div>
                                <span className={`badge ${
                                  item.status === 'Completed' ? 'badge-green' : item.status === 'In Progress' ? 'badge-purple' : 'badge-cyan'
                                }`}>
                                  {item.status}
                                </span>
                              </div>

                              <div className="progress-bar-wrapper">
                                <div className="progress-labels">
                                  <span>Course Completion Progress</span>
                                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(item.overall_progress)}%</span>
                                </div>
                                <div className="progress-track">
                                  <div 
                                    className="progress-fill"
                                    style={{ width: `${item.overall_progress}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="enrolled-course-stats">
                                <span>Completed Modules: <strong>{item.completed_modules}/{item.total_modules}</strong></span>
                                <span>Avg Quiz Score: <strong>{item.quiz_average}%</strong></span>
                                <span>Study Hours Logged: <strong className="highlight-stat">{item.study_hours}h</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {enrollments.length > 0 && (
                      <div style={{
                        marginTop: '24px',
                        textAlign: 'center',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.02)'
                      }}>
                        💡 Tip: Click on any active course card to configure study metrics and test your MySQL triggers!
                      </div>
                    )}
                  </div>

                  <div className="panel-card predict-panel">
                    <div>
                      <h3 className="panel-card-title">
                        <Cpu size={16} style={{ color: 'var(--accent-cyan)' }} />
                        AI Progress Forecasts
                      </h3>

                      {selectedEnrollment ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div className="predict-course-banner">
                            <span className="predict-course-banner-sub">Target Module Target</span>
                            <h4 className="predict-course-banner-title">{selectedEnrollment.course_title}</h4>
                          </div>

                          <div className="predict-stats-grid">
                            <div className="predict-stat-box">
                              <span className="predict-stat-box-label">Completion Odds</span>
                              <div className="predict-stat-box-value" style={{ color: 'var(--accent-cyan)' }}>
                                {selectedEnrollment.completed_modules === selectedEnrollment.total_modules ? '100' : selectedEnrollment.quiz_average >= 85 ? '94.2' : '64.5'}%
                              </div>
                            </div>
                            
                            <div className="predict-stat-box">
                              <span className="predict-stat-box-label">Projected Grade</span>
                              <div className="predict-stat-box-value" style={{ color: 'var(--accent-purple)' }}>
                                {selectedEnrollment.quiz_average >= 85 ? 'A' : selectedEnrollment.quiz_average >= 70 ? 'B+' : 'C'}
                              </div>
                            </div>

                            <div className="predict-stat-box predict-stat-box-full">
                              <Clock size={16} style={{ color: 'var(--accent-gold)' }} />
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {selectedEnrollment.completed_modules === selectedEnrollment.total_modules 
                                  ? 'Course Completed!' 
                                  : `${selectedEnrollment.quiz_average >= 85 ? '1.5' : '3.2'} weeks remaining`
                                }
                              </span>
                            </div>
                          </div>

                          <div className="predict-insights-box">
                            <div className="insights-box-header">
                              <Bot size={14} />
                              <span>AI Learning Coach Advice</span>
                            </div>
                            <p className="insights-box-body">
                              {selectedEnrollment.completed_modules === selectedEnrollment.total_modules 
                                ? 'Sensational effort completing this curriculum! Click on "AI Path Generator" to build your next milestone roadmap.'
                                : selectedEnrollment.quiz_average >= 85 
                                  ? 'Outstanding engagement! Your current pace and stellar quiz performance project an exceptional finish. Keep up the high standard.'
                                  : 'Solid progress. Increasing weekly study sessions by 1.5 hours will solidify your comprehension and push you to an A grade.'
                              }
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                          <Bot size={36} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 12px' }} />
                          Enroll in a course and begin updating your metrics in **My Academy** to view active AI predictions!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // INSTRUCTOR DASHBOARD
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div className="view-header-row">
                  <div className="view-header-left">
                    <h2 className="gradient-text" style={{ background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent-purple) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Faculty Portal & Metrics
                    </h2>
                    <p>Track academic enrollment parameters and tuition revenue calculations.</p>
                  </div>
                  <div className="view-header-right">
                    <span>Active Educator:</span>
                    <span className="badge badge-purple" style={{ cursor: 'default' }}>{currentUser.name}</span>
                  </div>
                </div>

                {/* Instructor Metrics Row */}
                {instructorStats ? (
                  <div className="metrics-row">
                    <div className="metric-card" style={{ borderColor: 'rgba(171,71,188,0.15)' }}>
                      <div className="metric-card-top">
                        <div>
                          <span className="metric-card-label">Enrolled Learners</span>
                          <h3 className="metric-card-value">{instructorStats.total_students}</h3>
                        </div>
                        <div className="metric-card-icon icon-purple">
                          <Users size={20} />
                        </div>
                      </div>
                      <div className="metric-card-footer">
                        <span>Total active student seats</span>
                      </div>
                    </div>

                    <div className="metric-card" style={{ borderColor: 'rgba(171,71,188,0.15)' }}>
                      <div className="metric-card-top">
                        <div>
                          <span className="metric-card-label">Managed Courses</span>
                          <h3 className="metric-card-value">{instructorStats.total_courses}</h3>
                        </div>
                        <div className="metric-card-icon icon-cyan">
                          <BookOpen size={20} />
                        </div>
                      </div>
                      <div className="metric-card-footer">
                        <span>Syllabuses actively published</span>
                      </div>
                    </div>

                    <div className="metric-card" style={{ borderColor: 'rgba(171,71,188,0.15)' }}>
                      <div className="metric-card-top">
                        <div>
                          <span className="metric-card-label">Feedback Rating</span>
                          <h3 className="metric-card-value" style={{ color: 'var(--accent-gold)' }}>★ {instructorStats.avg_rating}</h3>
                        </div>
                        <div className="metric-card-icon icon-gold">
                          <Award size={20} />
                        </div>
                      </div>
                      <div className="metric-card-footer">
                        <span>Teacher score average</span>
                      </div>
                    </div>

                    <div className="metric-card" style={{ borderColor: 'rgba(171,71,188,0.15)' }}>
                      <div className="metric-card-top">
                        <div>
                          <span className="metric-card-label">Accrued Tuition</span>
                          <h3 className="metric-card-value" style={{ color: '#34d399' }}>${instructorStats.total_revenue}</h3>
                        </div>
                        <div className="metric-card-icon icon-green">
                          <Database size={20} />
                        </div>
                      </div>
                      <div className="metric-card-footer">
                        <span>Tuition generated in MySQL</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <span>Aggregating SQL telemetry stats...</span>
                  </div>
                )}

                {/* Instructor Course List Panel */}
                <div className="panel-card" style={{ border: '1px solid rgba(171,71,188,0.15)' }}>
                  <h3 className="panel-card-title">
                    <BookOpen size={16} style={{ color: 'var(--accent-purple)' }} />
                    My Published Curriculum Modules
                  </h3>
                  
                  <div className="courses-list-stack">
                    {courses.filter(c => c.instructor_id === currentUser.instructor_id).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: '13px' }}>You haven't published any courses yet.</p>
                        <button 
                          onClick={() => setActiveTab('inst-create')} 
                          className="btn-premium btn-cyan"
                          style={{ marginTop: '16px', background: 'linear-gradient(135deg, #ab47bc 0%, #00e5ff 100%)', border: 'none', color: '#080b11', padding: '8px 16px', fontSize: '11px' }}
                        >
                          Publish Your First Course
                        </button>
                      </div>
                    ) : (
                      courses.filter(c => c.instructor_id === currentUser.instructor_id).map((course) => {
                        const enrollCount = enrollments ? courses.reduce((acc, curr) => {
                          // count student enrollments for this course in simulated mode, or we show the count
                          return enrollments.filter(e => e.course_id === course.course_id).length;
                        }, 0) : 0;
                        return (
                          <div key={course.course_id} className="enrolled-course-item" style={{ cursor: 'default' }}>
                            <div className="enrolled-course-top">
                              <div>
                                <span className="course-cat-tag" style={{ color: 'var(--accent-purple)' }}>{course.category}</span>
                                <h4 className="enrolled-course-title">{course.title}</h4>
                                <p className="enrolled-course-instructor">Difficulty: {course.difficulty} • Duration: {course.duration}</p>
                              </div>
                              <span className="badge badge-purple">
                                ${course.price} Tuition
                              </span>
                            </div>
                            <div className="enrolled-course-stats" style={{ marginTop: '10px' }}>
                              <span>Student Rating: <strong>★ {course.rating}</strong></span>
                              <span>Total Students Enrolled: <strong className="highlight-stat" style={{ color: 'var(--accent-purple)' }}>{instructorStudents.filter(s => s.course_title === course.title).length} learners</strong></span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* C. TAB: COURSE CATALOG */}
          {activeTab === 'catalog' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Header */}
              <div className="view-header-row">
                <div className="view-header-left">
                  <h2 className="gradient-text">ZenLearn Academy Curriculum</h2>
                  <p>Select a premium course and enroll to populate your academic dashboard.</p>
                </div>
                <div className="view-header-right">
                  <div className="catalog-search-row">
                    <div className="catalog-search-wrapper">
                      <Search className="catalog-search-icon" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search courses..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <select 
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="catalog-filter-select"
                    >
                      <option value="All">All Difficulties</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Course Cards Grid */}
              <div className="courses-grid-layout">
                {filteredCourses.map((course) => {
                  const isEnrolled = enrollments.some(e => e.course_id === course.course_id);
                  return (
                    <div key={course.course_id} className="course-card">
                      <div>
                        {/* Header Details */}
                        <div className="course-card-top-row">
                          <div>
                            <span className="course-cat-tag">{course.category}</span>
                            <h3 className="course-card-title">{course.title}</h3>
                          </div>
                          <span className={`badge ${
                            course.difficulty === 'Advanced' ? 'badge-purple' : course.difficulty === 'Intermediate' ? 'badge-cyan' : 'badge-gold'
                          }`}>
                            {course.difficulty}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="course-card-desc">
                          {course.description}
                        </p>

                        {/* Syllabus Accordion preview */}
                        <div className="syllabus-overview-box">
                          <h4 className="syllabus-overview-title">Syllabus Overview</h4>
                          <ul className="syllabus-grid">
                            {course.syllabus && JSON.parse(typeof course.syllabus === 'string' ? course.syllabus : JSON.stringify(course.syllabus)).map((module, i) => (
                              <li key={i} className="syllabus-item-preview">
                                <span className="syllabus-dot"></span>
                                <span>{module}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="course-card-footer">
                        {/* Instructor */}
                        <div className="instructor-badge">
                          <img 
                            src={course.instructor_avatar} 
                            alt={course.instructor_name} 
                            className="instructor-badge-img"
                          />
                          <div>
                            <h4 className="instructor-badge-name">{course.instructor_name}</h4>
                            <span className="instructor-badge-rating">★ {course.rating} Expertise</span>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div className="tuition-box">
                            <span className="tuition-label">Tuition Cost</span>
                            <span className="tuition-value">${course.price}</span>
                          </div>
                          
                          {currentUserType === 'instructor' ? (
                            <div className="enrolled-tag-success" style={{ borderColor: 'rgba(171,71,188,0.2)', background: 'rgba(171,71,188,0.05)', color: '#d78cfc' }}>
                              Faculty Mode
                            </div>
                          ) : isEnrolled ? (
                            <div className="enrolled-tag-success">
                              <CheckCircle size={14} />
                              Enrolled
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleEnroll(course.course_id)}
                              className="btn-premium btn-cyan"
                              style={{ fontSize: '11px', padding: '10px 20px' }}
                            >
                              Enroll Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* D. TAB: MY ACADEMY (STUDENT VIEW ONLY) */}
          {activeTab === 'academy' && currentUserType === 'student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Header */}
              <div className="view-header-row" style={{ marginBottom: '10px' }}>
                <div className="view-header-left">
                  <h2 className="gradient-text">My Academic Portal</h2>
                  <p>Tune study parameters to trigger real-time calculations directly inside your local MySQL database.</p>
                </div>
              </div>

              {enrollments.length === 0 ? (
                <div className="panel-card" style={{ padding: '60px', textAlign: 'center' }}>
                  <BookOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>No active enrollments found</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', maxWidth: '400px', margin: '6px auto 0' }}>
                    You haven't enrolled in any active courses yet! Head over to the Course Catalog, pick a course, and click enroll to get started.
                  </p>
                  <button 
                    onClick={() => setActiveTab('catalog')} 
                    className="btn-premium btn-cyan"
                    style={{ marginTop: '24px', fontSize: '12px' }}
                  >
                    View Catalog
                  </button>
                </div>
              ) : (
                <div className="academy-layout-grid">
                  
                  {/* Left Column: Course Selector */}
                  <div>
                    <h3 className="selector-column-header">Select Active Module</h3>
                    <div className="course-selector-list">
                      {enrollments.map((item) => (
                        <div 
                          key={item.enrollment_id}
                          onClick={() => selectCourseForTuning(item)}
                          className={`course-selector-btn ${
                            selectedEnrollment?.enrollment_id === item.enrollment_id ? 'active' : ''
                          }`}
                        >
                          <span className="course-selector-btn-top">{item.course_category}</span>
                          <h4 className="course-selector-btn-title">{item.course_title}</h4>
                          
                          <div className="course-selector-btn-bottom">
                            <span>Progress: <strong style={{ color: 'var(--accent-cyan)' }}>{Math.round(item.overall_progress)}%</strong></span>
                            <span className={`badge ${
                              item.status === 'Completed' ? 'badge-green' : item.status === 'In Progress' ? 'badge-purple' : 'badge-cyan'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Control Deck & Sliders */}
                  <div className="panel-card" style={{ border: '1px solid var(--glass-border-glow)' }}>
                    {selectedEnrollment ? (
                      <div className="tuning-deck-body">
                        <div className="tuning-deck-header">
                          <div>
                            <span className="metric-card-label" style={{ color: 'var(--accent-cyan)' }}>Learner Telemetry Tuning Board</span>
                            <h3 className="enrolled-course-title" style={{ fontSize: '1.1rem', marginTop: '4px' }}>{selectedEnrollment.course_title}</h3>
                            <p className="tuning-deck-desc">
                              Simulate student engagement by adjusting sliders below. Syncing progress fires a **MySQL SQL TRIGGER (`trg_auto_update_progress`)** on the database side to dynamically calculate progress.
                            </p>
                          </div>
                          <span className="badge badge-purple">Active Transaction</span>
                        </div>

                        {/* Sliders Box */}
                        <div className="sliders-wrapper">
                          
                          {/* Slider A: Completed Modules */}
                          <div className="slider-group-box">
                            <div className="slider-box-labels">
                              <span className="slider-box-icon-label">
                                <BookOpen size={14} style={{ color: 'var(--accent-cyan)' }} />
                                Completed Syllabus Modules
                              </span>
                              <span className="slider-box-interactive-value" style={{ color: 'var(--accent-cyan)' }}>{sliderModules} / {selectedEnrollment.total_modules}</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max={selectedEnrollment.total_modules} 
                              value={sliderModules}
                              onChange={(e) => setSliderModules(Number(e.target.value))}
                              className="premium-range"
                            />
                            <div className="slider-footer-labels">
                              <span>0 Modules</span>
                              <span>{selectedEnrollment.total_modules} Modules</span>
                            </div>
                          </div>

                          {/* Slider B: Quiz average */}
                          <div className="slider-group-box">
                            <div className="slider-box-labels">
                              <span className="slider-box-icon-label">
                                <Award size={14} style={{ color: 'var(--accent-purple)' }} />
                                Average Assessment Grade
                              </span>
                              <span className="slider-box-interactive-value" style={{ color: 'var(--accent-purple)' }}>{sliderQuiz}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={sliderQuiz}
                              onChange={(e) => setSliderQuiz(Number(e.target.value))}
                              className="premium-range"
                            />
                            <div className="slider-footer-labels">
                              <span>0% Grade</span>
                              <span>100% Top Mark</span>
                            </div>
                          </div>

                          {/* Slider C: Study Hours */}
                          <div className="slider-group-box">
                            <div className="slider-box-labels">
                              <span className="slider-box-icon-label">
                                <Clock size={14} style={{ color: 'var(--accent-gold)' }} />
                                Total Study Hours Logged
                              </span>
                              <span className="slider-box-interactive-value" style={{ color: 'var(--accent-gold)' }}>{sliderHours} hrs</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="60" 
                              value={sliderHours}
                              onChange={(e) => setSliderHours(Number(e.target.value))}
                              className="premium-range"
                            />
                            <div className="slider-footer-labels">
                              <span>0 Hours</span>
                              <span>60 Hours</span>
                            </div>
                          </div>

                        </div>

                        {/* Sync Button */}
                        <div className="action-row-sync">
                          <div className="action-row-sync-status">
                            Status: <strong>{selectedEnrollment.status}</strong> 
                            <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>•</span> 
                            Progress: <strong style={{ color: 'var(--accent-cyan)' }}>{Math.round(selectedEnrollment.overall_progress)}%</strong>
                          </div>
                          
                          <button 
                            onClick={handleSyncProgress}
                            disabled={isUpdatingDb}
                            className="btn-premium btn-cyan"
                            style={{ padding: '12px 24px', fontSize: '12px' }}
                          >
                            {isUpdatingDb ? (
                              <>
                                <Loader size={14} className="animate-spin" />
                                Running SQL Trigger...
                              </>
                            ) : (
                              <>
                                <Database size={14} />
                                Sync DB & Fire Trigger
                              </>
                            )}
                          </button>
                        </div>

                        {/* Real-time SQL trigger log visualization panel */}
                        {(isUpdatingDb || triggerLog.length > 0) && (
                          <div className="sql-telemetry-panel">
                            <div className="sql-telemetry-header">SQL Transaction Telemetry Log</div>
                            {triggerLog.map((log, i) => (
                              <div 
                                key={i} 
                                className={`sql-log-line ${
                                  log.includes('TRIGGER') || log.includes('SQL TRIGGER') ? 'sql-log-line-highlight' : ''
                                }`}
                              >
                                {log}
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        Please select a course from the left sidebar to tune progress parameters.
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* E. TAB: AI ROADMAP & CHAT (STUDENT VIEW ONLY) */}
          {activeTab === 'ai-hub' && currentUserType === 'student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Header */}
              <div className="view-header-row" style={{ marginBottom: '10px' }}>
                <div className="view-header-left">
                  <h2 className="gradient-text">AI Learning Architect</h2>
                  <p>Synthesize custom milestone roadmaps and seek specialized tutoring from our conversational AI Coach.</p>
                </div>
              </div>

              <div className="ai-hub-grid">
                
                {/* Left Columns: Roadmap Path Generator */}
                <div>
                  
                  {/* Career Goal form Panel */}
                  <div className="objective-form-card">
                    <h3 className="panel-card-title" style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                      <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
                      Formulate Career Target
                    </h3>
                    
                    <div className="form-fields-row">
                      <div className="form-field-group">
                        <label>Target Dream Title</label>
                        <input 
                          type="text" 
                          value={careerGoal}
                          onChange={(e) => setCareerGoal(e.target.value)}
                        />
                      </div>
                      <div className="form-field-group">
                        <label>My Present Skills</label>
                        <input 
                          type="text" 
                          value={currentSkills}
                          onChange={(e) => setCurrentSkills(e.target.value)}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={generateAiRoadmap}
                      disabled={isGeneratingPath}
                      className="btn-premium btn-cyan"
                      style={{ fontSize: '11px', padding: '10px 20px' }}
                    >
                      {isGeneratingPath ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          Mapping Career Roadmap...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          Synthesize Custom Roadmap
                        </>
                      )}
                    </button>
                  </div>

                  {/* Flowchart Visualizer */}
                  {aiRoadmap && (
                    <div className="panel-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 className="panel-card-title" style={{ margin: 0 }}>Personalized Learning Milestone roadmap</h3>
                        <span className="badge badge-cyan">Coverage Index: {aiRoadmap.matchScore}%</span>
                      </div>

                      {/* Node flow diagram */}
                      <div className="roadmap-graph-body">
                        <div className="roadmap-container">
                          {aiRoadmap.milestones.map((milestone, index) => {
                            const isEnrolled = enrollments.some(e => e.course_id === milestone.course_id);
                            const isSelected = selectedMilestone?.id === milestone.id;
                            return (
                              <div 
                                key={milestone.id}
                                onClick={() => setSelectedMilestone(milestone)}
                                className="roadmap-step"
                              >
                                <div className="roadmap-line"></div>
                                <div className={`roadmap-marker ${isEnrolled ? 'completed' : ''}`}>
                                  {milestone.order}
                                </div>
                                <div 
                                  className="roadmap-step-card-wrapper" 
                                  style={{
                                    flex: 1, 
                                    marginLeft: '16px',
                                    borderRadius: '12px',
                                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.03)',
                                    background: isSelected ? 'rgba(0,240,255,0.03)' : 'rgba(255,255,255,0.01)',
                                    padding: '16px',
                                    transition: 'var(--transition-smooth)'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        {milestone.type} • {milestone.category}
                                      </span>
                                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{milestone.title}</h4>
                                    </div>
                                    <span className={`badge ${isEnrolled ? 'badge-green' : 'badge-cyan'}`} style={{ fontSize: '8px' }}>
                                      {isEnrolled ? 'Active Course' : 'Syllabus Core'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Detail Node inspector panel */}
                      {selectedMilestone && (
                        <div className="node-inspector">
                          <div className="inspector-meta">
                            <span>Milestone Node Telemetry Inspector</span>
                            <span>{selectedMilestone.difficulty} difficulty</span>
                          </div>
                          <h4 className="inspector-course-title">{selectedMilestone.title}</h4>
                          <p className="inspector-course-reason">
                            <strong>AI Core Explanation:</strong> {selectedMilestone.reason}
                          </p>
                          
                          {!enrollments.some(e => e.course_id === selectedMilestone.course_id) && (
                            <button 
                              onClick={() => handleEnroll(selectedMilestone.course_id)}
                              className="btn-premium btn-cyan"
                              style={{ fontSize: '10px', padding: '8px 16px', marginTop: '16px' }}
                            >
                              Enroll & Activate Milestone
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Right Column: AI Coach Conversation */}
                <div className="panel-card chat-coach-panel">
                  
                  {/* Coach Chat Header */}
                  <div className="chat-coach-header">
                    <div className="chat-coach-header-avatar">
                      <Bot size={20} />
                    </div>
                    <div className="chat-coach-header-info">
                      <h3>ZenLearn AI Learning Coach</h3>
                      <span>Study Assistant online</span>
                    </div>
                  </div>

                  {/* Message Logs */}
                  <div className="chat-messages-container">
                    {chatMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`chat-message-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}
                      >
                        <span className="message-sender-name">
                          {msg.sender === 'user' ? currentUser.name : 'ZenLearn AI Coach'}
                        </span>
                        <div className="message-text">
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    
                    {isCoachTyping && (
                      <div className="chat-message-bubble ai">
                        <span className="message-sender-name">ZenLearn AI Coach</span>
                        <div className="message-text typing-indicator">
                          <Loader size={12} className="animate-spin" />
                          <span>Generating trajectory...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSendMessage} className="chat-input-row">
                    <input 
                      type="text" 
                      placeholder="Type your study questions..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="chat-send-btn">
                      <Send size={14} />
                    </button>
                  </form>

                </div>

              </div>

            </div>
          )}

          {/* F. TAB: INSTRUCTOR COURSE CREATION DECK (INSTRUCTOR ONLY) */}
          {activeTab === 'inst-create' && currentUserType === 'instructor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="view-header-row" style={{ marginBottom: '10px' }}>
                <div className="view-header-left">
                  <h2 className="gradient-text" style={{ background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent-purple) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Publish New Academic Course
                  </h2>
                  <p>Register a brand new course and compile its syllabus. The course immediately seeds the global curriculum catalog.</p>
                </div>
              </div>

              <div className="objective-form-card" style={{ border: '1px solid rgba(171,71,188,0.15)' }}>
                <form onSubmit={handlePublishCourse} className="tuning-deck-body">
                  
                  <div className="form-fields-row" style={{ marginBottom: 0 }}>
                    <div className="form-field-group">
                      <label style={{ color: '#d78cfc' }}>Course Curriculum Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Cognitive Network Topologies"
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-field-group">
                      <label style={{ color: '#d78cfc' }}>Curriculum Category</label>
                      <select 
                        value={courseCategory}
                        onChange={(e) => setCourseCategory(e.target.value)}
                        className="catalog-filter-select"
                        style={{ width: '100%', height: '42px', marginTop: '6px' }}
                      >
                        <option value="AI & Machine Learning">AI & Machine Learning</option>
                        <option value="Database Engineering">Database Engineering</option>
                        <option value="Design & Web Apps">Design & Web Apps</option>
                        <option value="Distributed Cryptography">Distributed Cryptography</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label style={{ color: '#d78cfc' }}>Granular Course Description</label>
                    <textarea 
                      placeholder="Detail what students will learn, BCI/hardware specifications, neural math backbones, consensus schemas, and practical engineering skills..."
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                      style={{
                        width: '100%',
                        height: '100px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        marginTop: '6px',
                        resize: 'none',
                        fontFamily: 'var(--font-body)'
                      }}
                      required
                    />
                  </div>

                  <div className="form-fields-row" style={{ marginBottom: 0 }}>
                    <div className="form-field-group">
                      <label style={{ color: '#d78cfc' }}>Syllabus Duration</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 24 hours"
                        value={courseDuration}
                        onChange={(e) => setCourseDuration(e.target.value)}
                      />
                    </div>
                    <div className="form-field-group">
                      <label style={{ color: '#d78cfc' }}>Course Difficulty</label>
                      <select 
                        value={courseDifficulty}
                        onChange={(e) => setCourseDifficulty(e.target.value)}
                        className="catalog-filter-select"
                        style={{ width: '100%', height: '42px', marginTop: '6px' }}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="form-field-group">
                      <label style={{ color: '#d78cfc' }}>Tuition Cost (USD)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="99.99"
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label style={{ color: '#d78cfc' }}>Syllabus Modules List (Comma-separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Basic Layers, Loss Gradients, Spiking Cells, Final Exam"
                      value={courseSyllabus}
                      onChange={(e) => setCourseSyllabus(e.target.value)}
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '6px', display: 'block' }}>
                      Separate syllabus modules with commas. This automatically compiles into database JSON.
                    </small>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-premium btn-cyan" 
                    style={{ width: '100%', padding: '14px', marginTop: '12px', fontSize: '12px', justifyContent: 'center', background: 'linear-gradient(135deg, #ab47bc 0%, #00e5ff 100%)', color: '#080b11', border: 'none', fontWeight: 800 }}
                    disabled={isPublishingCourse}
                  >
                    {isPublishingCourse ? (
                      <>
                        <Loader size={14} className="animate-spin" />
                        Writing Course transaction to MySQL database...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Publish Premium Course & Sync Catalog
                      </>
                    )}
                  </button>

                </form>
              </div>
            </div>
          )}

          {/* G. TAB: INSTRUCTOR STUDENT TRACKER (INSTRUCTOR ONLY) */}
          {activeTab === 'inst-monitor' && currentUserType === 'instructor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="view-header-row" style={{ marginBottom: '10px' }}>
                <div className="view-header-left">
                  <h2 className="gradient-text" style={{ background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent-purple) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Student Telemetry Monitoring Tracker
                  </h2>
                  <p>Monitor live student engagement, quiz performance, and active study hours logged via cross-table joins.</p>
                </div>
              </div>

              <div className="panel-card" style={{ padding: '24px', border: '1px solid rgba(171,71,188,0.15)' }}>
                <h3 className="panel-card-title">
                  <Users size={16} style={{ color: 'var(--accent-purple)' }} />
                  Active Learner Trajectories in Your Courses
                </h3>

                {instructorStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No students have enrolled in your courses yet. 
                    Publish new courses or switch profiles to register/enroll students!
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Learner</th>
                          <th>Target Course</th>
                          <th>Modules Completed</th>
                          <th>Quiz Avg</th>
                          <th>Study Hours</th>
                          <th>Overall Progress</th>
                          <th>Academic Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instructorStudents.map((s, idx) => (
                          <tr key={idx}>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.learner_name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.learner_email}</div>
                            </td>
                            <td>{s.course_title}</td>
                            <td style={{ fontWeight: 600 }}>{s.completed_modules || 0} modules completed</td>
                            <td style={{ color: s.quiz_average >= 80 ? 'var(--accent-cyan)' : 'var(--accent-gold)', fontWeight: 600 }}>
                              {s.quiz_average}%
                            </td>
                            <td style={{ color: 'var(--accent-gold)' }}>{s.study_hours} hrs</td>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {Math.round(s.overall_progress)}%
                            </td>
                            <td>
                              <span className={`badge ${
                                s.status === 'Completed' ? 'badge-green' : s.status === 'In Progress' ? 'badge-purple' : 'badge-cyan'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
