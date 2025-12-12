#!/usr/bin/env node
'use strict';

// Imports
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const transactionsRouter = require('./routes/transactions');
const eventsRouter = require('./routes/events');
const promotionsRouter = require('./routes/promotions');
const debuggingRouter = require('./routes/debugging');
const cors = require('cors');
const express = require('express');
const app = express();

// CORS configuration: allow both local development and production origins
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:5173', // Local development
];

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (uniqueOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
// Middleware
app.use(express.json());
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/transactions', transactionsRouter);
app.use('/events', eventsRouter);
app.use('/promotions', promotionsRouter);
app.use('/debugging', debuggingRouter);

// ----------------------------------------------------------------------------
// Start server
const port = process.env.PORT || (() => {
    // Fallback for local development: check command-line argument
    const args = process.argv;
    if (args.length === 3) {
        const num = parseInt(args[2], 10);
        if (!isNaN(num)) {
            return num;
        }
    }
    // Default port if neither env var nor arg provided
    return 8000;
})();

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});
