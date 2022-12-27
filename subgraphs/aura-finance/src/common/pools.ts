import { BigInt, BigDecimal, Address, Bytes } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_HUNDRED,
  BIGINT_ZERO,
  ZERO_ADDRESS,
  BIGINT_TEN,
} from "./constants";
import { readValue } from "./utils/ethereum";
import { PoolTokensType } from "./types";
import { DEFAULT_DECIMALS } from "../prices/common/constants";

import { BalancerVault } from "../../generated/Booster-v1/BalancerVault";
import { WeightedPool } from "../../generated/Booster-v1/WeightedPool";
import { StablePool } from "../../generated/Booster-v1/StablePool";

export function getPoolTokensInfo(poolAddress: Address): PoolTokensType {
  const poolContract = WeightedPool.bind(poolAddress);

  const balancerVault = readValue<Address>(
    poolContract.try_getVault(),
    Address.fromString(ZERO_ADDRESS)
  );
  const balancerPool = readValue<Bytes>(
    poolContract.try_getPoolId(),
    new Bytes(0)
  );

  let supply = BIGINT_ZERO;

  const stablePoolContract = StablePool.bind(poolAddress);

  const actualSupplyCall = stablePoolContract.try_getActualSupply();

  if (actualSupplyCall.reverted) {
    const virtulSupplyCall = poolContract.try_getVirtualSupply();

    if (virtulSupplyCall.reverted) {
      supply = readValue<BigInt>(poolContract.try_totalSupply(), BIGINT_ZERO);
    } else {
      supply = virtulSupplyCall.value;
    }
  } else {
    supply = actualSupplyCall.value;
  }

  if (!(balancerVault == Address.fromString(ZERO_ADDRESS))) {
    const balancerVaultContract = BalancerVault.bind(balancerVault);

    const result = balancerVaultContract.try_getPoolTokens(balancerPool);

    if (result.reverted) return new PoolTokensType(poolAddress, supply);

    return new PoolTokensType(
      poolAddress,
      supply,
      result.value.getTokens(),
      result.value.getBalances()
    );
  }

  return new PoolTokensType(poolAddress, supply);
}

export function isBPT(tokenAddress: Address): boolean {
  const poolContract = WeightedPool.bind(tokenAddress);

  const balancerPool = poolContract.try_getPoolId();
  if (!balancerPool.reverted) {
    return true;
  }

  return false;
}

export function getPoolTokenWeightsForStablePools(
  poolAddress: Address,
  popIndex: number
): BigDecimal[] {
  const poolContract = StablePool.bind(poolAddress);

  const scales = readValue<BigInt[]>(poolContract.try_getScalingFactors(), []);

  const inputTokenScales: BigInt[] = [];
  for (let idx = 0; idx < scales.length; idx++) {
    if (idx == popIndex) {
      continue;
    }

    inputTokenScales.push(scales.at(idx));
  }

  const totalScale = inputTokenScales
    .reduce<BigInt>((sum, current) => sum.plus(current), BIGINT_ZERO)
    .toBigDecimal();

  const inputTokenWeights: BigDecimal[] = [];
  for (let idx = 0; idx < inputTokenScales.length; idx++) {
    inputTokenWeights.push(
      inputTokenScales.at(idx).divDecimal(totalScale).times(BIGDECIMAL_HUNDRED)
    );
  }

  return inputTokenWeights;
}

export function getPoolTokenWeightsForWeightedPools(
  poolAddress: Address,
  popIndex: number
): BigDecimal[] {
  const poolContract = WeightedPool.bind(poolAddress);

  const weights = readValue<BigInt[]>(
    poolContract.try_getNormalizedWeights(),
    []
  );

  const inputTokenWeights: BigDecimal[] = [];
  for (let idx = 0; idx < weights.length; idx++) {
    if (idx == popIndex) {
      continue;
    }

    inputTokenWeights.push(
      weights
        .at(idx)
        .divDecimal(
          BIGINT_TEN.pow(DEFAULT_DECIMALS.toI32() as u8).toBigDecimal()
        )
        .times(BIGDECIMAL_HUNDRED)
    );
  }

  return inputTokenWeights;
}

export function getPoolTokenWeights(
  poolAddress: Address,
  popIndex: number
): BigDecimal[] {
  let inputTokenWeights = getPoolTokenWeightsForWeightedPools(
    poolAddress,
    popIndex
  );
  if (inputTokenWeights.length > 0) return inputTokenWeights;

  inputTokenWeights = getPoolTokenWeightsForStablePools(poolAddress, popIndex);

  return inputTokenWeights;
}
