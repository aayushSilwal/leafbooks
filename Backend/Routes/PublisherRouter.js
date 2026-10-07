const express = require('express');
const router = express.Router();

const { becomePublisher, getMe } = require('../Controllers/publisherController');
const auth = require('../Middlewares/auth');

router.post('/become', auth, becomePublisher);
router.get('/me', auth, getMe);

module.exports = router;