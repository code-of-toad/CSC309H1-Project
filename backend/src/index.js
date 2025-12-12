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
app.use(cors({
    origin: [
        'http://localhost:5173',
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
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
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(err);
    process.exit(1);
});
