const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { createCheckout, handleWebhook } = require('../controllers/paymentController')

// Stripe webhook needs raw body — must be registered before express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook)

router.post('/create-checkout', protect, createCheckout)

module.exports = router
