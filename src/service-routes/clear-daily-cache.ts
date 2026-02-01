import { cacheDelete, cacheKeys } from "../../cache";

import type { NextFunction, Request, Response } from "express";

async function clearDailyCacheHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const keys = await cacheKeys("daily:*");
    await Promise.all(
      keys
        .map(key => (key && key !== "" ? key : null))
        .filter(Boolean)
        .map(key => cacheDelete(key as string))
    );
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export default clearDailyCacheHandler;
