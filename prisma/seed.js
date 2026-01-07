const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create a demo user
  const hashedPassword = await bcrypt.hash('password', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
      projects: {
        create: {
          name: 'Sample Project',
          description: 'A sample project for demonstration',
          sessions: {
            create: {
              startTime: new Date('2023-01-01T10:00:00Z'),
              endTime: new Date('2023-01-01T12:00:00Z'),
              duration: 7200000, // 2 hours in ms
              records: {
                create: {
                  text: 'Worked on initial setup',
                  timestamp: new Date('2023-01-01T10:30:00Z'),
                },
              },
            },
          },
        },
      },
    },
  });

  console.log('Seeded demo user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });