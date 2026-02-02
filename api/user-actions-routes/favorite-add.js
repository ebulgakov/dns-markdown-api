"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@clerk/express");
const user_1 = require("../db/models/user");
async function addFavoriteHandler(req, res, next) {
    try {
        const { product } = req.body;
        const { userId } = (0, express_1.getAuth)(req);
        if (typeof userId !== "string" || !userId.trim()) {
            return res.status(401).send("Authentication required. User identity not found.");
        }
        if (typeof product !== "object" || product === null || Array.isArray(product)) {
            return res.status(400).send("product is required and must be a valid object.");
        }
        const item = {
            status: {
                deleted: false,
                createdAt: new Date()
            },
            item: product
        };
        const user = await user_1.User.findOneAndUpdate({
            userId: userId.trim(),
            "favorites.item.link": { $ne: product.link } // Assuming 'link' is a unique identifier for the product
        }, { $addToSet: { favorites: item } }, { new: true, runValidators: true }).exec();
        // Check if the user was found and the item was added
        if (!user) {
            // Check if the user exists to differentiate between user not found and item already in favorites
            const existingUser = await user_1.User.findOne({ userId: userId.trim() }).select("favorites").exec();
            if (!existingUser)
                return res.status(404).send("User not found");
            return res
                .status(409)
                .json({ message: "Item already in favorites", favorites: existingUser.favorites });
        }
        res.json({ message: "Item added to favorites", favorites: user.favorites });
    }
    catch (error) {
        next(error);
    }
}
exports.default = addFavoriteHandler;
