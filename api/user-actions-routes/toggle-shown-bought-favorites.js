"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@clerk/express");
const user_1 = require("../db/models/user");
async function toggleShownBoughtFavoritesHandler(req, res, next) {
    try {
        const { status } = req.body;
        const { userId } = (0, express_1.getAuth)(req);
        if (typeof userId !== "string" || !userId.trim()) {
            return res.status(401).send("Authentication required. User identity not found.");
        }
        if (typeof status !== "boolean") {
            return res.status(400).send("Invalid 'status' value. It must be a boolean.");
        }
        const user = await user_1.User.findOneAndUpdate({ userId: userId.trim() }, { $set: { shownBoughtFavorites: status } }, { new: true, runValidators: true }).exec();
        if (!user)
            return res.status(404).send("User not found");
        res.json({
            message: "Show bought favorites status updated",
            shownBoughtFavorites: user.shownBoughtFavorites
        });
    }
    catch (error) {
        next(error);
    }
}
exports.default = toggleShownBoughtFavoritesHandler;
