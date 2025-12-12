/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example:
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const { PrismaClient, RoleType } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

(async () => {
    const args = process.argv;
    if (args.length !== 5) {
        console.error('usage: node prisma/createsu.js <utorid> <email> <password>');
        process.exit(1);
    }
    const utorid = args[2];
    const email = args[3];
    const password = await bcrypt.hash(args[4], 10);
    try {
        const superuser = await prisma.user.create({
            data: {
                role: RoleType.superuser,
                name: 'Flynn White',
                utorid,
                email,
                password,
                verified: true,
                activated: true,
            },
        });
        console.log(superuser);
    } catch (err) {
        console.error(err);
    }
})();
