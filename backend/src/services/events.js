const { prisma } = require('../config');

class EventService {
    static createEvent(data) {
        return prisma.event.create({
            data,
            include: {
                organizers: { select: { id: true } },
                guests: { select: { id: true } },
            },
        });
    }
    static getEvent(eventName, id) {
        const where = eventName ? { name: eventName } : { id };
        return prisma.event.findUnique({
            where,
            include: {
                organizers: { select: { id: true, utorid: true, name: true } },
                guests: { select: { id: true, utorid: true, name: true } },
            },
        });
    }
    static async getEventsByFilter(where, skip, take) {
        const prismaFilter = this._buildPrismaWhere(where);
        return prisma.event.findMany({
            where: prismaFilter,
            skip,
            take,
            include: { guests: true },
            orderBy: { startTime: 'asc' },
        });
    }
    static async getCountByFilter(where) {
        const prismaFilter = this._buildPrismaWhere(where);
        return prisma.event.count({ where: prismaFilter });
    }
    // private helper to translate plain JS 'where' object → Prisma filter
    static _buildPrismaWhere(where) {
        const prismaWhere = {};
        if (where.name) prismaWhere.name = where.name;
        if (where.location) prismaWhere.location = where.location;
        if (where.startTime) prismaWhere.startTime = where.startTime;
        if (where.endTime) prismaWhere.endTime = where.endTime;
        // handle "showFull = false"
        if (where.onlyNotFull) {
            prismaWhere.OR = [{ capacity: null }, { numGuests: { lt: prisma.event.fields.capacity } }];
        }
        if (where.published !== undefined) {
            prismaWhere.published = where.published;
        }
        return prismaWhere;
    }
    static updateEvent(id, data) {
        return prisma.event.update({
            where: { id },
            data,
        });
    }
    static deleteEvent(id) {
        return prisma.event.delete({
            where: { id },
        });
    }
    static addOrganizerToEvent(id, utorid) {
        return prisma.event.update({
            where: { id },
            data: {
                organizers: {
                    connect: { utorid },
                },
            },
            include: {
                organizers: { select: { id: true, utorid: true, name: true } },
                guests: { select: { id: true, utorid: true, name: true } },
            },
        });
    }
    static addGuestToEvent(id, utorid) {
        return prisma.event.update({
            where: { id },
            data: {
                guests: {
                    connect: { utorid },
                },
            },
            include: {
                guests: {
                    where: { utorid },
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                    },
                },
            },
        });
    }
    static incrementNumGuests(id, num) {
        return prisma.event.update({
            where: { id },
            data: { numGuests: { increment: num } },
        });
    }
    static rewardUpdate(id, amount) {
        return prisma.event.update({
            where: { id },
            data: {
                pointsRemain: { decrement: amount },
                pointsAwarded: { increment: amount },
            },
        });
    }
}

module.exports = {
    EventService,
};
