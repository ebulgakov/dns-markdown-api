import { Router } from "express";

import lastPriceListHandler from "./last-pricelist.ts";
import listPriceListsHandler from "./list.ts";
import priceListByIdHandler from "./pricelist-by-id.ts";

const router = Router();

router.get("/", lastPriceListHandler);

router.get("/list", listPriceListsHandler);

router.get("/id/:id", priceListByIdHandler);

export default router;
