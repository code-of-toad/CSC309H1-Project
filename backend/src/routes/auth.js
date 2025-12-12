// Imports
const express = require('express');
const { issueJwt } = require('../controllers/issue-jwt');
const { requestPasswordReset, resetPassword } = require('../controllers/reset-password');
const { authenticateJwt } = require('../middleware/authenticateJwt');
const { authorizeClearance } = require('../middleware/authorizeClearance');
const { getUserQrToken, verifyQrTokenEndpoint } = require('../controllers/qr-controller');

// Instantiate router object
const authRouter = express.Router();
// Define the routes
authRouter.post('/tokens', issueJwt);
authRouter.post('/resets', requestPasswordReset);
authRouter.post('/resets/:resetToken', resetPassword);

authRouter.get(
    '/qr/user',
    authenticateJwt,
    getUserQrToken
);
authRouter.post(
    '/qr/verify',
    authenticateJwt,
    authorizeClearance(['cashier', 'manager', 'superuser']),
    verifyQrTokenEndpoint
);

// Exports
module.exports = authRouter;
