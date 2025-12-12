const { z } = require('zod');
const { UserService } = require('../services/users');
const { TransactionService } = require('../services/transactions');
const { PromotionService } = require('../services/promotions');

async function createPromo(req, res) {
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
                type: z.enum(['automatic', 'one-time'], {
                    errorMap: () => ({ message: 'type must be either "automatic" or "one-time"' }),
                }),
                startTime: z
                    .string({ required_error: 'startTime is required' })
                    .refine((v) => !isNaN(Date.parse(v)), {
                        message: `startTime must be in ISO 8601 format`,
                    })
                    .refine((v) => new Date(v) >= new Date(), { message: 'startTime must not be in the past' }),
                endTime: z.string({ required_error: 'endTime is required' }).refine((v) => !isNaN(Date.parse(v)), {
                    message: `endTime must be in ISO 8601 format`,
                }),
                minSpending: z
                    .number({ invalid_type_error: 'minSpending must be a number' })
                    .positive('minSpending must be positive')
                    .nullable()
                    .optional(),
                rate: z
                    .number({ invalid_type_error: 'rate must be a number' })
                    .positive('rate must be positive')
                    .nullable()
                    .optional(),
                points: z
                    .number()
                    .int('points must be an integer')
                    .positive('points must be positive')
                    .nullable()
                    .optional(),
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
        const { name, description, type, startTime, endTime, minSpending, rate, points } = result.data;
        // --------------------------------------------------------------------
        // Create new promotion
        const data = {
            type: type === 'automatic' ? type : 'onetime',
            name,
            description,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
        };
        if (minSpending !== undefined && minSpending !== null) data.minSpending = minSpending;
        if (rate !== undefined && rate !== null) data.rate = rate;
        if (points !== undefined && points !== null) data.points = points;
        const newPromo = await PromotionService.createPromo(data);
        // Send
        res.status(201).json({
            id: newPromo.id,
            name: newPromo.name,
            description: newPromo.description,
            type: newPromo.type,
            startTime: newPromo.startTime,
            endTime: newPromo.endTime,
            minSpending: newPromo.minSpending,
            rate: newPromo.rate,
            points: newPromo.points,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function getPromosList(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate query parameters
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                name: z.string().optional(),
                type: z.enum(['automatic', 'one-time']).optional(),
                started: z
                    .string()
                    .refine((v) => v === 'true' || v === 'false', {
                        message: 'started must be either "true" or "false"',
                    })
                    .transform((v) => v === 'true')
                    .optional(),
                ended: z
                    .string()
                    .refine((v) => v === 'true' || v === 'false', {
                        message: 'ended must be either "true" or "false"',
                    })
                    .transform((v) => v === 'true')
                    .optional(),
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
        const { name, type, started, ended, page, limit } = result.data;
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
        if (name !== undefined) where.name = { contains: name };
        if (type !== undefined) where.type = type;
        const select = {
            id: true,
            name: true,
            type: true,
            minSpending: true,
            rate: true,
            points: true,
        };
        if (['manager', 'superuser'].includes(req.user.role)) {
            select.startTime = true;
            select.endTime = true;
            if (started !== undefined) {
                where.startTime = started ? { lte: now } : { gt: now };
            }
            if (ended !== undefined) {
                where.endTime = ended ? { lte: now } : { gt: now };
            }
        } else {
            where.AND = [
                { startTime: { lte: now } },
                { endTime: { gt: now } },
                { users: { none: { utorid: req.user.utorid } } },
            ];
        }
        // Get users by filter
        const [count, results] = await Promise.all([
            PromotionService.getCountByFilter(where),
            PromotionService.getPromosByFilter(where, select, skip, take),
        ]);
        // Send
        res.status(200).json({
            count,
            results,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function getPromo(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { promotionId } = req.params;
        if (!/^\d+$/.test(promotionId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        const promo = await PromotionService.getPromo(parseInt(promotionId));
        // If promotion doesn't exist, send 404 Not Found
        if (!promo) {
            res.status(404).json({ error: `Promotion ID=${promotionId} not found` });
            return;
        }
        // If promotion is currently inactive, send 404 Not Found
        const now = new Date();
        if (now < new Date(promo.startTime) || new Date(promo.endTime) < now) {
            res.status(404).json({ error: `Promotion ID=${promotionId} currently inactive` });
            return;
        }
        // Send
        res.status(200).json({
            id: promo.id,
            name: promo.name,
            description: promo.description,
            type: promo.type,
            endTime: promo.endTime,
            minSpending: promo.minSpending,
            rate: promo.rate,
            points: promo.points,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function updatePromo(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { promotionId } = req.params;
        if (!/^\d+$/.test(promotionId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                name: z.string().min(1, 'name cannot be empty').optional(),
                description: z.string().min(1, 'description cannot be empty').optional(),
                type: z
                    .enum(['automatic', 'one-time'], {
                        errorMap: () => ({ message: 'type must be either "automatic" or "one-time"' }),
                    })
                    .optional(),
                startTime: z
                    .string()
                    .refine((v) => !isNaN(Date.parse(v)), { message: 'startTime must be in ISO 8601 format' })
                    .optional(),
                endTime: z
                    .string()
                    .refine((v) => !isNaN(Date.parse(v)), { message: 'endTime must be in ISO 8601 format' })
                    .optional(),
                minSpending: z.number().positive('minSpending must be a positive number').optional(),
                rate: z.number().positive('rate must be a positive number').optional(),
                points: z.number().int('points must be an integer').positive('points must be positive').optional(),
            })
            .strict() // Reject extra fields
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
        const { name, description, type, startTime, endTime, minSpending, rate, points } = result.data;
        // --------------------------------------------------------------------
        const promo = await PromotionService.getPromo(parseInt(promotionId));
        // If promo doesn't exist, send 404 Not Found
        if (!promo) {
            res.status(404).json({ error: `Promotion ID=${promotionId} not found` });
            return;
        }
        const now = new Date();
        // If startTime is in the past, send 400 Bad Request
        if (startTime !== undefined && startTime !== null && new Date(startTime) < now) {
            res.status(400).json({ error: 'Cannot set a promotion to start in the past' });
            return;
        }
        // If endTime is in the past, send 400 Bad Request
        if (endTime !== undefined && endTime !== null && new Date(endTime) < now) {
            res.status(400).json({ error: 'Cannot set a promotion to end in the past' });
            return;
        }
        // If update(s) to name, description, type, startTime, minSpending,
        // rate, or points is made after the original start time has passed,
        // send 400 Bad Request
        if (new Date(promo.startTime) < now) {
            if (name !== undefined && name !== null) {
                res.status(400).json({ error: 'Promotion has already begun: Cannot change name' });
                return;
            }
            if (description !== undefined && description !== null) {
                res.status(400).json({ error: 'Promotion has already begun: Cannot change description' });
                return;
            }
            if (type !== undefined && type !== null) {
                res.status(400).json({ error: 'Promotion has already begun: Cannot change type' });
                return;
            }
            if (startTime !== undefined && startTime !== null) {
                res.status(400).json({ error: 'Promotion has already begun: Cannot change startTime' });
                return;
            }
            if (minSpending !== undefined && minSpending !== null) {
                res.status(400).json({ error: 'Promotion has already begun: Cannot change minSpending' });
                return;
            }
            if (rate !== undefined && rate !== null) {
                res.status(400).json({ error: 'Promotion has already begun: Cannot change rate' });
                return;
            }
            if (points !== undefined && points !== null) {
                res.status(400).json({ error: 'Promotion has already begun: Cannot change points' });
                return;
            }
        }
        // If update to endTime is made after the original end time has passed,
        // send 400 Bad Request
        if (new Date(promo.endTime) < now) {
            res.status(400).json({ error: 'Promotion has already ended: Cannot change endTime' });
            return;
        }
        // Update promotion
        const data = {};
        if (name !== undefined && name !== null) data.name = name;
        if (description !== undefined && description !== null) data.description = description;
        if (type !== undefined && type !== null) data.type = type;
        if (startTime !== undefined && startTime !== null) data.startTime = startTime;
        if (endTime !== undefined && endTime !== null) data.endTime = endTime;
        if (minSpending !== undefined && minSpending !== null) data.minSpending = minSpending;
        if (rate !== undefined && rate !== null) data.rate = rate;
        if (points !== undefined && points !== null) data.points = points;
        const updatedPromo = await PromotionService.updatePromo(promo.id, data);
        // Send
        const response = {
            id: updatedPromo.id,
            name: updatedPromo.name,
            type: updatedPromo.type,
        };
        for (const key of Object.keys(data)) {
            response[key] = updatedPromo[key];
        }
        res.status(200).json(response);
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function deletePromo(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { promotionId } = req.params;
        if (!/^\d+$/.test(promotionId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        const promo = await PromotionService.getPromo(parseInt(promotionId));
        // If promo doesn't exist, send 404 Not Found
        if (!promo) {
            res.status(404).json({ error: `Promotion ID=${promotionId} not found` });
            return;
        }
        // If startTime is in the past, send 400 Bad Request
        const now = new Date();
        if (new Date(promo.startTime) < now) {
            res.status(403).json({ error: `Promotion ID=${promotionId} has already started` });
            return;
        }
        // Delete promotion
        await PromotionService.deletePromo(promo.id);
        // Send
        res.status(204).send();
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

module.exports = {
    createPromo,
    getPromosList,
    getPromo,
    updatePromo,
    deletePromo,
};
