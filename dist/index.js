"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_router_1 = require("./router/auth.router");
const budget_router_1 = require("./router/budget.router");
const error_middleware_1 = require("./middleware/error.middleware");
const notfound_middleware_1 = require("./middleware/notfound.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
// Routes
const authRouter = new auth_router_1.AuthRouter();
app.use('/api/auth', authRouter.getRouter());
const budgetRouter = new budget_router_1.BudgetRouter();
app.use('/api/budget', budgetRouter.getRouter());
app.use(error_middleware_1.errorHandler);
app.use(notfound_middleware_1.notFoundHandler);
const PORT = process.env.PORT || 8000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
exports.default = app;
