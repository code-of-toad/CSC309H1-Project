const { prisma } = require('../config');

class UserService {
    static createUser(data) {
        return prisma.user.create({
            data,
        });
    }
    // static activateUser(utorid) {
    //     return prisma.user.update({
    //         where: { utorid },
    //         data: { activated: true },
    //     });
    // }
    static getUser(utorid, id) {
        // USAGE:
        // ---------------------------------------------------
        // UserService.getUser('handong5'); // finds by utorid
        // UserService.getUser(null, 7);    // finds by id
        // ---------------------------------------------------
        if (!utorid && !id) {
            throw new Error(
                "Invalid parameters\nUsage: 'UserService.getUser(\"utorid\")' or 'UserService.getUser(null, id)'",
            );
        }
        const where = utorid ? { utorid } : { id };
        return prisma.user.findUnique({
            where,
        });
    }
    static getUserAndRelations(utorid, id) {
        // USAGE:
        // ---------------------------------------------------
        // UserService.getUser('handong5'); // finds by utorid
        // UserService.getUser(null, 7);    // finds by id
        // ---------------------------------------------------
        if (!utorid && !id) {
            throw new Error(
                "Invalid parameters\nUsage: 'UserService.getUser(\"utorid\")' or 'UserService.getUser(null, id)'",
            );
        }
        const where = utorid ? { utorid } : { id };
        return prisma.user.findUnique({
            where,
            include: {
                transactions: true,
                promotions: true,
                organizedEvents: true,
                guestEvents: true,
            },
        });
    }
    static updatePassword(utorid, password) {
        return prisma.user.update({
            where: { utorid },
            data: { password },
        });
    }
    static updateLastLogin(utorid) {
        return prisma.user.update({
            where: { utorid },
            data: { lastLogin: new Date() },
        });
    }
    static updateUserInfo(utorid, data) {
        return prisma.user.update({
            where: { utorid },
            data,
        });
    }
    static getUsersByFilter(where, select, skip, take) {
        return prisma.user.findMany({
            where,
            select,
            skip,
            take,
            orderBy: { id: 'asc' }, // Optional, but consistent
        });
    }
    static getCountByFilter(where) {
        return prisma.user.count({ where });
    }
    static incrementPoints(utorid, points) {
        return prisma.user.update({
            where: { utorid },
            data: { points: { increment: points } },
        });
    }
    static addPromosToUser(utorid, promoIds) {
        return prisma.user.update({
            where: { utorid },
            data: {
                promotions: {
                    connect: promoIds,
                },
            },
        });
    }
}

module.exports = {
    UserService,
};
