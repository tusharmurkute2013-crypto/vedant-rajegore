import { useState } from 'react'
import { User, School, Key, Lock, LogIn, UserPlus, Sparkles, AlertTriangle } from 'lucide-react'
import './AuthPage.css'

function AuthPage({ API_URL, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    school: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation checks
    if (!formData.username.trim() || !formData.password) {
      setError("⚠️ Username and password are required!")
      setLoading(false)
      return
    }

    if (!isLogin && (!formData.name.trim() || !formData.school.trim())) {
      setError("⚠️ All fields are required to register!")
      setLoading(false)
      return
    }

    const payload = isLogin 
      ? { username: formData.username.trim(), password: formData.password }
      : { 
          username: formData.username.trim(), 
          password: formData.password,
          name: formData.name.trim(),
          school: formData.school.trim()
        }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || `HTTP Error ${res.status}`)
      }

      // Successful login/register
      onAuthSuccess(data.token, data.user)
    } catch (err) {
      setError(err.message || "❌ Failed to connect to server. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Background glow effects */}
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      <div className="auth-card">
        <div className="auth-logo-section">
          <img src="/logo.png" alt="STEMQuest Logo" className="auth-logo-img" />
          <span className="auth-logo-text">STEMQuest</span>
          <p className="auth-subtitle">Adventure through Science, Math & Coding! 🚀</p>
        </div>

        {/* Tab Toggle */}
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            onClick={() => { setIsLogin(true); setError(null) }}
          >
            <LogIn size={16} />
            <span>Log In</span>
          </button>
          <button 
            type="button"
            className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            onClick={() => { setIsLogin(false); setError(null) }}
          >
            <UserPlus size={16} />
            <span>Sign Up</span>
          </button>
        </div>

        {error && (
          <div className="auth-error-msg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Sign Up fields */}
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <div className="input-wrapper">
                  <span className="input-icon"><User size={18} /></span>
                  <input 
                    id="name"
                    name="name"
                    type="text" 
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="school">School Name</label>
                <div className="input-wrapper">
                  <span className="input-icon"><School size={18} /></span>
                  <input 
                    id="school"
                    name="school"
                    type="text" 
                    placeholder="e.g. Govt Senior Secondary School"
                    value={formData.school}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Core Login/Register fields */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <span className="input-icon"><Key size={18} /></span>
              <input 
                id="username"
                name="username"
                type="text" 
                placeholder="Choose a screen name, e.g. ravi123"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Lock size={18} /></span>
              <input 
                id="password"
                name="password"
                type="password" 
                placeholder="Enter password (min 4 characters)"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <span>Please wait...</span>
            ) : isLogin ? (
              <>
                <span>Launch App</span>
                <LogIn size={18} />
              </>
            ) : (
              <>
                <span>Create Account</span>
                <Sparkles size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <span>New player? <button type="button" onClick={() => { setIsLogin(false); setError(null) }}>Sign Up here</button></span>
          ) : (
            <span>Already have an account? <button type="button" onClick={() => { setIsLogin(true); setError(null) }}>Log In here</button></span>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage
