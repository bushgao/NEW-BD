const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const newPassword = '123456';
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updated = await prisma.user.update({
        where: { email: 'pinpai001@gmail.com' },
        data: { passwordHash }
    });

    console.log('✅ Password reset successfully for:', updated.email);
    console.log('   New password: 123456');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
