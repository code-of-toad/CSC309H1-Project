const { expressjwt } = require('express-jwt');
const { JWT_SECRET } = require('../config');
const { UserService } = require('../services/users');

// console.log(JWT_SECRET);

const baseJwt = expressjwt({
    secret: JWT_SECRET,
    algorithms: ['HS256'],
    requestProperty: 'auth',
});

async function authenticateJwt(req, res, next) {
    baseJwt(req, res, async (err) => {
        if (err) {
            if (err.name === 'UnauthorizedError') {
                if (err.inner?.name === 'TokenExpiredError') {
                    res.status(401).json({ message: 'Token expired' });
                    return;
                }
                res.status(401).json({ message: 'Invalid token' });
                return;
            }
            res.status(401).json({ message: 'Invalid or missing token' });
            return;
        }
        try {
            // Get user from DB
            const user = await UserService.getUser(req.auth.utorid);
            // Attach user entry to request
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
    });
}

module.exports = {
    authenticateJwt,
};
