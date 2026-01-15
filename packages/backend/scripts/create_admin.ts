import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating platform admin user...');

    const passwordHash = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@example.com',
            passwordHash,
            name: '平台管理员',
            role: 'PLATFORM_ADMIN',
            isIndependent: true,
        }
    });

    console.log('✅ Platform admin created:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   ID:', admin.id);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
