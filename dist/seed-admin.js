"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("./prisma");
dotenv_1.default.config();
// Script seed untuk membuat 1 user admin awal (Prisma).
// Jalankan: `npm run seed:admin`
async function main() {
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@local.test';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
    const passwordHash = await bcryptjs_1.default.hash(adminPassword, 10);
    const admin = await prisma_1.prisma.user.upsert({
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
