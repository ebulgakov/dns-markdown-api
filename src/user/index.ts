import { Router } from "express";

import { User } from "../../db/models/user";

const router = Router();

router.get("/id/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("id is required");

    const user = await User.findOne({ userId: id }).lean().exec();
    if (!user) return res.status(404).send("User not found");

    res.json(JSON.parse(JSON.stringify(user)));
  } catch (error) {
    next(error);
  }
});

export default router;
