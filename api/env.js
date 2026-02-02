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
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.isTestEnv = exports.isDev = exports.isProd = void 0;
const dotenv = __importStar(require("dotenv"));
const zod_1 = require("zod");
const isProd = () => process.env.NODE_ENV === "production";
exports.isProd = isProd;
const isDev = () => process.env.NODE_ENV === "development";
exports.isDev = isDev;
const isTestEnv = () => process.env.NODE_ENV === "test";
exports.isTestEnv = isTestEnv;
if ((0, exports.isDev)()) {
    dotenv.config({ path: ".env.development" });
}
else if ((0, exports.isTestEnv)()) {
    dotenv.config({ path: ".env.test" });
}
else if ((0, exports.isProd)()) {
    dotenv.config({ path: ".env.production" });
}
const envSchema = zod_1.z.object({
    CLERK_PUBLISHABLE_KEY: zod_1.z
        .string()
        .min(10, "CLERK_PUBLISHABLE_KEY must be at least 10 characters long"),
    CLERK_SECRET_KEY: zod_1.z.string().min(10, "CLERK_SECRET_KEY must be at least 10 characters long"),
    CLERK_WEBHOOK_SIGNING_SECRET: zod_1.z
        .string()
        .min(10, "CLERK_WEBHOOK_SIGNING_SECRET must be at least 10 characters long"),
    CITY: zod_1.z.string().default("samara"),
    PORT: zod_1.z.string().default("4000"),
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: zod_1.z.string().startsWith("mongodb"),
    // Auth
    API_AUTH_SECRET: zod_1.z.string().min(10, "API_AUTH_SECRET must be at least 10 characters long"),
    API_SERVICE_SECRET: zod_1.z.string().min(10, "API_SERVICE_SECRET must be at least 10 characters long"),
    // Upstash Redis
    UPSTASH_REDIS_REST_URL: zod_1.z.string().startsWith("https://"),
    UPSTASH_REDIS_REST_TOKEN: zod_1.z
        .string()
        .min(10, "UPSTASH_REDIS_REST_TOKEN must be at least 10 characters long"),
    // CORS
    CORS_ORIGIN: zod_1.z
        .string()
        .or(zod_1.z.array(zod_1.z.string()))
        .transform(val => {
        if (typeof val === "string") {
            return val.split(",").map(origin => origin.trim());
        }
        return val;
    })
        .default([])
});
let env;
try {
    exports.env = env = envSchema.parse(process.env);
}
catch (error) {
    console.error("⚠️  Environment variable validation error:", process.env);
    if (error instanceof zod_1.z.ZodError) {
        console.error("❌ Invalid environment variables:");
        const { fieldErrors } = zod_1.z.flattenError(error);
        console.error(JSON.stringify(fieldErrors, null, 2));
        // More detailed error messages
        error.issues.forEach(err => {
            const path = err.path.join(".");
            console.error(`  ${path}: ${err.message}`);
        });
        process.exit(1);
    }
    console.error(error);
    throw error;
}
