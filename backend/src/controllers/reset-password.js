const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { UserService } = require('../services/users');
const { ResetTokenService } = require('../services/reset-token');
const { sendPasswordResetEmail } = require('../services/emailService');
const { isValidPassword, isValidUtoridLength, isString, checkExtraFields } = require('../helpers/payload-validation');
const { RESET_URL_BASE } = require('../config');

const requestDateByIp = new Map();

async function requestPasswordReset(req, res) {
    const { utorid } = req.body;
    // ------------------------------------------------
    // If request body is invalid, send 400 Bad Request
    // ------------------------------------------------
    // Check for unexpected fields
    const extra = checkExtraFields(['utorid'], req.body);
    if (extra.length > 0) {
        res.status(400).json({ message: `Unknown field(s): ${extra.join(', ')}` });
        return;
    }
    // Check for missing fields
    if (utorid === undefined) {
        res.status(400).json({ message: 'utorid is required' });
        return;
    }
    // Check for invalid field type
    if (!isString(utorid)) {
        res.status(400).json({ message: 'utorid must be a string' });
        return;
    }
    // Check for invalid utorid (must be of 7 or 8 characters)
    if (!isValidUtoridLength(utorid)) {
        res.status(400).json({ message: 'utorid must be 7 or 8 characters' });
        return;
    }
    // ------------------------------------------------
    // Rate limiting: Maximum of once per minute
    const ipKey = `${req.ip}_${utorid}`;
    const lastRequestAt = requestDateByIp.get(ipKey);
    if (lastRequestAt && Date.now() - lastRequestAt < 60 * 1000) {
        res.status(429).json({ message: 'Too many requests from this IP' });
        return;
    }
    requestDateByIp.set(ipKey, Date.now());
    // Get user by utorid
    const user = await UserService.getUser(utorid);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    try {
        // Delete any pre-existing reset tokens for this user
        await ResetTokenService.deleteTokens(utorid);
        // Create new reset token, expires in 1h
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        // Store new reset token in DB
        await ResetTokenService.createToken(utorid, resetToken, expiresAt);

        // ----------------
        // SEND RESET EMAIL
        // ----------------
        const resetLink = `${RESET_URL_BASE}/${resetToken}`;
        await sendPasswordResetEmail(user.email, resetLink);

        // 202 Accepted: Send reset token
        res.status(202).json({
            expiresAt,
            resetToken,
            message: 'Password reset email sent.'
        });
        return;
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error' });
        return;
    }
}

async function resetPassword(req, res) {
    const { utorid, password } = req.body;
    // ------------------------------------------------
    // If request body is invalid, send 400 Bad Request
    // ------------------------------------------------
    // Check for unexpected fields
    const extra = checkExtraFields(['utorid', 'password'], req.body);
    if (extra.length > 0) {
        res.status(400).json({ message: `Unknown field(s): ${extra.join(', ')}` });
        return;
    }
    // Check for missing fields
    if (utorid === undefined) {
        res.status(400).json({ message: 'utorid is required' });
        return;
    }
    if (password === undefined) {
        res.status(400).json({ message: 'password is required' });
        return;
    }
    // Check for invalid field type
    if (!isString(utorid) || !isString(password)) {
        res.status(400).json({ message: 'utorid and password must be strings' });
        return;
    }
    // Check for invalid utorid (must be of 7 or 8 characters)
    if (!isValidUtoridLength(utorid)) {
        res.status(400).json({ message: 'utorid must be 7 or 8 characters' });
        return;
    }
    // Check for invalid password
    if (!isValidPassword(password)) {
        res.status(400).json({
            message:
                'password must contain at least 8-20 characters, one uppercase, one lowercase, one number, and one special character',
        });
        return;
    }
    // ------------------------------------------------
    const { resetToken } = req.params;
    try {
        // Get reset token from DB by token value
        const tokenEntry = await ResetTokenService.getToken(resetToken);
        // If reset token doesn't exist, send 404 Not Found
        if (!tokenEntry) {
            res.status(404).json({ message: 'Token not found' });
            return;
        }
        // If reset token doesn't match utorid, send 401 Anauthorized
        if (tokenEntry.utorid !== utorid) {
            res.status(401).json({ message: 'Token does not match user' });
            return;
        }
        // If reset token has expired, send 410 Gone
        if (new Date(tokenEntry.expiresAt) <= new Date()) {
            // Delete expired token from DB
            await ResetTokenService.deleteTokens(utorid);
            res.status(410).json({ message: 'Reset token has expired' });
            return;
        }
        // Update user with new password
        const newPassword = await bcrypt.hash(password, 10);
        await UserService.updatePassword(utorid, newPassword);
        // Delete consumed token from DB
        await ResetTokenService.deleteTokens(utorid);
        res.status(200).json({ message: 'Password reset successful' });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
        return;
    }
}

module.exports = {
    requestPasswordReset,
    resetPassword,
};
