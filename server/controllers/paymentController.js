const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Course = require('../models/Course')
const User = require('../models/User')

// POST /payment/create-checkout
exports.createCheckout = async (req, res) => {
  try {
    const { courseId } = req.body
    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ message: 'Course not found' })
    if (course.price === 0) return res.status(400).json({ message: 'Course is free' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'pkr',
          product_data: {
            name: course.title,
            description: `Enroll in ${course.title} on NEXUS LMS`,
          },
          unit_amount: course.price * 100,
        },
        quantity: 1,
      }],
      metadata: {
        courseId: course._id.toString(),
        studentId: req.user._id.toString(),
      },
      success_url: `${process.env.CLIENT_URL}/student/courses?enrolled=${courseId}`,
      cancel_url: `${process.env.CLIENT_URL}/student/courses`,
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /payment/webhook  (raw body needed)
exports.handleWebhook = async (req, res) => {
  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    return res.status(400).send('Webhook Error')
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { courseId, studentId } = session.metadata

    // Enroll student
    await Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: studentId } })
    await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: courseId } })
  }

  res.json({ received: true })
}
