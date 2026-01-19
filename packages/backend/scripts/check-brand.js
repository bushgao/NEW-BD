const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // List all brands with owner info
    const brands = await prisma.brand.findMany({
        include: {
            owner: true
        }
    });

    console.log('Brands and their owners:');
    for (const brand of brands) {
        console.log(`\nBrand: ${brand.name}`);
        console.log(`  Email: ${brand.email}`);
        if (brand.owner) {
            console.log(`  Owner ID: ${brand.owner.id}`);
            console.log(`  Owner Name: ${brand.owner.name}`);
            console.log(`  Owner Email: ${brand.owner.email}`);
            console.log(`  Owner Phone: ${brand.owner.phone}`);
        } else {
            console.log('  No owner linked');
        }
    }

    // List all users with email containing 13888888888
    console.log('\n\nSearching for users with 13888888888...');
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: '13888888888' } },
                { phone: { contains: '13888888888' } }
            ]
        }
    });
    console.log('Found users:', users);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
