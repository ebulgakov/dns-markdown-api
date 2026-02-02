"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceMiddleware = void 0;
const env_1 = require("../env");
const serviceMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1] || "";
    // Just in case if token is empty string and API_SERVICE_SECRET also empty string
    if (!token || token !== env_1.env.API_SERVICE_SECRET) {
        return res.status(401).json({ error: "Unauthorized Service" });
    }
    next();
};
exports.serviceMiddleware = serviceMiddleware;
