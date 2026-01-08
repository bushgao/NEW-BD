const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        factoryId: true,
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('=== 所有用户 ===');
    users.forEach(user => {
      console.log(`${user.role}: ${user.name} (${user.email}) - ${user.status}`);
    });
    console.log(`\n总共 ${users.length} 个用户`);
    console.log('==================');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();
