import { Router } from 'express';
import { AuthController } from '../controller/auth.controller';
import { adminOnly, authRequired } from '../middleware/auth.middleware';

export class AuthRouter {
  private router: Router;
  private controller: AuthController;

  constructor() {
    this.router = Router();
    this.controller = new AuthController();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post('/login', this.controller.login.bind(this.controller));
    this.router.get('/me', authRequired, this.controller.me.bind(this.controller));
    this.router.patch('/me', authRequired, this.controller.updateMyProfile.bind(this.controller));
    this.router.post(
      '/users',
      authRequired,
      adminOnly,
      this.controller.createUser.bind(this.controller),
    );
    this.router.get('/users', authRequired, adminOnly, this.controller.adminListUsers.bind(this.controller));
    this.router.patch('/users/:id', authRequired, adminOnly, this.controller.adminUpdateUser.bind(this.controller));
    this.router.delete('/users/:id', authRequired, adminOnly, this.controller.adminDeleteUser.bind(this.controller));
  }

  getRouter() {
    return this.router;
  }
}

