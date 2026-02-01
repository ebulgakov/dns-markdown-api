import { cacheDelete, cacheKeys } from "../../cache";

import type { NextFunction, Request, Response } from "express";

async function clearAllCacheHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    // This approach works well for small to medium keyspaces
    // TODO: use SCAN for production environments with large keyspaces
    const keys = await cacheKeys("*");
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

export default clearAllCacheHandler;
