import { useState, useEffect, useRef } from 'react'
import { 
  LayoutDashboard, 
  Atom, 
  Trophy, 
  User, 
  Award, 
  Star, 
  Flame, 
  LogOut, 
  Compass, 
  Sparkles, 
  MessageSquare,
  Send,
  ArrowLeft,
  Apple,
  Play,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  School,
  Brain
} from 'lucide-react'
import './App.css'
import AuthPage from './AuthPage'

// API Base URL — uses the Vite env var when available and falls back to local dev.
// ─────────────────────────────────────────────────────────────────────────────
const API_URL = (import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : 'https://backend-new-3m56.onrender.com')).replace(/\/$/, '')

function App() {
  // ─── Auth State ──────────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('token') || null)

  // ─── Global State ───────────────────────────────────────────────────────
  const [stats, setStats] = useState({ points: 0, level: 1, streak: 0, quests_completed: 0, badges: [], daily_challenge_done: false, name: '', school: '' })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [activeGame, setActiveGame] = useState(null)
  const [newBadgeAlert, setNewBadgeAlert] = useState(null) // badge unlock popup

  // ─── AI Tutor State ─────────────────────────────────────────────────────
  const [tutorOpen, setTutorOpen] = useState(false)
  const [tutorQuestion, setTutorQuestion] = useState('')
  const [tutorChat, setTutorChat] = useState([
    { sender: 'tutor', text: 'Namaste! 🙏 I am your STEMQuest AI Tutor. Ask me anything about science, math, coding, or engineering and I will explain it simply!' }
  ])
  const chatEndRef = useRef(null)

  // ─── Math Game State ─────────────────────────────────────────────────────
  const [mathQuestions, setMathQuestions] = useState([])
  const [mathIndex, setMathIndex] = useState(0)
  const [mathScore, setMathScore] = useState(0)
  const [mathAnswered, setMathAnswered] = useState(null) // 'correct' | 'wrong' | null

  // ─── Science Game State ──────────────────────────────────────────────────
  const [planets, setPlanets] = useState([])
  const [gravity, setGravity] = useState(9.8)
  const [planetName, setPlanetName] = useState('Earth')
  const [planetFact, setPlanetFact] = useState('Earth\'s gravity keeps the Moon in orbit!')
  const [appleY, setAppleY] = useState(0)
  const [dropTime, setDropTime] = useState(0)
  const [isDropping, setIsDropping] = useState(false)

  // ─── Coding Game State ───────────────────────────────────────────────────
  const [robotPos, setRobotPos] = useState({ r: 0, c: 0 })
  const [commands, setCommands] = useState([])
  const [codeMessage, setCodeMessage] = useState('Build a path for the robot to reach the star! ⭐')
  const [isRunningCode, setIsRunningCode] = useState(false)

  // ─── Leaderboard State ─────────────────────────────────────────────────────
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  // ─── Platform Stats State (real data from backend) ─────────────────────
  const [platformStats, setPlatformStats] = useState({ total_students: null, total_quests_completed: null, total_schools: null })

  // ─────────────────────────────────────────────────────────────────────────
  // API Helpers (using JWT tokens)
  // ─────────────────────────────────────────────────────────────────────────

  const apiFetch = async (path, options = {}) => {
    const activeToken = token || localStorage.getItem('token')
    const headers = { 'Content-Type': 'application/json' }
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`
    }
    const res = await fetch(`${API_URL}${path}`, {
      headers,
      ...options,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || `HTTP ${res.status}`)
    }
    return res.json()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setStats({ points: 0, level: 1, streak: 0, quests_completed: 0, badges: [], daily_challenge_done: false, name: '', school: '' })
    setActiveGame(null)
  }

  const updateStatsFromResponse = (data) => {
    setStats({
      points: data.points,
      level: data.level,
      streak: data.streak,
      quests_completed: data.quests_completed,
      badges: data.badges || [],
      daily_challenge_done: data.daily_challenge_done,
      name: data.name,
      school: data.school,
    })
    // Show badge unlock popup if any new badges earned
    if (data.new_badges && data.new_badges.length > 0) {
      const badge = data.badges?.find(b => b.id === data.new_badges[0])
      if (badge) {
        setNewBadgeAlert(badge)
        setTimeout(() => setNewBadgeAlert(null), 4000)
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // On Load — fetch user stats, math questions, planet data (Auth-Gated)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const activeToken = token || localStorage.getItem('token')
      if (!activeToken) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Load user stats
        const userData = await apiFetch('/api/user/me')
        updateStatsFromResponse(userData)

        // Load math questions from backend
        const mathData = await apiFetch('/api/quests/math')
        setMathQuestions(mathData.questions)

        // Load planet data from backend
        const planetData = await apiFetch('/api/science/planets')
        setPlanets(planetData.planets)
        if (planetData.planets.length > 0) {
          const earth = planetData.planets.find(p => p.name === 'Earth') || planetData.planets[0]
          setGravity(earth.gravity)
          setPlanetName(earth.name)
          setPlanetFact(earth.fact)
        }
        // Load platform stats from backend (no fake data)
        const statsData = await apiFetch('/api/stats')
        setPlatformStats(statsData)
      } catch (err) {
        console.error('Initialization error:', err)
        handleLogout() // Clear invalid session if authentication fails
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [token])

  // Auto-scroll tutor chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [tutorChat])

  // Load leaderboard when tab is active
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      setLeaderboardLoading(true)
      apiFetch('/api/leaderboard')
        .then(data => setLeaderboard(data.leaderboard))
        .catch(err => console.error('Leaderboard error:', err))
        .finally(() => setLeaderboardLoading(false))
    }
  }, [activeTab])

  // ─────────────────────────────────────────────────────────────────────────
  // Quest Completion — awards points via backend
  // ─────────────────────────────────────────────────────────────────────────
  const handleQuestCompletion = async (pointsEarned) => {
    try {
      const data = await apiFetch(`/api/user/me/points?points=${pointsEarned}`, { method: 'POST' })
      updateStatsFromResponse(data)
    } catch (err) {
      console.error('Error updating points:', err)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Daily Challenge — backend enforces 1-per-day rule
  // ─────────────────────────────────────────────────────────────────────────
  const handleDailyChallenge = async () => {
    try {
      const data = await apiFetch('/api/user/me/daily-challenge', { method: 'POST' })
      updateStatsFromResponse(data)
      if (data.already_done) {
        alert("⏰ You already completed today's challenge! Come back tomorrow for more XP!")
      } else {
        alert(`🎉 Daily Challenge Complete! ${data.message}`)
      }
    } catch (err) {
      console.error('Daily challenge error:', err)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AI Tutor
  // ─────────────────────────────────────────────────────────────────────────
  const askAITutor = async (e) => {
    e.preventDefault()
    if (!tutorQuestion.trim()) return

    const userMsg = { sender: 'user', text: tutorQuestion }
    setTutorChat(prev => [...prev, userMsg])
    const currentQuestion = tutorQuestion
    setTutorQuestion('')

    // Add loading indicator
    setTutorChat(prev => [...prev, { sender: 'tutor', text: '...thinking...', loading: true }])

    try {
      const data = await apiFetch('/api/tutor', {
        method: 'POST',
        body: JSON.stringify({ question: currentQuestion }),
      })
      setTutorChat(prev => [
        ...prev.filter(m => !m.loading),
        { sender: 'tutor', text: data.response }
      ])
    } catch (err) {
      setTutorChat(prev => [
        ...prev.filter(m => !m.loading),
        { sender: 'tutor', text: "Sorry, I'm having trouble connecting right now. Please check if the backend is running!" }
      ])
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Math Game Logic
  // ─────────────────────────────────────────────────────────────────────────
  const handleMathAnswer = async (opt) => {
    if (mathAnswered) return // prevent double-click
    const correct = opt === mathQuestions[mathIndex].answer
    setMathAnswered(correct ? 'correct' : 'wrong')

    if (correct) {
      await handleQuestCompletion(mathQuestions[mathIndex].points)
    }

    setTimeout(() => {
      setMathAnswered(null)
      if (mathIndex < mathQuestions.length - 1) {
        setMathIndex(idx => idx + 1)
      } else {
        const totalXP = mathScore * 15 + (correct ? 15 : 0)
        alert(`🎉 Quiz Complete! You scored ${mathScore + (correct ? 1 : 0)}/${mathQuestions.length}. Well done!`)
        setActiveGame(null)
        setMathIndex(0)
        setMathScore(0)
      }
    }, 1000)

    if (correct) setMathScore(s => s + 1)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Science Game Logic
  // ─────────────────────────────────────────────────────────────────────────
  const changePlanet = (planet) => {
    setGravity(planet.gravity)
    setPlanetName(planet.name)
    setPlanetFact(planet.fact)
    setAppleY(0)
    setDropTime(0)
  }

  const dropApple = async () => {
    if (isDropping) return
    setIsDropping(true)
    setAppleY(0)

    const duration = Math.sqrt((2 * 100) / gravity) * 1000
    setDropTime((duration / 1000).toFixed(2))

    let start = null
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = timestamp - start
      const percentage = Math.min(progress / duration, 1)
      setAppleY(percentage * 250)

      if (progress < duration) {
        requestAnimationFrame(step)
      } else {
        setIsDropping(false)
        handleQuestCompletion(20)
        alert(`🍎 Apple landed on ${planetName}! Fall time: ${(duration / 1000).toFixed(2)}s. +20 XP!`)
      }
    }
    requestAnimationFrame(step)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Coding Game Logic
  // ─────────────────────────────────────────────────────────────────────────
  const addCommand = (cmd) => {
    if (commands.length < 6) setCommands(prev => [...prev, cmd])
  }

  const runCode = async () => {
    if (isRunningCode || commands.length === 0) return
    setIsRunningCode(true)
    setCodeMessage("🤖 Running commands...")

    let index = 0
    let currentPos = { r: 0, c: 0 }
    setRobotPos(currentPos)

    const interval = setInterval(async () => {
      if (index >= commands.length) {
        clearInterval(interval)
        setIsRunningCode(false)
        setCommands([])

        if (currentPos.r === 2 && currentPos.c === 2) {
          setCodeMessage("🏆 Success! The robot reached the star! +25 XP")
          await handleQuestCompletion(25)
          alert("🏆 Success! You coded the robot to the star! +25 XP")
          setActiveGame(null)
        } else {
          setCodeMessage("❌ The robot missed the star. Try a different path!")
          setRobotPos({ r: 0, c: 0 })
        }
        return
      }

      const stepCmd = commands[index]
      if (stepCmd === 'Right' && currentPos.c < 2) currentPos.c += 1
      if (stepCmd === 'Down' && currentPos.r < 2) currentPos.r += 1
      setRobotPos({ ...currentPos })
      index++
    }, 800)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
  }

  const xpToNextLevel = () => {
    const currentLevelXP = (stats.level - 1) * 100
    const nextLevelXP = stats.level * 100
    return { current: stats.points - currentLevelXP, needed: nextLevelXP - currentLevelXP }
  }

  const earnedBadges = stats.badges?.filter(b => b.earned) || []
  const lockedBadges = stats.badges?.filter(b => !b.earned) || []

  const handleAuthSuccess = (newToken, userData) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    updateStatsFromResponse(userData)
    setActiveTab('home')
  }

  if (!token) {
    return <AuthPage API_URL={API_URL} onAuthSuccess={handleAuthSuccess} />
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">⚛️</div>
        <p>Loading STEMQuest...</p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* Badge Unlock Popup */}
      {newBadgeAlert && (
        <div className="badge-unlock-popup">
          <div className="badge-unlock-inner">
            <span className="badge-unlock-icon">{newBadgeAlert.icon}</span>
            <div>
              <strong>Badge Unlocked! 🎉</strong>
              <p>{newBadgeAlert.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="logo-container">
          <img src="/logo.png" alt="STEMQuest Logo" className="app-logo" />
          <span className="logo-text">STEMQuest</span>
        </div>
        <div className="nav-links">
          <button id="nav-dashboard" className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setActiveGame(null) }}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button id="nav-quests" className={`nav-btn ${activeTab === 'quests' ? 'active' : ''}`} onClick={() => { setActiveTab('quests'); setActiveGame(null) }}>
            <Atom size={18} />
            <span>STEM Quests</span>
          </button>
          <button id="nav-leaderboard" className={`nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => { setActiveTab('leaderboard'); setActiveGame(null) }}>
            <Trophy size={18} />
            <span>Leaderboard</span>
          </button>
        </div>
        <div className="nav-stats" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="student-greeting" style={{ marginRight: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', fontWeight: '800', color: '#a5b4fc' }}>
            <User size={16} />
            <span>{stats.name || 'Student'}</span>
          </span>
          <div className="stat-pill level"><Award size={16} /> Lvl {stats.level}</div>
          <div className="stat-pill xp"><Star size={16} /> {stats.points} XP</div>
          <div className="stat-pill streak"><Flame size={16} /> {stats.streak} Day Streak</div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === 'home' && !activeGame && (
        <main className="main-dashboard animate-fade">
          {/* Hero Banner */}
          <section className="hero-banner">
            <div className="hero-content">
              <span className="hero-badge">🚀 Empowering Rural STEM Minds</span>
              <h1>Learn. Play. Explore. Build.</h1>
              <p>Discover the magic of Science, Math, and Coding through immersive gameplay designed for you!</p>
              <div className="hero-ctas">
                <button id="cta-start" className="cta-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setActiveTab('quests')}>
                  <Compass size={18} />
                  <span>Start Adventure</span>
                </button>
                <button id="cta-tutor" className="cta-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setTutorOpen(true)}>
                  <MessageSquare size={18} />
                  <span>Chat with AI Tutor</span>
                </button>
              </div>
            </div>
            <div className="hero-image-wrapper">
              <img src="/banner.png" alt="Rural STEM Adventure" className="hero-image" />
            </div>
          </section>

          {/* Stats Bar */}
          {/* Stats Bar — real data from backend */}
          <section className="stats-bar">
            <div className="stat-card">
              <h3>{platformStats.total_students !== null ? platformStats.total_students.toLocaleString() : '—'}</h3>
              <p>Students Learning</p>
            </div>
            <div className="stat-card">
              <h3>{platformStats.total_quests_completed !== null ? platformStats.total_quests_completed.toLocaleString() : '—'}</h3>
              <p>Quests Completed</p>
            </div>
            <div className="stat-card">
              <h3>{platformStats.total_schools !== null ? platformStats.total_schools.toLocaleString() : '—'}</h3>
              <p>Schools Connected</p>
            </div>
          </section>

          {/* XP Progress Bar */}
          <div className="xp-progress-section">
            <div className="xp-progress-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Star size={16} /> Level {stats.level} Progress</span>
              <span>{xpToNextLevel().current} / {xpToNextLevel().needed} XP to Level {stats.level + 1}</span>
            </div>
            <div className="xp-progress-bar">
              <div
                className="xp-progress-fill"
                style={{ width: `${Math.min((xpToNextLevel().current / xpToNextLevel().needed) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Daily Challenge + Badges */}
          <div className="dashboard-grid">
            <div className="daily-challenge-panel">
              <div className="panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Flame size={20} className="sparkles" /> Daily STEM Challenge</h2>
                {!stats.daily_challenge_done && <span className="badge-new">NEW</span>}
                {stats.daily_challenge_done && <span className="badge-done">✅ DONE</span>}
              </div>
              <p>
                <strong>The Gravity Experiment:</strong> Why does a heavier paper ball not fall
                faster than a lighter paper ball? Discover the mystery of acceleration and drag!
              </p>
              <button
                id="btn-daily-challenge"
                className={`challenge-btn ${stats.daily_challenge_done ? 'done' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleDailyChallenge}
              >
                {stats.daily_challenge_done ? '✅ Completed Today!' : (
                  <>
                    <Sparkles size={18} />
                    <span>Complete & Claim +50 XP</span>
                  </>
                )}
              </button>
            </div>

            <div className="achievements-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={20} /> Badges ({earnedBadges.length}/{stats.badges?.length || 8})</h2>
              <div className="badges-list">
                {(stats.badges?.length > 0 ? stats.badges : [
                  { id: 'explorer', icon: '🧭', name: 'Explorer', earned: false },
                  { id: 'scientist', icon: '🧬', name: 'Scientist', earned: false },
                  { id: 'innovator', icon: '🛠️', name: 'Innovator', earned: false },
                  { id: 'coder', icon: '🤖', name: 'Coder', earned: false },
                ]).map(badge => (
                  <div key={badge.id} className={`badge-item ${badge.earned ? 'earned' : 'locked'}`} title={badge.desc || badge.name}>
                    <div className="badge-icon">{badge.icon}</div>
                    <span>{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── QUESTS TAB ── */}
      {activeTab === 'quests' && !activeGame && (
        <main className="quests-section animate-fade">
          <div className="section-header">
            <h1>Select Your STEM Path</h1>
            <p>Pick a subject, start a quest, and solve puzzles to level up!</p>
          </div>
          <div className="quests-grid">
            <div className="quest-card math">
              <div className="quest-accent-bar"></div>
              <img src="/math.png" alt="Math Mysteries" className="quest-icon-img" />
              <h2>Math Mysteries</h2>
              <p>Solve {mathQuestions.length} algebra puzzles to crack equations and unlock rewards.</p>
              <div className="quest-actions">
                <button id="btn-start-math" className="action-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => { setMathIndex(0); setMathScore(0); setActiveGame('math') }}>
                  <Play size={16} />
                  <span>Start Equation Battle</span>
                </button>
              </div>
            </div>

            <div className="quest-card science">
              <div className="quest-accent-bar"></div>
              <img src="/science.png" alt="Science Lab" className="quest-icon-img" />
              <h2>Science Lab</h2>
              <p>Simulate gravity on {planets.length || 4} planets and see how acceleration changes!</p>
              <div className="quest-actions">
                <button id="btn-start-science" className="action-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => setActiveGame('science')}>
                  <Play size={16} />
                  <span>Enter Gravity Lab</span>
                </button>
              </div>
            </div>

            <div className="quest-card coding">
              <div className="quest-accent-bar"></div>
              <img src="/coding.png" alt="Code Breakers" className="quest-icon-img" />
              <h2>Code Breakers</h2>
              <p>Help the robot navigate to the star by coding sequential instructions.</p>
              <div className="quest-actions">
                <button id="btn-start-coding" className="action-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => { setRobotPos({ r: 0, c: 0 }); setCommands([]); setActiveGame('coding') }}>
                  <Play size={16} />
                  <span>Play Logic Builder</span>
                </button>
              </div>
            </div>

            <div className="quest-card engineering">
              <div className="quest-accent-bar"></div>
              <img src="/engineering.png" alt="Engineering Design" className="quest-icon-img" />
              <h2>Engineering Design</h2>
              <p>Build water filters, solar ovens, and bridges out of local rural materials.</p>
              <div className="quest-actions">
                <button id="btn-start-engineering" className="action-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => handleQuestCompletion(30).then(() => alert('🌉 Bridge built! +30 XP'))}>
                  <Award size={16} />
                  <span>Build Bridge (+30 XP)</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── MATH GAME ── */}
      {activeGame === 'math' && mathQuestions.length > 0 && (
        <main className="game-container animate-fade">
          <div className="game-header">
            <button className="back-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setActiveGame(null)}>
              <ArrowLeft size={16} />
              <span>Back to Quests</span>
            </button>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={22} /> Equation Battle</h2>
            <div className="game-score" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Trophy size={16} />
              <span>Score: {mathScore}/{mathQuestions.length}</span>
            </div>
          </div>
          <div className="game-box math-game">
            <div className="question-counter">Question {mathIndex + 1} of {mathQuestions.length}</div>
            <h3 className="math-question">{mathQuestions[mathIndex].question}</h3>
            <p className="math-points-hint">+{mathQuestions[mathIndex].points} XP for correct answer</p>
            <div className="options-grid">
              {mathQuestions[mathIndex].options.map((opt, i) => (
                <button
                  key={i}
                  id={`math-option-${i}`}
                  className={`option-btn ${
                    mathAnswered
                      ? opt === mathQuestions[mathIndex].answer
                        ? 'correct-answer'
                        : mathAnswered === 'wrong' && opt !== mathQuestions[mathIndex].answer
                          ? 'wrong-answer'
                          : ''
                      : ''
                  }`}
                  onClick={() => handleMathAnswer(opt)}
                  disabled={!!mathAnswered}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ── SCIENCE GAME ── */}
      {activeGame === 'science' && (
        <main className="game-container animate-fade">
          <div className="game-header">
            <button className="back-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setActiveGame(null)}>
              <ArrowLeft size={16} />
              <span>Back to Quests</span>
            </button>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Atom size={22} /> Gravity Simulator</h2>
          </div>
          <div className="game-box science-game">
            <div className="control-panel">
              <h3>Choose Planet</h3>
              <div className="planet-buttons">
                {(planets.length > 0 ? planets : [
                  { name: 'Moon', gravity: 1.6, emoji: '🌕', fact: 'On the Moon you can jump 6x higher!' },
                  { name: 'Earth', gravity: 9.8, emoji: '🌍', fact: "Earth's gravity keeps the Moon in orbit!" },
                  { name: 'Mars', gravity: 3.7, emoji: '🔴', fact: 'On Mars you weigh only 38% of your Earth weight!' },
                  { name: 'Jupiter', gravity: 24.8, emoji: '🪐', fact: "Jupiter's gravity protects Earth from asteroids!" },
                ]).map(planet => (
                  <button
                    key={planet.name}
                    id={`planet-${planet.name.toLowerCase()}`}
                    className={planetName === planet.name ? 'active' : ''}
                    onClick={() => changePlanet(planet)}
                  >
                    {planet.emoji} {planet.name} ({planet.gravity} m/s²)
                  </button>
                ))}
              </div>
              <p className="gravity-info">Gravity: <strong>{gravity} m/s²</strong></p>
              <p className="planet-fact">💡 {planetFact}</p>
              <button id="btn-drop-apple" className="action-btn drop-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={dropApple} disabled={isDropping}>
                <Apple size={18} />
                <span>Drop Apple</span>
              </button>
            </div>

            <div className="simulator-view">
              <div className="fall-zone">
                <div className="apple" style={{ transform: `translateY(${appleY}px)` }}>🍎</div>
                <div className="ground"></div>
              </div>
              {dropTime > 0 && <p className="time-result">⏱ Fall Duration: <strong>{dropTime} seconds</strong></p>}
            </div>
          </div>
        </main>
      )}

      {/* ── CODING GAME ── */}
      {activeGame === 'coding' && (
        <main className="game-container animate-fade">
          <div className="game-header">
            <button className="back-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setActiveGame(null)}>
              <ArrowLeft size={16} />
              <span>Back to Quests</span>
            </button>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Brain size={22} /> Code Breakers: Maze Solver</h2>
          </div>
          <div className="game-box coding-game">
            <div className="grid-container">
              {[0, 1, 2].map(r => (
                <div key={r} className="grid-row">
                  {[0, 1, 2].map(c => {
                    const isRobot = robotPos.r === r && robotPos.c === c
                    const isStar = r === 2 && c === 2
                    return (
                      <div key={c} className={`grid-cell ${isRobot ? 'has-robot' : ''} ${isStar ? 'has-star' : ''}`}>
                        {isRobot ? '🤖' : isStar ? '⭐' : ''}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="code-editor">
              <p className="editor-instructions">{codeMessage}</p>
              <p className="coding-hint">💡 Hint: Robot starts at top-left. Star is at bottom-right. Add 2 Rights + 2 Downs!</p>
              <div className="command-builder">
                <button id="cmd-right" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => addCommand('Right')} disabled={isRunningCode}>
                  <span>Move Right</span>
                  <ChevronRight size={16} />
                </button>
                <button id="cmd-down" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => addCommand('Down')} disabled={isRunningCode}>
                  <span>Move Down</span>
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="code-sequence">
                <strong>Commands: </strong>
                {commands.length === 0 && <span className="no-commands">No commands yet</span>}
                {commands.map((cmd, i) => (
                  <span key={i} className="cmd-tag">{cmd}</span>
                ))}
              </div>
              <div className="editor-actions">
                <button id="btn-run-code" className="run-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={runCode} disabled={isRunningCode || commands.length === 0}>
                  <Play size={16} />
                  <span>Run Code</span>
                </button>
                <button id="btn-reset-code" className="reset-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => { setCommands([]); setRobotPos({ r: 0, c: 0 }); setCodeMessage('Build a path for the robot to reach the star! ⭐') }} disabled={isRunningCode}>
                  <RotateCcw size={16} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── LEADERBOARD TAB ── */}
      {activeTab === 'leaderboard' && !activeGame && (
        <main className="leaderboard-section animate-fade">
          <div className="section-header">
            <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <Trophy size={32} style={{ color: '#fbbf24' }} />
              <span>School Champions Leaderboard</span>
            </h1>
            <p>See how students across rural schools are scoring in STEM!</p>
          </div>

          <div className="leaderboard-table-container">
            {leaderboardLoading ? (
              <div className="loading-leaderboard">Loading leaderboard... ⏳</div>
            ) : (
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Trophy size={14} /> Rank
                      </span>
                    </th>
                    <th>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={14} /> Student Name
                      </span>
                    </th>
                    <th>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <School size={14} /> School
                      </span>
                    </th>
                    <th>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Star size={14} /> XP Points
                      </span>
                    </th>
                    <th>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Award size={14} /> Level
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={i}
                      className={`${i < 3 ? 'top-three' : ''} ${entry.is_current_user ? 'user-row' : ''}`}
                    >
                      <td>{getRankEmoji(entry.rank)} {entry.rank}</td>
                      <td>{entry.name} {entry.is_current_user ? '(You)' : ''}</td>
                      <td>{entry.school}</td>
                      <td>{entry.points.toLocaleString()}</td>
                      <td>Level {entry.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      )}

      {/* ── Floating AI Tutor Button ── */}
      <button id="btn-open-tutor" className="ai-tutor-trigger" onClick={() => setTutorOpen(!tutorOpen)}>
        <Brain size={18} />
        <span>Ask AI Tutor</span>
      </button>

      {/* ── AI Tutor Drawer ── */}
      <div className={`ai-tutor-drawer ${tutorOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={20} />
            <span>STEMQuest AI Tutor</span>
          </h3>
          <button id="btn-close-tutor" className="close-btn" onClick={() => setTutorOpen(false)}>×</button>
        </div>
        <div className="drawer-chat">
          {tutorChat.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.sender} ${msg.loading ? 'loading' : ''}`}>
              <p>{msg.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form className="drawer-input-area" onSubmit={askAITutor}>
          <input
            id="tutor-input"
            type="text"
            placeholder="Ask about gravity, photosynthesis, coding..."
            value={tutorQuestion}
            onChange={(e) => setTutorQuestion(e.target.value)}
          />
          <button id="btn-send-tutor" type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  )
}

export default App
