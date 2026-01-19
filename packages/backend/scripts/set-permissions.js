const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find users with '品牌商务测试' name or phone containing '1380'
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: '品牌商务测试' },
                { phone: { contains: '1380' } }
            ]
        },
        select: {
            id: true,
            phone: true,
            name: true,
            role: true,
            permissions: true
        }
    });

    console.log('Found users:');
    console.log(JSON.stringify(users, null, 2));

    // Define permissions to set
    const permissions = {
        advanced: {
            viewROIData: true,
            viewCostData: true,
            modifyOthersData: false
        },
        operations: {
            exportData: true,
            manageSamples: true,
            batchOperations: false,
            manageInfluencers: true,
            deleteCollaborations: false,
            manageCollaborations: true
        },
        dataVisibility: {
            viewRanking: true,
            viewTeamData: false,
            viewOthersInfluencers: false,
            viewOthersPerformance: false,
            viewOthersCollaborations: false
        }
    };

    // Update '品牌商务测试' user if found
    const targetUser = users.find(u => u.name === '品牌商务测试');
    if (targetUser) {
        console.log(`\nUpdating permissions for user: ${targetUser.name} (${targetUser.id})`);

        const updated = await prisma.user.update({
            where: { id: targetUser.id },
            data: { permissions },
            select: {
                id: true,
                name: true,
                permissions: true
            }
        });

        console.log('Updated user:');
        console.log(JSON.stringify(updated, null, 2));
    } else {
        console.log('\nNo user found with name "品牌商务测试"');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
