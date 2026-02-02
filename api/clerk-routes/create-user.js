"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const svix_1 = require("svix");
const user_1 = require("../db/models/user");
const env_1 = require("../env");
async function createUserWebhookHandler(req, res, next) {
    const svix_id = req.header("svix-id");
    const svix_timestamp = req.header("svix-timestamp");
    const svix_signature = req.header("svix-signature");
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).send("Error occured -- no svix headers");
    }
    const payload = req.body;
    const bodyString = JSON.stringify(payload);
    const wh = new svix_1.Webhook(env_1.env.CLERK_WEBHOOK_SIGNING_SECRET);
    let evt;
    try {
        evt = wh.verify(bodyString, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err instanceof Error ? err.message : "Unknown error"
        });
    }
    const eventType = evt.type;
    if (eventType === "user.created") {
        try {
            const { id, email_addresses, username } = evt.data;
            const newUser = new user_1.User({
                userId: id,
                username: username || "",
                email: email_addresses[0]?.email_address || "test@exemple.com" // Leave for test in Clerk webhook testing
            });
            await newUser.save();
            res.status(200).json({ success: true, message: "Webhook received" });
        }
        catch (err) {
            next(err);
        }
    }
    else {
        res.status(200).json({ success: true, message: "Webhook received" });
    }
}
exports.default = createUserWebhookHandler;
