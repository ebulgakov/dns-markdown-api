import mongoose from "mongoose";

import reportsSchema from "../schemas/reports";

import type { Report as ReportType } from "@src/types/reports";

export const Reports =
  mongoose.models.Reports || mongoose.model<ReportType>("Reports", reportsSchema);
