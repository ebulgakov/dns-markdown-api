import { expect, test, describe, mock, beforeEach } from "bun:test";

import priceDropPredictionHandler from "../price-drop-prediction";

import type { PriceDropPrediction } from "@src/types/analysis-data";
import type { Goods } from "@src/types/pricelist";
import type { Mock } from "bun:test";
import type { NextFunction, Request, Response } from "express";

// Mock dependencies
const cacheGet = mock(async (): Promise<PriceDropPrediction[] | null> => null);
const cacheAdd = mock(async () => {});
const exec = mock(async (): Promise<unknown[]> => []);
const lean = mock(() => ({ exec }));
const sort = mock(() => ({ lean }));
const find = mock(() => ({ sort }));
const getLastPriceListFlat = mock(async (): Promise<Goods[]> => []);

const AnalysisData = { find };

mock.module("@src/cache", () => ({
  cacheGet,
  cacheAdd
}));

mock.module("@src/db/models/analysis-data", () => ({
  AnalysisData
}));

mock.module("@src/pricelist-routes/helpers/get-last-price-list", () => ({
  getLastPriceListFlat
}));

const makeGood = (overrides: Partial<Goods> = {}): Goods => ({
  _id: "id-1",
  title: "Product",
  link: "https://example.com/product",
  description: "",
  reasons: [],
  priceOld: "1000",
  price: "800",
  profit: "200",
  code: "code-1",
  image: "",
  available: "1",
  ...overrides
});

// Anchor all fixture dates on "now" so predictions land in the future and are
// not filtered out by the past-prediction rule (which compares against Date.now()).
const DAY_MS = 24 * 60 * 60 * 1000;
const NOW_MS = Date.now();
const daysAgo = (days: number) => new Date(NOW_MS - days * DAY_MS).toISOString();
const daysFromNow = (days: number) => new Date(NOW_MS + days * DAY_MS).toISOString();

describe("priceDropPredictionHandler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  const next: NextFunction = mock(() => {});
  const json = mock(() => res as Response);
  const send = mock(() => res as Response);
  const status = mock(() => res as Response);

  beforeEach(() => {
    req = { query: {} };
    res = { json, send, status };
    cacheGet.mockReset();
    cacheAdd.mockReset();
    getLastPriceListFlat.mockReset();
    find.mockClear();
    sort.mockClear();
    lean.mockClear();
    exec.mockClear();
    (next as unknown as Mock<NextFunction>).mockClear();
    json.mockClear();
    send.mockClear();
    status.mockClear();
  });

  test("should return 400 if city is not provided", async () => {
    await priceDropPredictionHandler(req as Request, res as Response, next);
    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith("city is required");
  });

  test("should return cached data if it exists", async () => {
    req.query = { city: "TestCity" };
    const mockPayload: PriceDropPrediction[] = [
      { item: makeGood(), lastUpdateDate: daysAgo(2), predictionDate: daysFromNow(6) }
    ];
    cacheGet.mockResolvedValueOnce(mockPayload);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(cacheGet).toHaveBeenCalledWith("daily:analysis:price-drop-prediction:TestCity");
    expect(json).toHaveBeenCalledWith(mockPayload);
    expect(getLastPriceListFlat).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  test("should return an empty array without querying AnalysisData if the catalog is empty", async () => {
    req.query = { city: "TestCity" };
    getLastPriceListFlat.mockResolvedValueOnce([]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(find).not.toHaveBeenCalled();
    expect(cacheAdd).toHaveBeenCalledWith("daily:analysis:price-drop-prediction:TestCity", [], {
      ex: 60 * 60 * 24
    });
    expect(json).toHaveBeenCalledWith([]);
  });

  test("should query the full history sorted ascending by link and date", async () => {
    req.query = { city: "TestCity" };
    getLastPriceListFlat.mockResolvedValueOnce([makeGood({ link: "https://example.com/product" })]);
    exec.mockResolvedValueOnce([]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(find).toHaveBeenCalledWith(
      { city: "TestCity", link: { $in: ["https://example.com/product"] } },
      { link: 1, price: 1, dateAdded: 1 }
    );
    expect(sort).toHaveBeenCalledWith({ link: 1, dateAdded: 1 });
  });

  test("should count every price change including increases, ignoring only unchanged records", async () => {
    req.query = { city: "TestCity" };
    const link = "https://example.com/product";
    const item = makeGood({ link });
    getLastPriceListFlat.mockResolvedValueOnce([item]);
    exec.mockResolvedValueOnce([
      { link, price: "4000", dateAdded: daysAgo(60) }, // initial (catalog add)
      { link, price: "4000", dateAdded: daysAgo(55) }, // unchanged, skipped
      { link, price: "3600", dateAdded: daysAgo(50) }, // change #1 (down)
      { link, price: "3800", dateAdded: daysAgo(30) }, // change #2 (up, still counts)
      { link, price: "3100", dateAdded: daysAgo(10) } // change #3 (down)
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // changes at day -50, -30, -10 -> gaps 20, 20 -> average 20 -> prediction day +10.
    // If the increase at day -30 were ignored, gaps would be 40 -> prediction day +30,
    // so asserting day +10 proves the increase is counted.
    expect(json).toHaveBeenCalledWith([
      { item, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(10) }
    ]);
  });

  test("should exclude products with fewer than 2 recorded price changes", async () => {
    req.query = { city: "TestCity" };
    const withTwoChanges = makeGood({ link: "https://example.com/with-two-changes" });
    const withOneChange = makeGood({ link: "https://example.com/with-one-change" });
    const withNoHistory = makeGood({ link: "https://example.com/no-history" });
    getLastPriceListFlat.mockResolvedValueOnce([withTwoChanges, withOneChange, withNoHistory]);
    exec.mockResolvedValueOnce([
      { link: withTwoChanges.link, price: "1000", dateAdded: daysAgo(40) },
      { link: withTwoChanges.link, price: "900", dateAdded: daysAgo(30) },
      { link: withTwoChanges.link, price: "800", dateAdded: daysAgo(10) },
      { link: withOneChange.link, price: "1000", dateAdded: daysAgo(40) },
      { link: withOneChange.link, price: "1000", dateAdded: daysAgo(30) },
      { link: withOneChange.link, price: "900", dateAdded: daysAgo(10) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // withTwoChanges: changes at day -30 and day -10 -> interval 20 days -> prediction day +10
    expect(json).toHaveBeenCalledWith([
      { item: withTwoChanges, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(10) }
    ]);
  });

  test("should keep products with a future prediction but drop those overdue, in one response", async () => {
    req.query = { city: "TestCity" };
    const future = makeGood({ link: "https://example.com/future" });
    const overdue = makeGood({ link: "https://example.com/overdue" });
    getLastPriceListFlat.mockResolvedValueOnce([future, overdue]);
    exec.mockResolvedValueOnce([
      // future: changes at day -30 and day -10 -> interval 20 -> prediction day +10 (kept)
      { link: future.link, price: "5000", dateAdded: daysAgo(40) },
      { link: future.link, price: "4500", dateAdded: daysAgo(30) },
      { link: future.link, price: "4000", dateAdded: daysAgo(10) },
      // overdue: changes at day -100 and day -60 -> interval 40 -> prediction day -20 (dropped)
      { link: overdue.link, price: "3000", dateAdded: daysAgo(120) },
      { link: overdue.link, price: "2500", dateAdded: daysAgo(100) },
      { link: overdue.link, price: "2000", dateAdded: daysAgo(60) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(json).toHaveBeenCalledWith([
      { item: future, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(10) }
    ]);
  });

  test("should average uneven gaps between changes, not extrapolate from the last gap", async () => {
    req.query = { city: "TestCity" };
    const link = "https://example.com/product";
    const item = makeGood({ link });
    getLastPriceListFlat.mockResolvedValueOnce([item]);
    exec.mockResolvedValueOnce([
      { link, price: "5000", dateAdded: daysAgo(120) }, // catalog add (baseline)
      { link, price: "4500", dateAdded: daysAgo(100) }, // change #1
      { link, price: "4000", dateAdded: daysAgo(40) }, // change #2 (gap 60)
      { link, price: "3500", dateAdded: daysAgo(10) }, // change #3 (gap 30)
      { link, price: "3000", dateAdded: daysAgo(4) } // change #4 (gap 6)
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // gaps 60, 30, 6 -> average 32 days. Last gap alone (6) would give day +2;
    // the average pushes the prediction to last change (day -4) + 32 = day +28.
    expect(json).toHaveBeenCalledWith([
      { item, lastUpdateDate: daysAgo(4), predictionDate: daysFromNow(28) }
    ]);
  });

  test("should compute the average interval between changes per product, sorted ascending by predicted date", async () => {
    req.query = { city: "TestCity" };
    const soon = makeGood({ link: "https://example.com/soon" });
    const far = makeGood({ link: "https://example.com/far" });
    getLastPriceListFlat.mockResolvedValueOnce([far, soon]);
    exec.mockResolvedValueOnce([
      // far: changes at day -60 and day -10 -> interval 50 days -> prediction day +40
      { link: far.link, price: "5000", dateAdded: daysAgo(70) },
      { link: far.link, price: "4500", dateAdded: daysAgo(60) },
      { link: far.link, price: "4000", dateAdded: daysAgo(10) },
      // soon: changes at day -30 and day -10 -> interval 20 days -> prediction day +10
      { link: soon.link, price: "4200", dateAdded: daysAgo(40) },
      { link: soon.link, price: "3600", dateAdded: daysAgo(30) },
      { link: soon.link, price: "3100", dateAdded: daysAgo(10) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    const expected = [
      { item: soon, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(10) },
      { item: far, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(40) }
    ];
    expect(cacheAdd).toHaveBeenCalledWith(
      "daily:analysis:price-drop-prediction:TestCity",
      expected,
      { ex: 60 * 60 * 24 }
    );
    expect(json).toHaveBeenCalledWith(expected);
  });

  test("should call next with error if db query fails", async () => {
    req.query = { city: "TestCity" };
    getLastPriceListFlat.mockResolvedValueOnce([makeGood()]);
    const error = new Error("DB error");
    exec.mockRejectedValueOnce(error);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
