"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@clerk/express");
const user_1 = require("../db/models/user");
async function hiddenAddHandler(req, res, next) {
    try {
        const { title } = req.body;
        const { userId } = (0, express_1.getAuth)(req);
        if (typeof userId !== "string" || !userId.trim()) {
            return res.status(401).send("Authentication required. User identity not found.");
        }
        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).send("title is required and must be a non-empty string.");
        }
        const user = await user_1.User.findOneAndUpdate({ userId: userId.trim() }, { $addToSet: { hiddenSections: title.trim() } }, { new: true, runValidators: true }).exec();
        if (!user)
            return res.status(404).send("User not found");
        res.json({ message: "Section added to hidden sections", sections: user.hiddenSections });
    }
    catch (error) {
        next(error);
    }
}
exports.default = hiddenAddHandler;
