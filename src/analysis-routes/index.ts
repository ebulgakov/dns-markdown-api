import { Router } from "express";

import allAnalysisGoodsByDateAddedHandler from "./all-analysis-goods-by-date-added";
import allAnalysisDiffsHandler from "./all-diffs";
import lastAnalysisDiffHandler from "./last-diff";
import priceDropPredictionHandler from "./price-drop-prediction";
import productsCountHandler from "./products-count";
import reportsHandler from "./reports";
import totalUniqProductsCount from "./total-uniq-products-count";

const router = Router();

router.get("/last-diff", lastAnalysisDiffHandler);
router.get("/reports", reportsHandler);
router.get("/all-diffs", allAnalysisDiffsHandler);
router.get("/all-analysis-goods-by-date-added", allAnalysisGoodsByDateAddedHandler);
router.get("/products-count", productsCountHandler);
router.get("/total-uniq-products-count", totalUniqProductsCount);
router.get("/price-drop-prediction", priceDropPredictionHandler);

export default router;
