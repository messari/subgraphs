import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { ERC20 } from "../../generated/PoolManager/ERC20";
import { Pricer, TokenInit, readValue } from "./utils";
import { ProtocolConfig } from "../sdk/protocols/config";
import { TreasuryV2 } from "../../generated/PoolManager/TreasuryV2";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Pool as PoolContract } from "../../generated/PoolManager/Pool";
import { PoolManager as PoolManagerContract } from "../../generated/PoolManager/PoolManager";

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

export function initializeSDKFromCall(call: ethereum.Call): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.Protocol.ID,
    constants.Protocol.NAME,
    constants.Protocol.SLUG,
    Versions,
  );
  const tokenPricer = new Pricer();
  const tokenInitializer = new TokenInit();

  const sdk = SDK.initializeFromCall(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    call,
  );

  return sdk;
}

export function getOrCreatePoolV1(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const contract = TreasuryV2.bind(poolAddress);
    const inputToken = readValue<Address>(
      contract.try_baseToken(),
      constants.NULL.TYPE_ADDRESS,
    );

    const outputTokenAddress = readValue<Address>(
      contract.try_fToken(),
      constants.NULL.TYPE_ADDRESS,
    );
    const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddress);

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [inputToken],
      outputToken,
    );
  }

  return pool;
}

export function updatePoolTVLV1(pool: Pool): void {
  const contract = TreasuryV2.bind(Address.fromBytes(pool.getBytesID()));

  const baseTokenTotalSupply = readValue<BigInt>(
    contract.try_totalBaseToken(),
    constants.BIGINT_ZERO,
  );

  const baseTokenTotalSupplyWrapped = readValue<BigInt>(
    contract.try_getWrapppedValue(baseTokenTotalSupply),
    constants.BIGINT_ZERO,
  );

  pool.setInputTokenBalances([baseTokenTotalSupplyWrapped], true);
}

export function updatePoolOutputTokenSupplyV1(pool: Pool): void {
  const contract = ERC20.bind(Address.fromBytes(pool.pool.outputToken!));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO,
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}

export function getOrCreatePoolV2(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const inputToken = Address.fromString(constants.FX_USD_ADDRESS);
    const outputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [inputToken],
      outputToken,
    );
  }

  return pool;
}

export function updatePoolTVLV2(pool: Pool): void {
  const poolManagerContract = PoolManagerContract.bind(
    Address.fromString(constants.POOL_MANAGER_ADDRESS),
  );

  const poolInfo = poolManagerContract.try_getPoolInfo(
    Address.fromBytes(pool.getBytesID()),
  );
  if (poolInfo.reverted) return;

  pool.setInputTokenBalances([poolInfo.value.getCollateralBalance()], true);
}
