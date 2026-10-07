require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const AuthRouter = require('./Routes/AuthRouter');
const verifyEmailRoute = require('./Routes/verifyEmail');
const passwordRouter = require('./Routes/passwordRouter');
const publisherRouter = require('./Routes/PublisherRouter'); // ✅ add this
const userRouter = require('./Routes/UserRouter');
const reviewRouter = require('./Routes/ReviewRouter');
const adminRouter = require('./Routes/Adminrouter');
const giftLendRouter = require('./Routes/GiftLendRouter');
const paymentRouter = require('./Routes/PaymentRouter');


require('./Models/db');

const bookRouter = require('./Routes/BookRouter');


const PORT = process.env.PORT || 8080;

app.get('/ping', (req, res) => {
    res.send('PONG');
});

app.use(bodyParser.json());
app.use(cors());

app.use('/auth', AuthRouter);
app.use('/verify-email', verifyEmailRoute);
app.use('/password', passwordRouter);
app.use('/api/publisher', publisherRouter); // ✅ mount publisher routes
app.use('/api/books', bookRouter);


app.use('/api/reviews', reviewRouter);
app.use('/api/user', userRouter);

app.use('/api/admin', adminRouter);
app.use('/api/gifting', giftLendRouter);


app.use('/api/payment', paymentRouter);

app.listen(PORT, () => {
    console.log("server is running on ", PORT);
});
