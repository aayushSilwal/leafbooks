# LeafBooks: Read & Share

A full-stack MERN platform for discovering, buying, and sharing digital books. Publishers upload and sell books, readers buy them with **eSewa**, build a personal library, and can **gift** or **lend** books to other users. An admin panel oversees users, publishers, orders, and revenue.


## Features

**Readers**
- Sign up with email verification (Nodemailer) or sign in with Google
- Browse a home feed (trending, free, newest) and a store with search, genre filter, sorting, and pagination
- Buy books through **eSewa**, with signature verification and a server-side cross-check of each payment
- Personal bookshelf and library, with reading history
- **Gift** a book to another user by email (the recipient accepts or declines, and ownership transfers on acceptance)
- **Lend** a book for 7 days, with automatic expiry and early return
- Rate and review books you own, with average ratings
- Update profile, change password, upload a profile picture, and delete the account (full data cleanup)

**Publishers**
- Apply to become a publisher; an admin approves or rejects the application
- Upload books (cover image and book file to Cloudinary), save as draft or publish, edit, and delete
- Dashboard with sales, earnings, top books, and genre breakdown

**Admin**
- Separate admin login
- Platform stats, user management (search, details, delete), publisher approvals
- Book, order, review, gift, and lend moderation
- Revenue analytics: monthly revenue and top-selling books

## Tech Stack

| Area | Tools |
|---|---|
| Frontend | React |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt, Google OAuth (`google-auth-library`) |
| Payments | eSewa ePay v2 (HMAC-SHA256 signed requests) |
| Storage | Cloudinary (covers, book files, avatars) |
| Email | Nodemailer |

## API Overview

| Prefix | Purpose |
|---|---|
| `/api/books` | Home feed, store, book details, bookshelf, library, reading history, publisher upload/edit/delete and stats |
| `/api/payment` | Initiate eSewa payment, verify callback, order history |
| `/api/gifting` | Send/respond to gifts, lend/return books, access check |
| `/api/reviews` | Add, list, and delete reviews |
| `/api/publisher` | Apply to become a publisher, current user with publisher profile |
| `/api/user` | Profile, password, avatar, account deletion |
| `/api/admin` | Admin login, stats, and moderation endpoints |

## Getting Started

```bash
git clone https://github.com/aayushSilwal/leafbooks.git
cd leafbooks
```

**Backend**
```bash
cd server            # adjust to your folder name
npm install
cp .env.example .env # then fill in your own values
npm start
```

**Frontend**
```bash
cd client            # adjust to your folder name
npm install
npm start
```

### Environment Variables

Create a `.env` in the backend folder. Never commit it.

```env
# Database
MONGO_URI=

# Auth
JWT_SECRET=
GOOGLE_CLIENT_ID=

# Admin
ADMIN_EMAIL=
ADMIN_PASSWORD=

# eSewa (use the test/sandbox values while developing)
ESEWA_MERCHANT_ID=
ESEWA_SECRET_KEY=
ESEWA_BASE_URL=
ESEWA_SUCCESS_URL=
ESEWA_FAILURE_URL=

# App
CLIENT_URL=

# Cloudinary and email: use the variable names from your config files
```

## Author

**Aayush Silwal**: [GitHub](https://github.com/aayushSilwal)
