import { getAuth } from "@clerk/express";
import { User } from "@src/db/models/user";
import { z } from "zod";

import type { NextFunction, Request, Response } from "express";

const hiddenSectionAddSchema = z.object({
  title: z.string().trim().min(1, "title is required and must be a non-empty string.")
});

async function hiddenAddHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = hiddenSectionAddSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ errors: z.prettifyError(validationResult.error) });
    }

    const { title } = validationResult.data;
    const { userId } = getAuth(req);

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(401).send("Authentication required. User identity not found.");
    }

    const user = await User.findOneAndUpdate(
      { userId: userId.trim() },
      { $addToSet: { hiddenSections: title } },
      { new: true, runValidators: true }
    ).exec();

    if (!user) return res.status(404).send("User not found");
    res.json({ message: "Section added to hidden sections", sections: user.hiddenSections });
  } catch (error) {
    next(error);
  }
}

export default hiddenAddHandler;
