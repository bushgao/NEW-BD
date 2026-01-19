const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = 'ce703b2f-416b-40a8-9674-89a680c5d53b';
    const newPassword = '123456';
    const phone = '13888888888';

    const hash = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            passwordHash: hash,
            phone: phone  // Set phone field so login by phone works
        }
    });

    console.log('User updated successfully!');
    console.log('Name:', updated.name);
    console.log('Email:', updated.email);
    console.log('Phone:', updated.phone);
    console.log('Password reset to:', newPassword);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
