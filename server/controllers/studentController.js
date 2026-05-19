const User = require('../models/User')
const Course = require('../models/Course')
const Assignment = require('../models/Assignment')
const Quiz = require('../models/Quiz')
const Hackathon = require('../models/Hackathon')
const { Feedback, Complaint } = require('../models/Feedback')

// GET /student/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate('enrolledCourses')

    // Count enrolled, completed
    const enrolledCount = student.enrolledCourses.length

    // Assignments due
    const allAssignments = await Assignment.find({
      course: { $in: student.enrolledCourses.map(c => c._id) }
    })
    const pending = allAssignments.filter(a => {
      const sub = a.submissions.find(s => s.student.toString() === req.user._id.toString())
      return !sub
    })

    // Upcoming quizzes
    const upcomingQuizzes = await Quiz.find({
      course: { $in: student.enrolledCourses.map(c => c._id) },
      scheduledAt: { $gte: new Date() },
      status: { $ne: 'completed' }
    }).populate('course', 'title').limit(5)

    // Joined hackathons
    const joinedHackathons = await Hackathon.find({
      participants: req.user._id,
      status: { $in: ['open', 'active'] }
    }).limit(3)

    res.json({
      enrolledCount,
      completedCount: student.enrolledCourses.filter(c => c.progress >= 100).length || 0,
      pendingAssignments: pending.length,
      upcomingQuizzes: upcomingQuizzes.map(q => ({
        _id: q._id,
        title: q.title,
        course: q.course?.title,
        dueDate: q.scheduledAt,
        points: q.questions.length * 2,
      })),
      recentAssignments: allAssignments.slice(0, 4).map(a => {
        const sub = a.submissions.find(s => s.student.toString() === req.user._id.toString())
        return {
          _id: a._id, title: a.title, course: a.course?.toString(),
          status: sub ? sub.status : 'pending',
          dueDate: a.dueDate,
        }
      }),
      enrolledCourses: student.enrolledCourses.slice(0, 4).map(c => ({
        _id: c._id, title: c.title, progress: 0,
        instructor: '', category: c.category,
      })),
      joinedHackathons: joinedHackathons.map(h => ({
        _id: h._id, title: h.title, status: h.status, deadline: h.deadline,
      })),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /student/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'phone', 'profilePic']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
    res.json({ user })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// POST /student/courses/:id/enroll
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ message: 'Course not found' })

    // Check if already enrolled
    if (course.enrolledStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already enrolled' })
    }

    // If paid course, check payment (simplified — integrate Stripe for real)
    if (course.price > 0 && !req.user.isPremium) {
      return res.status(402).json({ message: 'Payment required', courseId: course._id, price: course.price })
    }

    await Course.findByIdAndUpdate(req.params.id, {
      $push: { enrolledStudents: req.user._id }
    })
    await User.findByIdAndUpdate(req.user._id, {
      $push: { enrolledCourses: req.params.id }
    })

    res.json({ message: 'Enrolled successfully' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// POST /student/assignments/:id/submit
exports.submitAssignment = async (req, res) => {
  try {
    const { hostingLink, description, screenshotUrl } = req.body
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' })

    // Remove existing submission if editing
    assignment.submissions = assignment.submissions.filter(
      s => s.student.toString() !== req.user._id.toString()
    )

    assignment.submissions.push({
      student: req.user._id,
      hostingLink: hostingLink || '',
      screenshotUrl: screenshotUrl || '',
      description,
      status: 'submitted',
    })

    await assignment.save()
    res.json({ message: 'Assignment submitted successfully' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// POST /student/feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { teacher, message, rating } = req.body
    await Feedback.create({ student: req.user._id, teacher, message, rating })
    res.json({ message: 'Feedback submitted' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// POST /student/complaint
exports.submitComplaint = async (req, res) => {
  try {
    const { teacher, reason, description } = req.body
    await Complaint.create({ student: req.user._id, teacher, reason, description })
    res.json({ message: 'Complaint submitted' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET /student/courses
exports.getCourses = async (req, res) => {
  try {
    const { category, search } = req.query
    const filter = { status: 'published' }
    if (category && category !== 'all') filter.category = category
    if (search) filter.title = { $regex: search, $options: 'i' }

    const courses = await Course.find(filter).populate('teacher', 'name').limit(50)
    const student = await User.findById(req.user._id)

    const result = courses.map(c => ({
      ...c.toJSON(),
      enrolled: student.enrolledCourses.includes(c._id),
    }))

    res.json({ courses: result })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /student/assignments
exports.getAssignments = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
    const assignments = await Assignment.find({
      course: { $in: student.enrolledCourses }
    }).populate('course', 'title')

    const result = assignments.map(a => {
      const sub = a.submissions.find(s => s.student.toString() === req.user._id.toString())
      return {
        _id: a._id, title: a.title, description: a.description,
        course: a.course?.title, dueDate: a.dueDate, points: a.points,
        status: sub ? sub.status : 'pending',
        submission: sub ? { hostingLink: sub.hostingLink, description: sub.description, screenshotUrl: sub.screenshotUrl } : null,
        teacherFeedback: sub?.teacherFeedback || '',
      }
    })

    res.json({ assignments: result })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /student/hackathons
exports.getHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find({}).limit(20)
    const result = hackathons.map(h => ({
      ...h.toJSON(),
      joined: h.participants.includes(req.user._id),
    }))
    res.json({ hackathons: result })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /student/hackathons/:id/join
exports.joinHackathon = async (req, res) => {
  try {
    const h = await Hackathon.findById(req.params.id)
    if (!h) return res.status(404).json({ message: 'Not found' })
    if (h.participants.includes(req.user._id)) return res.status(400).json({ message: 'Already joined' })

    await Hackathon.findByIdAndUpdate(req.params.id, { $push: { participants: req.user._id } })
    await User.findByIdAndUpdate(req.user._id, { $push: { joinedHackathons: req.params.id } })

    res.json({ message: 'Joined successfully' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
