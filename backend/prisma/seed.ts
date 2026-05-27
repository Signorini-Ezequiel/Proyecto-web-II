import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../src/common/constants/auth.constants';

const prisma = new PrismaClient();

const demoUsers = [
  {
    name: 'Buyer Demo',
    email: 'buyer@autopoint.com',
    password: 'buyer123',
    role: UserRole.BUYER,
  },
  {
    name: 'Seller Demo',
    email: 'seller@autopoint.com',
    password: 'seller123',
    role: UserRole.SELLER,
  },
] as const;

async function main(): Promise<void> {
  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: passwordHash,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        password: passwordHash,
        role: user.role,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Error seeding demo users:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
