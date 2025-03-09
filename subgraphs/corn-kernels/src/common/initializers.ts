import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { Pricer, TokenInit, readValue } from "./utils";
import { ProtocolConfig } from "../sdk/protocols/config";
import { ERC20 } from "../../generated/CornSiloV1/ERC20";
import { CornSilo } from "../../generated/CornSiloV1/CornSilo";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function initializeSDKFromEvent(event: ethereum.Event): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.Protocol.ID,
    constants.Protocol.NAME,
    constants.Protocol.SLUG,
    Versions,
  );
  const tokenPricer = new Pricer();
  const tokenInitializer = new TokenInit();

  const sdk = SDK.initializeFromEvent(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    event,
  );

  return sdk;
}

export function getOrCreatePool(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const siloContract = CornSilo.bind(poolAddress);

    const outputTokenAddress = readValue<Address>(
      siloContract.try_bitcorn(),
      constants.NULL.TYPE_ADDRESS,
    );

    const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddress);
    pool.initialize(outputToken.name, outputToken.symbol, [], outputToken);
  }

  return pool;
}

export function updatePoolTVL(
  sdk: SDK,
  inputTokenAddress: Address,
  amount: BigInt,
): void {
  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress);
  const pool = getOrCreatePool(Address.fromString(constants.Protocol.ID), sdk);

  pool.addInputToken(inputToken, amount);
}
