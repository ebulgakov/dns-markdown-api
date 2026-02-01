import { Router } from "express";

import addFavoriteHandler from "./add";
import removeFavoriteHandler from "./remove";

const router = Router();

router.post("/add", addFavoriteHandler);

router.post("/remove", removeFavoriteHandler);

export default router;
