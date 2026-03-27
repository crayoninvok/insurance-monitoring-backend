"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const budget_controller_1 = require("../controller/budget.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
class BudgetRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = new budget_controller_1.BudgetController();
        this.initRoutes();
    }
    initRoutes() {
        const upload = (0, multer_1.default)({
            storage: multer_1.default.memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
        });
        // ADMIN
        this.router.get('/policies', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.listPolicies.bind(this.controller));
        this.router.post('/policies', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.upsertPolicy.bind(this.controller));
        // NEW POLICIES
        this.router.get('/policies/rawat-jalan', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.listRawatJalanPolicies.bind(this.controller));
        this.router.post('/policies/rawat-jalan', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.upsertRawatJalanPolicy.bind(this.controller));
        this.router.get('/policies/melahirkan', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.listMelahirkanPolicies.bind(this.controller));
        this.router.post('/policies/melahirkan', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.upsertMelahirkanPolicy.bind(this.controller));
        this.router.get('/policies/rawat-inap', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.listRawatInapPolicies.bind(this.controller));
        this.router.post('/policies/rawat-inap', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.upsertRawatInapPolicy.bind(this.controller));
        // Lookups
        this.router.get('/lookups/rawat-jalan-medicals', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.listRawatJalanMedicals.bind(this.controller));
        this.router.post('/lookups/rawat-jalan-medicals', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.createRawatJalanMedical.bind(this.controller));
        this.router.patch('/lookups/rawat-jalan-medicals/:id', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.setRawatJalanMedicalActive.bind(this.controller));
        // Rawat Inap episode options (GET: semua user login; POST/PATCH: admin)
        this.router.get('/lookups/rawat-inap-episode-options', auth_middleware_1.authRequired, this.controller.listRawatInapEpisodeOptions.bind(this.controller));
        this.router.post('/lookups/rawat-inap-episode-options', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.createRawatInapEpisodeOption.bind(this.controller));
        this.router.patch('/lookups/rawat-inap-episode-options/:id', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.setRawatInapEpisodeOptionActive.bind(this.controller));
        // Rawat Inap episodes
        this.router.get('/admin/rawat-inap/episodes', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminListRawatInapEpisodes.bind(this.controller));
        this.router.post('/admin/rawat-inap/episodes', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminCreateRawatInapEpisode.bind(this.controller));
        this.router.get('/admin/balances', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminListUserBudgets.bind(this.controller));
        this.router.post('/admin/spend', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminSpendForUser.bind(this.controller));
        this.router.post('/admin/spend-document', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, upload.single('file'), this.controller.adminUploadSpendDocument.bind(this.controller));
        this.router.post('/admin/reset-user-transactions', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminResetUserTransactions.bind(this.controller));
        this.router.get('/admin/trends/options', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminListOptionTrends.bind(this.controller));
        this.router.get('/admin/ledger', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminListUserLedger.bind(this.controller));
        // USER
        this.router.get('/me', auth_middleware_1.authRequired, this.controller.getMyBudget.bind(this.controller));
    }
    getRouter() {
        return this.router;
    }
}
exports.BudgetRouter = BudgetRouter;
