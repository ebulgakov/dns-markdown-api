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
      { item: makeGood(), lastUpdateDate: daysAgo(2), predictionDate: daysFromNow(6), expired: false }
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
    // changes at day -50, -30, -10 -> gaps 20, 20 -> only one product, so the
    // global reference is also 20 days and no gap is small enough to be anomalous.
    exec.mockResolvedValueOnce([
      { link, price: "4000", dateAdded: daysAgo(60) }, // initial (catalog add)
      { link, price: "4000", dateAdded: daysAgo(55) }, // unchanged, skipped
      { link, price: "3600", dateAdded: daysAgo(50) }, // change #1 (down)
      { link, price: "3800", dateAdded: daysAgo(30) }, // change #2 (up, still counts)
      { link, price: "3100", dateAdded: daysAgo(10) } // change #3 (down)
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // median of [20, 20] -> 20 -> prediction day +10.
    // If the increase at day -30 were ignored, gaps would be [40] -> prediction day +30,
    // so asserting day +10 proves the increase is counted.
    expect(json).toHaveBeenCalledWith([
      { item, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(10), expired: false }
    ]);
  });

  test("should take the median of gaps rather than the mean", async () => {
    req.query = { city: "TestCity" };
    const link = "https://example.com/product";
    const item = makeGood({ link });
    getLastPriceListFlat.mockResolvedValueOnce([item]);
    // changes at day -100, -40, -10, -4 -> gaps 60, 30, 6.
    // mean = 32 (old behavior); median = 30 (new behavior) -> prediction day -4 + 30 = +26.
    exec.mockResolvedValueOnce([
      { link, price: "5000", dateAdded: daysAgo(120) }, // catalog add (baseline)
      { link, price: "4500", dateAdded: daysAgo(100) }, // change #1
      { link, price: "4000", dateAdded: daysAgo(40) }, // change #2 (gap 60)
      { link, price: "3500", dateAdded: daysAgo(10) }, // change #3 (gap 30)
      { link, price: "3000", dateAdded: daysAgo(4) } // change #4 (gap 6)
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(json).toHaveBeenCalledWith([
      { item, lastUpdateDate: daysAgo(4), predictionDate: daysFromNow(26), expired: false }
    ]);
  });

  test("should fall back to the city-wide median for a product with no recorded changes, anchored to its earliest record", async () => {
    req.query = { city: "TestCity" };
    const established = makeGood({ link: "https://example.com/established" });
    const fresh = makeGood({ link: "https://example.com/fresh" });
    getLastPriceListFlat.mockResolvedValueOnce([established, fresh]);
    exec.mockResolvedValueOnce([
      // established: changes at day -40 and day -10 -> interval 30 days -> global median = 30
      { link: established.link, price: "1000", dateAdded: daysAgo(70) },
      { link: established.link, price: "900", dateAdded: daysAgo(40) },
      { link: established.link, price: "800", dateAdded: daysAgo(10) },
      // fresh: single record, no price change ever recorded, added 25 days ago
      { link: fresh.link, price: "500", dateAdded: daysAgo(25) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // fresh has no own interval, so it borrows the city's global median (30 days)
    // anchored to its only known date (day -25) -> prediction day -25 + 30 = day +5,
    // which sorts ahead of established's day +20.
    expect(json).toHaveBeenCalledWith([
      { item: fresh, lastUpdateDate: daysAgo(25), predictionDate: daysFromNow(5), expired: false },
      { item: established, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(20), expired: false }
    ]);
  });

  test("should fall back to the city-wide median for a product with exactly one recorded change, anchored to that change", async () => {
    req.query = { city: "TestCity" };
    const established = makeGood({ link: "https://example.com/established" });
    const oneChange = makeGood({ link: "https://example.com/one-change" });
    getLastPriceListFlat.mockResolvedValueOnce([established, oneChange]);
    exec.mockResolvedValueOnce([
      // established: changes at day -40 and day -10 -> interval 30 days -> global median = 30
      { link: established.link, price: "1000", dateAdded: daysAgo(70) },
      { link: established.link, price: "900", dateAdded: daysAgo(40) },
      { link: established.link, price: "800", dateAdded: daysAgo(10) },
      // oneChange: a single recorded change, day -35 -> no own interval possible
      { link: oneChange.link, price: "2000", dateAdded: daysAgo(50) },
      { link: oneChange.link, price: "1800", dateAdded: daysAgo(35) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // oneChange borrows the global median (30 days) anchored to its single change
    // date (day -35) -> prediction day -35 + 30 = day -5 (overdue -> expired: true).
    expect(json).toHaveBeenCalledWith([
      { item: oneChange, lastUpdateDate: daysAgo(35), predictionDate: daysAgo(5), expired: true },
      { item: established, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(20), expired: false }
    ]);
  });

  test("should return an empty array (not a fallback) when no product in the city has any recorded change", async () => {
    req.query = { city: "TestCity" };
    const onlyAdded = makeGood({ link: "https://example.com/only-added" });
    getLastPriceListFlat.mockResolvedValueOnce([onlyAdded]);
    exec.mockResolvedValueOnce([{ link: onlyAdded.link, price: "500", dateAdded: daysAgo(5) }]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // No product anywhere in the city has a computable interval, so there is no
    // global median to fall back to, and the product is excluded entirely.
    expect(json).toHaveBeenCalledWith([]);
  });

  test("should collapse a burst of anomalously rapid changes instead of letting it drag down the interval", async () => {
    req.query = { city: "TestCity" };
    // Three normal-cadence products anchor the city-wide global median at 30 days
    // (one 30-day gap each = 3 pooled values). A real catalog has far more normal
    // products than bursty ones, so a burst in one product shouldn't be able to
    // drag the shared reference down — this fixture pools 3 normal 30-day gaps
    // against the bursty product's 2 noise gaps to reproduce that "normal
    // outweighs noise" shape, rather than a single normal product a burst could
    // dominate.
    const normalA = makeGood({ link: "https://example.com/normal-a" });
    const normalB = makeGood({ link: "https://example.com/normal-b" });
    const normalC = makeGood({ link: "https://example.com/normal-c" });
    const bursty = makeGood({ link: "https://example.com/bursty" });
    getLastPriceListFlat.mockResolvedValueOnce([normalA, normalB, normalC, bursty]);
    exec.mockResolvedValueOnce([
      // normalA: 3 rows -> changes at day -50, -20 -> 1 gap of 30 days.
      { link: normalA.link, price: "1000", dateAdded: daysAgo(80) },
      { link: normalA.link, price: "900", dateAdded: daysAgo(50) },
      { link: normalA.link, price: "800", dateAdded: daysAgo(20) },
      // normalB: 3 rows -> changes at day -55, -25 -> 1 gap of 30 days.
      { link: normalB.link, price: "1000", dateAdded: daysAgo(85) },
      { link: normalB.link, price: "900", dateAdded: daysAgo(55) },
      { link: normalB.link, price: "800", dateAdded: daysAgo(25) },
      // normalC: 3 rows -> changes at day -45, -15 -> 1 gap of 30 days.
      { link: normalC.link, price: "1000", dateAdded: daysAgo(75) },
      { link: normalC.link, price: "900", dateAdded: daysAgo(45) },
      { link: normalC.link, price: "800", dateAdded: daysAgo(15) },
      // bursty: 4 rows -> a real change at day -37, then 2 more within days of it
      // (day -35, -32) -> changes at day -37, -35, -32 -> gaps 2, 3 days, both
      // well under 0.2 * 30 = 6. Those burst gaps must not feed into its own
      // interval median.
      { link: bursty.link, price: "2000", dateAdded: daysAgo(40) },
      { link: bursty.link, price: "1900", dateAdded: daysAgo(37) },
      { link: bursty.link, price: "1950", dateAdded: daysAgo(35) },
      { link: bursty.link, price: "1850", dateAdded: daysAgo(32) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // Pooled gaps: [30, 30, 30, 2, 3] -> global median 30 days, unmoved by the
    // burst. normalA/normalB/normalC keep their own 30-day interval untouched.
    // bursty has zero usable gaps left (both its gaps are anomalously short), so
    // it falls back to the 30-day global median, anchored to the burst's last
    // date (day -32) -> prediction day -32 + 30 = day -2 (overdue).
    expect(json).toHaveBeenCalledWith([
      { item: bursty, lastUpdateDate: daysAgo(32), predictionDate: daysAgo(2), expired: true },
      { item: normalB, lastUpdateDate: daysAgo(25), predictionDate: daysFromNow(5), expired: false },
      { item: normalA, lastUpdateDate: daysAgo(20), predictionDate: daysFromNow(10), expired: false },
      { item: normalC, lastUpdateDate: daysAgo(15), predictionDate: daysFromNow(15), expired: false }
    ]);
  });

  test("should not treat a naturally long gap as anomalous", async () => {
    req.query = { city: "TestCity" };
    const link = "https://example.com/slow-mover";
    const item = makeGood({ link });
    const other = makeGood({ link: "https://example.com/other" });
    getLastPriceListFlat.mockResolvedValueOnce([item, other]);
    exec.mockResolvedValueOnce([
      // other: changes at day -60 and day -30 -> interval 30 days -> global median 30 days.
      { link: other.link, price: "1000", dateAdded: daysAgo(90) },
      { link: other.link, price: "900", dateAdded: daysAgo(60) },
      { link: other.link, price: "800", dateAdded: daysAgo(30) },
      // item: a single 90-day gap between its own two changes. Far longer than the
      // global median, but the anomaly rule only ever flags gaps that are too
      // short, never too long, so this must be kept as-is.
      { link, price: "3000", dateAdded: daysAgo(180) },
      { link, price: "2800", dateAdded: daysAgo(90) },
      { link, price: "2600", dateAdded: daysAgo(0) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(json).toHaveBeenCalledWith(
      expect.arrayContaining([
        { item, lastUpdateDate: daysAgo(0), predictionDate: daysFromNow(90), expired: false }
      ])
    );
  });

  test("should keep overdue products flagged as expired alongside future ones", async () => {
    req.query = { city: "TestCity" };
    const future = makeGood({ link: "https://example.com/future" });
    const overdue = makeGood({ link: "https://example.com/overdue" });
    getLastPriceListFlat.mockResolvedValueOnce([future, overdue]);
    exec.mockResolvedValueOnce([
      // future: changes at day -30 and day -10 -> interval 20 -> prediction day +10 (expired: false)
      { link: future.link, price: "5000", dateAdded: daysAgo(40) },
      { link: future.link, price: "4500", dateAdded: daysAgo(30) },
      { link: future.link, price: "4000", dateAdded: daysAgo(10) },
      // overdue: changes at day -100 and day -60 -> interval 40 -> prediction day -20 (expired: true)
      { link: overdue.link, price: "3000", dateAdded: daysAgo(120) },
      { link: overdue.link, price: "2500", dateAdded: daysAgo(100) },
      { link: overdue.link, price: "2000", dateAdded: daysAgo(60) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // Both are returned, sorted ascending by predictionDate, so the overdue one
    // (day -20) comes before the future one (day +10) and carries expired: true.
    expect(json).toHaveBeenCalledWith([
      { item: overdue, lastUpdateDate: daysAgo(60), predictionDate: daysAgo(20), expired: true },
      { item: future, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(10), expired: false }
    ]);
  });

  test("should compute the interval per product, sorted ascending by predicted date", async () => {
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
      { item: soon, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(10), expired: false },
      { item: far, lastUpdateDate: daysAgo(10), predictionDate: daysFromNow(40), expired: false }
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
