import { Versions } from "../../../../src/versions";

export const PROTOCOL_NAME = "Camelot V2";
export const PROTOCOL_SLUG = "camelot-v2";
export const PROTOCOL_SUBGRAPH_VERSION = Versions.getSubgraphVersion();
export const PROTOCOL_METHODOLOGY_VERSION = Versions.getMethodologyVersion();
export const PROTOCOL_SCHEMA_VERSION = Versions.getSchemaVersion();

export const PROTOCOL_FEE_SHARE_ID = "protocol-fee-share";
export const FACTORY_ADDRESS = "0x6eccab422d763ac031210895c81787e87b43a652";
export const XGRAIL_ADDRESS = "0x3caae25ee616f2c8e13c74da0813402eae3f496b";
export const INT_THREE = 3 as i32;
export const INT_FIVE = 5 as i32;

export namespace PairType {
  export const VOLATILE = "VOLATILE";
  export const STABLE = "STABLE";
}
