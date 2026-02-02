"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@clerk/express");
const user_1 = require("../db/models/user");
async function removeFavoriteHandler(req, res, next) {
    try {
        const { link } = req.body;
        const { userId } = (0, express_1.getAuth)(req);
        if (typeof userId !== "string" || !userId.trim()) {
            return res.status(401).send("Authentication required. User identity not found.");
        }
        if (typeof link !== "string" || !link.trim()) {
            return res.status(400).send("link is required and must be a non-empty string.");
        }
        const user = await user_1.User.findOneAndUpdate({ userId: userId.trim() }, { $pull: { favorites: { "item.link": link.trim() } } }, { new: true, runValidators: true }).exec();
        if (!user)
            return res.status(404).send("User not found");
        res.json({ message: "Item removed from favorites", favorites: user.favorites });
    }
    catch (error) {
        next(error);
    }
}
exports.default = removeFavoriteHandler;
