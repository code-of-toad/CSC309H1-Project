// Imports
const express = require('express');
const { authenticateJwt } = require('../middleware/authenticateJwt');
const { authorizeClearance } = require('../middleware/authorizeClearance');
const { createPromo, getPromosList, getPromo, updatePromo, deletePromo } = require('../controllers/promotions');

// Instantiate router object
const promotionsRouter = express.Router();
// Define the routes
promotionsRouter.post('/', authenticateJwt, authorizeClearance(['manager', 'superuser']), createPromo);
promotionsRouter.get(
    '/',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    getPromosList,
);
promotionsRouter.get(
    '/:promotionId',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    getPromo,
);
promotionsRouter.patch('/:promotionId', authenticateJwt, authorizeClearance(['manager', 'superuser']), updatePromo);
promotionsRouter.delete('/:promotionId', authenticateJwt, authorizeClearance(['manager', 'superuser']), deletePromo);

// Exports
module.exports = promotionsRouter;
