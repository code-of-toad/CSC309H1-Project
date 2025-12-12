function authorizeClearance(allowedRoles = []) {
    return (req, res, next) => {
        // Ensure user and role are defined
        if (!req.user || !req.user.role) {
            res.status(401).json({ error: 'Unauthorized: Missing user credentials' });
            return;
        }
        // Check if user has clearance
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden: Insufficient clearance' });
            return;
        }
        next();
    };
}

module.exports = {
    authorizeClearance,
};
