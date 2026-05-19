// models/Hackathon.js
const mongoose = require('mongoose')

const hackathonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['hackathon', 'competition', 'workshop'], default: 'hackathon' },
  description: { type: String },
  prize: { type: String },
  deadline: { type: Date, required: true },
  maxTeamSize: { type: Number, default: 4 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tracks: [String],
  status: { type: String, enum: ['open', 'active', 'ended'], default: 'open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('Hackathon', hackathonSchema)
