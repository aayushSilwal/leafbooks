const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth');
const { addReview, getReviews, deleteReview } = require('../Controllers/ReviewController');

router.post('/:bookId',   auth, addReview);
router.get('/:bookId',    auth, getReviews);
router.delete('/:bookId', auth, deleteReview);

module.exports = router;