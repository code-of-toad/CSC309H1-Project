// Imports
const express = require('express');
const { authenticateJwt } = require('../middleware/authenticateJwt');
const { authorizeClearance } = require('../middleware/authorizeClearance');
const {
    createEvent,
    getEventsList,
    getEvent,
    updateEvent,
    deleteEvent,
    addOrganizerToEvent,
    removeOrganizerFromEvent,
    addGuestToEvent,
    removeGuestFromEvent,
    rsvpSelf,
    unRsvpSelf,
    createRewardTrx,
} = require('../controllers/events');

// Instantiate router object
const eventsRouter = express.Router();
// Define the routes
eventsRouter.post(
    '/:eventId/organizers',
    authenticateJwt,
    authorizeClearance(['manager', 'superuser']),
    addOrganizerToEvent,
);
eventsRouter.delete(
    '/:eventId/organizers/:userId',
    authenticateJwt,
    authorizeClearance(['manager', 'superuser']),
    removeOrganizerFromEvent,
);
eventsRouter.post('/:eventId/guests/me', authenticateJwt, authorizeClearance(['regular']), rsvpSelf);
eventsRouter.delete('/:eventId/guests/me', authenticateJwt, authorizeClearance(['regular']), unRsvpSelf);
eventsRouter.post(
    '/:eventId/guests',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    addGuestToEvent,
);
eventsRouter.delete(
    '/:eventId/guests/:userId',
    authenticateJwt,
    authorizeClearance(['manager', 'superuser']),
    removeGuestFromEvent,
);
eventsRouter.post(
    '/:eventId/transactions',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    createRewardTrx,
);
eventsRouter.post('/', authenticateJwt, authorizeClearance(['manager', 'superuser']), createEvent);
eventsRouter.get(
    '/',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    getEventsList,
);
eventsRouter.get(
    '/:eventId',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    getEvent,
);
eventsRouter.patch(
    '/:eventId',
    authenticateJwt,
    authorizeClearance(['regular', 'cashier', 'manager', 'superuser']),
    updateEvent,
);
eventsRouter.delete('/:eventId', authenticateJwt, authorizeClearance(['manager', 'superuser']), deleteEvent);

// Exports
module.exports = eventsRouter;
