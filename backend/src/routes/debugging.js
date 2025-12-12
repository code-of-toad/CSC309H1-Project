// Imports
const express = require('express');
const { authenticateJwt } = require('../middleware/authenticateJwt');
const { authorizeClearance } = require('../middleware/authorizeClearance');
const { issueJwtDebugging } = require('../controllers/issue-jwt');

// Instantiate router object
const debuggingRouter = express.Router();
// Define the routes
debuggingRouter.get(
    '/login',
    issueJwtDebugging,
    (_req, res) => {
        res.status(200).json({ message: 'Login successful :)' });
        return;
    },
);
debuggingRouter.get(
    '/regular',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    (_req, res) => {
        res.status(200).json({ message: 'OK: You are a Regular User.' });
        return;
    },
);
debuggingRouter.get(
    '/cashier',
    authenticateJwt,
    authorizeClearance(['cashier', 'manager', 'superuser']),
    (_req, res) => {
        res.status(200).json({ message: 'OK: You are a Cashier.' });
        return;
    },
);
debuggingRouter.get(
    '/manager',
    authenticateJwt,
    authorizeClearance(['manager', 'superuser']),
    (_req, res) => {
        res.status(200).json({ message: 'OK: You are a Manager.' });
        return;
    },
);
debuggingRouter.get(
    '/superuser',
    authenticateJwt,
    authorizeClearance(['superuser']),
    (_req, res) => {
        res.status(200).json({ message: 'OK: You are a Superuser.' });
        return;
    },
);

// Exports
module.exports = debuggingRouter;
