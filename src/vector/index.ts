import { Index } from "@upstash/vector";

import type { Goods } from "@src/types/pricelist.ts";

const vector = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN
});

const getVectorItemsByIds = async (
  ids: string[]
): Promise<
  {
    id: string;
    metadata: Goods;
  }[]
> => {
  // @ts-expect-error - Upstash Vector REST API does not currently support TypeScript types for the fetch method with includeMetadata option
  return vector.fetch({ ids, includeMetadata: true });
};

export { getVectorItemsByIds };
