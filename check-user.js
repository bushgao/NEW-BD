const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'staff@demo.com' },
      include: { factory: true }
    });
    
    console.log('=== 商务人员数据 ===');
    console.log(JSON.stringify(user, null, 2));
    console.log('==================');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
