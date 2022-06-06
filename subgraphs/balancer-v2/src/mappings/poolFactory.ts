import { BigInt, Address, Bytes, BigDecimal, log } from "@graphprotocol/graph-ts";
import { PoolCreated } from "../../generated/WeightedPoolFactory/WeightedPoolFactory";

// datasource
import { WeightedPool as WeightedPoolTemplate } from "../../generated/templates";
import { StablePool as StablePoolTemplate } from "../../generated/templates";
import { MetaStablePool as MetaStablePoolTemplate } from "../../generated/templates";
import { StablePhantomPool as StablePhantomPoolTemplate } from "../../generated/templates";
import { LiquidityBootstrappingPool as LiquidityBootstrappingPoolTemplate } from "../../generated/templates";
import { InvestmentPool as InvestmentPoolTemplate } from "../../generated/templates";
import { LinearPool as LinearPoolTemplate } from "../../generated/templates";

import { Vault } from "../../generated/Vault/Vault";
import { WeightedPool } from "../../generated/templates/WeightedPool/WeightedPool";
import { createLiquidityPool } from "../common/creators";
import { BIGINT_ZERO, VAULT_ADDRESS } from "../common/constants";
import { updateWeight } from "../common/weight";

function createPool(event: PoolCreated): string {
  let poolAddress: Address = event.params.pool;
  let poolContract = WeightedPool.bind(poolAddress);
  let poolIdCall = poolContract.try_getPoolId();
  if (poolIdCall.reverted) {
    return "";
  }
  let poolId = poolIdCall.value;

  let nameCall = poolContract.try_name();
  if (nameCall.reverted) {
    return "";
  }
  let name = nameCall.value;

  let symbolCall = poolContract.try_symbol();
  if (symbolCall.reverted) {
    return "";
  }
  let symbol = symbolCall.value;

  let vaultContract = Vault.bind(VAULT_ADDRESS);

  let tokensCall = vaultContract.try_getPoolTokens(poolId);
  let inputTokens: string[] = [];
  if (!tokensCall.reverted) {
    let tokens = tokensCall.value.value0;
    for (let i: i32 = 0; i < tokens.length; i++) {
      inputTokens.push(tokens[i].toHexString());
    }
  }

  let swapFeeCall = poolContract.try_getSwapFeePercentage();
  let swapFee = BIGINT_ZERO;
  if (!symbolCall.reverted) {
    swapFee = swapFeeCall.value;
  }

  createLiquidityPool(event, poolAddress.toHexString(), name, symbol, inputTokens, swapFee);
  return poolAddress.toHexString();
}

export function handleNewWeightedPool(event: PoolCreated): void {
  let poolAddress = createPool(event);
  updateWeight(poolAddress);
  WeightedPoolTemplate.create(event.params.pool);
}

export function handleNewLiquidityBootstrappingPool(event: PoolCreated): void {
  let poolId = createPool(event);
  updateWeight(poolId);
  LiquidityBootstrappingPoolTemplate.create(event.params.pool);
}

export function handleNewInvestmentPool(event: PoolCreated): void {
  let poolId = createPool(event);
  updateWeight(poolId);
  InvestmentPoolTemplate.create(event.params.pool);
}

export function handleNewStablePool(event: PoolCreated): void {
  createPool(event);
  StablePoolTemplate.create(event.params.pool);
}

export function handleNewMetaStablePool(event: PoolCreated): void {
  createPool(event);
  MetaStablePoolTemplate.create(event.params.pool);
}

export function handleNewStablePhantomPool(event: PoolCreated): void {
  createPool(event);
  StablePhantomPoolTemplate.create(event.params.pool);
}

export function handleNewAaveLinearPool(event: PoolCreated): void {
  createPool(event);
  LinearPoolTemplate.create(event.params.pool);
}

export function handleNewERC4626LinearPool(event: PoolCreated): void {
  createPool(event);
  LinearPoolTemplate.create(event.params.pool);
}

function handleNewLinearPool(event: PoolCreated, poolType: string): void {
  createPool(event);
  LinearPoolTemplate.create(event.params.pool);
}
