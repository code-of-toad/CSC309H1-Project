/*
 * If you need to initialize your database with some data, you may write a script
 * to do so here.
 */
'use strict';

const { PrismaClient, RoleType } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function createSuperuser(name, utorid, email, password, verified, suspicious) {
    try {
        const superuser = await prisma.user.create({
            data: {
                role: RoleType.superuser,
                name,
                utorid,
                email,
                password: await bcrypt.hash(password, 10),
                verified,
                suspicious,
            },
        });
        console.log(superuser);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function createManager(name, utorid, email, password, verified, suspicious) {
    try {
        const manager = await prisma.user.create({
            data: {
                role: RoleType.manager,
                name,
                utorid,
                email,
                password: await bcrypt.hash(password, 10),
                verified,
                suspicious,
            },
        });
        console.log(manager);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function createCashier(name, utorid, email, password, verified, suspicious) {
    try {
        const cashier = await prisma.user.create({
            data: {
                role: RoleType.cashier,
                name,
                utorid,
                email,
                password: await bcrypt.hash(password, 10),
                verified,
                suspicious,
            },
        });
        console.log(cashier);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function createRegularUser(name, utorid, email, password, verified, suspicious) {
    try {
        const regularUser = await prisma.user.create({
            data: {
                role: RoleType.regular,
                name,
                utorid,
                email,
                password: await bcrypt.hash(password, 10),
                verified,
                suspicious,
            },
        });
        console.log(regularUser);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function main() {
    await createSuperuser(
        'Flynn White', // name
        'flynnw7', // utorid
        'flynn.white@mail.utoronto.ca', // email
        'Abcdef1!', // password
        true, // verified
        false, // suspicious
    );
    await createManager(
        'Peter Parker', // name
        'parker7', // utorid
        'sp0derman@mail.utoronto.ca', // email
        'Abcdef1!', // password
        true, // verified
        false, // suspicious
    );
    await createManager(
        'Goblin Junior', // name
        'osborne7', // utorid
        'gonna.cry@mail.utoronto.ca', // email
        'Abcdef1!', // password
        true, // verified
        true, // suspicious
    );
    await createCashier(
        'Tyler, the Cashier', // name
        'goblin7', // utorid
        'cashier.tyler@mail.utoronto.ca', // email
        'Abcdef1!', // password
        true, // verified
        false, // suspicious
    );
    await createCashier(
        'McLovin', // name
        'mclovin7', // utorid
        'hawaiian.organ.donor@mail.utoronto.ca', // email
        'Abcdef1!', // password
        true, // verified
        true, // suspicious
    );
    await createRegularUser(
        'Gustavo Fring', // name
        'gusfring', // utorid
        'pollos.hermanos@mail.utoronto.ca', // email
        'Abcdef1!', // password
        true, // verified
        false, // suspicious
    );
    await createRegularUser(
        'Walter White', // name
        'walterw7', // utorid
        'walter.white@mail.utoronto.ca', // email
        'Abcdef1!', // password
        true, // verified
        false, // suspicious
    );
    await createRegularUser(
        'Jesse Pinkman', // name
        'cptncook', // utorid
        'swed420@mail.utoronto.ca', // email
        'Abcdef1!', // password
        true, // verified
        false, // suspicious
    );
    await createRegularUser(
        'Suspicious Lickity', // name
        'lickity7', // utorid
        'sus.lickity@mail.utoronto.ca', // email
        'Abcdef1!', // password
        true, // verified
        true, // suspicious
    );
    await createRegularUser(
        'Unverified User', // name
        'unverif', // utorid
        'unverified.user@mail.utoronto.ca', // email
        'Abcdef1!', // password
        false, // verified
        false, // suspicious
    );
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
