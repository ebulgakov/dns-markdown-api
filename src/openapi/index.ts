import { pricelistRouteDocs } from "@src/pricelist-routes/helpers/schemas";

import { buildOpenApiSpec } from "./build-spec";

const allRouteDocs = [...pricelistRouteDocs];

export const openApiSpec = buildOpenApiSpec(allRouteDocs);
