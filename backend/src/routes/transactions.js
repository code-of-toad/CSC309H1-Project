// Imports
const express = require('express');
const { authenticateJwt } = require('../middleware/authenticateJwt');
const { authorizeClearance } = require('../middleware/authorizeClearance');
const { createPurchaseTrx, getTrxsList, getTrx, setTrxSus, processRedemption } = require('../controllers/transactions');

// Instantiate router object
const transactionsRouter = express.Router();
// Define the routes
transactionsRouter.post(
    '/',
    authenticateJwt,
    authorizeClearance(['cashier', 'manager', 'superuser']),
    createPurchaseTrx,
);
transactionsRouter.get('/', authenticateJwt, authorizeClearance(['manager', 'superuser']), getTrxsList);
transactionsRouter.patch(
    '/:transactionId/suspicious',
    authenticateJwt,
    authorizeClearance(['manager', 'superuser']),
    setTrxSus,
);
transactionsRouter.patch(
    '/:transactionId/processed',
    authenticateJwt,
    authorizeClearance(['cashier', 'manager', 'superuser']),
    processRedemption,
);
transactionsRouter.get('/:transactionId', authenticateJwt, authorizeClearance(['manager', 'superuser']), getTrx);

// Exports
module.exports = transactionsRouter;
