"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const env_1 = require("../env");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1] || "";
    // Just in case if token is empty string and some of the secrets also empty string
    if (!token || ![env_1.env.API_SERVICE_SECRET, env_1.env.API_AUTH_SECRET].includes(token)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};
exports.authMiddleware = authMiddleware;
