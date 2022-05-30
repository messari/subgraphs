import { ProtocolType, Schema } from "../constants";
import { schema as dexSchema } from "./dex/schema";
import { schema as yieldSchema } from "./yield/schema";
import { schema as lendingSchema } from "./lending/schema";
import { schema as dexPoolOverview } from "./dex/poolOverview";
import { schema as yieldPoolOverview } from "./yield/poolOverview";
import { schema as lendingPoolOverview } from "./lending/poolOverview";

export const schema = (type: string, version: string): Schema => {
  console.log("ROUTING TO SCHEMA ", type, version);
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

export const poolOverview = (type: string, version: string): string => {
  console.log("ROUTING TO POOLOVERVIEW ", type, version);
  switch (type) {
    case ProtocolType.EXCHANGE:
      return dexPoolOverview(version);
    case ProtocolType.YIELD:
      return yieldPoolOverview(version);
    case ProtocolType.LENDING:
      return lendingPoolOverview(version);
    default:
      return dexPoolOverview(version);
  }
};
