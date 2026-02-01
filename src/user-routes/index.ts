import { Router } from "express";

import userByIdHandler from "./user-by-id";

const router = Router();

router.get("/id/:id", userByIdHandler);

export default router;
