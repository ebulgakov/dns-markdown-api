import { Router } from "express";

import { AnalysisData } from "../../db/models/analysis-data";
import { AnalysisDiff } from "../../db/models/analysis-diff";
import { Pricelist } from "../../db/models/pricelist";
import { Reports } from "../../db/models/reports";
import { User } from "../../db/models/user";

import type { AnalysisData as AnalysisDataType } from "../../types/analysis-data";
import type { AnalysisDiff as AnalysisDiffType } from "../../types/analysis-diff";
import type { Position } from "../../types/pricelist";
import type { Favorite } from "../../types/user";

const router = Router();

router.get("/all-price-lists", async (req, res, next) => {
  try {
    const city = req.query.city as string;

    if (!city) return res.status(400).send("city is required");

    const priceLists = await Pricelist.find({ city }, {}, { sort: { updatedAt: -1 } }).exec();
    res.json(priceLists);
  } catch (error) {
    next(error);
  }
});

router.post("/delete-last-price-list", async (req, res, next) => {
  try {
    const { city } = req.body as { city: string };

    if (!city) return res.status(400).send("city is required");

    await Pricelist.findOneAndDelete({ city }, { sort: { updatedAt: -1 } }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

router.post("/add-new-price-list", async (req, res, next) => {
  try {
    const { city, positions } = req.body as { city: string; positions: Position[] };

    if (!city || !positions) return res.status(400).send("city and positions are required");

    const priceList = new Pricelist({
      city,
      positions
    });

    await priceList.save();
    res.status(201).json(priceList);
  } catch (error) {
    next(error);
  }
});

router.post("/insert-analysis-data", async (req, res, next) => {
  try {
    const { analysisData } = req.body as {
      analysisData: AnalysisDataType[];
    };

    if (!analysisData) return res.status(400).send("analysisData are required");

    await AnalysisData.insertMany(analysisData);
    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
});

router.post("/delete-analysis-data", async (req, res, next) => {
  try {
    const { city } = req.body as { city: string };

    if (!city) return res.status(400).send("city is required");

    await AnalysisData.deleteMany({ city }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

router.post("/delete-analysis-data-by-date", async (req, res, next) => {
  try {
    const { city, date } = req.body as { city: string; date: string };

    if (!city || !date) return res.status(400).send("city and date are required");

    await AnalysisData.deleteMany({ city, dateAdded: date }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

router.post("/insert-analysis-diff", async (req, res, next) => {
  try {
    const { analysisDiff } = req.body as {
      analysisDiff: AnalysisDiffType[];
    };

    if (!analysisDiff) return res.status(400).send("analysisDiff are required");

    await AnalysisDiff.insertMany(analysisDiff);
    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
});

router.post("/delete-analysis-diff", async (req, res, next) => {
  try {
    const { city } = req.body as { city: string };

    if (!city) return res.status(400).send("city is required");

    await AnalysisDiff.deleteMany({ city }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

router.post("/delete-analysis-diff-by-date", async (req, res, next) => {
  try {
    const { city, date } = req.body as { city: string; date: string };

    if (!city || !date) return res.status(400).send("city and date are required");

    await AnalysisDiff.deleteMany({ city, dateAdded: date }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

router.post("/add-analysis-report", async (req, res, next) => {
  try {
    const { city, report, dateAdded } = req.body as {
      city: string;
      report: string;
      dateAdded: string;
    };

    if (!city || !report || !dateAdded)
      return res.status(400).send("city/report/dateAdded are required");

    const newReport = new Reports({ city, dateAdded, report });

    return newReport.save();
  } catch (error) {
    next(error);
  }
});

router.post("/delete-analysis-report-by-city-date", async (req, res, next) => {
  try {
    const { city, dateAdded } = req.body as { city: string; dateAdded: string };

    if (!city || !dateAdded) return res.status(400).send("city and dateAdded are required");

    await Reports.deleteMany({ city, dateAdded }).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

router.get("/all-users", async (req, res, next) => {
  try {
    const city = req.query.city as string;

    if (!city) return res.status(400).send("city is required");

    const users = await User.find({ city }, {}, { sort: { updatedAt: -1 } }).exec();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post("/update-users-favorites", async (req, res, next) => {
  try {
    const { users } = req.body as {
      users: { userId: string; favorites: Favorite[] }[];
    };

    if (!users) return res.status(400).send("users are required");

    const bulkOps = users.map(user => ({
      updateOne: {
        filter: { userId: user.userId },
        update: { favorites: user.favorites }
      }
    }));

    await User.bulkWrite(bulkOps);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

export default router;
