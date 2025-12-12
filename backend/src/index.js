#!/usr/bin/env node
'use strict';

// ------------------------------------------------------------
// Imports
// ------------------------------------------------------------
const express = require('express');
const cors = require('cors');

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const transactionsRouter = require('./routes/transactions');
const eventsRouter = require('./routes/events');
const promotionsRouter = require('./routes/promotions');
const debuggingRouter = require('./routes/debugging');

const app = express();

// ------------------------------------------------------------
// CORS configuration (DEV + PROD SAFE)
// ------------------------------------------------------------
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow same-origin, curl, Postman, server-to-server
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // IMPORTANT: do NOT throw
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------
app.use(express.json());

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/transactions', transactionsRouter);
app.use('/events', eventsRouter);
app.use('/promotions', promotionsRouter);
app.use('/debugging', debuggingRouter);

// ------------------------------------------------------------
// Start server
// ------------------------------------------------------------
const port =
    process.env.PORT ??
    (process.argv[2] ? parseInt(process.argv[2], 10) : 8000);

if (Number.isNaN(port)) {
    console.error('Invalid port');
    process.exit(1);
}

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`Cannot start server: ${err.message}`);
    process.exit(1);
});
