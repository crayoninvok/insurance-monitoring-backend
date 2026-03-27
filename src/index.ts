import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { AuthRouter } from './router/auth.router';
import { BudgetRouter } from './router/budget.router';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notfound.middleware';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Routes
const authRouter = new AuthRouter();
app.use('/api/auth', authRouter.getRouter());

const budgetRouter = new BudgetRouter();
app.use('/api/budget', budgetRouter.getRouter());

app.use(errorHandler);
app.use(notFoundHandler);

const PORT = process.env.PORT || 8000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;