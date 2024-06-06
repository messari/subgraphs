import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { ProtocolConfig } from "../sdk/protocols/config";
import { ERC20 } from "../../generated/LiquidityPool/ERC20";
import { Pricer, TokenInit, readValue } from "../common/utils";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../generated/LiquidityPool/LiquidityPool";

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
    const inputToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.ETH_ADDRESS)
    );
    const outputToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.EETH_ADDRESS)
    );

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [inputToken.id],
      outputToken,
      true
    );
  }

  return pool;
}

export function getOrCreateEarlyAdopterPool(
  poolAddress: Address,
  sdk: SDK
): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const rEthToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.RETH_ADDRESS)
    );
    const wstEthToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.WSTETH_ADDRESS)
    );
    const sfrxEthToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.SFRXETH_ADDRESS)
    );
    const cbEthToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.CBETH_ADDRESS)
    );
    const ethToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.ETH_ADDRESS)
    );

    pool.initialize(
      "EarlyAdopterPool",
      "adopter-pool",
      [
        rEthToken.id,
        wstEthToken.id,
        sfrxEthToken.id,
        cbEthToken.id,
        ethToken.id,
      ],
      null,
      true
    );
  }

  return pool;
}

export function updatePoolTVL(pool: Pool): void {
  const poolContract = LiquidityPool.bind(Address.fromBytes(pool.getBytesID()));

  const poolTVL = readValue<BigInt>(
    poolContract.try_getTotalPooledEther(),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([poolTVL], true);
}

export function updatePoolOutputTokenSupply(pool: Pool): void {
  const contract = ERC20.bind(Address.fromString(constants.EETH_ADDRESS));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}
