import { cacheAdd, cacheGet } from "@src/cache";
import { compareLLMGoods, describeLLMGood } from "@src/llm";
import { convertGoodsToString } from "@src/llm-routes/helpers/convert-to-string.ts";
import { getVectorItemsByIds } from "@src/vector";
import { Router } from "express";

const router = Router();

router.get("/compare-products", async (req, res) => {
  const linksParam = req.query.links;
  if (!linksParam || typeof linksParam !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'links' query parameter" });
  }

  const linksStr = decodeURIComponent(`${req.query.links}`);
  const links = linksStr.split("|");

  if (links.length < 1 || links.length > 5) {
    return res
      .status(400)
      .json({ error: "At least one product link is required for comparison and max five links" });
  }

  const key = `llm:compare:${String(linksParam)}`;
  const cached = await cacheGet<string>(key);
  if (cached)
    return res.json({
      message: "Product comparison result (cached)",
      report: cached
    });

  const items = await getVectorItemsByIds(links);
  const itemsString = items.map(({ metadata }) => convertGoodsToString(metadata, {})).join("\n");

  const comparedGoodsReport = await compareLLMGoods(itemsString);

  await cacheAdd<string>(key, comparedGoodsReport);

  res.json({
    message: "Product comparison result",
    report: comparedGoodsReport
  });
});

router.get("/describe-product", async (req, res) => {
  const linkParam = req.query.link;
  if (!linkParam || typeof linkParam !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'link' query parameter" });
  }

  const link = decodeURIComponent(linkParam);

  const key = `llm:describe:${String(link)}`;
  const cached = await cacheGet<string>(key);
  if (cached)
    return res.json({
      message: "Product description result (cached)",
      report: cached
    });

  const [item] = await getVectorItemsByIds([link]);
  if (!item) {
    return res.status(404).json({ error: "Product not found for the provided link" });
  }

  const itemString = convertGoodsToString(item.metadata, {});

  const describedGoodReport = await describeLLMGood(itemString);

  await cacheAdd<string>(key, describedGoodReport);

  res.json({
    message: "Product description result",
    report: describedGoodReport
  });
});

export default router;
