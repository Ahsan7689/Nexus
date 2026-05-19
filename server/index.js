require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const app = express()

// ── Security & middleware ───────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://nimra-project.netlify.app',
  ],
  credentials: true,
}))
app.use(morgan('dev'))

// Stripe webhook MUST come before express.json()
const paymentRoutes = require('./routes/payment')
app.use('/api/payment', paymentRoutes)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
})
app.use('/api', limiter)

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'))
app.use('/api/student', require('./routes/student'))
app.use('/api/teacher', require('./routes/teacher'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }))

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

// ── Database Connection ───────────────────────────────────────────
// ⚠️ Vercel ke liye listen() hata diya — module.exports se kaam chalta hai
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => console.error('❌  MongoDB connection error:', err.message))

// ── Local development ke liye ─────────────────────────────────────
const PORT = process.env.PORT || 5000
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`))
}

// ⬅️ YE ZAROORI HAI — Vercel is line se app ko pick karta hai
module.exports = app
