"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, next) {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
    if (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? message : undefined,
        });
    }
    return next();
}
