import { Router } from 'express';
import multer from 'multer';
import { BudgetController } from '../controller/budget.controller';
import { adminOnly, authRequired } from '../middleware/auth.middleware';

export class BudgetRouter {
  private router: Router;
  private controller: BudgetController;

  constructor() {
    this.router = Router();
    this.controller = new BudgetController();
    this.initRoutes();
  }

  private initRoutes() {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    });
    // ADMIN
    this.router.get(
      '/policies',
      authRequired,
      adminOnly,
      this.controller.listPolicies.bind(this.controller),
    );
    this.router.post(
      '/policies',
      authRequired,
      adminOnly,
      this.controller.upsertPolicy.bind(this.controller),
    );

    // NEW POLICIES
    this.router.get(
      '/policies/rawat-jalan',
      authRequired,
      adminOnly,
      this.controller.listRawatJalanPolicies.bind(this.controller),
    );
    this.router.post(
      '/policies/rawat-jalan',
      authRequired,
      adminOnly,
      this.controller.upsertRawatJalanPolicy.bind(this.controller),
    );

    this.router.get(
      '/policies/melahirkan',
      authRequired,
      adminOnly,
      this.controller.listMelahirkanPolicies.bind(this.controller),
    );
    this.router.post(
      '/policies/melahirkan',
      authRequired,
      adminOnly,
      this.controller.upsertMelahirkanPolicy.bind(this.controller),
    );

    this.router.get(
      '/policies/rawat-inap',
      authRequired,
      adminOnly,
      this.controller.listRawatInapPolicies.bind(this.controller),
    );
    this.router.post(
      '/policies/rawat-inap',
      authRequired,
      adminOnly,
      this.controller.upsertRawatInapPolicy.bind(this.controller),
    );

    // Lookups
    this.router.get(
      '/lookups/rawat-jalan-medicals',
      authRequired,
      adminOnly,
      this.controller.listRawatJalanMedicals.bind(this.controller),
    );
    this.router.post(
      '/lookups/rawat-jalan-medicals',
      authRequired,
      adminOnly,
      this.controller.createRawatJalanMedical.bind(this.controller),
    );
    this.router.patch(
      '/lookups/rawat-jalan-medicals/:id',
      authRequired,
      adminOnly,
      this.controller.setRawatJalanMedicalActive.bind(this.controller),
    );

    // Rawat Inap episode options (GET: semua user login; POST/PATCH: admin)
    this.router.get(
      '/lookups/rawat-inap-episode-options',
      authRequired,
      this.controller.listRawatInapEpisodeOptions.bind(this.controller),
    );
    this.router.post(
      '/lookups/rawat-inap-episode-options',
      authRequired,
      adminOnly,
      this.controller.createRawatInapEpisodeOption.bind(this.controller),
    );
    this.router.patch(
      '/lookups/rawat-inap-episode-options/:id',
      authRequired,
      adminOnly,
      this.controller.setRawatInapEpisodeOptionActive.bind(this.controller),
    );

    // Rawat Inap episodes
    this.router.get(
      '/admin/rawat-inap/episodes',
      authRequired,
      adminOnly,
      this.controller.adminListRawatInapEpisodes.bind(this.controller),
    );
    this.router.post(
      '/admin/rawat-inap/episodes',
      authRequired,
      adminOnly,
      this.controller.adminCreateRawatInapEpisode.bind(this.controller),
    );

    this.router.get(
      '/admin/balances',
      authRequired,
      adminOnly,
      this.controller.adminListUserBudgets.bind(this.controller),
    );
    this.router.post(
      '/admin/spend',
      authRequired,
      adminOnly,
      this.controller.adminSpendForUser.bind(this.controller),
    );
    this.router.post(
      '/admin/spend-document',
      authRequired,
      adminOnly,
      upload.single('file'),
      this.controller.adminUploadSpendDocument.bind(this.controller),
    );
    this.router.post(
      '/admin/reset-user-transactions',
      authRequired,
      adminOnly,
      this.controller.adminResetUserTransactions.bind(this.controller),
    );
    this.router.get(
      '/admin/trends/options',
      authRequired,
      adminOnly,
      this.controller.adminListOptionTrends.bind(this.controller),
    );

    this.router.get(
      '/admin/ledger',
      authRequired,
      adminOnly,
      this.controller.adminListUserLedger.bind(this.controller),
    );

    // USER
    this.router.get(
      '/me',
      authRequired,
      this.controller.getMyBudget.bind(this.controller),
    );
  }

  getRouter() {
    return this.router;
  }
}

