#!/usr/bin/env node
'use strict';

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
// CORS (WORKING IN DEV + RAILWAY)
// ------------------------------------------------------------
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
].filter(Boolean);

console.log('=== Server Starting ===');
console.log('CORS allowed origins:', allowedOrigins);
console.log('FRONTEND_URL env var:', process.env.FRONTEND_URL);
console.log('PORT env var:', process.env.PORT);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
        if (!origin) {
            return callback(null, true);
        }
        
        // Normalize origins (remove trailing slashes for comparison)
        const normalizedOrigin = origin.replace(/\/$/, '');
        const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
        
        if (normalizedAllowed.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            console.warn(`Normalized origin: ${normalizedOrigin}`);
            console.warn(`Allowed origins:`, allowedOrigins);
            console.warn(`Normalized allowed:`, normalizedAllowed);
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ------------------------------------------------------------
app.use(express.json());

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/transactions', transactionsRouter);
app.use('/events', eventsRouter);
app.use('/promotions', promotionsRouter);
app.use('/debugging', debuggingRouter);

// ------------------------------------------------------------
const port =
    process.env.PORT ??
    (process.argv[2] ? parseInt(process.argv[2], 10) : 8000);

const server = app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`✅ CORS configured for origins:`, allowedOrigins);
});

server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
