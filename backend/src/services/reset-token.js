const { prisma } = require('../config');

class ResetTokenService {
    static createToken(utorid, token, expiresAt) {
        return prisma.resetToken.create({
            data: {
                utorid,
                token,
                expiresAt,
            },
        });
    }
    static getToken(token) {
        return prisma.resetToken.findUnique({
            where: { token },
        });
    }
    static deleteTokens(utorid) {
        return prisma.resetToken.deleteMany({
            where: { utorid },
        });
    }
}

module.exports = {
    ResetTokenService,
};
