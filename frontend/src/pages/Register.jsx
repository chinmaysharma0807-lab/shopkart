import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { registerCustomer } from '../services/api.js'

const initialForm = { fullName: '', email: '', password: '', phone: '' }

// Client-side checks so the user gets feedback before hitting the API.
// The backend still validates everything again.
const validate = (form) => {
  const errors = {}
  if (!form.fullName.trim()) errors.fullName = 'Full name is required'
  if (!form.email.trim()) errors.email = 'Email is required'
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email'
  if (!form.password) errors.password = 'Password is required'
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters'
  if (!form.phone.trim()) errors.phone = 'Phone number is required'
  else if (!/^\d{10}$/.test(form.phone)) errors.phone = 'Enter a 10-digit phone number'
  return errors
}

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      await registerCustomer(form)
      navigate('/login', { state: { message: 'Account created! Please log in.' } })
    } catch (err) {
      // 409 = email taken, 400 = validation failed on the server
      setServerError(err.response?.data?.message || 'Could not reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h1>Create your account</h1>
          <p className="subtitle">Join ShopKart and start shopping</p>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className={errors.fullName ? 'invalid' : ''}
          />
          {errors.fullName && <p className="field-error">{errors.fullName}</p>}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="john@gmail.com"
            className={errors.email ? 'invalid' : ''}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            className={errors.password ? 'invalid' : ''}
          />
          {errors.password && <p className="field-error">{errors.password}</p>}

          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="9876543210"
            className={errors.phone ? 'invalid' : ''}
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </main>
    </>
  )
}

export default Register
