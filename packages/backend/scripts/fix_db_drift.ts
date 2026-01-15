import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up database schema drift...');
    try {
        // Drop the table that is blocking the enum alteration
        // We use CASCADE to remove dependencies
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "GlobalInfluencer" CASCADE;`);
        console.log('✅ Dropped table "GlobalInfluencer"');
    } catch (e) {
        console.error('Error dropping table:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
