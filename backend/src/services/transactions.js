const { prisma } = require('../config');

class TransactionService {
    static createTrx(data) {
        return prisma.transaction.create({
            data,
        });
    }
    static getTrx(id) {
        return prisma.transaction.findUnique({
            where: { id },
        });
    }
    static getTrxAndRelations(id) {
        return prisma.transaction.findUnique({
            where: { id },
            include: {
                user: true,
                promotions: true,
            },
        });
    }
    static updateTrx(id, data) {
        return prisma.transaction.update({
            data,
            where: { id },
        });
    }
    static getTrxsByFilter(where, select, skip, take) {
        return prisma.transaction.findMany({
            where,
            select,
            skip,
            take,
            orderBy: { id: 'asc' }, // Optional, but consistent
        });
    }
    static getCountByFilter(where) {
        return prisma.transaction.count({ where });
    }
}

module.exports = {
    TransactionService,
};
