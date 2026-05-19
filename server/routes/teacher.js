const express = require('express')
const router = express.Router()
const { protect, restrictTo } = require('../middleware/auth')
const ctrl = require('../controllers/teacherController')

router.use(protect, restrictTo('teacher'))

router.get('/dashboard', ctrl.getDashboard)

router.get('/courses', ctrl.getCourses)
router.post('/courses', ctrl.createCourse)
router.patch('/courses/:id', ctrl.updateCourse)
router.delete('/courses/:id', ctrl.deleteCourse)

router.get('/assignments', ctrl.getAssignments)
router.post('/assignments', ctrl.createAssignment)
router.patch('/assignments/:id/submissions/:subId/review', ctrl.reviewSubmission)

router.get('/quizzes', ctrl.getQuizzes)
router.post('/quizzes', ctrl.createQuiz)

router.get('/students', ctrl.getStudents)
router.get('/analytics', ctrl.getAnalytics)

module.exports = router
