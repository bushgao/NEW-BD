const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // 查询所有用户
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, factoryId: true }
    });
    console.log('=== All Users ===');
    users.forEach(u => console.log(`  ${u.email} | ${u.name} | ${u.role}`));

    // 查找 pinpai001@gmail.com
    const target = await prisma.user.findUnique({
        where: { email: 'pinpai001@gmail.com' }
    });
    console.log('\n=== Target User (pinpai001@gmail.com) ===');
    console.log(target ? JSON.stringify(target, null, 2) : 'NOT FOUND');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
