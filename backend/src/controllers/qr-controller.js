// controllers/qr-controller.js
const jwt = require('jsonwebtoken');
const { QR_SECRET } = require('../config');
const { UserService } = require('../services/users');
const { ResetTokenService } = require('../services/reset-token'); // If needed later

//--------------------------------------------------------------------------
// Utility: Sign QR Token (short-lived)
//--------------------------------------------------------------------------
function signQrToken(payload, expiresIn = '5m') {
    return jwt.sign(payload, QR_SECRET, { expiresIn });
}

//--------------------------------------------------------------------------
// Utility: Verify QR Token
//--------------------------------------------------------------------------
function verifyQrToken(token) {
    try {
        return jwt.verify(token, QR_SECRET);
    } catch (err) {
        return null;
    }
}

//--------------------------------------------------------------------------
// GET /auth/qr/user
// Returns a signed QR token that identifies the current logged-in user.
//--------------------------------------------------------------------------
async function getUserQrToken(req, res) {
    try {
        const payload = {
            type: 'user-id',
            utorid: req.user.utorid,
        };

        const token = signQrToken(payload, '5m'); // short-lived QR token

        res.status(200).json({ token });
        return;
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
        return;
    }
}

//--------------------------------------------------------------------------
// POST /auth/qr/verify
// Cashiers scan a QR → send token → backend validates & returns payload.
//--------------------------------------------------------------------------
async function verifyQrTokenEndpoint(req, res) {
    const { token } = req.body;

    if (!token) {
        res.status(400).json({ message: 'QR token is required' });
        return;
    }

    try {
        const payload = verifyQrToken(token);
        if (!payload) {
            res.status(400).json({ message: 'Invalid or expired QR token' });
            return;
        }

        // Basic sanity check: ensure it has required keys
        if (!payload.type) {
            res.status(400).json({ message: 'Malformed QR token' });
            return;
        }

        //------------------------------------------------------------------
        // Case 1: user-id QR
        //------------------------------------------------------------------
        if (payload.type === 'user-id') {
            // Optional: verify that user still exists
            const user = await UserService.getUser(payload.utorid);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.status(200).json({
                type: 'user-id',
                utorid: payload.utorid,
            });
            return;
        }

        //------------------------------------------------------------------
        // Case 2: redemption QR
        //------------------------------------------------------------------
        if (payload.type === 'redemption') {
            const { requestId } = payload;

            if (!requestId) {
                res.status(400).json({ message: 'Malformed redemption token' });
                return;
            }

            // Do NOT validate redemption existence here
            // The cashier page for processing redemption will validate it.

            res.status(200).json({
                type: 'redemption',
                requestId,
            });
            return;
        }

        //------------------------------------------------------------------
        // Unknown QR type
        //------------------------------------------------------------------
        res.status(400).json({ message: 'Unrecognized QR token type' });
        return;

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
        return;
    }
}

//--------------------------------------------------------------------------
// Export
//--------------------------------------------------------------------------
module.exports = {
    getUserQrToken,
    verifyQrTokenEndpoint,
};
