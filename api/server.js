"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@clerk/express");
const Sentry = __importStar(require("@sentry/node"));
const cors_1 = __importDefault(require("cors"));
const express_2 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const analysis_routes_1 = __importDefault(require("./analysis-routes"));
const clerk_routes_1 = __importDefault(require("./clerk-routes"));
const env_1 = require("./env");
const auth_middleware_1 = require("./middleware/auth-middleware");
const db_connection_middleware_1 = require("./middleware/db-connection-middleware");
const service_middleware_1 = require("./middleware/service-middleware");
const pricelist_routes_1 = __importDefault(require("./pricelist-routes"));
const products_routes_1 = __importDefault(require("./products-routes"));
const service_routes_1 = __importDefault(require("./service-routes"));
const user_actions_routes_1 = __importDefault(require("./user-actions-routes"));
const user_routes_1 = __importDefault(require("./user-routes"));
require("./instrument");
const app = (0, express_2.default)();
// Add logging middleware
app.use((0, morgan_1.default)("dev", { skip: () => (0, env_1.isTestEnv)() }));
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
}));
app.use((0, helmet_1.default)());
// Set limit to 20MB
app.use(express_2.default.json({ limit: "20mb" }));
app.use(express_2.default.urlencoded({ limit: "20mb", extended: true }));
// Use a raw body parser for the Cleak webhook route
app.use("/clerk/create-user", express_2.default.raw({ type: "application/json" }));
app.use(db_connection_middleware_1.ensureDbConnectionMiddleware);
// Health check endpoint
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        service: "DNS Markdown API"
    });
});
app.use("/api", auth_middleware_1.authMiddleware);
app.use("/user-actions", (0, express_1.clerkMiddleware)());
app.use("/api/pricelist", pricelist_routes_1.default);
app.use("/api/products", products_routes_1.default);
app.use("/api/user", user_routes_1.default);
app.use("/user-actions", user_actions_routes_1.default);
app.use("/api/analysis", analysis_routes_1.default);
app.use("/clerk", clerk_routes_1.default);
app.use("/service", service_middleware_1.serviceMiddleware);
app.use("/service", service_routes_1.default);
Sentry.setupExpressErrorHandler(app);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res
        .status(500)
        .json({ error: "Internal Server Error", ...((0, env_1.isDev)() && { details: err.message }) });
});
exports.default = app;
