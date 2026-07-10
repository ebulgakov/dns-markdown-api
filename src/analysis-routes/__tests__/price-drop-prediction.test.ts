import { expect, test, describe, mock, beforeEach } from "bun:test";

import priceDropPredictionHandler from "../price-drop-prediction";

import type { PriceDropPrediction } from "@src/types/analysis-data";
import type { Goods } from "@src/types/pricelist";
import type { Mock } from "bun:test";
import type { NextFunction, Request, Response } from "express";

// Mock dependencies
const cacheGet = mock(async (): Promise<PriceDropPrediction[] | null> => null);
const cacheAdd = mock(async () => {});
const aggregate = mock(async (): Promise<unknown[]> => []);
const getLastPriceListFlat = mock(async (): Promise<Goods[]> => []);

const AnalysisData = { aggregate };

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
    aggregate.mockClear();
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
      { item: makeGood(), predictionDate: "2024-01-06T00:00:00.000Z" }
    ];
    cacheGet.mockResolvedValueOnce(mockPayload);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(cacheGet).toHaveBeenCalledWith("daily:analysis:price-drop-prediction:TestCity");
    expect(json).toHaveBeenCalledWith(mockPayload);
    expect(getLastPriceListFlat).not.toHaveBeenCalled();
    expect(aggregate).not.toHaveBeenCalled();
  });

  test("should return an empty array without querying AnalysisData if the catalog is empty", async () => {
    req.query = { city: "TestCity" };
    getLastPriceListFlat.mockResolvedValueOnce([]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(aggregate).not.toHaveBeenCalled();
    expect(cacheAdd).toHaveBeenCalledWith(
      "daily:analysis:price-drop-prediction:TestCity",
      [],
      { ex: 60 * 60 * 24 }
    );
    expect(json).toHaveBeenCalledWith([]);
  });

  test("should exclude products with fewer than 2 history entries", async () => {
    req.query = { city: "TestCity" };
    const withHistory = makeGood({ link: "https://example.com/with-history" });
    const withoutHistory = makeGood({ link: "https://example.com/no-history" });
    getLastPriceListFlat.mockResolvedValueOnce([withHistory, withoutHistory]);
    aggregate.mockResolvedValueOnce([
      {
        _id: "https://example.com/with-history",
        firstDate: "2024-01-01T00:00:00.000Z",
        lastDate: "2024-01-05T00:00:00.000Z",
        count: 2
      },
      {
        _id: "https://example.com/no-history",
        firstDate: "2024-01-01T00:00:00.000Z",
        lastDate: "2024-01-01T00:00:00.000Z",
        count: 1
      }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(json).toHaveBeenCalledWith([
      { item: withHistory, predictionDate: "2024-01-09T00:00:00.000Z" }
    ]);
  });

  test("should compute the average interval and predict the next change date, sorted ascending", async () => {
    req.query = { city: "TestCity" };
    const soon = makeGood({ link: "https://example.com/soon" });
    const far = makeGood({ link: "https://example.com/far" });
    getLastPriceListFlat.mockResolvedValueOnce([far, soon]);
    aggregate.mockResolvedValueOnce([
      {
        // events at day 0, day 2, day 4 -> avg interval 2 days -> prediction day 6
        _id: "https://example.com/soon",
        firstDate: "2024-01-01T00:00:00.000Z",
        lastDate: "2024-01-05T00:00:00.000Z",
        count: 3
      },
      {
        // events at day 0, day 20 -> avg interval 20 days -> prediction day 40
        _id: "https://example.com/far",
        firstDate: "2024-01-01T00:00:00.000Z",
        lastDate: "2024-01-21T00:00:00.000Z",
        count: 2
      }
    ]);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(cacheAdd).toHaveBeenCalledWith(
      "daily:analysis:price-drop-prediction:TestCity",
      [
        { item: soon, predictionDate: "2024-01-07T00:00:00.000Z" },
        { item: far, predictionDate: "2024-02-10T00:00:00.000Z" }
      ],
      { ex: 60 * 60 * 24 }
    );
    expect(json).toHaveBeenCalledWith([
      { item: soon, predictionDate: "2024-01-07T00:00:00.000Z" },
      { item: far, predictionDate: "2024-02-10T00:00:00.000Z" }
    ]);
  });

  test("should call next with error if db query fails", async () => {
    req.query = { city: "TestCity" };
    getLastPriceListFlat.mockResolvedValueOnce([makeGood()]);
    const error = new Error("DB error");
    aggregate.mockRejectedValueOnce(error);

    await priceDropPredictionHandler(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
