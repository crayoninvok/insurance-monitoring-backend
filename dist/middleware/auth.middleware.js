"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.authRequired = authRequired;
exports.adminOnly = adminOnly;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET wajib di-set di .env');
    return secret;
}
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), { expiresIn: '12h' });
}
function authRequired(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const token = header.slice('Bearer '.length).trim();
        const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
        req.user = decoded;
        return next();
    }
    catch {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}
function adminOnly(req, res, next) {
    if (req.user?.role !== 'ADMIN') {
        return res
            .status(403)
            .json({ success: false, message: 'Forbidden (ADMIN only)' });
    }
    return next();
}
