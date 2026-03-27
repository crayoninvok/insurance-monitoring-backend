"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controller/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
class AuthRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = new auth_controller_1.AuthController();
        this.initRoutes();
    }
    initRoutes() {
        this.router.post('/login', this.controller.login.bind(this.controller));
        this.router.get('/me', auth_middleware_1.authRequired, this.controller.me.bind(this.controller));
        this.router.patch('/me', auth_middleware_1.authRequired, this.controller.updateMyProfile.bind(this.controller));
        this.router.post('/users', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.createUser.bind(this.controller));
        this.router.get('/users', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminListUsers.bind(this.controller));
        this.router.patch('/users/:id', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminUpdateUser.bind(this.controller));
        this.router.delete('/users/:id', auth_middleware_1.authRequired, auth_middleware_1.adminOnly, this.controller.adminDeleteUser.bind(this.controller));
    }
    getRouter() {
        return this.router;
    }
}
exports.AuthRouter = AuthRouter;
