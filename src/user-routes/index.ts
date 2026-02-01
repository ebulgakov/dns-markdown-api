import { Router } from "express";

import updateNotificationHandler from "./notifications-update";
import toggleShownBoughtFavoritesHandler from "./toggle-shown-bought-favorites";
import userByIdHandler from "./user-by-id";

const router = Router();

router.get("/id/:id", userByIdHandler);

router.post("/notifications/update", updateNotificationHandler);

router.post("/toggle-shown-bought-favorites", toggleShownBoughtFavoritesHandler);

export default router;
