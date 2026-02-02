"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../db/models/user");
async function allNotificationUsersHandler(req, res, next) {
    try {
        const cityRaw = req.query.city;
        const city = `${cityRaw ?? ""}`.trim();
        if (!city)
            return res.status(400).send("city is required");
        const users = await user_1.User.find({ city, favorites: { $gt: [] }, "notifications.updates.enabled": true }, {}, { sort: { updatedAt: -1 } })
            .select("favorites email userId")
            .exec();
        res.json(users);
    }
    catch (error) {
        next(error);
    }
}
exports.default = allNotificationUsersHandler;
