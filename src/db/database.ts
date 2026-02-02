import mongoose from "mongoose";

import { env } from "../env";

global.mongoose = global.mongoose || {
  conn: null,
  promise: null
};

export async function dbConnect() {
  if (global.mongoose && global.mongoose.conn) {
    return global.mongoose.conn;
  }

  const dbUri = env.DATABASE_URL;

  const promise = mongoose.connect(dbUri, {
    autoIndex: true // Auto-indexing for development
  });

  global.mongoose = {
    conn: await promise,
    promise: promise
  };

  return await promise;
}

export async function dbDisconnect() {
  if (global.mongoose && global.mongoose.conn) {
    await mongoose.disconnect();
    global.mongoose.conn = null;
  }
}
