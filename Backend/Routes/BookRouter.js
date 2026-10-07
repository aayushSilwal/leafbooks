const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth');
const { uploadBookFiles } = require('../config/multer');
const {
  uploadBook,
  getMyBooks,
  getHomeBooks,
  getBookById,
  getBookshelf,
  addToBookshelf,
  removeFromBookshelf,
  getStoreBooks,
  purchaseBook,
  getOwnedBooks,
  getLibrary,
  logReadingHistory,
  toggleBookStatus,
  deleteBook,
  getBookForEdit,
  updateBook,
  getPublisherStats,
} = require('../Controllers/bookController');

router.post('/upload',              auth, uploadBookFiles, uploadBook);
router.get('/my-books',             auth, getMyBooks);
router.get('/publisher-stats',        auth, getPublisherStats);
router.get('/home',                 auth, getHomeBooks);
router.get('/store',                auth, getStoreBooks);
router.get('/library',              auth, getLibrary);
router.get('/bookshelf',            auth, getBookshelf);
router.get('/owned',                auth, getOwnedBooks);
router.post('/bookshelf/add',       auth, addToBookshelf);
router.delete('/bookshelf/remove',  auth, removeFromBookshelf);
router.post('/purchase',            auth, purchaseBook);
router.post('/reading-history',     auth, logReadingHistory);
router.get('/:id/edit',             auth, getBookForEdit);
router.put('/:id',                  auth, uploadBookFiles, updateBook);
router.get('/:id',                  auth, getBookById);
router.patch('/:id/status',         auth, toggleBookStatus);
router.delete('/:id',               auth, deleteBook);

module.exports = router;