"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../db/models/user");
async function userByIdHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id)
            return res.status(400).send("id is required");
        const user = await user_1.User.findOne({ userId: id }).lean().exec();
        if (!user)
            return res.status(404).send("User not found");
        res.json(user);
    }
    catch (error) {
        next(error);
    }
}
exports.default = userByIdHandler;
