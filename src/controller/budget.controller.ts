import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

function currentYear() {
  return new Date().getFullYear();
}

function toDecimalInput(amount: number | string) {
  // Prisma Decimal input dapat menerima string/number.
  if (typeof amount === 'number') return amount;
  return amount;
}

type BenefitType = 'RAWAT_JALAN' | 'RAWAT_INAP' | 'MELAHIRKAN';
type RawatInapServiceType = 'TARIF_KAMAR_DAYS' | 'TANPA_OPERASI' | 'OPERASI';

function normalizeEnum(input: unknown) {
  if (input === undefined || input === null || input === '') return null;
  return String(input).trim().toUpperCase();
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? 'dvkc8sxpf',
  api_key: process.env.CLOUDINARY_API_KEY ?? '864916714767455',
  api_secret: process.env.CLOUDINARY_API_SECRET ?? 'WpArqR6GW61DEA8jIc_MDv3t0yg',
});

export class BudgetController {
  async adminUploadSpendDocument(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'File wajib dikirim' });
      }

      const uploaded = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'insurance-projects-docs',
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error('Gagal upload ke Cloudinary'));
              return;
            }
            resolve(result as any);
          },
        );
        stream.end(file.buffer);
      });

      return res.json({
        success: true,
        data: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          originalName: file.originalname,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Gagal upload dokumen',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  // ADMIN: set policy budget per position per year
  async upsertPolicy(req: Request, res: Response) {
    try {
      const body = req.body as {
        year?: number;
        position?: any;
        annualAmount?: number | string;
      };

      const year = body.year ?? currentYear();
      const position = body.position;
      const annualAmount = body.annualAmount;

      if (!position) {
        return res
          .status(400)
          .json({ success: false, message: 'position wajib dikirim' });
      }
      if (annualAmount === undefined || annualAmount === null || annualAmount === '') {
        return res
          .status(400)
          .json({ success: false, message: 'annualAmount wajib dikirim' });
      }

      const policy = await prisma.budgetPolicy.upsert({
        where: { year_position: { year, position } },
        update: { annualAmount: toDecimalInput(annualAmount) },
        create: { year, position, annualAmount: toDecimalInput(annualAmount) },
        select: { id: true, year: true, position: true, annualAmount: true },
      });

      return res.json({
        success: true,
        data: {
          ...policy,
          annualAmount: policy.annualAmount.toString(),
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

  // ADMIN: list policies by year
  async listPolicies(req: Request, res: Response) {
    try {
      const year = req.query.year ? Number(req.query.year) : currentYear();
      const data = await prisma.budgetPolicy.findMany({
        where: { year },
        orderBy: [{ position: 'asc' }],
        select: { id: true, year: true, position: true, annualAmount: true },
      });

      return res.json({
        success: true,
        data: data.map((p) => ({
          ...p,
          annualAmount: p.annualAmount.toString(),
        })),
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

  // ADMIN: Rawat Jalan policy (annual pool per position)
  async upsertRawatJalanPolicy(req: Request, res: Response) {
    try {
      const body = req.body as { year?: number; position?: any; annualAmount?: number | string };
      const year = body.year ?? currentYear();
      const position = body.position;
      const annualAmount = body.annualAmount;

      if (!position) return res.status(400).json({ success: false, message: 'position wajib dikirim' });
      if (annualAmount === undefined || annualAmount === null || annualAmount === '') {
        return res.status(400).json({ success: false, message: 'annualAmount wajib dikirim' });
      }

      const policy = await prisma.rawatJalanPolicy.upsert({
        where: { year_position: { year, position } },
        update: { annualAmount: toDecimalInput(annualAmount) },
        create: { year, position, annualAmount: toDecimalInput(annualAmount) },
        select: { id: true, year: true, position: true, annualAmount: true },
      });

      return res.json({
        success: true,
        data: { ...policy, annualAmount: policy.annualAmount.toString() },
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

  async listRawatJalanPolicies(req: Request, res: Response) {
    try {
      const year = req.query.year ? Number(req.query.year) : currentYear();
      const data = await prisma.rawatJalanPolicy.findMany({
        where: { year },
        orderBy: [{ position: 'asc' }],
        select: { id: true, year: true, position: true, annualAmount: true },
      });
      return res.json({
        success: true,
        data: data.map((p) => ({ ...p, annualAmount: p.annualAmount.toString() })),
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

  // ADMIN: Melahirkan policy (annual pool per position, FEMALE only usage)
  async upsertMelahirkanPolicy(req: Request, res: Response) {
    try {
      const body = req.body as { year?: number; position?: any; annualAmount?: number | string };
      const year = body.year ?? currentYear();
      const position = body.position;
      const annualAmount = body.annualAmount;

      if (!position) return res.status(400).json({ success: false, message: 'position wajib dikirim' });
      if (annualAmount === undefined || annualAmount === null || annualAmount === '') {
        return res.status(400).json({ success: false, message: 'annualAmount wajib dikirim' });
      }

      const policy = await prisma.melahirkanPolicy.upsert({
        where: { year_position: { year, position } },
        update: { annualAmount: toDecimalInput(annualAmount) },
        create: { year, position, annualAmount: toDecimalInput(annualAmount) },
        select: { id: true, year: true, position: true, annualAmount: true },
      });

      return res.json({
        success: true,
        data: { ...policy, annualAmount: policy.annualAmount.toString() },
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

  async listMelahirkanPolicies(req: Request, res: Response) {
    try {
      const year = req.query.year ? Number(req.query.year) : currentYear();
      const data = await prisma.melahirkanPolicy.findMany({
        where: { year },
        orderBy: [{ position: 'asc' }],
        select: { id: true, year: true, position: true, annualAmount: true },
      });
      return res.json({
        success: true,
        data: data.map((p) => ({ ...p, annualAmount: p.annualAmount.toString() })),
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

  // ADMIN: Rawat Inap policy (caps per position per service type)
  async upsertRawatInapPolicy(req: Request, res: Response) {
    try {
      const body = req.body as {
        year?: number;
        position?: any;
        serviceType?: RawatInapServiceType | string;
        capAmount?: number | string;
      };

      const year = body.year ?? currentYear();
      const position = body.position;
      const serviceType = normalizeEnum(body.serviceType) as RawatInapServiceType | null;
      const capAmount = body.capAmount;

      if (!position) return res.status(400).json({ success: false, message: 'position wajib dikirim' });
      if (!serviceType) return res.status(400).json({ success: false, message: 'serviceType wajib dikirim' });
      if (capAmount === undefined || capAmount === null || capAmount === '') {
        return res.status(400).json({ success: false, message: 'capAmount wajib dikirim' });
      }

      const allowed: RawatInapServiceType[] = ['TARIF_KAMAR_DAYS', 'TANPA_OPERASI', 'OPERASI'];
      if (!allowed.includes(serviceType)) {
        return res.status(400).json({ success: false, message: 'serviceType tidak valid' });
      }

      const policy = await prisma.rawatInapPolicy.upsert({
        where: { year_position_serviceType: { year, position, serviceType } },
        update: { capAmount: toDecimalInput(capAmount) },
        create: { year, position, serviceType, capAmount: toDecimalInput(capAmount) },
        select: { id: true, year: true, position: true, serviceType: true, capAmount: true },
      });

      return res.json({
        success: true,
        data: { ...policy, capAmount: policy.capAmount.toString() },
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

  async listRawatInapPolicies(req: Request, res: Response) {
    try {
      const year = req.query.year ? Number(req.query.year) : currentYear();
      const data = await prisma.rawatInapPolicy.findMany({
        where: { year },
        orderBy: [{ position: 'asc' }, { serviceType: 'asc' }],
        select: { id: true, year: true, position: true, serviceType: true, capAmount: true },
      });
      return res.json({
        success: true,
        data: data.map((p) => ({ ...p, capAmount: p.capAmount.toString() })),
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

  // ADMIN: Rawat Jalan medical lookup (admin-maintained dropdown)
  async listRawatJalanMedicals(req: Request, res: Response) {
    try {
      const onlyActive = req.query.active === undefined ? true : String(req.query.active) !== 'false';
      const data = await prisma.rawatJalanMedical.findMany({
        where: onlyActive ? { isActive: true } : undefined,
        orderBy: [{ name: 'asc' }],
        select: { id: true, name: true, isActive: true, createdAt: true, updatedAt: true },
      });
      return res.json({
        success: true,
        data: data.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
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

  async createRawatJalanMedical(req: Request, res: Response) {
    try {
      const body = req.body as { name?: string };
      const name = (body.name ?? '').trim();
      if (!name) return res.status(400).json({ success: false, message: 'name wajib dikirim' });

      const created = await prisma.rawatJalanMedical.create({
        data: { name, isActive: true },
        select: { id: true, name: true, isActive: true, createdAt: true, updatedAt: true },
      });

      return res.status(201).json({
        success: true,
        data: {
          ...created,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      const isUnique = e instanceof Error && e.message.toLowerCase().includes('unique');
      return res.status(isUnique ? 409 : 500).json({
        success: false,
        message: isUnique ? 'Medical name sudah ada' : 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  async setRawatJalanMedicalActive(req: Request, res: Response) {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : '';
      if (!id) return res.status(400).json({ success: false, message: 'id wajib dikirim' });

      const body = req.body as { isActive?: boolean };
      if (typeof body.isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isActive wajib boolean' });
      }

      const updated = await prisma.rawatJalanMedical.update({
        where: { id },
        data: { isActive: body.isActive },
        select: { id: true, name: true, isActive: true, createdAt: true, updatedAt: true },
      });

      return res.json({
        success: true,
        data: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
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

  // Rawat Inap episode options (admin CRUD; semua user bisa GET opsi aktif)
  async listRawatInapEpisodeOptions(req: Request, res: Response) {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const onlyActive = !isAdmin ? true : String(req.query.active ?? 'true') !== 'false';

      const data = await prisma.rawatInapEpisodeOption.findMany({
        where: onlyActive ? { isActive: true } : undefined,
        orderBy: [{ name: 'asc' }],
        select: { id: true, name: true, isActive: true, createdAt: true, updatedAt: true },
      });
      return res.json({
        success: true,
        data: data.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
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

  async createRawatInapEpisodeOption(req: Request, res: Response) {
    try {
      const body = req.body as { name?: string };
      const name = (body.name ?? '').trim();
      if (!name) return res.status(400).json({ success: false, message: 'name wajib dikirim' });

      const created = await prisma.rawatInapEpisodeOption.create({
        data: { name, isActive: true },
        select: { id: true, name: true, isActive: true, createdAt: true, updatedAt: true },
      });

      return res.status(201).json({
        success: true,
        data: {
          ...created,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      const isUnique = e instanceof Error && e.message.toLowerCase().includes('unique');
      return res.status(isUnique ? 409 : 500).json({
        success: false,
        message: isUnique ? 'Nama episode option sudah ada' : 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  async setRawatInapEpisodeOptionActive(req: Request, res: Response) {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : '';
      if (!id) return res.status(400).json({ success: false, message: 'id wajib dikirim' });

      const body = req.body as { isActive?: boolean };
      if (typeof body.isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isActive wajib boolean' });
      }

      const updated = await prisma.rawatInapEpisodeOption.update({
        where: { id },
        data: { isActive: body.isActive },
        select: { id: true, name: true, isActive: true, createdAt: true, updatedAt: true },
      });

      return res.json({
        success: true,
        data: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
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

  // ADMIN: create/list Rawat Inap episodes (caps enforced per episode and service type)
  async adminCreateRawatInapEpisode(req: Request, res: Response) {
    try {
      const body = req.body as { userId?: string; year?: number; rawatInapEpisodeOptionId?: string };
      const userId = (body.userId ?? '').trim();
      if (!userId) return res.status(400).json({ success: false, message: 'userId wajib dikirim' });

      const year = body.year ? Number(body.year) : currentYear();
      const rawatInapEpisodeOptionId = (body.rawatInapEpisodeOptionId ?? '').trim();
      if (!rawatInapEpisodeOptionId) {
        return res.status(400).json({ success: false, message: 'rawatInapEpisodeOptionId wajib dikirim' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, position: true, status: true, isDeleted: true },
        });
        if (!user || user.isDeleted === 'YES' || user.status !== 'ACTIVE') {
          throw new Error('User tidak aktif/valid');
        }

        const option = await tx.rawatInapEpisodeOption.findUnique({
          where: { id: rawatInapEpisodeOptionId },
          select: { id: true, isActive: true },
        });
        if (!option || option.isActive !== true) {
          throw new Error('Episode option tidak valid atau tidak aktif');
        }

        const serviceTypes: RawatInapServiceType[] = ['TARIF_KAMAR_DAYS', 'TANPA_OPERASI', 'OPERASI'];
        const policies = await tx.rawatInapPolicy.findMany({
          where: { year, position: user.position, serviceType: { in: serviceTypes as any } },
          select: { serviceType: true, capAmount: true },
        });

        const capMap = new Map<string, any>();
        for (const p of policies) capMap.set(p.serviceType, p.capAmount);
        for (const st of serviceTypes) {
          if (!capMap.has(st)) {
            throw new Error(`Rawat Inap policy belum diset untuk year=${year} position=${user.position} serviceType=${st}`);
          }
        }

        const episode = await tx.rawatInapEpisode.create({
          data: { userId: user.id, year, rawatInapEpisodeOptionId: option.id },
          select: {
            id: true,
            userId: true,
            year: true,
            rawatInapEpisodeOptionId: true,
            createdAt: true,
            episodeOption: { select: { id: true, name: true } },
          },
        });

        const balances = await tx.rawatInapEpisodeBalance.createManyAndReturn({
          data: serviceTypes.map((st) => ({
            episodeId: episode.id,
            serviceType: st as any,
            allocated: capMap.get(st),
            spent: 0,
          })),
          select: { id: true, serviceType: true, allocated: true, spent: true },
        });

        await tx.budgetLedger.createMany({
          data: serviceTypes.map((st) => ({
            userId: user.id,
            year,
            type: 'ALLOCATE',
            amount: capMap.get(st),
            benefitType: 'RAWAT_INAP',
            rawatInapEpisodeId: episode.id,
            rawatInapServiceType: st as any,
            note: `Initial allocation (Rawat Inap ${st})`,
          })),
        });

        return { episode, balances };
      });

      return res.status(201).json({
        success: true,
        data: {
          episode: {
            id: result.episode.id,
            userId: result.episode.userId,
            year: result.episode.year,
            rawatInapEpisodeOptionId: result.episode.rawatInapEpisodeOptionId,
            sickConditionLabel: result.episode.episodeOption.name,
            createdAt: result.episode.createdAt.toISOString(),
          },
          balances: result.balances.map((b) => ({
            ...b,
            allocated: b.allocated.toString(),
            spent: b.spent.toString(),
          })),
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      const isClient =
        e instanceof Error &&
        (e.message.toLowerCase().includes('policy') ||
          e.message.toLowerCase().includes('episode option'));
      return res.status(isClient ? 400 : 500).json({
        success: false,
        message: isClient ? (e as Error).message : 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  async adminListRawatInapEpisodes(req: Request, res: Response) {
    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
      if (!userId) return res.status(400).json({ success: false, message: 'userId wajib dikirim' });
      const year = req.query.year ? Number(req.query.year) : currentYear();

      const data = await prisma.rawatInapEpisode.findMany({
        where: { userId, year },
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          userId: true,
          year: true,
          rawatInapEpisodeOptionId: true,
          createdAt: true,
          episodeOption: { select: { id: true, name: true } },
        },
      });

      return res.json({
        success: true,
        data: data.map((e) => ({
          id: e.id,
          userId: e.userId,
          year: e.year,
          rawatInapEpisodeOptionId: e.rawatInapEpisodeOptionId,
          sickConditionLabel: e.episodeOption.name,
          createdAt: e.createdAt.toISOString(),
        })),
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

  // USER: get my budget balance for year (auto-create if missing)
  async getMyBudget(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const year = req.query.year ? Number(req.query.year) : currentYear();

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, position: true, gender: true, status: true, isDeleted: true },
      });
      if (!user || user.isDeleted === 'YES' || user.status !== 'ACTIVE') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { rawatJalan, melahirkan, rawatInap } = await prisma.$transaction(async (tx) => {
        // RAWAT JALAN (annual pool)
        let rj = await tx.rawatJalanBalance.findUnique({
          where: { userId_year: { userId, year } },
        });
        if (!rj) {
          const policy = await tx.rawatJalanPolicy.findUnique({
            where: { year_position: { year, position: user.position } },
          });
          if (!policy) {
            throw new Error(`Rawat Jalan policy belum diset untuk year=${year} position=${user.position}`);
          }
          rj = await tx.rawatJalanBalance.create({
            data: { userId, year, allocated: policy.annualAmount, spent: 0 },
          });
          await tx.budgetLedger.create({
            data: {
              userId,
              year,
              type: 'ALLOCATE',
              amount: policy.annualAmount,
              benefitType: 'RAWAT_JALAN',
              note: 'Initial allocation (Rawat Jalan)',
            },
          });
        }

        // MELAHIRKAN (annual pool, FEMALE only)
        let mel: any = null;
        if (user.gender === 'FEMALE') {
          mel = await tx.melahirkanBalance.findUnique({
            where: { userId_year: { userId, year } },
          });
          if (!mel) {
            const policy = await tx.melahirkanPolicy.findUnique({
              where: { year_position: { year, position: user.position } },
            });
            if (!policy) {
              throw new Error(`Melahirkan policy belum diset untuk year=${year} position=${user.position}`);
            }
            mel = await tx.melahirkanBalance.create({
              data: { userId, year, allocated: policy.annualAmount, spent: 0 },
            });
            await tx.budgetLedger.create({
              data: {
                userId,
                year,
                type: 'ALLOCATE',
                amount: policy.annualAmount,
                benefitType: 'MELAHIRKAN',
                note: 'Initial allocation (Melahirkan)',
              },
            });
          }
        }

        // RAWAT INAP (per-episode caps). Summary is sum across episode balances.
        const agg = await tx.rawatInapEpisodeBalance.aggregate({
          where: { episode: { userId, year } },
          _sum: { allocated: true, spent: true },
        });

        const allocatedSum = agg._sum.allocated ?? new Prisma.Decimal(0);
        const spentSum = agg._sum.spent ?? new Prisma.Decimal(0);

        return {
          rawatJalan: rj,
          melahirkan: mel,
          rawatInap: { allocated: allocatedSum, spent: spentSum },
        };
      });

      const rawatJalanRemaining = rawatJalan.allocated.minus(rawatJalan.spent);
      const rawatInapRemaining = rawatInap.allocated.minus(rawatInap.spent);
      const melahirkanRemaining = melahirkan ? melahirkan.allocated.minus(melahirkan.spent) : null;

      return res.json({
        success: true,
        data: {
          year,
          rawatJalan: {
            allocated: rawatJalan.allocated.toString(),
            spent: rawatJalan.spent.toString(),
            remaining: rawatJalanRemaining.toString(),
          },
          rawatInap: {
            allocated: rawatInap.allocated.toString(),
            spent: rawatInap.spent.toString(),
            remaining: rawatInapRemaining.toString(),
          },
          melahirkan: melahirkan
            ? {
                allocated: melahirkan.allocated.toString(),
                spent: melahirkan.spent.toString(),
                remaining: (melahirkanRemaining as any).toString(),
              }
            : null,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      const isPolicyMissing =
        e instanceof Error && e.message.toLowerCase().includes('policy');
      return res.status(isPolicyMissing ? 400 : 500).json({
        success: false,
        message: isPolicyMissing ? e.message : 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  // ADMIN: list budget balances for all ACTIVE users (auto-create balance for missing year)
  async adminListUserBudgets(req: Request, res: Response) {
    try {
      const year = req.query.year ? Number(req.query.year) : currentYear();

      const result = await prisma.$transaction(async (tx) => {
        const users = await tx.user.findMany({
          where: { status: 'ACTIVE', isDeleted: 'NO' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            branch: true,
            position: true,
            gender: true,
          },
        });

        const out: Array<{
          userId: string;
            firstName: string;
            lastName: string;
            department: string;
            branch: string;
          position: string;
          gender: string;
          year: number;
          rawatJalan: { allocated: string; spent: string; remaining: string };
          rawatInap: { allocated: string; spent: string; remaining: string };
          melahirkan: { allocated: string; spent: string; remaining: string } | null;
        }> = [];

        for (const u of users) {
          // RAWAT JALAN annual pool
          let rj = await tx.rawatJalanBalance.findUnique({
            where: { userId_year: { userId: u.id, year } },
          });
          if (!rj) {
            const policy = await tx.rawatJalanPolicy.findUnique({
              where: { year_position: { year, position: u.position as any } },
            });
            if (!policy) {
              // UX: jangan gagal seluruh request jika policy position belum diset.
              continue;
            }
            rj = await tx.rawatJalanBalance.create({
              data: { userId: u.id, year, allocated: policy.annualAmount, spent: 0 },
            });
            await tx.budgetLedger.create({
              data: {
                userId: u.id,
                year,
                type: 'ALLOCATE',
                amount: policy.annualAmount,
                benefitType: 'RAWAT_JALAN',
                note: 'Initial allocation (Rawat Jalan)',
              },
            });
          }
          const rjRemaining = rj.allocated.minus(rj.spent);

          // MELAHIRKAN annual pool (FEMALE only)
          let mel: any = null;
          if (u.gender === 'FEMALE') {
            mel = await tx.melahirkanBalance.findUnique({
              where: { userId_year: { userId: u.id, year } },
            });
            if (!mel) {
              const policy = await tx.melahirkanPolicy.findUnique({
                where: { year_position: { year, position: u.position as any } },
              });
              if (policy) {
                mel = await tx.melahirkanBalance.create({
                  data: { userId: u.id, year, allocated: policy.annualAmount, spent: 0 },
                });
                await tx.budgetLedger.create({
                  data: {
                    userId: u.id,
                    year,
                    type: 'ALLOCATE',
                    amount: policy.annualAmount,
                    benefitType: 'MELAHIRKAN',
                    note: 'Initial allocation (Melahirkan)',
                  },
                });
              }
            }
          }
          const melRemaining = mel ? mel.allocated.minus(mel.spent) : null;

          // RAWAT INAP summary across episodes
          const agg = await tx.rawatInapEpisodeBalance.aggregate({
            where: { episode: { userId: u.id, year } },
            _sum: { allocated: true, spent: true },
          });
          const riAllocated = agg._sum.allocated ?? new Prisma.Decimal(0);
          const riSpent = agg._sum.spent ?? new Prisma.Decimal(0);
          const riRemaining = riAllocated.minus(riSpent);

          out.push({
            userId: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            department: u.department,
            branch: u.branch,
            position: u.position,
            gender: u.gender,
            year,
            rawatJalan: {
              allocated: rj.allocated.toString(),
              spent: rj.spent.toString(),
              remaining: rjRemaining.toString(),
            },
            rawatInap: {
              allocated: riAllocated.toString(),
              spent: riSpent.toString(),
              remaining: riRemaining.toString(),
            },
            melahirkan: mel
              ? {
                  allocated: mel.allocated.toString(),
                  spent: mel.spent.toString(),
                  remaining: (melRemaining as any).toString(),
                }
              : null,
          });
        }

        return out;
      });

      return res.json({ success: true, data: result });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  // ADMIN: tambah pemakaian/spend budget untuk user tertentu (SPEND)
  async adminSpendForUser(req: Request, res: Response) {
    try {
      const body = req.body as {
        userId?: string;
        year?: number;
        amount?: number | string;
        note?: string;
        documentUrl?: string;
        documentPublicId?: string;
        documentOriginalName?: string;
        spendCategory?: any;
        benefitType?: BenefitType | string;
        rawatJalanMedicalId?: string;
        rawatInapEpisodeId?: string;
        rawatInapEpisodeOptionId?: string;
        rawatInapServiceType?: RawatInapServiceType | string;
        rawatInapDetail?: {
          roomRatePerDay?: number | string;
          days?: number | string;
          isOperasi?: boolean;
          procedureAmount?: number | string;
        };
      };

      if (!body.userId) {
        return res.status(400).json({ success: false, message: 'userId wajib dikirim' });
      }

      const benefitTypeNormalized = normalizeEnum(body.benefitType) as BenefitType | null;
      const useRiDetail =
        benefitTypeNormalized === 'RAWAT_INAP' &&
        body.rawatInapDetail !== undefined &&
        body.rawatInapDetail !== null &&
        typeof body.rawatInapDetail === 'object';

      const isRawatInap = benefitTypeNormalized === 'RAWAT_INAP';
      if (!useRiDetail && !isRawatInap) {
        if (body.amount === undefined || body.amount === null || body.amount === '') {
          return res.status(400).json({ success: false, message: 'amount wajib dikirim' });
        }

        const amountNumber =
          typeof body.amount === 'number'
            ? body.amount
            : Number(String(body.amount));

        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
          return res
            .status(400)
            .json({ success: false, message: 'amount harus lebih dari 0' });
        }
      }

      const year = body.year ? Number(body.year) : currentYear();
      const documentUrl = typeof body.documentUrl === 'string' ? body.documentUrl.trim() : '';
      const documentPublicId =
        typeof body.documentPublicId === 'string' ? body.documentPublicId.trim() : '';
      const documentOriginalName =
        typeof body.documentOriginalName === 'string' ? body.documentOriginalName.trim() : '';
      const spendDocument =
        documentUrl || documentPublicId || documentOriginalName
          ? {
              documentUrl: documentUrl || null,
              documentPublicId: documentPublicId || null,
              documentOriginalName: documentOriginalName || null,
            }
          : {};
      const amount = useRiDetail
        ? new Prisma.Decimal(0)
        : body.amount !== undefined && body.amount !== null && body.amount !== ''
          ? toDecimalInput(body.amount)
          : new Prisma.Decimal(0);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: body.userId },
          select: { id: true, email: true, position: true, gender: true, status: true, isDeleted: true },
        });

        if (!user || user.isDeleted === 'YES' || user.status !== 'ACTIVE') {
          throw new Error('User tidak aktif/valid');
        }

        // New system: benefit-specific spend
        if (benefitTypeNormalized) {
          if (benefitTypeNormalized === 'RAWAT_JALAN') {
            const medicalId = (body.rawatJalanMedicalId ?? '').trim();
            if (!medicalId) throw new Error('rawatJalanMedicalId wajib dikirim untuk RAWAT_JALAN');

            const medical = await tx.rawatJalanMedical.findUnique({
              where: { id: medicalId },
              select: { id: true, isActive: true },
            });
            if (!medical || medical.isActive !== true) throw new Error('Rawat Jalan medical tidak valid/aktif');

            let balance = await tx.rawatJalanBalance.findUnique({
              where: { userId_year: { userId: user.id, year } },
            });
            if (!balance) {
              const policy = await tx.rawatJalanPolicy.findUnique({
                where: { year_position: { year, position: user.position } },
              });
              if (!policy) {
                throw new Error(`Rawat Jalan policy belum diset untuk year=${year} position=${user.position}`);
              }
              balance = await tx.rawatJalanBalance.create({
                data: { userId: user.id, year, allocated: policy.annualAmount, spent: 0 },
              });
              await tx.budgetLedger.create({
                data: {
                  userId: user.id,
                  year,
                  type: 'ALLOCATE',
                  amount: policy.annualAmount,
                  benefitType: 'RAWAT_JALAN',
                  note: 'Initial allocation (Rawat Jalan)',
                },
              });
            }

            const newSpent = balance.spent.plus(amount);
            if (newSpent.gt(balance.allocated)) {
              return { ok: false as const, status: 409 as const, message: 'Insufficient remaining budget' };
            }

            await tx.rawatJalanBalance.update({
              where: { userId_year: { userId: user.id, year } },
              data: { spent: newSpent },
            });

            await tx.budgetLedger.create({
              data: {
                userId: user.id,
                year,
                type: 'SPEND',
                amount,
                benefitType: 'RAWAT_JALAN',
                rawatJalanMedicalId: medicalId,
                ...spendDocument,
                note: body.note ?? 'Manual spend (Rawat Jalan)',
              },
            });

            const remaining = balance.allocated.minus(newSpent);
            return {
              ok: true as const,
              status: 201 as const,
              data: {
                userId: user.id,
                year,
                allocated: balance.allocated.toString(),
                spent: newSpent.toString(),
                remaining: remaining.toString(),
              },
            };
          }

          if (benefitTypeNormalized === 'MELAHIRKAN') {
            if (user.gender !== 'FEMALE') throw new Error('Melahirkan hanya untuk user FEMALE');

            let balance = await tx.melahirkanBalance.findUnique({
              where: { userId_year: { userId: user.id, year } },
            });
            if (!balance) {
              const policy = await tx.melahirkanPolicy.findUnique({
                where: { year_position: { year, position: user.position } },
              });
              if (!policy) {
                throw new Error(`Melahirkan policy belum diset untuk year=${year} position=${user.position}`);
              }
              balance = await tx.melahirkanBalance.create({
                data: { userId: user.id, year, allocated: policy.annualAmount, spent: 0 },
              });
              await tx.budgetLedger.create({
                data: {
                  userId: user.id,
                  year,
                  type: 'ALLOCATE',
                  amount: policy.annualAmount,
                  benefitType: 'MELAHIRKAN',
                  note: 'Initial allocation (Melahirkan)',
                },
              });
            }

            const newSpent = balance.spent.plus(amount);
            if (newSpent.gt(balance.allocated)) {
              return { ok: false as const, status: 409 as const, message: 'Insufficient remaining budget' };
            }

            await tx.melahirkanBalance.update({
              where: { userId_year: { userId: user.id, year } },
              data: { spent: newSpent },
            });

            await tx.budgetLedger.create({
              data: {
                userId: user.id,
                year,
                type: 'SPEND',
                amount,
                benefitType: 'MELAHIRKAN',
                ...spendDocument,
                note: body.note ?? 'Manual spend (Melahirkan)',
              },
            });

            const remaining = balance.allocated.minus(newSpent);
            return {
              ok: true as const,
              status: 201 as const,
              data: {
                userId: user.id,
                year,
                allocated: balance.allocated.toString(),
                spent: newSpent.toString(),
                remaining: remaining.toString(),
              },
            };
          }

          if (benefitTypeNormalized === 'RAWAT_INAP') {
            const requestedEpisodeId = (body.rawatInapEpisodeId ?? '').trim();
            const optionId = (body.rawatInapEpisodeOptionId ?? '').trim();
            let episodeId = requestedEpisodeId;

            if (!episodeId) {
              if (!optionId) {
                throw new Error('rawatInapEpisodeOptionId wajib dikirim untuk RAWAT_INAP');
              }

              const option = await tx.rawatInapEpisodeOption.findUnique({
                where: { id: optionId },
                select: { id: true, isActive: true },
              });
              if (!option || option.isActive !== true) {
                throw new Error('Episode option tidak valid atau tidak aktif');
              }

              const existing = await tx.rawatInapEpisode.findFirst({
                where: { userId: user.id, year, rawatInapEpisodeOptionId: option.id },
                select: { id: true },
              });

              if (existing) {
                episodeId = existing.id;
              } else {
                const serviceTypes: RawatInapServiceType[] = ['TARIF_KAMAR_DAYS', 'TANPA_OPERASI', 'OPERASI'];
                const policies = await tx.rawatInapPolicy.findMany({
                  where: { year, position: user.position, serviceType: { in: serviceTypes as any } },
                  select: { serviceType: true, capAmount: true },
                });

                const capMap = new Map<string, Prisma.Decimal>();
                for (const p of policies) capMap.set(p.serviceType, p.capAmount);
                for (const st of serviceTypes) {
                  if (!capMap.has(st)) {
                    throw new Error(`Rawat Inap policy belum diset untuk year=${year} position=${user.position} serviceType=${st}`);
                  }
                }

                const createdEpisode = await tx.rawatInapEpisode.create({
                  data: { userId: user.id, year, rawatInapEpisodeOptionId: option.id },
                  select: { id: true },
                });
                episodeId = createdEpisode.id;

                await tx.rawatInapEpisodeBalance.createMany({
                  data: serviceTypes.map((st) => ({
                    episodeId,
                    serviceType: st as any,
                    allocated: capMap.get(st)!,
                    spent: 0,
                  })),
                });

                await tx.budgetLedger.createMany({
                  data: serviceTypes.map((st) => ({
                    userId: user.id,
                    year,
                    type: 'ALLOCATE',
                    amount: capMap.get(st)!,
                    benefitType: 'RAWAT_INAP',
                    rawatInapEpisodeId: episodeId,
                    rawatInapServiceType: st as any,
                    note: `Initial allocation (Rawat Inap ${st})`,
                  })),
                });
              }
            } else {
              const episode = await tx.rawatInapEpisode.findUnique({
                where: { id: episodeId },
                select: { id: true, userId: true, year: true },
              });
              if (!episode || episode.userId !== user.id || episode.year !== year) {
                throw new Error('Episode Rawat Inap tidak valid');
              }
            }

            // Alur baru: tarif kamar/hari × hari → bucket TARIF_KAMAR_DAYS; nominal operasi/tanpa operasi → bucket sesuai pilihan.
            if (useRiDetail) {
              const d = body.rawatInapDetail!;
              const roomRatePerDay = Number(d.roomRatePerDay);
              const days = Math.floor(Number(d.days));
              const procedureAmountNum = Number(d.procedureAmount);

              if (!Number.isFinite(roomRatePerDay) || roomRatePerDay < 0) {
                throw new Error('Tarif kamar per hari tidak valid');
              }
              if (!Number.isFinite(days) || days < 1) {
                throw new Error('Jumlah hari menginap minimal 1');
              }
              if (!Number.isFinite(procedureAmountNum) || procedureAmountNum < 0) {
                throw new Error('Nominal operasi/tanpa operasi tidak valid');
              }

              const isOperasi = Boolean(d.isOperasi);
              const roomAmount = new Prisma.Decimal(roomRatePerDay).mul(days);
              const procedureAmt = new Prisma.Decimal(procedureAmountNum);
              const procedureType = (isOperasi ? 'OPERASI' : 'TANPA_OPERASI') as RawatInapServiceType;

              if (roomAmount.eq(0) && procedureAmt.eq(0)) {
                throw new Error('Minimal salah satu: biaya kamar atau biaya tindakan harus lebih dari 0');
              }

              const balanceRoom = await tx.rawatInapEpisodeBalance.findUnique({
                where: { episodeId_serviceType: { episodeId, serviceType: 'TARIF_KAMAR_DAYS' } },
              });
              const balanceProc = await tx.rawatInapEpisodeBalance.findUnique({
                where: { episodeId_serviceType: { episodeId, serviceType: procedureType as any } },
              });
              if (!balanceRoom || !balanceProc) throw new Error('Balance episode tidak ditemukan');

              if (roomAmount.gt(0)) {
                // Plafon kamar berlaku per-hari (bukan akumulasi total episode).
                const roomRateCap = balanceRoom.allocated;
                const roomRatePerDayDec = new Prisma.Decimal(roomRatePerDay);
                if (roomRatePerDayDec.gt(roomRateCap)) {
                  return {
                    ok: false as const,
                    status: 409 as const,
                    message: 'Tarif kamar per hari melebihi plafon yang diset',
                  };
                }
                const newRoomSpent = balanceRoom.spent.plus(roomAmount);
                await tx.rawatInapEpisodeBalance.update({
                  where: { episodeId_serviceType: { episodeId, serviceType: 'TARIF_KAMAR_DAYS' } },
                  data: { spent: newRoomSpent },
                });
                await tx.budgetLedger.create({
                  data: {
                    userId: user.id,
                    year,
                    type: 'SPEND',
                    amount: roomAmount,
                    benefitType: 'RAWAT_INAP',
                    rawatInapEpisodeId: episodeId,
                    rawatInapServiceType: 'TARIF_KAMAR_DAYS',
                    ...spendDocument,
                    note:
                      (body.note ?? 'Rawat Inap') +
                      ` — kamar: ${roomRatePerDay}/hari × ${days} hari`,
                  },
                });
              }

              if (procedureAmt.gt(0)) {
                // Operasi/tanpa operasi dicek per transaksi (bukan akumulasi episode).
                const procedureCap = balanceProc.allocated;
                if (procedureAmt.gt(procedureCap)) {
                  return {
                    ok: false as const,
                    status: 409 as const,
                    message: `Nominal ${isOperasi ? 'operasi' : 'tanpa operasi'} melebihi plafon yang diset`,
                  };
                }
                const newProcSpent = balanceProc.spent.plus(procedureAmt);
                await tx.rawatInapEpisodeBalance.update({
                  where: { episodeId_serviceType: { episodeId, serviceType: procedureType as any } },
                  data: { spent: newProcSpent },
                });
                await tx.budgetLedger.create({
                  data: {
                    userId: user.id,
                    year,
                    type: 'SPEND',
                    amount: procedureAmt,
                    benefitType: 'RAWAT_INAP',
                    rawatInapEpisodeId: episodeId,
                    rawatInapServiceType: procedureType as any,
                    ...spendDocument,
                    note:
                      (body.note ?? 'Rawat Inap') +
                      ` — ${isOperasi ? 'operasi' : 'tanpa operasi'}`,
                  },
                });
              }

              return {
                ok: true as const,
                status: 201 as const,
                data: {
                  userId: user.id,
                  year,
                  rawatInapEpisodeId: episodeId,
                  totalApplied: roomAmount.add(procedureAmt).toString(),
                  mode: 'detail' as const,
                },
              };
            }

            const serviceType = normalizeEnum(body.rawatInapServiceType) as RawatInapServiceType | null;
            const allowed: RawatInapServiceType[] = ['TARIF_KAMAR_DAYS', 'TANPA_OPERASI', 'OPERASI'];
            if (!serviceType || !allowed.includes(serviceType)) {
              throw new Error('rawatInapServiceType tidak valid');
            }

            const balance = await tx.rawatInapEpisodeBalance.findUnique({
              where: { episodeId_serviceType: { episodeId, serviceType: serviceType as any } },
            });
            if (!balance) throw new Error('Balance episode tidak ditemukan');

            // Backward-compat mode RI: validasi per transaksi terhadap plafon service type.
            const amountDec = new Prisma.Decimal(amount as any);
            if (amountDec.gt(balance.allocated)) {
              return {
                ok: false as const,
                status: 409 as const,
                message: 'Nominal melebihi plafon service type yang diset',
              };
            }
            const newSpent = balance.spent.plus(amountDec);

            await tx.rawatInapEpisodeBalance.update({
              where: { episodeId_serviceType: { episodeId, serviceType: serviceType as any } },
              data: { spent: newSpent },
            });

            await tx.budgetLedger.create({
              data: {
                userId: user.id,
                year,
                type: 'SPEND',
                amount: amountDec,
                benefitType: 'RAWAT_INAP',
                rawatInapEpisodeId: episodeId,
                rawatInapServiceType: serviceType as any,
                ...spendDocument,
                note: body.note ?? 'Manual spend (Rawat Inap)',
              },
            });

            const remaining = balance.allocated.minus(newSpent);
            return {
              ok: true as const,
              status: 201 as const,
              data: {
                userId: user.id,
                year,
                allocated: balance.allocated.toString(),
                spent: newSpent.toString(),
                remaining: remaining.toString(),
              },
            };
          }

          throw new Error('benefitType tidak dikenal');
        }

        // Legacy system fallback (single annual pool)
        let balance = await tx.budgetBalance.findUnique({
          where: { userId_year: { userId: user.id, year } },
        });

        if (!balance) {
          const policy = await tx.budgetPolicy.findUnique({
            where: { year_position: { year, position: user.position } },
          });

          if (!policy) {
            throw new Error(
              `Budget policy belum diset untuk year=${year} position=${user.position}`,
            );
          }

          balance = await tx.budgetBalance.create({
            data: {
              userId: user.id,
              year,
              allocated: policy.annualAmount,
              spent: 0,
            },
          });

          await tx.budgetLedger.create({
            data: {
              userId: user.id,
              year,
              type: 'ALLOCATE',
              amount: policy.annualAmount,
              note: 'Initial allocation',
            },
          });
        }

        const newSpent = balance.spent.plus(amount);
        if (newSpent.gt(balance.allocated)) {
          // Overspend
          return {
            ok: false as const,
            status: 409 as const,
            message: 'Insufficient remaining budget',
          };
        }

        await tx.budgetBalance.update({
          where: { userId_year: { userId: user.id, year } },
          data: { spent: newSpent },
        });

        // Normalisasi kategori spend sesuai enum Prisma.
        const spendCategoryRaw = body.spendCategory;
        const spendCategoryNormalized =
          spendCategoryRaw === undefined || spendCategoryRaw === null || spendCategoryRaw === ''
            ? null
            : String(spendCategoryRaw).toUpperCase();

        const allowedCategories = [
          'RAWAT_INAP',
          'MCU',
          'RAWAT_JALAN',
          'BELI_OBAT',
          'DOKTER_UMUM',
          'OPERASI',
        ];

        const spendCategory = spendCategoryNormalized
          ? allowedCategories.includes(spendCategoryNormalized)
            ? (spendCategoryNormalized as any)
            : undefined
          : undefined;

        await tx.budgetLedger.create({
          data: {
            userId: user.id,
            year,
            type: 'SPEND',
            amount,
            spendCategory,
            ...spendDocument,
            note: body.note ?? 'Manual spend',
          },
        });

        const remaining = balance.allocated.minus(newSpent);
        return {
          ok: true as const,
          status: 201 as const,
          data: {
            userId: user.id,
            year,
            allocated: balance.allocated.toString(),
            spent: newSpent.toString(),
            remaining: remaining.toString(),
          },
        };
      });

      if ('ok' in result && result.ok === false) {
        return res.status(result.status).json({
          success: false,
          message: result.message,
        });
      }

      return res.json({ success: true, data: (result as any).data });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  // ADMIN: reset transaksi user per year (hapus ledger + set spent=0)
  async adminResetUserTransactions(req: Request, res: Response) {
    try {
      const body = req.body as { userId?: string; year?: number };
      const userId = (body.userId ?? '').trim();
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId wajib dikirim' });
      }
      const year = body.year ? Number(body.year) : currentYear();

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, status: true, isDeleted: true },
        });
        if (!user || user.isDeleted === 'YES' || user.status !== 'ACTIVE') {
          throw new Error('User tidak aktif/valid');
        }

        const episodes = await tx.rawatInapEpisode.findMany({
          where: { userId, year },
          select: { id: true },
        });
        const episodeIds = episodes.map((e) => e.id);

        const deletedLedger = await tx.budgetLedger.deleteMany({
          where: { userId, year },
        });
        await tx.budgetBalance.updateMany({
          where: { userId, year },
          data: { spent: 0 },
        });
        await tx.rawatJalanBalance.updateMany({
          where: { userId, year },
          data: { spent: 0 },
        });
        await tx.melahirkanBalance.updateMany({
          where: { userId, year },
          data: { spent: 0 },
        });
        if (episodeIds.length > 0) {
          await tx.rawatInapEpisodeBalance.updateMany({
            where: { episodeId: { in: episodeIds } },
            data: { spent: 0 },
          });
        }

        return {
          userId,
          year,
          deletedLedgerCount: deletedLedger.count,
        };
      });

      return res.json({ success: true, data: result });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  }

  // ADMIN: trend spend per option (Rawat Jalan medical & Rawat Inap episode option)
  async adminListOptionTrends(req: Request, res: Response) {
    try {
      const year = req.query.year ? Number(req.query.year) : currentYear();

      const [rjRows, riRows] = await Promise.all([
        prisma.budgetLedger.findMany({
          where: {
            year,
            type: 'SPEND',
            benefitType: 'RAWAT_JALAN',
            rawatJalanMedicalId: { not: null },
          },
          select: {
            amount: true,
            rawatJalanMedical: { select: { id: true, name: true } },
          },
        }),
        prisma.budgetLedger.findMany({
          where: {
            year,
            type: 'SPEND',
            benefitType: 'RAWAT_INAP',
            rawatInapEpisodeId: { not: null },
          },
          select: {
            amount: true,
            rawatInapEpisode: {
              select: {
                episodeOption: { select: { id: true, name: true } },
              },
            },
          },
        }),
      ]);

      const rjMap = new Map<string, { optionId: string; optionName: string; count: number; totalAmount: Prisma.Decimal }>();
      for (const row of rjRows) {
        if (!row.rawatJalanMedical) continue;
        const key = row.rawatJalanMedical.id;
        const prev = rjMap.get(key);
        if (!prev) {
          rjMap.set(key, {
            optionId: key,
            optionName: row.rawatJalanMedical.name,
            count: 1,
            totalAmount: row.amount,
          });
          continue;
        }
        prev.count += 1;
        prev.totalAmount = prev.totalAmount.plus(row.amount);
      }

      const riMap = new Map<string, { optionId: string; optionName: string; count: number; totalAmount: Prisma.Decimal }>();
      for (const row of riRows) {
        const option = row.rawatInapEpisode?.episodeOption;
        if (!option) continue;
        const key = option.id;
        const prev = riMap.get(key);
        if (!prev) {
          riMap.set(key, {
            optionId: key,
            optionName: option.name,
            count: 1,
            totalAmount: row.amount,
          });
          continue;
        }
        prev.count += 1;
        prev.totalAmount = prev.totalAmount.plus(row.amount);
      }

      const rawatJalan = Array.from(rjMap.values())
        .sort((a, b) => b.totalAmount.minus(a.totalAmount).toNumber())
        .map((x) => ({
          optionId: x.optionId,
          optionName: x.optionName,
          count: x.count,
          totalAmount: x.totalAmount.toString(),
        }));

      const rawatInap = Array.from(riMap.values())
        .sort((a, b) => b.totalAmount.minus(a.totalAmount).toNumber())
        .map((x) => ({
          optionId: x.optionId,
          optionName: x.optionName,
          count: x.count,
          totalAmount: x.totalAmount.toString(),
        }));

      return res.json({
        success: true,
        data: {
          year,
          rawatJalan,
          rawatInap,
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

  // ADMIN: ambil isi ledger untuk user tertentu per tahun
  async adminListUserLedger(req: Request, res: Response) {
    try {
      const userId =
        typeof req.query.userId === 'string' ? req.query.userId : '';
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: 'userId wajib dikirim' });
      }

      const year = req.query.year ? Number(req.query.year) : currentYear();

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, isDeleted: true },
      });

      if (!user || user.isDeleted === 'YES' || user.status !== 'ACTIVE') {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const entries = await prisma.budgetLedger.findMany({
        where: { userId, year },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          year: true,
          type: true,
          amount: true,
          spendCategory: true,
          benefitType: true,
          rawatInapServiceType: true,
          documentUrl: true,
          documentPublicId: true,
          documentOriginalName: true,
          rawatJalanMedical: { select: { id: true, name: true } },
          rawatInapEpisode: {
            select: { id: true, episodeOption: { select: { name: true } } },
          },
          note: true,
          createdAt: true,
        },
      });

      return res.json({
        success: true,
        data: entries.map((e) => ({
          id: e.id,
          year: e.year,
          type: e.type,
          amount: e.amount.toString(),
          spendCategory: e.spendCategory,
          benefitType: e.benefitType,
          rawatInapServiceType: e.rawatInapServiceType,
          documentUrl: e.documentUrl,
          documentPublicId: e.documentPublicId,
          documentOriginalName: e.documentOriginalName,
          rawatJalanMedical: e.rawatJalanMedical
            ? { id: e.rawatJalanMedical.id, name: e.rawatJalanMedical.name }
            : null,
          rawatInapEpisode: e.rawatInapEpisode
            ? {
                id: e.rawatInapEpisode.id,
                sickConditionLabel: e.rawatInapEpisode.episodeOption.name,
              }
            : null,
          note: e.note,
          createdAt: e.createdAt.toISOString(),
        })),
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
}

