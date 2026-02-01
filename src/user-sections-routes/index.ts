import { Router } from "express";

import favoriteAddHandler from "./favorite-add.ts";
import favoriteRemoveHandler from "./favorite-remove.ts";
import hiddenAddHandler from "./hidden-add.ts";
import hiddenRemoveHandler from "./hidden-remove.ts";

const router = Router();

router.post("/hidden-add", hiddenAddHandler);
router.post("/hidden-remove", hiddenRemoveHandler);
router.post("/favorite-add", favoriteAddHandler);
router.post("/favorite-remove", favoriteRemoveHandler);

export default router;
