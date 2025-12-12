const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { UserService } = require('../services/users');
const { isValidUtoridLength, isString, checkExtraFields } = require('../helpers/payload-validation');

async function issueJwt(req, res) {
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
    if (!utorid) {
        res.status(400).json({ message: 'utorid is required' });
        return;
    }
    if (!password) {
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
        res.status(400).json({ message: 'Invalid utorid' });
        return;
    }
    // ------------------------------------------------
    try {
        // Find user by utorid
        const user = await UserService.getUser(utorid);
        // If user doesn't exist, send 404 Not Found
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // If user has no password in DB, send 500 Internal Server Error
        if (!user.password) {
            res.status(401).json({ message: 'User has no password set. Contact admin.' });
            return;
        }
        // Compare passwords using bcrypt,
        // since passwords are stored using bcrypt at activation.
        const isMatch = await bcrypt.compare(password, user.password);
        // If passwords don't match, send 401 Anauthorized
        if (!isMatch) {
            res.status(401).json({ message: 'Incorrect password' });
            return;
        }
        // ---------------------------
        // User has been authenticated
        // ---------------------------
        // Update user's last login time
        await UserService.updateLastLogin(user.utorid);
        // Sign & send JWT
        const payload = {
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            points: user.points,
        };
        const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        res.status(200).json({
            token: jwtToken,
            expiresAt,
            name: user.name,
            role: user.role,
            points: user.points,
        });
        return;
    } catch (err) {
        // Internal server error
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

async function issueJwtDebugging(req, res) {  // Expires in 10 seconds
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
    if (!utorid) {
        res.status(400).json({ message: 'utorid is required' });
        return;
    }
    if (!password) {
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
        res.status(400).json({ message: 'Invalid utorid' });
        return;
    }
    // ------------------------------------------------
    try {
        // Find user by utorid
        const user = await UserService.getUser(utorid);
        // If user doesn't exist, send 404 Not Found
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // If user has no password in DB, send 500 Internal Server Error
        if (!user.password) {
            res.status(401).json({ message: 'User has no password set. Contact admin.' });
            return;
        }
        // Compare passwords using bcrypt,
        // since passwords are stored using bcrypt at activation.
        const isMatch = await bcrypt.compare(password, user.password);
        // If passwords don't match, send 401 Anauthorized
        if (!isMatch) {
            res.status(401).json({ message: 'Incorrect password' });
            return;
        }
        // ---------------------------
        // User has been authenticated
        // ---------------------------
        // Update user's last login time
        await UserService.updateLastLogin(user.utorid);
        // Sign & send JWT
        const payload = { utorid, email: user.email, role: user.role };
        const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '10s' });
        const expiresAt = new Date(Date.now() + 10 * 1000).toISOString();
        res.status(200).json({ token: jwtToken, expiresAt });
        return;
    } catch (err) {
        // Internal server error
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

module.exports = {
    issueJwt,
    issueJwtDebugging,
};
