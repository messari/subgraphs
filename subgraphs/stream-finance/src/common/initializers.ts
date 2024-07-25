import { Versions } from "../versions";
import { Pricer, TokenInit } from "./utils";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { StreamVault } from "../../generated/LevUSDC/StreamVault";

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

export function getOrCreatePool(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const vaultContract = StreamVault.bind(poolAddress);

    const vaultParamsCall = vaultContract.try_vaultParams();
    let inputTokenAddress = constants.NULL.TYPE_ADDRESS;
    if (!vaultParamsCall.reverted) {
      inputTokenAddress = vaultParamsCall.value.getAsset();
    }

    const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress);
    const outputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [inputToken.id],
      outputToken
    );
  }

  return pool;
}
