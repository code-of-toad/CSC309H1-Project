const { z } = require('zod');
const { UserService } = require('../services/users');
const { TransactionService } = require('../services/transactions');
const { PromotionService } = require('../services/promotions');
const { calcPoints } = require('../helpers/points');
const { formatTransactionManager } = require('../helpers/formatTransaction');

async function createPurchaseTrx(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        // Common validation schema
        const baseSchema = z
            .object({
                utorid: z.string().min(7, 'utorid must be 7-8 characters').max(8, 'utorid must be 7-8 characters'),
                type: z.enum(['purchase', 'adjustment'], {
                    errorMap: () => ({ message: 'type must be "purchase" or "adjustment"' }),
                }),
                promotionIds: z.array(z.number().int().positive()).nullable().optional(),
                remark: z.string().max(255).nullable().optional(),
            })
            .strict();
        // Purchase schema
        const purchaseSchema = baseSchema
            .extend({
                spent: z.number().positive('spent must be a positive value'),
            })
            .strict();
        // Adjustment schema
        const adjustmentSchema = baseSchema
            .extend({
                amount: z.number(),
                relatedId: z.number().int().positive(),
            })
            .strict();
        // Pick the correct schema
        const validSchema =
            req.body.type === 'purchase'
                ? purchaseSchema
                : req.body.type === 'adjustment'
                  ? adjustmentSchema
                  : baseSchema;
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const data = result.data;
        // --------------------------------------------------------------------
        // Clearance validation
        // --------------------------------------------------------------------
        if (data.type === 'purchase') {
            if (!['cashier', 'manager', 'superuser'].includes(req.user.role)) {
                res.status(403).json({ error: 'Unauthorized to create a purchase transaction' });
                return;
            }
        }
        if (data.type === 'adjustment') {
            if (!['manager', 'superuser'].includes(req.user.role)) {
                res.status(403).json({ error: 'Unauthorized to create an adjustment transaction' });
                return;
            }
        }
        // --------------------------------------------------------------------
        // Check if customer exists
        const customer = await UserService.getUserAndRelations(data.utorid);
        if (!customer) {
            res.status(400).json({ error: `User with utorid=${data.utorid} not found` });
            return;
        }
        // Validate promotion IDs (if provided) and collect
        const promoIds = data.promotionIds ?? [];
        if (promoIds.length > 0) {
            for (const pid of promoIds) {
                // If a promo doesn't exist, send 400 Bad Request
                const promo = await PromotionService.getPromo(pid);
                if (!promo) {
                    res.status(400).json({ error: `Promotion ID=${pid} doesn't exist` });
                    return;
                }
                // If a promo has been used, send 400 Bad Request
                if (customer.promotions.some((usedPromo) => usedPromo.id === pid)) {
                    res.status(400).json({ error: `Customer already used promotion ID=${pid}` });
                    return;
                }
                // If a promo hasn't started yet, send 400 Bad Request
                if (promo.startTime !== null && promo.startTime > new Date()) {
                    res.status(400).json({
                        error: `Promotional period has not started for promotion ID=${pid}`,
                    });
                    return;
                }
                // If a promo expired, send 400 Bad Request
                if (promo.endTime !== null && promo.endTime < new Date()) {
                    res.status(400).json({ error: `promotion ID=${pid} has expired` });
                    return;
                }
                // If a promo specifies a minSpending greater than spent, send 400 Bad Request
                if (data.type === 'purchase' && promo.minSpending > data.spent) {
                    res.status(400).json({
                        message: `promotionId=${promo.id} requires a minimum spending of $${promo.minSpending}`,
                    });
                    return;
                }
            }
        }
        // Collect all specified promotions in one array
        const promos = await Promise.all(promoIds.map((id) => PromotionService.getPromo(id)));

        // PURCHASE:
        if (data.type === 'purchase') {
            // Connect all specified promo ID's to customer DB
            const promoIdsToConnect = promoIds.map((id) => ({ id }));
            await UserService.addPromosToUser(customer.utorid, promoIdsToConnect);
            // Calculate total points earned
            let amount = calcPoints(data.spent);
            if (promoIds.length > 0) {
                for (const promo of promos) {
                    amount += calcPoints(data.spent, promo.rate);
                }
            }
            console.log('-----------------------');
            console.log(`[Purchase Trx] Customer Balance (BEFORE): ${(await UserService.getUser(data.utorid)).points}`);
            // Update customer points (or not)
            const suspicious = req.user.suspicious;
            // const suspicious = req.user.role === 'cashier' && req.user.suspicious === true;
            const customerPts = suspicious ? 0 : amount;
            await UserService.incrementPoints(data.utorid, customerPts);
            // Create a new purchase transaction
            const newTrx = await TransactionService.createTrx({
                utorid: data.utorid,
                type: data.type,
                spent: data.spent,
                amount: amount,
                remark: data.remark ?? '',
                suspicious,
                createdBy: req.user.utorid,
                promotions: { connect: promoIdsToConnect },
            });
            console.log(`[Purchase Trx] Cashier: sus=${suspicious}`);
            console.log(`[Purchase Trx] Points earned from purchase=${newTrx.amount}`);
            console.log(`[Purchase Trx] Points added to customer=${customerPts}`);
            console.log(`[Purchase Trx] Customer Balance (AFTER): ${(await UserService.getUser(data.utorid)).points}`);
            console.log('-----------------------');
            // Build payload & send
            res.status(201).json({
                id: newTrx.id,
                utorid: newTrx.utorid,
                type: newTrx.type,
                spent: newTrx.spent,
                earned: newTrx.amount,
                remark: newTrx.remark,
                promotionIds: promoIds,
                createdBy: newTrx.createdBy,
            });
            return;
        }
        // ADJUSTMENT:
        if (data.type === 'adjustment') {
            // Get the related transaction by relatedId
            const relatedTrx = await TransactionService.getTrx(data.relatedId);
            // If relatedId refers to a non-existing trx, send 400: Bad Request
            if (!relatedTrx) {
                res.status(404).json({ error: `Invalid relatedId: Transaction ID=${data.relatedId} does not exist` });
                return;
            }
            // If relatedId transaction belongs to the wrong utorid, send 400: Bad Request
            if (relatedTrx.utorid !== data.utorid) {
                res.status(400).json({
                    error: `Invalid relatedId: Transaction ID=${data.relatedId} does not belong to customer=${data.utorid}`,
                });
                return;
            }
            // Connect all specified promo ID's to customer DB
            const promoIdsToConnect = promoIds.map((id) => ({ id }));
            await UserService.addPromosToUser(customer.utorid, promoIdsToConnect);
            // Calculate total amount (points) adjusted
            let amount = data.amount;
            if (promoIds.length > 0) {
                for (const promo of promos) {
                    amount += calcPoints(relatedTrx.spent, promo.rate);
                }
            }
            // Update customer points
            await UserService.incrementPoints(data.utorid, amount);
            // Create the adjustment transaction
            const adjTrx = await TransactionService.createTrx({
                utorid: data.utorid,
                type: data.type,
                amount,
                remark: data.remark ?? '',
                relatedId: data.relatedId,
                createdBy: req.user.utorid,
                promotions: { connect: promoIdsToConnect },
            });
            // Build payload & send
            res.status(201).json({
                id: adjTrx.id,
                utorid: adjTrx.utorid,
                amount: adjTrx.amount,
                type: adjTrx.type,
                relatedId: adjTrx.relatedId,
                remark: adjTrx.remark,
                promotionIds: promoIds,
                createdBy: adjTrx.createdBy,
            });
            return;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function getTrxsList(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate query parameters
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                name: z.string().optional(),
                createdBy: z.string().optional(),
                suspicious: z
                    .preprocess((v) => {
                        if (v === 'true' || v === true) return true;
                        if (v === 'false' || v === false) return false;
                        return undefined;
                    }, z.boolean())
                    .optional(),
                promotionId: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().positive().optional()),
                type: z.enum(['purchase', 'redemption', 'adjustment', 'event', 'transfer']).optional(),
                relatedId: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().positive().optional()),
                amount: z.preprocess((v) => (v ? Number(v) : undefined), z.number().optional()),
                operator: z.enum(['gte', 'lte']).optional(),
                page: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().positive()).default(1),
                limit: z.preprocess((v) => (v === undefined ? 10 : Number(v)), z.number().int().positive()).default(10),
            })
            .strict()
            // Cross-field validation logic
            .refine(
                (data) => {
                    // relatedId requires type
                    if (data.relatedId !== undefined && !data.type) return false;
                    return true;
                },
                { message: 'relatedId must be used with type' },
            )
            .refine(
                (data) => {
                    // amount requires operator
                    if (data.amount !== undefined && !data.operator) return false;
                    // operator requires amount
                    if (data.operator && data.amount === undefined) return false;
                    return true;
                },
                { message: 'amount and operator must be used together' },
            );
        const result = validSchema.safeParse(req.query);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { name, createdBy, suspicious, promotionId, type, relatedId, amount, operator, page, limit } =
            result.data;
        // --------------------------------------------------------------------
        // Pagination logic
        const skip = (page - 1) * limit;
        const take = limit;
        // Filtering logic
        const where = {};
        if (name) {
            // where.OR = [{ utorid: { contains: name } }, { name: { contains: name } }];
            where.utorid = { contains: name };
        }
        if (createdBy) where.createdBy = { contains: createdBy };
        if (suspicious !== undefined) where.suspicious = suspicious;
        if (promotionId) where.promotions = { some: { id: promotionId } };
        if (type) where.type = type;
        if (relatedId) where.relatedId = relatedId;
        if (amount !== undefined && operator) {
            where.amount = operator === 'gte' ? { gte: amount } : { lte: amount };
        }
        const select = {
            id: true,
            utorid: true,
            type: true,
            spent: true,
            amount: true,
            redeemed: true,
            relatedId: true,
            suspicious: true,
            remark: true,
            createdBy: true,
            processedBy: true,
            promotions: { select: { id: true } },
        };
        // Get transactions by filter
        const [count, results] = await Promise.all([
            TransactionService.getCountByFilter(where),
            TransactionService.getTrxsByFilter(where, select, skip, take),
        ]);
        // Build payload & send
        res.status(200).json({
            count,
            results: results.map(formatTransactionManager),
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function getTrx(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { transactionId } = req.params;
        if (!/^\d+$/.test(transactionId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Fetch target transaction by id, including relations
        const targetTrx = await TransactionService.getTrxAndRelations(parseInt(transactionId));
        if (!targetTrx) {
            res.status(404).json({ error: `Transaction ID=${transactionId} not found` });
            return;
        }
        // Build payload & send
        res.status(200).json(formatTransactionManager(targetTrx));
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function setTrxSus(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { transactionId } = req.params;
        if (!/^\d+$/.test(transactionId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                suspicious: z.boolean({ required_error: 'suspicious is a required field' }),
            })
            .strict();
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { suspicious } = result.data;
        // --------------------------------------------------------------------
        // Fetch transaction to update
        const targetTrx = await TransactionService.getTrxAndRelations(parseInt(transactionId));
        // If transaction is not found, send 404 Not Found
        if (!targetTrx) {
            res.status(404).json({ error: `Transaction ID=${transactionId} not found` });
            return;
        }
        console.log('-----------------------');
        console.log(`[Set Sus Trx] Trx Amount: ${targetTrx.amount}`);
        console.log(`[Set Sus Trx] Set to suspicious=${suspicious}`);
        console.log(`[Set Sus Trx] Customer Balance (BEFORE): ${(await UserService.getUser(targetTrx.utorid)).points}`);
        console.log(`[Set Sus Trx] Related Trx (BEFORE): sus=${targetTrx.suspicious}`);
        // Deduct amount from the corresponding user's points balance
        if (targetTrx.suspicious === false && suspicious === true) {
            await UserService.incrementPoints(targetTrx.utorid, -targetTrx.amount);
        }
        // Add amount to the corresponding user's points balance
        if (targetTrx.suspicious === true && suspicious === false) {
            await UserService.incrementPoints(targetTrx.utorid, targetTrx.amount);
        }
        // Update transaction suspicious status
        const updatedTrx = await TransactionService.updateTrx(parseInt(transactionId), { suspicious });
        console.log(`[Set Sus Trx] Related Trx (AFTER): sus=${updatedTrx.suspicious}`);
        console.log(`[Set Sus Trx] Customer Balance (AFTER): ${(await UserService.getUser(targetTrx.utorid)).points}`);
        console.log('-----------------------');
        res.status(200).json({
            id: updatedTrx.id,
            utorid: updatedTrx.utorid,
            type: updatedTrx.type,
            spent: updatedTrx.spent,
            amount: updatedTrx.amount,
            promotionIds: targetTrx.promotions.map((p) => p.id),
            suspicious: updatedTrx.suspicious,
            remark: updatedTrx.remark,
            createdBy: updatedTrx.createdBy,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function processRedemption(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { transactionId } = req.params;
        if (!/^\d+$/.test(transactionId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                processed: z.literal(true, { errorMap: () => ({ message: 'processed can only be true' }) }),
            })
            .strict();
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        // --------------------------------------------------------------------
        // Fetch transaction to update
        const targetTrx = await TransactionService.getTrxAndRelations(parseInt(transactionId));
        // If transaction is not found, send 404 Not Found
        if (!targetTrx) {
            res.status(404).json({ error: `Transaction ID=${transactionId} not found` });
            return;
        }
        // If transaction type is not `redemption`, send 400 Bad Request
        if (targetTrx.type !== 'redemption') {
            res.status(400).json({ error: 'Transaction type must be redemption' });
            return;
        }
        // If transaction is already processed, send 400 Bad Request
        if (targetTrx.processedBy !== null) {
            res.status(400).json({ error: 'Transaction has already been processed' });
            return;
        }
        // Process the redemption transaction
        const processedTrx = await TransactionService.updateTrx(targetTrx.id, {
            redeemed: targetTrx.amount,
            processedBy: req.user.utorid,
            relatedId: req.user.id,
        });
        // Remove redeemed points from customer's balance
        await UserService.incrementPoints(processedTrx.utorid, -processedTrx.redeemed);
        // Send
        res.status(200).json({
            id: processedTrx.id,
            utorid: processedTrx.utorid,
            type: processedTrx.type,
            processedBy: processedTrx.processedBy,
            redeemed: processedTrx.redeemed,
            remark: processedTrx.remark,
            createdBy: processedTrx.createdBy,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

module.exports = {
    createPurchaseTrx,
    getTrxsList,
    getTrx,
    setTrxSus,
    processRedemption,
};
