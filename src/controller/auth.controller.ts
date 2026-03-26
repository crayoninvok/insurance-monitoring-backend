import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { signToken } from '../middleware/auth.middleware';

const ALLOWED_DEPARTMENTS = new Set([
  'HRGA',
  'FINANCE',
  'PROCUREMENT',
  'OPERATIONS',
  'PLANT',
  'INFRASTRUCTURE',
  'LOGISTICS',
  'TRAINING_CENTER',
  'MANAGEMENT',
]);
const ALLOWED_BRANCHES = new Set(['HEAD_OFFICE', 'SENYIUR', 'MUARA_PAHU']);
const ALLOWED_POSITIONS = new Set([
  'DIRECTOR',
  'MANAGER',
  'SUPERINTENDENT',
  'SUPERVISOR',
  'JUNIOR_SUPERVISOR',
  'WORKER',
]);
const ALLOWED_GENDERS = new Set(['MALE', 'FEMALE']);
const ALLOWED_STATUSES = new Set(['ACTIVE', 'INACTIVE']);
const ALLOWED_ROLES = new Set(['ADMIN', 'USER']);

function normalizeEnum(input: unknown) {
  return String(input ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'email dan password wajib dikirim',
        });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
          status: true,
          isDeleted: true,
        },
      });

      if (!user || user.isDeleted === 'YES' || user.status !== 'ACTIVE') {
        return res
          .status(401)
          .json({ success: false, message: 'Email atau password salah' });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res
          .status(401)
          .json({ success: false, message: 'Email atau password salah' });
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return res.json({ success: true, token });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const body = req.body as {
        firstName?: string;
        lastName?: string;
        phone?: string;
        email?: string;
        password?: string;
        gender?: 'MALE' | 'FEMALE';
        department?: any;
        branch?: any;
        position?: any;
        status?: 'ACTIVE' | 'INACTIVE';
        role?: 'ADMIN' | 'USER';
      };

      const required = [
        'firstName',
        'lastName',
        'phone',
        'email',
        'password',
        'gender',
        'department',
        'branch',
        'position',
      ] as const;

      for (const k of required) {
        if (!body[k]) {
          return res
            .status(400)
            .json({ success: false, message: `${k} wajib dikirim` });
        }
      }

      // QA/security: default create user = USER (admin tidak boleh eskalasi role lewat endpoint ini)
      const passwordHash = await bcrypt.hash(body.password!, 10);
      const branchNormalized = normalizeEnum(body.branch);
      const departmentNormalized = normalizeEnum(body.department);
      const positionNormalized = normalizeEnum(body.position);
      const genderNormalized = normalizeEnum(body.gender);
      const statusNormalized = normalizeEnum(body.status ?? 'ACTIVE');

      if (!ALLOWED_DEPARTMENTS.has(departmentNormalized)) {
        return res.status(400).json({
          success: false,
          message:
            'department tidak valid (gunakan: HRGA, FINANCE, PROCUREMENT, OPERATIONS, PLANT, INFRASTRUCTURE, LOGISTICS, TRAINING_CENTER, MANAGEMENT)',
        });
      }
      if (!ALLOWED_BRANCHES.has(branchNormalized)) {
        return res.status(400).json({
          success: false,
          message: 'branch tidak valid (gunakan: HEAD_OFFICE, SENYIUR, MUARA_PAHU)',
        });
      }
      if (!ALLOWED_POSITIONS.has(positionNormalized)) {
        return res.status(400).json({
          success: false,
          message:
            'position tidak valid (gunakan: DIRECTOR, MANAGER, SUPERINTENDENT, SUPERVISOR, JUNIOR_SUPERVISOR, WORKER)',
        });
      }
      if (!ALLOWED_GENDERS.has(genderNormalized)) {
        return res.status(400).json({
          success: false,
          message: 'gender tidak valid (gunakan: MALE atau FEMALE)',
        });
      }
      if (!ALLOWED_STATUSES.has(statusNormalized)) {
        return res.status(400).json({
          success: false,
          message: 'status tidak valid (gunakan: ACTIVE atau INACTIVE)',
        });
      }

      const created = await prisma.user.create({
        data: {
          firstName: body.firstName!,
          lastName: body.lastName!,
          phone: body.phone!,
          email: body.email!,
          password: passwordHash,
          gender: genderNormalized as any,
          department: departmentNormalized as any,
          branch: branchNormalized as any,
          position: positionNormalized as any,
          status: statusNormalized as any,
          role: 'USER',
          isDeleted: 'NO',
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return res.status(201).json({ success: true, data: created });
    } catch (e) {
      // Keep server-side trace for faster debugging while returning safe message to client.
      console.error('createUser error:', e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          return res.status(409).json({
            success: false,
            message: 'Email sudah terdaftar',
          });
        }
      }
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  async me(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const user = await prisma.user.findFirst({
        where: { id: req.user.id, isDeleted: 'NO' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          gender: true,
          department: true,
          branch: true,
          position: true,
          status: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }
      return res.json({ success: true, data: user });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  async updateMyProfile(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const body = req.body as {
        firstName?: string;
        lastName?: string;
        phone?: string;
        gender?: 'MALE' | 'FEMALE';
        password?: string;
      };

      const data: Prisma.UserUpdateInput = {};
      if (body.firstName !== undefined) data.firstName = body.firstName.trim();
      if (body.lastName !== undefined) data.lastName = body.lastName.trim();
      if (body.phone !== undefined) data.phone = body.phone.trim();
      if (body.gender !== undefined) {
        const g = normalizeEnum(body.gender);
        if (!ALLOWED_GENDERS.has(g)) {
          return res.status(400).json({ success: false, message: 'gender tidak valid (MALE/FEMALE)' });
        }
        data.gender = g as any;
      }
      if (body.password !== undefined && body.password !== '') {
        if (body.password.length < 6) {
          return res.status(400).json({ success: false, message: 'password minimal 6 karakter' });
        }
        data.password = await bcrypt.hash(body.password, 10);
      }
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada data yang diupdate' });
      }

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          gender: true,
          department: true,
          branch: true,
          position: true,
          status: true,
          role: true,
          updatedAt: true,
        },
      });
      return res.json({ success: true, data: updated });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  async adminListUsers(req: Request, res: Response) {
    try {
      const q = String(req.query.q ?? '').trim();
      const page = Math.max(1, Number(req.query.page ?? 1) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 10) || 10));
      const skip = (page - 1) * pageSize;

      const where: Prisma.UserWhereInput = {
        isDeleted: 'NO',
      };
      if (q) {
        where.OR = [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            gender: true,
            department: true,
            branch: true,
            position: true,
            status: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return res.json({
        success: true,
        data: items,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  async adminUpdateUser(req: Request, res: Response) {
    try {
      const id = String(req.params.id ?? '').trim();
      if (!id) {
        return res.status(400).json({ success: false, message: 'id user wajib dikirim' });
      }
      const existing = await prisma.user.findFirst({
        where: { id, isDeleted: 'NO' },
        select: { id: true, position: true },
      });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }
      const body = req.body as {
        firstName?: string;
        lastName?: string;
        phone?: string;
        email?: string;
        gender?: 'MALE' | 'FEMALE';
        department?: string;
        branch?: string;
        position?: string;
        status?: 'ACTIVE' | 'INACTIVE';
        role?: 'ADMIN' | 'USER';
        password?: string;
      };
      let nextRole: 'ADMIN' | 'USER' | null = null;
      let nextPosition: string | null = null;

      const data: Prisma.UserUpdateInput = {};
      if (body.firstName !== undefined) data.firstName = body.firstName.trim();
      if (body.lastName !== undefined) data.lastName = body.lastName.trim();
      if (body.phone !== undefined) data.phone = body.phone.trim();
      if (body.email !== undefined) data.email = body.email.trim();

      if (body.gender !== undefined) {
        const v = normalizeEnum(body.gender);
        if (!ALLOWED_GENDERS.has(v)) {
          return res.status(400).json({ success: false, message: 'gender tidak valid (MALE/FEMALE)' });
        }
        data.gender = v as any;
      }
      if (body.department !== undefined) {
        const v = normalizeEnum(body.department);
        if (!ALLOWED_DEPARTMENTS.has(v)) {
          return res.status(400).json({ success: false, message: 'department tidak valid' });
        }
        data.department = v as any;
      }
      if (body.branch !== undefined) {
        const v = normalizeEnum(body.branch);
        if (!ALLOWED_BRANCHES.has(v)) {
          return res.status(400).json({ success: false, message: 'branch tidak valid' });
        }
        data.branch = v as any;
      }
      if (body.position !== undefined) {
        const v = normalizeEnum(body.position);
        if (!ALLOWED_POSITIONS.has(v)) {
          return res.status(400).json({ success: false, message: 'position tidak valid' });
        }
        data.position = v as any;
        nextPosition = v;
      }
      if (body.status !== undefined) {
        const v = normalizeEnum(body.status);
        if (!ALLOWED_STATUSES.has(v)) {
          return res.status(400).json({ success: false, message: 'status tidak valid' });
        }
        data.status = v as any;
      }
      if (body.role !== undefined) {
        const v = normalizeEnum(body.role);
        if (!ALLOWED_ROLES.has(v)) {
          return res.status(400).json({ success: false, message: 'role tidak valid (ADMIN/USER)' });
        }
        data.role = v as any;
        nextRole = v as 'ADMIN' | 'USER';
      }
      if (body.password !== undefined && body.password !== '') {
        if (body.password.length < 6) {
          return res.status(400).json({ success: false, message: 'password minimal 6 karakter' });
        }
        data.password = await bcrypt.hash(body.password, 10);
      }
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada data yang diupdate' });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const userUpdated = await tx.user.update({
          where: { id },
          data,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            gender: true,
            department: true,
            branch: true,
            position: true,
            status: true,
            role: true,
            updatedAt: true,
          },
        });

        const targetPosition = nextPosition ?? existing.position;
        const positionChanged = targetPosition !== existing.position;
        // Auto-sync plafon allocated ketika posisi berubah (spent tetap).
        if (positionChanged) {
          const [legacyBalances, rjBalances, melBalances, riEpisodeBalances] = await Promise.all([
            tx.budgetBalance.findMany({
              where: { userId: id },
              select: { id: true, year: true },
            }),
            tx.rawatJalanBalance.findMany({
              where: { userId: id },
              select: { id: true, year: true },
            }),
            tx.melahirkanBalance.findMany({
              where: { userId: id },
              select: { id: true, year: true },
            }),
            tx.rawatInapEpisodeBalance.findMany({
              where: { episode: { userId: id } },
              select: { id: true, serviceType: true, episode: { select: { year: true } } },
            }),
          ]);

          for (const b of legacyBalances) {
            const p = await tx.budgetPolicy.findUnique({
              where: { year_position: { year: b.year, position: targetPosition as any } },
              select: { annualAmount: true },
            });
            if (p) {
              await tx.budgetBalance.update({
                where: { id: b.id },
                data: { allocated: p.annualAmount },
              });
            }
          }

          for (const b of rjBalances) {
            const p = await tx.rawatJalanPolicy.findUnique({
              where: { year_position: { year: b.year, position: targetPosition as any } },
              select: { annualAmount: true },
            });
            if (p) {
              await tx.rawatJalanBalance.update({
                where: { id: b.id },
                data: { allocated: p.annualAmount },
              });
            }
          }

          for (const b of melBalances) {
            const p = await tx.melahirkanPolicy.findUnique({
              where: { year_position: { year: b.year, position: targetPosition as any } },
              select: { annualAmount: true },
            });
            if (p) {
              await tx.melahirkanBalance.update({
                where: { id: b.id },
                data: { allocated: p.annualAmount },
              });
            }
          }

          for (const b of riEpisodeBalances) {
            const p = await tx.rawatInapPolicy.findUnique({
              where: {
                year_position_serviceType: {
                  year: b.episode.year,
                  position: targetPosition as any,
                  serviceType: b.serviceType,
                },
              },
              select: { capAmount: true },
            });
            if (p) {
              await tx.rawatInapEpisodeBalance.update({
                where: { id: b.id },
                data: { allocated: p.capAmount },
              });
            }
          }
        }

        // keep variable used to avoid lint of nextRole in case future logic needs it
        void nextRole;
        return userUpdated;
      });

      return res.json({ success: true, data: updated });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
        }
        if (e.code === 'P2025') {
          return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
      }
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  async adminDeleteUser(req: Request, res: Response) {
    try {
      const id = String(req.params.id ?? '').trim();
      if (!id) {
        return res.status(400).json({ success: false, message: 'id user wajib dikirim' });
      }
      await prisma.user.delete({
        where: { id },
      });
      return res.json({ success: true, message: 'User berhasil dihapus permanen' });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }
}

