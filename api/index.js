"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/no-require-imports
const env_1 = require("./env");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const server_1 = __importDefault(require("./server"));
if (env_1.env.NODE_ENV !== "production") {
  server_1.default.listen(env_1.env.PORT, () => console.log(`Listening on ${env_1.env.PORT}`));
}
exports.default = server_1.default;
