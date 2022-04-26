import { ProtocolType, Schema } from "../constants";
import { schema as dexSchema } from "./dex/schema";
import { schema as yieldSchema } from "./yield/schema";
import { schema as lendingSchema } from "./lending/schema";

export const schema = (type: string, version: string): Schema => {
  switch (type) {
    case ProtocolType.EXCHANGE:
      return dexSchema(version);
    case ProtocolType.YIELD:
      return yieldSchema(version);
    case ProtocolType.LENDING:
      return lendingSchema(version);
    default:
      return dexSchema(version);
  }
};
