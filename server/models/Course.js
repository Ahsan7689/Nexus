// models/Course.js
const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String },
  duration: { type: String },
  order: { type: Number },
})

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  category: { type: String, enum: ['Development', 'Design', 'Business'], required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, default: 0 },
  lessons: [lessonSchema],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  thumbnail: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  tags: [String],
}, { timestamps: true })

module.exports = mongoose.model('Course', courseSchema)
