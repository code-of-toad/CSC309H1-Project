// Imports
const express = require('express');
// const { multerUpload, multerErrorHandler } = require('../middleware/multer');
const { authenticateJwt } = require('../middleware/authenticateJwt');
const { authorizeClearance } = require('../middleware/authorizeClearance');
const {
    registerUser,
    getUsersList,
    getUser,
    updateUser,
    updateCurrUser,
    getCurrUser,
    updateCurrUserPassword,
    createTransferTrx,
    createRedemptionTrx,
    getUserTrxs,
} = require('../controllers/users');

// Instantiate router object
const usersRouter = express.Router();
// Define the routes
usersRouter.post('/', authenticateJwt, authorizeClearance(['cashier', 'manager', 'superuser']), registerUser);
usersRouter.get('/', authenticateJwt, authorizeClearance(['manager', 'superuser']), getUsersList);
usersRouter.patch(
    '/me',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    updateCurrUser,
);
usersRouter.get(
    '/me',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    getCurrUser,
);
usersRouter.patch(
    '/me/password',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    updateCurrUserPassword,
);
usersRouter.post(
    '/me/transactions',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    createRedemptionTrx,
);
usersRouter.get(
    '/me/transactions',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    getUserTrxs,
);
usersRouter.get('/:userId', authenticateJwt, authorizeClearance(['cashier', 'manager', 'superuser']), getUser);
usersRouter.patch('/:userId', authenticateJwt, authorizeClearance(['manager', 'superuser']), updateUser);
usersRouter.post(
    '/:userId/transactions',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    createTransferTrx,
);

// Exports
module.exports = usersRouter;
