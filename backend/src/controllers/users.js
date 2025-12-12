const bcrypt = require('bcrypt');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const { UserService } = require('../services/users');
const { ResetTokenService } = require('../services/reset-token');
const { TransactionService } = require('../services/transactions');
const { sendPasswordResetEmail } = require('../services/emailService');
const { formatTransactionRegular } = require('../helpers/formatTransaction');
const { isValidBirthday } = require('../helpers/payload-validation');
const { RESET_URL_BASE } = require('../config');

async function registerUser(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                utorid: z.string().min(7, 'utorid must be 7-8 characters').max(8, 'utorid must be 7-8 characters'),
                name: z.string().min(1, 'name must be 1-50 characters').max(50, 'name must be 1-50 characters'),
                email: z
                    .string()
                    .email('Invalid email format')
                    .refine((email) => email.endsWith('@mail.utoronto.ca'), {
                        message: 'email must end with @mail.utoronto.ca',
                    }),
            })
            .strict(); // Reject extra fields
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { utorid, name, email } = result.data;
        // --------------------------------------------------------------------
        // Check if user alreay exists
        const userExists = await UserService.getUser(utorid);
        if (userExists) {
            res.status(409).json({ error: `User with utorid=${utorid} already exists` });
            return;
        }
        // Create new user
        const newUser = await UserService.createUser({
            utorid,
            name,
            email,
        });
        // Create new reset token, expires in 7d
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        // Store new reset token in DB
        await ResetTokenService.createToken(utorid, resetToken, expiresAt);

        // ------------------------------------------
        // SEND THE ACTIVATION / PASSWORD SETUP EMAIL
        // ------------------------------------------
        const resetLink = `${RESET_URL_BASE}/${resetToken}`;
        await sendPasswordResetEmail(email, resetLink);

        // Respond
        res.status(201).json({
            id: newUser.id,
            utorid: newUser.utorid,
            name: newUser.name,
            email: newUser.email,
            verified: newUser.verified,
            expiresAt,
            resetToken,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function getUsersList(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate query parameters
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                name: z.string().optional(),
                role: z.enum(['regular', 'cashier', 'manager', 'superuser']).optional(),
                verified: z
                    .string()
                    .refine((v) => v === 'true' || v === 'false', {
                        message: 'verified must be either "true" or "false"',
                    })
                    .transform((v) => v === 'true')
                    .optional(),
                activated: z
                    .string()
                    .refine((v) => v === 'true' || v === 'false', {
                        message: 'activated must be either "true" or "false"',
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
        const { name, role, verified, activated, page, limit } = result.data;
        // --------------------------------------------------------------------
        // Pagination logic
        const skip = (page - 1) * limit;
        const take = limit;
        // Filtering logic
        const where = {};
        if (name !== undefined) {
            where.OR = [{ name: { contains: name } }, { utorid: { contains: name } }];
        }
        if (role !== undefined) where.role = role;
        if (verified !== undefined) where.verified = verified;
        if (activated === true) where.lastLogin = { not: null };
        if (activated === false) where.lastLogin = null;
        const select = {
            id: true,
            utorid: true,
            name: true,
            email: true,
            birthday: true,
            role: true,
            points: true,
            createdAt: true,
            lastLogin: true,
            verified: true,
            avatarUrl: true,
        };
        // Get users by filter
        const [count, results] = await Promise.all([
            UserService.getCountByFilter(where),
            UserService.getUsersByFilter(where, select, skip, take),
        ]);
        // The concurrency above makes things efficient as opposed to the
        // old code below. This works because the two promises are
        // independent of one another.
        //   const count = await UserService.getCountByFilter(where);
        //   const results = await UserService.getUsersByFilter(where, select, skip, take);
        //
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

async function getUser(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        const { userId } = req.params;
        if (!/^\d+$/.test(userId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Fetch target user by id
        const targetUser = await UserService.getUserAndRelations(null, parseInt(userId));
        if (!targetUser) {
            res.status(404).json({ error: `User ID=${userId} not found` });
            return;
        }
        // Cashier => Build payload & send
        if (['cashier'].includes(req.user.role)) {
            res.status(200).json({
                id: targetUser.id,
                utorid: targetUser.utorid,
                name: targetUser.name,
                points: targetUser.points,
                verified: targetUser.verified,
                promotions: targetUser.promotions,
            });
            return;
        }
        // Manager => Build payload & send
        if (['manager', 'superuser'].includes(req.user.role)) {
            res.status(200).json({
                id: targetUser.id,
                utorid: targetUser.utorid,
                name: targetUser.name,
                email: targetUser.email,
                birthday: targetUser.birthday,
                role: targetUser.role,
                points: targetUser.points,
                suspicious: targetUser.suspicious,
                createdAt: targetUser.createdAt,
                lastLogin: targetUser.lastLogin,
                verified: targetUser.verified,
                avatarUrl: targetUser.avatarUrl,
                promotions: targetUser.promotions,
            });
            return;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function updateUser(req, res) {
    try {
        const { userId } = req.params;
        // --------------------------------------------------------------------
        // Validate route parameter
        // --------------------------------------------------------------------
        if (!/^\d+$/.test(userId)) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }
        // --------------------------------------------------------------------
        // Check for empty payload
        // --------------------------------------------------------------------
        if (Object.keys(req.body).length === 0) {
            res.status(400).json({ error: 'Specify user field(s) to update' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                email: z
                    .string()
                    .email('Invalid email format')
                    .refine((email) => email.endsWith('@mail.utoronto.ca'), {
                        message: 'email must end with @mail.utoronto.ca',
                    })
                    .nullable()
                    .optional(),
                verified: z
                    .boolean()
                    .nullable()
                    .optional()
                    .refine((val) => val === undefined || val === true || val == null, {
                        message: 'verified must be set to true',
                    }),
                suspicious: z.boolean().nullable().optional(),
                role: z.enum(['regular', 'cashier', 'manager', 'superuser']).nullable().optional(),
            })
            .strict();
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const data = result.data;
        // --------------------------------------------------------------------
        // Fetch target user by id
        const targetUser = await UserService.getUser(null, parseInt(userId));
        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Clearance-dependent role assignment
        if (data.role !== undefined && data.role !== null) {
            const allowedRoles =
                req.user.role === 'manager' ? ['regular', 'cashier'] : ['regular', 'cashier', 'manager', 'superuser'];
            if (!allowedRoles.includes(data.role)) {
                res.status(403).json({ error: `Not authorized to assign the role of ${data.role}` });
                return;
            }
            // When promoting a regular user to cashier, suspicious must be false
            const userIsSuspicious =
                data.suspicious !== undefined && data.suspicious !== null ? data.suspicious : targetUser.suspicious;
            if (data.role === 'cashier' && targetUser.role === 'regular' && userIsSuspicious) {
                res.status(400).json({ error: 'A suspicious user cannot be promoted to cashier' });
                return;
            }
        }
        // Build update object (only provided fields)
        const updatedFields = {};
        for (const [key, val] of Object.entries(data)) {
            if (val !== null && val !== undefined) {
                updatedFields[key] = val;
            }
        }
        // Update user
        const updatedUser = await UserService.updateUserInfo(targetUser.utorid, updatedFields);
        // Send
        res.status(200).json({
            id: updatedUser.id,
            utorid: updatedUser.utorid,
            name: updatedUser.name,
            ...updatedFields,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function updateCurrUser(req, res) {
    try {
        // --------------------------------------------------------------------
        // Check for empty payload
        // --------------------------------------------------------------------
        if (Object.keys(req.body).length === 0) {
            res.status(400).json({ error: 'Specify user field(s) to update' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                name: z
                    .string()
                    .min(1, 'name must be 1-50 characters')
                    .max(50, 'name must be 1-50 characters')
                    .nullable()
                    .optional(),
                email: z
                    .string()
                    .email('Invalid email format')
                    .refine((email) => email.endsWith('@mail.utoronto.ca'), {
                        message: 'email must end with @mail.utoronto.ca',
                    })
                    .nullable()
                    .optional(),
                birthday: z
                    .string()
                    .refine((date) => isValidBirthday(date), {
                        message: 'birthdamust be a valid calendar date in the format "YYYY-MM-DD"',
                    })
                    .nullable()
                    .optional(),
                avatar: z
                    .string()
                    .refine(
                        (avatar) =>
                            /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(avatar) ||
                            /^data:image\/(png|jpg|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(avatar),
                        { message: 'avatar must be a valid image URL or base64-encoded image string' },
                    )
                    .nullable()
                    .optional(),
            })
            .strict();
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const data = result.data;
        // --------------------------------------------------------------------
        // Build payload
        const updatedFields = {};
        for (const [key, val] of Object.entries(data)) {
            if (val !== undefined && val !== null) {
                // The ternary operation below ensures that the key name for
                // avatar matches the DB scheme. All other keys already match
                // the DB scheme
                updatedFields[key === 'avatar' ? 'avatarUrl' : key] = val;
            }
        }
        // If all fiends are undefined and/or null, send 400 Bad Request
        if (Object.keys(updatedFields).length === 0) {
            res.status(400).json({ error: 'Specify at least one non-null field to update' });
            return;
        }
        // Update user
        const updatedUser = await UserService.updateUserInfo(req.user.utorid, updatedFields);
        // Send
        res.status(200).json({
            id: updatedUser.id,
            utorid: updatedUser.utorid,
            name: updatedUser.name,
            email: updatedUser.email,
            birthday: updatedUser.birthday,
            role: updatedUser.role,
            points: updatedUser.points,
            createdAt: updatedUser.createdAt,
            lastLogin: updatedUser.lastLogin,
            verified: updatedUser.verified,
            avatarUrl: updatedUser.avatarUrl,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function getCurrUser(req, res) {
    try {
        // --------------------------------------------------------------------
        // No validation needed :)
        // --------------------------------------------------------------------
        // Fetch user by utorid
        const user = await UserService.getUserAndRelations(req.user.utorid);
        // Send
        res.status(200).json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
            promotions: user.promotions,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function updateCurrUserPassword(req, res) {
    try {
        // --------------------------------------------------------------------
        // Check for empty payload
        // --------------------------------------------------------------------
        if (Object.keys(req.body).length === 0) {
            res.status(400).json({ message: 'You must enter both passwords' });
            return;
        }
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                old: z.string(),
                new: z
                    .string()
                    .regex(
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/,
                        'new password must be 8-20 chars, include upper, lower, number, and special character',
                    ),
            })
            .strict(); // Reject extra fields
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { old: oldPw, new: newPw } = result.data;
        // --------------------------------------------------------------------
        // If old password is incorrect, send 403 Forbidden
        const isMatch = await bcrypt.compare(oldPw, req.user.password);
        if (!isMatch) {
            res.status(403).json({ error: 'Incorrect current password' });
            return;
        }
        // Hash and update new password
        const hashedNewPw = await bcrypt.hash(newPw, 10);
        await UserService.updatePassword(req.user.utorid, hashedNewPw);
        res.status(200).json({ message: 'Password updated successfully' });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function createTransferTrx(req, res) {
    try {
        const receiverUtorid = req.params.userId;  // treat param as UTORid
        const validSchema = z
            .object({
                type: z.enum(['transfer'], {
                    errorMap: () => ({ message: 'type must be "transfer"' }),
                }),
                amount: z.number().int().positive('amount must be a positive value'),
                remark: z.string().max(255).nullable().optional(),
            })
            .strict();

        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            return res.status(400).json({ error: message });
        }

        const { type, amount, remark } = result.data;

        //------------------------------------------------------------------
        // Validate sender/receiver
        //------------------------------------------------------------------
        const sender = req.user; // logged-in user

        // Prevent self-transfer (utorid === utorid)
        if (receiverUtorid === sender.utorid) {
            return res.status(400).json({ error: 'You cannot transfer points to yourself...' });
        }

        // Lookup receiver by UTORid
        const receiver = await UserService.getUser(receiverUtorid);
        if (!receiver) {
            return res.status(400).json({ error: `User with UTORid=${receiverUtorid} not found` });
        }

        // Sender must be verified
        if (!sender.verified) {
            return res.status(403).json({ error: 'Sender is not verified' });
        }

        // Sender must have enough points
        if (sender.points < amount) {
            console.log(`Sender has ${sender.points} points`);
            console.log(`Sender wants to send ${amount} points`);
            return res
                .status(400)
                .json({ error: `Insufficient points. Current balance: ${sender.points} points` });
        }

        //------------------------------------------------------------------
        // Create sender transaction (points deducted)
        //------------------------------------------------------------------
        const transferTrxForSender = await TransactionService.createTrx({
            utorid: sender.utorid,
            type,
            amount,
            remark: remark ?? '',
            createdBy: sender.utorid,
            relatedId: receiver.id,      // receiver's numeric DB id
        });

        //------------------------------------------------------------------
        // Create receiver transaction (points gained)
        //------------------------------------------------------------------
        const transferTrxForReceiver = await TransactionService.createTrx({
            utorid: receiver.utorid,
            type,
            amount,
            remark: remark ?? '',
            createdBy: sender.utorid,
            relatedId: sender.id,        // sender's numeric DB id
        });

        //------------------------------------------------------------------
        // Update points
        //------------------------------------------------------------------
        await UserService.incrementPoints(sender.utorid, -amount);
        await UserService.incrementPoints(receiver.utorid, amount);

        //------------------------------------------------------------------
        // Response
        //------------------------------------------------------------------
        return res.status(201).json({
            id: transferTrxForSender.id,
            sender: transferTrxForSender.utorid,
            recipient: transferTrxForReceiver.utorid,
            type: transferTrxForSender.type,
            sent: transferTrxForSender.amount,
            remark: transferTrxForSender.remark,
            createdBy: transferTrxForSender.createdBy,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


async function createRedemptionTrx(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate payload (JSON body)
        // --------------------------------------------------------------------
        // Common validation schema
        const validSchema = z
            .object({
                type: z.enum(['redemption'], {
                    errorMap: () => ({ message: 'type must be "redemption"' }),
                }),
                amount: z.number().int().positive('amount must be a positive value'),
                remark: z.string().max(255).nullable().optional(),
            })
            .strict();
        const result = validSchema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => e.message).join(', ');
            res.status(400).json({ error: message });
            return;
        }
        const { type, amount, remark } = result.data;
        const customer = req.user;
        // --------------------------------------------------------------------
        // If customer is not verified, send 403 Forbidden
        if (customer.verified === false) {
            res.status(403).json({ error: 'Customer is not verified' });
            return;
        }
        // If customer has insufficient points for redemption, send 400 Bad Request
        if (customer.points < amount) {
            console.log(`Customer has ${customer.points} points`);
            console.log(`Customer wants to redeem ${amount} points`);
            res.status(400).json({ error: `Insufficient points. Current balance: ${customer.points} points` });
            return;
        }
        // Create new redemption transaction
        const redemptionTrx = await TransactionService.createTrx({
            utorid: customer.utorid,
            type: type,
            amount: amount,
            redeemed: amount,
            remark: remark ?? '',
            createdBy: customer.utorid,
        });
        // Send
        res.status(201).json({
            id: redemptionTrx.id,
            utorid: redemptionTrx.utorid,
            type: redemptionTrx.type,
            processedBy: redemptionTrx.processedBy,
            amount: redemptionTrx.amount,
            remark: redemptionTrx.remark,
            createdBy: redemptionTrx.createdBy,
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function getUserTrxs(req, res) {
    try {
        // --------------------------------------------------------------------
        // Validate query parameters
        // --------------------------------------------------------------------
        const validSchema = z
            .object({
                type: z.enum(['purchase', 'redemption', 'adjustment', 'event', 'transfer']).optional(),
                relatedId: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().positive().optional()),
                promotionId: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().positive().optional()),
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
        const { type, relatedId, promotionId, amount, operator, page, limit } = result.data;
        // --------------------------------------------------------------------
        // Pagination logic
        const skip = (page - 1) * limit;
        const take = limit;
        // Filtering logic
        const where = { utorid: req.user.utorid };
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
            results: results.map(formatTransactionRegular),
        });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

module.exports = {
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
};
