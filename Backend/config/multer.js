const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

// Cover image storage
const coverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'leafbooks/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 600, height: 900, crop: 'fill' }],
  },
});

// Book file storage (PDF/ePub)
const bookStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'leafbooks/books',
    allowed_formats: ['pdf', 'epub'],
    resource_type: 'raw',
  },
});

const uploadCover = multer({ storage: coverStorage });
const uploadBook  = multer({ storage: bookStorage });

// Combined middleware: cover + book file in one request
const uploadBookFiles = multer({
  storage: multer.memoryStorage(),
}).fields([
  { name: 'cover', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 },
]);

module.exports = { uploadCover, uploadBook, uploadBookFiles };