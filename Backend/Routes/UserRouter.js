const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth');
const multer = require('multer');
const { getProfile, updateProfile, changePassword, updateProfilePicture, deleteAccount } = require('../Controllers/UserController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/profile',          auth, getProfile);
router.put('/profile',          auth, updateProfile);
router.put('/change-password',  auth, changePassword);
router.put('/profile-picture',  auth, upload.single('picture'), updateProfilePicture);
router.delete('/account',       auth, deleteAccount);

module.exports = router;