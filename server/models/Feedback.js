// models/Feedback.js
const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: String, required: true },
  teacherRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
}, { timestamps: true })

const complaintSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: String, required: true },
  teacherRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'under_review', 'resolved'], default: 'open' },
}, { timestamps: true })

module.exports = {
  Feedback: mongoose.model('Feedback', feedbackSchema),
  Complaint: mongoose.model('Complaint', complaintSchema),
}
