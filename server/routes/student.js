const express = require('express')
const router = express.Router()
const { protect, restrictTo } = require('../middleware/auth')
const { uploadAvatar, uploadScreenshot } = require('../middleware/upload')
const ctrl = require('../controllers/studentController')

router.use(protect, restrictTo('student'))

router.get('/dashboard', ctrl.getDashboard)
router.patch('/profile', ctrl.updateProfile)
router.patch('/profile/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const User = require('../models/User')
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: req.file.path },
      { new: true }
    )
    res.json({ user })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/courses', ctrl.getCourses)
router.post('/courses/:id/enroll', ctrl.enrollCourse)

router.get('/assignments', ctrl.getAssignments)
router.post('/assignments/:id/submit', ctrl.submitAssignment)

router.get('/hackathons', ctrl.getHackathons)
router.post('/hackathons/:id/join', ctrl.joinHackathon)

router.post('/feedback', ctrl.submitFeedback)
router.post('/complaint', ctrl.submitComplaint)

module.exports = router
