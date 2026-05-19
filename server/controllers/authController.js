// controllers/authController.js
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, subject } = req.body

    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email already in use' })

    const allowedRoles = ['student', 'teacher']
    const userRole = allowedRoles.includes(role) ? role : 'student'

    const user = await User.create({ name, email, password, role: userRole, subject: subject || '' })
    const token = signToken(user._id)

    res.status(201).json({ token, user })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = signToken(user._id)
    res.json({ token, user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMe = async (req, res) => {
  res.json({ user: req.user })
}
