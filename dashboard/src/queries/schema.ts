import { ProtocolType, Schema } from "../constants";
import { schema as dexSchema } from "./dex/schema";
import { schema as yieldSchema } from "./yield/schema";
import { schema as lendingSchema } from "./lending/schema";
import { schema as genericSchema } from "./generic/schema";

import { schema as dexPoolOverview } from "./dex/poolOverview";
import { schema as yieldPoolOverview } from "./yield/poolOverview";
import { schema as lendingPoolOverview } from "./lending/poolOverview";
import { schema as genericOverview } from "./generic/poolOverview";

export const schema = (type: string, version: string): Schema => {
  switch (type) {
    case ProtocolType.EXCHANGE:
      return dexSchema(version);
    case ProtocolType.YIELD:
      return yieldSchema(version);
    case ProtocolType.LENDING:
      return lendingSchema(version);
    case ProtocolType.GENERIC:
      return genericSchema(version);
    default:
      return genericSchema(version);
  }
};

export const poolOverview = (type: string, version: string): string => {
  switch (type) {
    case ProtocolType.EXCHANGE:
      return dexPoolOverview(version);
    case ProtocolType.YIELD:
      return yieldPoolOverview(version);
    case ProtocolType.LENDING:
      return lendingPoolOverview(version);
    case ProtocolType.GENERIC:
      return genericOverview(version);
    default:
      return genericOverview(version);
  }
};
