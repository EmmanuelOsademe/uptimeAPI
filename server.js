// Dependencies
'use strict';

require('dotenv').config();
require('express-async-errors');

// Supporting Features
const processor = require('./checks-processor');
const cli = require('./cli');

// Additional Security Packages
const helmet = require('helmet');
const cors = require('cors');
const xssClean = require('xss-clean');

// App
const express = require('express');
const app = express();


// DB connection file
const connectDB = require('./db/connect');

// Routers
const authRouter = require('./routes/auth');
const checksRouter = require('./routes/checks');
const usersRouter = require('./routes/user');

// Import Middlewares
const errorHandlerMiddleware = require('./middlewares/errorHandler');
const authenticateUser = require('./middlewares/authentication');
const {limitUserRequests, customRateLimiter} = require('./middlewares/rateLimiter'); // RateLimiter to curtail 'too many' request

// Middlewares
app.use(express.json())
app.use(helmet());
app.use(cors());
app.use(xssClean());

app.set('trust proxy', 1);
app.use(limitUserRequests);


// Routes
app.get('/', (req, res) =>{
    res.status(200).send('Uptime API');
});
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', authenticateUser, usersRouter);
app.use('/api/v1/checks', authenticateUser, checksRouter);

// Error-handler middlewares
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

// App Initialisation
app.init = async () =>{
    try {
        await connectDB(process.env.MONGO_URI);

        app.listen(port, () =>{
            try {
                console.log(`App is listening on Port: ${port}...`);
            } catch (error) {
                console.log(error);
            }
        })
        cli.init();
        processor.init();
    } catch (error) {
        console.log(error);
    }
};

app.init();
module.exports = app;
