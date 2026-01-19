const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const phone = '13888888888';

    // Find the user
    const user = await prisma.user.findFirst({
        where: { phone }
    });

    if (!user) {
        console.log('User not found with phone:', phone);

        // List all users
        const allUsers = await prisma.user.findMany({
            select: { id: true, name: true, phone: true, role: true }
        });
        console.log('\nAll users:', JSON.stringify(allUsers, null, 2));
        return;
    }

    console.log('User found:');
    console.log('  - ID:', user.id);
    console.log('  - Name:', user.name);
    console.log('  - Phone:', user.phone);
    console.log('  - Role:', user.role);
    console.log('  - Password hash:', user.password ? user.password.substring(0, 20) + '...' : 'NULL');

    // Test password
    const testPassword = '123456';
    if (user.password) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`  - Password "${testPassword}" matches:`, isMatch);
    }

    // Reset password if needed
    if (!user.password || !(await bcrypt.compare(testPassword, user.password))) {
        console.log('\n  Resetting password to "123456"...');
        const newHash = await bcrypt.hash(testPassword, 10);
        await prisma.user.update({
            where: { phone },
            data: { password: newHash }
        });
        console.log('  Password reset successfully!');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
