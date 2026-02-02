"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@clerk/express");
const user_1 = require("../db/models/user");
async function updateNotificationHandler(req, res, next) {
    try {
        const { notifications: notificationsRaw } = req.body;
        const { userId } = (0, express_1.getAuth)(req);
        if (typeof userId !== "string" || !userId.trim()) {
            return res.status(401).send("Authentication required. User identity not found.");
        }
        if (typeof notificationsRaw !== "object" || notificationsRaw === null) {
            return res.status(400).send("notifications is required and must be an object.");
        }
        const { updates } = notificationsRaw;
        if (typeof updates !== "object" || updates === null) {
            return res.status(400).send("notifications must have an 'updates' object property.");
        }
        const { enabled } = updates;
        if (typeof enabled !== "boolean") {
            return res.status(400).send("notifications.updates must have an 'enabled' boolean property.");
        }
        // Avoid overwriting other notification settings by only updating the provided fields
        const notifications = {
            updates: {
                enabled
            }
        };
        const user = await user_1.User.findOneAndUpdate({ userId: userId.trim() }, { $set: { notifications } }, { new: true, runValidators: true }).exec();
        if (!user)
            return res.status(404).send("User not found");
        res.json({ message: "Notifications updated", notifications: user.notifications });
    }
    catch (error) {
        next(error);
    }
}
exports.default = updateNotificationHandler;
