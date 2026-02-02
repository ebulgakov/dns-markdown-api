import { cacheDelete, cacheKeys } from "../cache";

import type { NextFunction, Request, Response } from "express";

async function clearCacheByKeyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { keys: rawKeys } = req.body as { keys?: unknown };
    const keys = `${rawKeys ?? ""}`.trim();
    if (!keys?.trim()) return res.status(400).send("keys is required");

    const foundKeys = await cacheKeys(keys);
    await Promise.all(
      foundKeys
        .map(key => (key && key !== "" ? key : null))
        .filter(Boolean)
        .map(key => cacheDelete(key as string))
    );
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default clearCacheByKeyHandler;
