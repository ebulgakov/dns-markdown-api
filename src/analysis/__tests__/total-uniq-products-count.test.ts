import { expect, test, describe, mock, beforeEach } from "bun:test";

import totalUniqProductsCountHandler from "../total-uniq-products-count";

import type { Mock } from "bun:test";
import type { NextFunction, Request, Response } from "express";

// Mock dependencies
const cacheGet = mock(async (): Promise<string | number | null> => null);
const cacheAdd = mock(async () => {});
const exec = mock(async (): Promise<{ link: string }[] | null> => null);
const lean = mock(() => ({ exec }));
const select = mock(() => ({ lean }));
const find = mock(() => ({ select }));

const AnalysisData = { find };

mock.module("../../../cache", () => ({
  cacheGet,
  cacheAdd
}));

mock.module("../../../db/models/analysis-data", () => ({
  AnalysisData
}));

describe("totalUniqProductsCountHandler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  const next: NextFunction = mock(() => {});
  const send = mock(() => res as Response);
  const status = mock(() => res as Response);

  beforeEach(() => {
    req = { query: {} };
    res = { send, status };
    cacheGet.mockReset();
    cacheAdd.mockReset();
    find.mockClear();
    select.mockClear();
    lean.mockClear();
    exec.mockClear();
    (next as unknown as Mock<NextFunction>).mockClear();
  });

  test("should return 400 if city is not provided", async () => {
    await totalUniqProductsCountHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("city is required");
  });

  test("should return cached data if it exists", async () => {
    req.query = { city: "TestCity" };
    cacheGet.mockResolvedValueOnce(123);

    await totalUniqProductsCountHandler(req as Request, res as Response, next);

    expect(cacheGet).toHaveBeenCalledWith("daily:analysis:uniq-count:TestCity");
    expect(res.send).toHaveBeenCalledWith(123);
    expect(find).not.toHaveBeenCalled();
  });

  test("should return 404 if no data found in db", async () => {
    req.query = { city: "TestCity" };
    exec.mockResolvedValueOnce(null);

    await totalUniqProductsCountHandler(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("No archived price lists found");
  });

  test("should calculate unique count, cache it, and return it", async () => {
    req.query = { city: "TestCity" };
    const mockData = [{ link: "link1" }, { link: "link2" }, { link: "link1" }];
    exec.mockResolvedValueOnce(mockData);

    await totalUniqProductsCountHandler(req as Request, res as Response, next);

    expect(find).toHaveBeenCalledWith({ city: "TestCity" }, {}, { sort: { updatedAt: 1 } });
    expect(select).toHaveBeenCalledWith("link");
    expect(lean).toHaveBeenCalled();
    expect(exec).toHaveBeenCalled();
    expect(cacheAdd).toHaveBeenCalledWith("daily:analysis:uniq-count:TestCity", 2, {
      ex: 60 * 60 * 24
    });
    expect(res.send).toHaveBeenCalledWith(2);
  });

  test("should return 0 if db returns an empty array", async () => {
    req.query = { city: "TestCity" };
    exec.mockResolvedValueOnce([]);

    await totalUniqProductsCountHandler(req as Request, res as Response, next);

    expect(res.send).toHaveBeenCalledWith(0);
    expect(cacheAdd).toHaveBeenCalledWith("daily:analysis:uniq-count:TestCity", 0, {
      ex: 60 * 60 * 24
    });
  });

  test("should call next with error if db query fails", async () => {
    req.query = { city: "TestCity" };
    const error = new Error("DB error");
    exec.mockRejectedValueOnce(error);

    await totalUniqProductsCountHandler(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
