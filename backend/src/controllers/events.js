const { z } = require('zod');
const { UserService } = require('../services/users');
const { TransactionService } = require('../services/transactions');
const { EventService } = require('../services/events');

async function createEvent(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                name: z.string({ required_error: 'name is required' }).min(1, 'name cannot be empty'),
                description: z
                    .string({ required_error: 'description is required' })
                    .min(1, 'description cannot be empty'),
                location: z.string({ required_error: 'location is required' }).min(1, 'location cannot be empty'),
                startTime: z.string({ required_error: 'startTime is required' }).refine((v) => !isNaN(Date.parse(v)), {
                    message: `startTime must be in ISO 8601 format`,
                }),
                endTime: z.string({ required_error: 'endTime is required' }).refine((v) => !isNaN(Date.parse(v)), {
                    message: `endTime must be in ISO 8601 format`,
                }),
                capacity: z
                    .number()
                    .int('capacity must be an integer')
                    .positive('capacity must be a positive number')
                    .nullable()
                    .optional(),
                points: z
                    .number({ required_error: 'points is required' })
                    .int('points must be an integer')
                    .positive('points must be a positive integer'),
            })
            .strict()
            .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
                message: 'endTime must be after startTime',
                path: ['endTime'],
            });
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { name, description, location, startTime, endTime, capacity, points } = result.data;
        // console.log(result.data); // DEBUGGGGGGGGGGGG
        // --------------------------------------------------------------------
        // If another event with the same name exits, send 400 Bad Request
        const eventExists = await EventService.getEvent(name);
        if (eventExists) {
            res.status(400).json({ error: `Event with name "${eventExists.name}" already exists` });
        }
        // Create a new event
        const newEvent = await EventService.createEvent({
            name,
            description,
            location,
            startTime,
            endTime,
            capacity: capacity ?? null,
            pointsRemain: points,
        });
        // Send
        res.status(201).json({
            id: newEvent.id,
            name: newEvent.name,
            description: newEvent.description,
            location: newEvent.location,
            startTime: newEvent.startTime,
            endTime: newEvent.endTime,
            capacity: newEvent.capacity,
            pointsRemain: newEvent.pointsRemain,
            pointsAwarded: newEvent.pointsAwarded,
            published: newEvent.published,
            organizers: newEvent.organizers,
            guests: newEvent.guests,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function getEventsList(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate query parameters
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                name: z.string().min(1).optional(),
                location: z.string().min(1).optional(),
                started: z.preprocess((v) => (v === undefined ? undefined : v === 'true'), z.boolean().optional()),
                ended: z.preprocess((v) => (v === undefined ? undefined : v === 'true'), z.boolean().optional()),
                showFull: z.preprocess((v) => (v === undefined ? false : v === 'true'), z.boolean()).default(false),
                published: z.preprocess((v) => (v === undefined ? undefined : v === 'true'), z.boolean().optional()),
                page: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().positive()).default(1),
                limit: z.preprocess((v) => (v === undefined ? 10 : Number(v)), z.number().int().positive()).default(10),
            })
            .strict();
        const result = validSchema.safeParse(req.query);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { name, location, started, ended, showFull, published, page, limit } = result.data;
        // --------------------------------------------------------------------
        // If both started and ended are specified, send 400 Bad Request
        if (started !== undefined && ended !== undefined) {
            res.status(400).json({ error: 'Cannot specify both started and ended' });
            return;
        }
        // Pagination logic
        const skip = (page - 1) * limit;
        const take = limit;
        // Filtering logic
        const now = new Date();
        const where = {};
        if (name) where.name = { contains: name };
        if (location) where.location = { contains: location };
        if (started !== undefined) where.startTime = started ? { lte: now } : { gt: now };
        if (ended !== undefined) where.endTime = ended ? { lte: now } : { gt: now };
        if (showFull === false) where.onlyNotFull = true;
        if (req.user.role === 'regular') {
            where.published = true;
        } else if (published !== undefined) {
            where.published = published;
        }
        // Get events by filter
        const [count, events] = await Promise.all([
            EventService.getCountByFilter(where),
            EventService.getEventsByFilter(where, skip, take),
        ]);
        // Build payload
        const results = events.map((e) => {
            const base = {
                id: e.id,
                name: e.name,
                location: e.location,
                startTime: e.startTime.toISOString(),
                endTime: e.endTime.toISOString(),
                capacity: e.capacity,
                numGuests: e.guests?.length ?? 0,
            };
            if (req.user.role !== 'regular') {
                base.pointsRemain = e.pointsRemain;
                base.pointsAwarded = e.pointsAwarded;
                base.published = e.published;
            }
            return base;
        });
        // Send
        res.status(200).json({ count, results });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

// async function getEvent(req, res) {
//     try {
//         // --------------------------------------------------------------------
//         // Validate route parameter
//         // --------------------------------------------------------------------
//         const { eventId } = req.params;
//         if (!/^\d+$/.test(eventId)) {
//             res.status(404).json({ error: 'Page not found' });
//             return;
//         }
//         // --------------------------------------------------------------------
//         // Fetch target event
//         const event = await EventService.getEvent(null, parseInt(eventId));
//         // If event doesn't exist, send 404 Not Found
//         if (!event) {
//             res.status(404).json({ error: `Event ID=${eventId} not found` });
//             return;
//         }
//         // Build payload
//         const payload = {
//             id: event.id,
//             name: event.name,
//             description: event.description,
//             location: event.location,
//             startTime: event.startTime,
//             endTime: event.endTime,
//             capacity: event.capacity,
//             organizers: event.organizers,
//         };
//         const isOrganizer = event.organizers.some((o) => o.id === req.user.id);
//         // If user is regular/cashier AND not_organizer...
//         if (['regular', 'cashier'].includes(req.user.role) && !isOrganizer) {
//             // If a regular/cashier user is trying to get an unpublished event,
//             // send 404 Not Found
//             if (event.published === false) {
//                 res.status(404).json({ error: `Event ID=${eventId} not found` });
//                 return;
//             }
//             payload.numGuests = event.numGuests;
//             // If user is manager/superuser/organizer...
//         } else {
//             payload.pointsRemain = event.pointsRemain;
//             payload.pointsAwarded = event.pointsAwarded;
//             payload.guests = event.guests;
//             payload.published = event.published;
//         }
//         // Send
//         res.status(200).json(payload);
//         return;
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal server error' });
//         return;
//     }
// }

async function getEvent(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId } = req.params;
        if (!/^\d+$/.test(eventId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }

        // --------------------------------------------------------------------
        // Fetch target event
        const event = await EventService.getEvent(null, parseInt(eventId));

        if (!event) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }

        const payload = {
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            capacity: event.capacity,
            organizers: event.organizers
        };

        const isOrganizer = event.organizers.some(o => o.id === req.user.id);
        const isGuest = event.guests.some(g => g.id === req.user.id);

        // --------------------------------------------------------------------
        // Regular / Cashier view
        // --------------------------------------------------------------------
        if (['regular', 'cashier'].includes(req.user.role) && !isOrganizer) {

            // Cannot see unpublished events
            if (!event.published) {
                res.status(404).json({ error: `Event ID=${eventId} not found` });
                return;
            }

            payload.numGuests = event.numGuests;
            payload.isGuest = isGuest;      // ⭐ NEW FIELD
        }

        // --------------------------------------------------------------------
        // Manager / Superuser / Organizer view
        // --------------------------------------------------------------------
        else {
            payload.pointsRemain = event.pointsRemain;
            payload.pointsAwarded = event.pointsAwarded;
            payload.guests = event.guests;
            payload.published = event.published;
        }

        res.status(200).json(payload);
        return;

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}


async function updateEvent(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId } = req.params;
        if (!/^\d+$/.test(eventId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                name: z.string().min(1, 'name cannot be empty').nullable().optional(),
                description: z.string().min(1, 'description cannot be empty').nullable().optional(),
                location: z.string().min(1, 'location cannot be empty').nullable().optional(),
                startTime: z
                    .string()
                    .refine((v) => !isNaN(Date.parse(v)), {
                        message: 'startTime must be in ISO 8601 format',
                    })
                    .nullable()
                    .optional(),
                endTime: z
                    .string({ required_error: 'endTime is required' })
                    .refine((v) => !isNaN(Date.parse(v)), {
                        message: 'endTime must be in ISO 8601 format',
                    })
                    .nullable()
                    .optional(),
                capacity: z
                    .number()
                    .int('capacity must be an integer')
                    .positive('capacity must be a positive number')
                    .nullable()
                    .optional(),
                points: z
                    .preprocess(
                        (v) => (v === null || v === undefined ? undefined : Number(v)),
                        z.number().int().positive('points must be a positive integer'),
                    )
                    .nullable()
                    .optional(),
                // points: z
                //     .number({ required_error: 'points is required' })
                //     .int('points must be an integer')
                //     .positive('points must be a positive integer')
                //     .optional(),
                published: z
                    .literal(true, { errorMap: () => ({ message: 'published can only be true' }) })
                    .nullable()
                    .optional(),
            })
            .strict()
            .refine((data) => !(data.startTime && data.endTime) || new Date(data.endTime) > new Date(data.startTime), {
                message: 'endTime must be after startTime',
                path: ['endTime'],
            });
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            console.log(result);
            console.log();
            console.log(result.data);
            res.status(400).json({ error: message });
            return;
        }
        const { name, description, location, startTime, endTime, capacity, points, published } = result.data;
        // --------------------------------------------------------------------
        // Fetch event
        const event = await EventService.getEvent(null, parseInt(eventId));
        // If event doesn't exist, send 404 Not Found
        if (!event) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        const isOrganizer = event.organizers.some((o) => o.id === req.user.id);
        if (['regular', 'cashier'].includes(req.user.role)) {
            // If user is regular/cashier AND not_organizer, send 403 Forbidden
            if (!isOrganizer) {
                res.status(403).json({ error: `Access denied` });
                return;
            }
            // If a non-manager user tries to set points or published,
            // send 403 Forbidden
            if (points !== undefined || published !== undefined) {
                res.status(403).json({ error: `Only managers can modify points or published fields` });
                return;
            }
        }
        const now = new Date();
        // If startTime is in the past, send 400 Bad Request
        if (startTime !== undefined && startTime !== null && new Date(startTime) < now) {
            res.status(400).json({ error: 'Cannot set an event to start in the past' });
            return;
        }
        // If endTime is in the past, send 400 Bad Request
        if (endTime !== undefined && endTime !== null && new Date(endTime) < now) {
            res.status(400).json({ error: 'Cannot set an event to end in the past' });
            return;
        }
        // If capacity is reduced to less than confirmed guests, send 400 Bad Request
        if (capacity !== undefined && capacity !== null && capacity < event.numGuests) {
            res.status(400).json({ error: `Event capacity must be greater than or equal to ${event.numGuests}` });
            return;
        }
        // If the total amount of points is reduced and results in the remaining
        // points allocated to the event falling below zero, send 400 Bad Request
        if (points !== undefined && points !== null && Number(points) < event.pointsAwarded) {
            res.status(400).json({ error: 'Points cannot be reduced below already awarded amount' });
            return;
        }
        // If update(s) to name, description, location, startTime, or capacity
        // is made after the original start time has passed, send 400 Bad Request
        if (event.startTime < now) {
            if (name !== undefined && name !== null) {
                res.status(400).json({ error: 'Event has already begun: Cannot change name' });
                return;
            }
            if (description !== undefined && description !== null) {
                res.status(400).json({ error: 'Event has already begun: Cannot change description' });
                return;
            }
            if (location !== undefined && location !== null) {
                res.status(400).json({ error: 'Event has already begun: Cannot change location' });
                return;
            }
            if (startTime !== undefined && startTime !== null) {
                res.status(400).json({ error: 'Event has already begun: Cannot change startTime' });
                return;
            }
            if (capacity !== undefined && capacity !== null) {
                res.status(400).json({ error: 'Event has already begun: Cannot change capacity' });
                return;
            }
        }
        // If update to endTime is made after the original end time has passed,
        // send 400 Bad Request
        if (event.endTime < now) {
            res.status(400).json({ error: 'Event has already ended: Cannot change endTime' });
            return;
        }
        // Update event
        const data = {};
        if (name !== undefined && name !== null) data.name = name;
        if (description !== undefined && description !== null) data.description = description;
        if (location !== undefined && location !== null) data.location = location;
        if (startTime !== undefined && startTime !== null) data.startTime = startTime;
        if (endTime !== undefined && endTime !== null) data.endTime = endTime;
        if (capacity !== undefined && capacity !== null) data.capacity = capacity;
        if (points !== undefined && points !== null) data.pointsRemain = points;
        if (published !== undefined && published !== null) data.published = published;
        const updatedEvent = await EventService.updateEvent(event.id, data);
        // Send
        res.status(200).json({
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            ...data,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function deleteEvent(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId } = req.params;
        if (!/^\d+$/.test(eventId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Fetch event
        const event = await EventService.getEvent(null, parseInt(eventId));
        // If event doesn't exist, send 404 Not Found
        if (!event) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        // If the event has been published, send 400 Bad Request
        if (event.published) {
            res.status(400).json({ error: 'Cannot delete a published event' });
            return;
        }
        // Delete event
        await EventService.deleteEvent(parseInt(eventId));
        res.status(204).send();
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function addOrganizerToEvent(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId } = req.params;
        if (!/^\d+$/.test(eventId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                utorid: z.string().min(7, 'utorid must be 7-8 characters').max(8, 'utorid must be 7-8 characters'),
            })
            .strict(); // Reject extra fields
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { utorid } = result.data;
        const user = await UserService.getUser(utorid);
        // If user with utorid doesn't exist, send 404 Not Found
        if (!user) {
            res.status(404).json({ error: `User with utorid=${utorid} not found` });
            return;
        }
        // --------------------------------------------------------------------
        // Fetch event
        const event = await EventService.getEvent(null, parseInt(eventId));
        // If event doesn't exist, send 404 Not Found
        if (!event) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        // If the user is already a guest, send 400 Bad Request
        const guests = event.guests;
        const isGuest = guests.some((g) => g.utorid === utorid);
        if (isGuest) {
            res.status(400).json({ error: `A guest (utorid=${utorid}) cannot be an organizer` });
            return;
        }
        // If the user is already an organizer, send 400 Bad Request
        const organizers = event.organizers;
        const isOrganizer = organizers.some((o) => o.utorid === utorid);
        if (isOrganizer) {
            res.status(400).json({ error: `User (utorid=${utorid}) is already an organizer` });
            return;
        }
        // If event has ended, send 410 Gone
        if (new Date(event.endTime) < new Date()) {
            res.status(410).json({ error: `Event ID=${eventId} has already ended` });
            return;
        }
        // Add user to the list of event organizers
        const updatedEvent = await EventService.addOrganizerToEvent(parseInt(eventId), utorid);
        // Send
        res.status(201).json({
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            organizers: updatedEvent.organizers,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function removeOrganizerFromEvent(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId, userId } = req.params;
        if (!/^\d+$/.test(eventId) || !/^\d+$/.test(userId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // If event doesn't exist, send 404 Not Found
        const event = await EventService.getEvent(null, parseInt(eventId));
        if (!event) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        // If user doesn't exist, send 404 Not Found
        const user = await UserService.getUser(null, parseInt(userId));
        if (!user) {
            res.status(404).json({ error: `User ID=${userId} not found` });
            return;
        }
        // If user is not an organizer already, send 400 Bad Request
        const isOrganizer = event.organizers.some((o) => o.id === user.id);
        if (!isOrganizer) {
            res.status(400).json({ error: `User ID=${userId} is not an organizer for event ID=${eventId}` });
            return;
        }
        // Remove the organizer from event
        await EventService.updateEvent(event.id, {
            organizers: {
                disconnect: { id: user.id },
            },
        });
        // Send
        res.status(204).send();
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function addGuestToEvent(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId } = req.params;
        if (!/^\d+$/.test(eventId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                utorid: z.string().min(7, 'utorid must be 7-8 characters').max(8, 'utorid must be 7-8 characters'),
            })
            .strict(); // Reject extra fields
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { utorid } = result.data;
        // --------------------------------------------------------------------
        // If user doesn't exist, send 404 Not Found
        const user = await UserService.getUser(utorid);
        if (!user) {
            res.status(404).json({ error: `User with utorid=${utorid} not found` });
            return;
        }
        // If event doesn't exist, send 404 Not Found
        const event = await EventService.getEvent(null, parseInt(eventId));
        if (!event) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        // Clearance check: 403 Forbidden
        const reqIsManager = ['manager', 'superuser'].includes(req.user.role);
        const reqIsOrganizer = event.organizers.some((o) => o.utorid === req.user.utorid);
        if (!reqIsManager && !reqIsOrganizer) {
            res.status(403).json({ error: 'Forbidden: Insufficient clearance' });
            return;
        }
        // If event is not visible to the organizer yet, send 404 Not Found
        if (!reqIsManager && reqIsOrganizer && !event.published) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        // If user is already an organizer, send 400 Bad Request
        const isOrganizer = event.organizers.some((o) => o.utorid === user.utorid);
        if (isOrganizer) {
            res.status(400).json({
                error: `User (utorid=${user.utorid}) is already an organizer of event ID=${eventId}`,
            });
            return;
        }
        // If user is already a guest, send 400 Bad Request
        const isGuest = event.guests.some((g) => g.id === user.id);
        if (isGuest) {
            res.status(400).json({ error: `User (utorid=${user.utorid}) is already a guest for event ID=${eventId}` });
            return;
        }
        // If event is full, send 410 Gone
        if (event.capacity !== null && event.capacity <= event.numGuests) {
            res.status(410).json({ error: `Event ID=${eventId} is already full` });
            return;
        }
        // If event has ended, send 410 Gone
        if (new Date(event.endTime) < new Date()) {
            res.status(410).json({ error: `Event ID=${eventId} has already ended` });
            return;
        }
        // Add guest to event
        await EventService.incrementNumGuests(event.id, 1);
        const updatedEvent = await EventService.addGuestToEvent(event.id, user.utorid);
        // Send
        res.status(201).json({
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            guestAdded: updatedEvent.guests[0],
            numGuests: updatedEvent.numGuests,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function removeGuestFromEvent(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId, userId } = req.params;
        if (!/^\d+$/.test(eventId) || !/^\d+$/.test(userId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // If event doesn't exist, send 404 Not Found
        const event = await EventService.getEvent(null, parseInt(eventId));
        if (!event) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        // Clearance check: 403 Forbidden
        const reqIsOrganizer = event.organizers.some((o) => o.id === req.user.id);
        if (reqIsOrganizer) {
            res.status(403).json({ error: 'Only a non-organizer manager can remove guests from an event' });
            return;
        }
        // If user doesn't exist, send 404 Not Found
        const user = await UserService.getUser(null, parseInt(userId));
        if (!user) {
            res.status(404).json({ error: `User ID=${userId} not found` });
            return;
        }
        // If user is not a guest already, send 400 Bad Request
        const isGuest = event.guests.some((g) => g.id === user.id);
        if (!isGuest) {
            res.status(400).json({ error: `User ID=${userId} is not a guest for event ID=${eventId}` });
            return;
        }
        // Remove guest from event
        await EventService.updateEvent(event.id, {
            guests: {
                disconnect: { id: user.id },
            },
        });
        res.status(204).send();
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function rsvpSelf(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId } = req.params;
        if (!/^\d+$/.test(eventId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        const user = req.user;
        // If event doesn't exist, send 404 Not Found
        const event = await EventService.getEvent(null, parseInt(eventId));
        if (!event || !event.published) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        // If user is already a guest, send 400 Bad Request
        const guestList = event.guests;
        if (guestList.some((g) => g.utorid === user.utorid)) {
            res.status(400).json({ error: `Already a guest for event ID=${eventId}` });
            return;
        }
        // If user is already an organizer, send 400 Bad Request
        const organizers = event.organizers;
        if (organizers.some((o) => o.utorid === user.utorid)) {
            res.status(400).json({
                error: `Already an organizer for event ID=${eventId}`,
            });
            return;
        }
        // If event is full, send 410 Gone
        if (event.capacity !== null && event.capacity <= event.numGuests) {
            res.status(410).json({ error: `Event ID=${eventId} is already full` });
            return;
        }
        // If event has ended, send 410 Gone
        if (new Date(event.endTime) < new Date()) {
            res.status(410).json({ error: `Event ID=${eventId} has already ended` });
            return;
        }
        // Add self as a guest to event
        await EventService.incrementNumGuests(event.id, 1);
        const updatedEvent = await EventService.addGuestToEvent(event.id, user.utorid);
        // Send
        res.status(201).json({
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            guestAdded: updatedEvent.guests[0],
            numGuests: updatedEvent.numGuests,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function unRsvpSelf(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId } = req.params;
        if (!/^\d+$/.test(eventId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        const user = req.user;
        // If event doesn't exist, send 404 Not Found
        const event = await EventService.getEvent(null, parseInt(eventId));
        if (!event || !event.published) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        // If event has ended, send 410 Gone
        if (new Date(event.endTime) < new Date()) {
            res.status(410).json({ error: `Event ID=${eventId} has already ended` });
            return;
        }
        // If user is not a guest already, send 400 Bad Request
        const isGuest = event.guests.some((g) => g.id === user.id);
        if (!isGuest) {
            res.status(404).json({ error: `User did not RSVP for event ID=${eventId}` });
            return;
        }
        // Remove self as guest from event
        await EventService.updateEvent(event.id, {
            guests: {
                disconnect: { id: user.id },
            },
        });
        res.status(204).send();
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function createRewardTrx(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { eventId } = req.params;
        if (!/^\d+$/.test(eventId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                type: z.literal('event', { errorMap: () => ({ message: 'type must be "event"' }) }),
                utorid: z
                    .string()
                    .min(7, 'utorid must be 7-8 characters')
                    .max(8, 'utorid must be 7-8 characters')
                    .nullable()
                    .optional(),
                amount: z
                    .number({ required_error: 'amount is required' })
                    .int('amount must be an integer')
                    .positive('amount must be a positive integer'),
            })
            .strict();
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { type, utorid, amount } = result.data;
        // --------------------------------------------------------------------
        // If event doesn't exist, send 404 Not Found
        const event = await EventService.getEvent(null, parseInt(eventId));
        if (!event) {
            res.status(404).json({ error: `Event ID=${eventId} not found` });
            return;
        }
        // Clearance check: 403 Forbidden
        const reqIsManager = ['manager', 'superuser'].includes(req.user.role);
        const reqIsOrganizer = event.organizers.some((o) => o.utorid === req.user.utorid);
        if (!reqIsManager && !reqIsOrganizer) {
            res.status(403).json({ error: 'Forbidden: Insufficient clearance' });
            return;
        }
        // If the guestList is empty, send 400 Bad Request
        const guestList = event.guests;
        if (guestList.length === 0) {
            res.status(400).json({ error: `Event ID=${eventId} has no guests to reward` });
            return;
        }
        // (utorid is specified) => Reward that guest with points
        if (utorid !== undefined && utorid !== null) {
            // If user doesn't exist, send 404 Not Found
            const user = await UserService.getUser(utorid);
            if (!user) {
                res.status(404).json({ error: `User (utorid=${utorid}) not found` });
                return;
            }
            // If user is not on the guest list, send 400 Bad Request
            if (!guestList.some((g) => g.id === user.id)) {
                res.status(400).json({ error: `User (utorid=${utorid}) not a guest for event ID=${eventId}` });
                return;
            }
            // If remaining points are less than requested amount, send 400 Bad Request
            if (event.pointsRemain < amount) {
                res.status(400).json({ error: `Only ${event.pointsRemain} points available for awarding guests` });
                return;
            }
            // Create event transaction
            const eventTrx = await TransactionService.createTrx({
                utorid,
                type,
                amount,
                createdBy: req.user.utorid,
                relatedId: event.id,
            });
            // Deduct points from pointsRemain + Add points to pointsAwarded
            await EventService.rewardUpdate(event.id, amount);
            // Reward points to user
            await UserService.incrementPoints(utorid, amount);
            // Send
            res.status(201).json({
                id: eventTrx.id,
                recipient: eventTrx.utorid,
                awarded: eventTrx.amount,
                type: eventTrx.type,
                relatedId: eventTrx.relatedId,
                remark: eventTrx.remark,
                createdBy: eventTrx.createdBy,
            });
            return;
            // (utorid is NOT specified) => Reward all guests
        } else {
            // Calculate total points to award
            const totalAwardPoints = amount * guestList.length;
            // If remaining points are less than total amount, send 400 Bad Request
            if (event.pointsRemain < totalAwardPoints) {
                res.status(400).json({ error: `Only ${event.pointsRemain} points available for awarding guests` });
                return;
            }
            // Process each guest individually
            const payload = [];
            for (const guest of guestList) {
                // Create event transaction
                const eventTrx = await TransactionService.createTrx({
                    utorid: guest.utorid,
                    type,
                    amount,
                    createdBy: req.user.utorid,
                    relatedId: event.id,
                });
                // Award points to guest
                await UserService.incrementPoints(guest.utorid, amount);
                payload.push({
                    id: eventTrx.id,
                    recipient: eventTrx.utorid,
                    awarded: eventTrx.amount,
                    type: eventTrx.type,
                    relatedId: eventTrx.relatedId,
                    remark: eventTrx.remark,
                    createdBy: eventTrx.createdBy,
                });
            }
            // Deduct points from pointsRemain + Add points to pointsAwarded
            await EventService.rewardUpdate(event.id, totalAwardPoints);
            // Send
            res.status(201).json(payload);
            return;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

module.exports = {
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
};
