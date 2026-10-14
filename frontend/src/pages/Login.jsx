import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { loginCustomer } from '../services/api.js'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.message // set by Register after sign-up

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)
    try {
      // On success the backend sets the HttpOnly cookie; the browser stores it.
      // We never see or touch the token in JavaScript.
      await loginCustomer(form)
      navigate('/home', { replace: true })
    } catch (err) {
      if (err.response?.status === 401) setError('Invalid Credentials')
      else setError(err.response?.data?.message || 'Could not reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h1>Welcome back</h1>
          <p className="subtitle">Log in to your ShopKart account</p>

          {successMessage && !error && <div className="alert alert-success">{successMessage}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="john@gmail.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Your password"
          />

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="switch">
            New to ShopKart? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </main>
    </>
  )
}

export default Login
