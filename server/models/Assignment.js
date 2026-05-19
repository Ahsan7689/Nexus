// models/Assignment.js
const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostingLink: { type: String, default: '' },
  screenshotUrl: { type: String, default: '' },
  description: { type: String, required: true },
  status: { type: String, enum: ['submitted', 'approved', 'not_approved'], default: 'submitted' },
  teacherFeedback: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
})

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  points: { type: Number, default: 10 },
  submissions: [submissionSchema],
}, { timestamps: true })

module.exports = mongoose.model('Assignment', assignmentSchema)
