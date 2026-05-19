const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  optA: String, optB: String, optC: String, optD: String,
  answer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
})

const quizResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: Number,
  answers: [String],
  completedAt: { type: Date, default: Date.now },
})

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [questionSchema],
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 20 }, // minutes
  results: [quizResultSchema],
  status: { type: String, enum: ['scheduled', 'active', 'completed'], default: 'scheduled' },
}, { timestamps: true })

module.exports = mongoose.model('Quiz', quizSchema)
