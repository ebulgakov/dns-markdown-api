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

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_MS = new Date("2024-01-01T00:00:00.000Z").getTime();
const atDay = (day: number) => new Date(BASE_MS + day * DAY_MS).toISOString();

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
      { item: makeGood(), lastUpdateDate: atDay(4), predictionDate: atDay(6) }
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

  test("should ignore price increases and flat records, counting only actual drops", async () => {
    req.query = { city: "TestCity" };
    const link = "https://example.com/product";
    const item = makeGood({ link });
    getLastPriceListFlat.mockResolvedValueOnce([item]);
    exec.mockResolvedValueOnce([
      { link, price: "4200", dateAdded: atDay(0) }, // initial
      { link, price: "4200", dateAdded: atDay(2) }, // flat, not a drop
      { link, price: "3600", dateAdded: atDay(3) }, // drop #1
      { link, price: "3700", dateAdded: atDay(5) }, // increase, not a drop
      { link, price: "3100", dateAdded: atDay(7) } // drop #2 (relative to 3700)
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // drop #1 at day 3, drop #2 at day 7 -> avg interval 4 days -> prediction day 11
    expect(json).toHaveBeenCalledWith([
      { item, lastUpdateDate: atDay(7), predictionDate: atDay(11) }
    ]);
  });

  test("should exclude products with fewer than 2 recorded price drops", async () => {
    req.query = { city: "TestCity" };
    const withTwoDrops = makeGood({ link: "https://example.com/with-two-drops" });
    const withOneDrop = makeGood({ link: "https://example.com/with-one-drop" });
    const withNoHistory = makeGood({ link: "https://example.com/no-history" });
    getLastPriceListFlat.mockResolvedValueOnce([withTwoDrops, withOneDrop, withNoHistory]);
    exec.mockResolvedValueOnce([
      { link: withTwoDrops.link, price: "1000", dateAdded: atDay(0) },
      { link: withTwoDrops.link, price: "900", dateAdded: atDay(1) },
      { link: withTwoDrops.link, price: "800", dateAdded: atDay(3) },
      { link: withOneDrop.link, price: "1000", dateAdded: atDay(0) },
      { link: withOneDrop.link, price: "1000", dateAdded: atDay(5) },
      { link: withOneDrop.link, price: "900", dateAdded: atDay(10) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    // withTwoDrops: drops at day 1 and day 3 -> avg interval 2 days -> prediction day 5
    expect(json).toHaveBeenCalledWith([
      { item: withTwoDrops, lastUpdateDate: atDay(3), predictionDate: atDay(5) }
    ]);
  });

  test("should compute the average interval between drops per product, sorted ascending by predicted date", async () => {
    req.query = { city: "TestCity" };
    const soon = makeGood({ link: "https://example.com/soon" });
    const far = makeGood({ link: "https://example.com/far" });
    getLastPriceListFlat.mockResolvedValueOnce([far, soon]);
    exec.mockResolvedValueOnce([
      // far: drops at day 1 and day 30 -> avg interval 29 days -> prediction day 59
      { link: far.link, price: "5000", dateAdded: atDay(0) },
      { link: far.link, price: "4500", dateAdded: atDay(1) },
      { link: far.link, price: "4000", dateAdded: atDay(30) },
      // soon: drops at day 3 and day 7 -> avg interval 4 days -> prediction day 11
      { link: soon.link, price: "4200", dateAdded: atDay(0) },
      { link: soon.link, price: "3600", dateAdded: atDay(3) },
      { link: soon.link, price: "3100", dateAdded: atDay(7) }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    const expected = [
      { item: soon, lastUpdateDate: atDay(7), predictionDate: atDay(11) },
      { item: far, lastUpdateDate: atDay(30), predictionDate: atDay(59) }
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
