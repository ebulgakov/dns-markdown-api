import { Router } from "express";

import allAnalysisDiffsHandler from "./all-diffs";
import lastAnalysisDiffHandler from "./last-diff";
import productsCountHandler from "./products-count";
import reportsHandler from "./reports.ts";
import totalUniqProductsCount from "./total-uniq-products-count";

const router = Router();

router.get("/last-diff", lastAnalysisDiffHandler);
router.get("/reports", reportsHandler);
router.get("/all-diffs", allAnalysisDiffsHandler);
router.get("/products-count", productsCountHandler);
router.get("/total-uniq-products-count", totalUniqProductsCount);

export default router;
