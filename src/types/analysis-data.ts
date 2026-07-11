import type { Goods } from "./pricelist";

export type AnalysisData = Goods & {
  city: string;
  category: string;
  dateAdded: string;
};

export type PriceDropPrediction = {
  item: Goods;
  lastUpdateDate: string;
  predictionDate: string;
  expired: boolean;
};
