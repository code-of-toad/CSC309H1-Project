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

// app.use(cors({
//     origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
//     credentials: true,
// }));
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
// ----------------------------------------------------------------------------
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
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});
