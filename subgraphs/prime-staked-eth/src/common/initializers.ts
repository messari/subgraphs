import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { Pricer, TokenInit, readValue } from "./utils";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { LRTDepositPool } from "../../generated/LRTConfig/LRTDepositPool";

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

export function initializeSDKFromCall(call: ethereum.Call): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.Protocol.ID,
    constants.Protocol.NAME,
    constants.Protocol.SLUG,
    Versions
  );
  const tokenPricer = new Pricer();
  const tokenInitializer = new TokenInit();

  const sdk = SDK.initializeFromCall(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    call
  );

  return sdk;
}

export function getOrCreatePool(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const inputToken = sdk.Tokens.getOrCreateToken(poolAddress);
    const outputToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.PRIME_ETH_ADDRESS)
    );

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [inputToken.id],
      outputToken
    );
  }

  return pool;
}

export function updatePoolTVL(pool: Pool): void {
  const contract = LRTDepositPool.bind(
    Address.fromString(constants.LRT_DEPOSIT_ADDRESS)
  );

  const poolUnderlyingTVL = readValue<BigInt>(
    contract.try_getTotalAssetDeposits(Address.fromBytes(pool.getBytesID())),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([poolUnderlyingTVL], true);
}
