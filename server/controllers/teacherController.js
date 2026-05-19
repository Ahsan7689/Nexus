const User = require('../models/User')
const Course = require('../models/Course')
const Assignment = require('../models/Assignment')
const Quiz = require('../models/Quiz')
const { Feedback, Complaint } = require('../models/Feedback')

// GET /teacher/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id })
    const courseIds = courses.map(c => c._id)
    const totalStudents = courses.reduce((acc, c) => acc + c.enrolledStudents.length, 0)

    const assignments = await Assignment.find({ teacher: req.user._id })
    const pendingReview = assignments.reduce((acc, a) => {
      return acc + a.submissions.filter(s => s.status === 'submitted').length
    }, 0)

    const quizzes = await Quiz.find({ teacher: req.user._id, status: { $ne: 'completed' } }).limit(5)
    const recentFeedback = await Feedback.find({ teacherRef: req.user._id }).populate('student', 'name').limit(5)
    const complaints = await Complaint.find({ teacherRef: req.user._id, status: 'open' }).limit(5)

    res.json({
      stats: {
        totalStudents,
        activeCourses: courses.filter(c => c.status === 'published').length,
        pendingReview,
        avgCompletionRate: 74,
        totalRevenue: courses.reduce((acc, c) => acc + c.price * c.enrolledStudents.length, 0),
        newEnrollmentsToday: 0,
      },
      courses: courses.map(c => ({
        _id: c._id, title: c.title, category: c.category,
        students: c.enrolledStudents.length, status: c.status,
      })),
      upcomingQuizzes: quizzes.map(q => ({
        _id: q._id, title: q.title, scheduledAt: q.scheduledAt,
        students: 0,
      })),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /teacher/courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id }).sort({ createdAt: -1 })
    res.json({ courses })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /teacher/courses
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, price } = req.body
    const course = await Course.create({
      title, description, category,
      price: Number(price) || 0,
      teacher: req.user._id,
    })
    res.status(201).json({ course })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PATCH /teacher/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      req.body,
      { new: true }
    )
    if (!course) return res.status(404).json({ message: 'Course not found' })
    res.json({ course })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// DELETE /teacher/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    await Course.findOneAndDelete({ _id: req.params.id, teacher: req.user._id })
    res.json({ message: 'Course deleted' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET /teacher/assignments
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user._id })
      .populate('course', 'title')
      .sort({ createdAt: -1 })

    const result = assignments.map(a => ({
      _id: a._id, title: a.title, course: a.course?.title,
      dueDate: a.dueDate, points: a.points,
      submissionsCount: a.submissions.length,
      pendingCount: a.submissions.filter(s => s.status === 'submitted').length,
      submissions: a.submissions,
    }))

    res.json({ assignments: result })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /teacher/assignments
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, course, dueDate, points } = req.body
    const assignment = await Assignment.create({
      title, description, course, dueDate, points: Number(points) || 10,
      teacher: req.user._id,
    })
    res.status(201).json({ assignment })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PATCH /teacher/assignments/:id/submissions/:subId/review
exports.reviewSubmission = async (req, res) => {
  try {
    const { status, feedback } = req.body
    if (!['approved', 'not_approved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const assignment = await Assignment.findOne({ _id: req.params.id, teacher: req.user._id })
    if (!assignment) return res.status(404).json({ message: 'Not found' })

    const sub = assignment.submissions.id(req.params.subId)
    if (!sub) return res.status(404).json({ message: 'Submission not found' })

    sub.status = status
    sub.teacherFeedback = feedback || ''
    sub.updatedAt = new Date()

    await assignment.save()
    res.json({ message: `Submission ${status}` })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// POST /teacher/quizzes
exports.createQuiz = async (req, res) => {
  try {
    const { title, course, scheduledAt, duration, questions } = req.body
    const quiz = await Quiz.create({
      title, course, scheduledAt, duration,
      questions: questions || [],
      teacher: req.user._id,
    })
    res.status(201).json({ quiz })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET /teacher/quizzes
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ teacher: req.user._id }).populate('course', 'title').sort({ scheduledAt: -1 })
    res.json({ quizzes })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /teacher/students
exports.getStudents = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id })
    const studentIds = [...new Set(courses.flatMap(c => c.enrolledStudents.map(id => id.toString())))]
    const students = await User.find({ _id: { $in: studentIds } }).select('-password')

    res.json({ students })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /teacher/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id })
    const totalStudents = courses.reduce((acc, c) => acc + c.enrolledStudents.length, 0)
    const totalRevenue = courses.reduce((acc, c) => acc + c.price * c.enrolledStudents.length, 0)

    res.json({
      totalStudents,
      totalRevenue,
      courseCount: courses.length,
      avgRating: 4.8,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
