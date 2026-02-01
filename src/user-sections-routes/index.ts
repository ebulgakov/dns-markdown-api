import { Router } from "express";

import favoriteAddHandler from "./favorite-add";
import favoriteRemoveHandler from "./favorite-remove";
import hiddenAddHandler from "./hidden-add";
import hiddenRemoveHandler from "./hidden-remove";

const router = Router();

router.post("/hidden-add", hiddenAddHandler);
router.post("/hidden-remove", hiddenRemoveHandler);
router.post("/favorite-add", favoriteAddHandler);
router.post("/favorite-remove", favoriteRemoveHandler);

export default router;
