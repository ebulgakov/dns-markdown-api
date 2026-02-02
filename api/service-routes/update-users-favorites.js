"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../db/models/user");
async function updateUsersFavoritesHandler(req, res, next) {
    try {
        const { users } = req.body;
        if (!users)
            return res.status(400).send("users are required");
        const bulkOps = users.map(user => ({
            updateOne: {
                filter: { userId: user.userId },
                update: { favorites: user.favorites }
            }
        }));
        await user_1.User.bulkWrite(bulkOps);
        res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}
exports.default = updateUsersFavoritesHandler;
