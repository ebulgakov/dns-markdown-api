import { Router } from "express";

import addAnalysisReportHandler from "./add-analysis-report.ts";
import addNewPriceListHandler from "./add-new-price-list.ts";
import allPriceListsHandler from "./all-price-lists";
import allUsersHandler from "./all-users.ts";
import deleteAnalysisDataByDateHandler from "./delete-analysis-data-by-date.ts";
import deleteAnalysisDataHandler from "./delete-analysis-data.ts";
import deleteAnalysisDiffByDateHandler from "./delete-analysis-diff-by-date.ts";
import deleteAnalysisDiffHandler from "./delete-analysis-diff.ts";
import deleteAnalysisReportByCityDateHandler from "./delete-analysis-report-by-city-date.ts";
import deleteLastPriceListHandler from "./delete-last-price-list.ts";
import insertAnalysisDataHandler from "./insert-analysis-data.ts";
import insertAnalysisDiffHandler from "./insert-analysis-diff.ts";
import updateUsersFavoritesHandler from "./update-users-favorites.ts";

const router = Router();

router.get("/all-price-lists", allPriceListsHandler);
router.post("/delete-last-price-list", deleteLastPriceListHandler);
router.post("/add-new-price-list", addNewPriceListHandler);

router.post("/insert-analysis-data", insertAnalysisDataHandler);
router.post("/delete-analysis-data", deleteAnalysisDataHandler);
router.post("/delete-analysis-data-by-date", deleteAnalysisDataByDateHandler);

router.post("/insert-analysis-diff", insertAnalysisDiffHandler);
router.post("/delete-analysis-diff", deleteAnalysisDiffHandler);
router.post("/delete-analysis-diff-by-date", deleteAnalysisDiffByDateHandler);

router.post("/add-analysis-report", addAnalysisReportHandler);
router.post("/delete-analysis-report-by-city-date", deleteAnalysisReportByCityDateHandler);

router.get("/all-users", allUsersHandler);
router.post("/update-users-favorites", updateUsersFavoritesHandler);

export default router;
