import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

dotenv.config();

// Script seed untuk membuat 1 user admin awal (Prisma).
// Jalankan: `npm run seed:admin`
async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@local.test';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName: 'Admin',
      lastName: 'Utama',
      phone: '081234567890',
      password: passwordHash,
      gender: 'MALE',
      department: 'HRGA',
      branch: 'HEAD_OFFICE',
      position: 'MANAGER',
      status: 'ACTIVE',
      role: 'ADMIN',
      isDeleted: 'NO',
    },
    create: {
      firstName: 'Admin',
      lastName: 'Utama',
      phone: '081234567890',
      email: adminEmail,
      password: passwordHash,
      gender: 'MALE',
      department: 'HRGA',
      branch: 'HEAD_OFFICE',
      position: 'MANAGER',
      status: 'ACTIVE',
      role: 'ADMIN',
      isDeleted: 'NO',
    },
    select: { id: true, email: true, role: true },
  });

  console.log('Seed admin selesai:', admin);
}

main().catch((e) => {
  console.error('Seed admin gagal:', e);
  process.exit(1);
});

