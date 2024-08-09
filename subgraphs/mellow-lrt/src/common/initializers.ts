import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Vault } from "../../generated/Vault/Vault";
import { ERC20 } from "../../generated/Vault/ERC20";
import { Pool } from "../sdk/protocols/generic/pool";
import { Pricer, TokenInit, readValue } from "./utils";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

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
    const outputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    pool.initialize(outputToken.name, outputToken.symbol, [], outputToken);
  }

  return pool;
}

export function updatePoolTVL(pool: Pool): void {
  const poolContract = Vault.bind(Address.fromBytes(pool.getBytesID()));

  let tokens: Address[] = [];
  let underlyingAmounts: BigInt[] = [];
  const poolUnderlyingTVL = poolContract.try_underlyingTvl();

  if (!poolUnderlyingTVL.reverted) {
    tokens = poolUnderlyingTVL.value.getTokens();
    underlyingAmounts = poolUnderlyingTVL.value.getAmounts();
  }

  pool.setInputTokenBalances(underlyingAmounts, true);
}

export function updatePoolOutputTokenSupply(pool: Pool): void {
  const contract = ERC20.bind(Address.fromBytes(pool.getBytesID()));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}
