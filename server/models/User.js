// models/User.js
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  profilePic: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  subject: { type: String, default: '' }, // for teachers
  isPremium: { type: Boolean, default: false },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  joinedHackathons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' }],
  joinedPrograms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }],
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
