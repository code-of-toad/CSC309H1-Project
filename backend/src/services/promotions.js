const { prisma } = require('../config');

class PromotionService {
    static createPromo(data) {
        return prisma.promotion.create({ data });
    }
    static getPromo(id) {
        return prisma.promotion.findUnique({
            where: { id },
        });
    }
    static updatePromo(id, data) {
        return prisma.promotion.update({
            where: { id },
            data,
        });
    }
    static deletePromo(id) {
        return prisma.promotion.delete({
            where: { id },
        });
    }
    static getPromosByFilter(where, select, skip, take) {
        return prisma.promotion.findMany({
            where,
            select,
            skip,
            take,
            orderBy: { id: 'asc' }, // Optional, but consistent
        });
    }
    static getCountByFilter(where) {
        return prisma.promotion.count({ where });
    }
}

module.exports = {
    PromotionService,
};

// const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
