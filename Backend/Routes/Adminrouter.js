const express = require('express');
const router = express.Router();
const adminAuth = require('../Middlewares/AdminMiddleware'); 
const ctrl = require('../Controllers/AdminController');

router.post('/login', ctrl.adminLogin);

// All routes below require admin JWT
router.use(adminAuth);

router.get('/stats',               ctrl.getAdminStats);

router.get('/users',               ctrl.getUsers);
router.get('/users/:id/detail',    ctrl.getUserDetail);
router.delete('/users/:id',        ctrl.deleteUser);

router.get('/publishers',          ctrl.getPublishers);
router.patch('/publishers/:id/approve', ctrl.approvePublisher);

router.get('/books',               ctrl.getBooks);
router.delete('/books/:id',        ctrl.adminDeleteBook);

router.get('/orders',              ctrl.getOrders);
router.get('/revenue',             ctrl.getRevenue);

router.get('/reviews',             ctrl.getReviews);
router.delete('/reviews/:id',      ctrl.deleteReview);

router.get('/lends',               ctrl.getLends);
router.get('/gifts',               ctrl.getGifts);

module.exports = router;