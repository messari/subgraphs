import { Versions } from "../versions";
import { Pricer, TokenInit } from "./utils";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { ethereum } from "@graphprotocol/graph-ts";
import { ProtocolConfig } from "../sdk/protocols/config";

export function initializeSDKFromEvent(event: ethereum.Event): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.Protocol.ID,
    constants.Protocol.NAME,
    constants.Protocol.SLUG,
    Versions
  );
  const tokenPricer = new Pricer();
  const tokenInitializer = new TokenInit();

  const sdk = SDK.initializeFromEvent(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    event
  );

  return sdk;
}
