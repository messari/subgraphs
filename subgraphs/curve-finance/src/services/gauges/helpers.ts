import { Address, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts/index";
import { CrvERC20 } from "../../../generated/AddressProvider/CrvERC20";
import { Gauge } from "../../../generated/AddressProvider/Gauge";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  CRV_POOL_START_BLOCK,
  CRV_TOKEN,
  DEFAULT_DECIMALS,
  SECONDS_PER_DAY,
  ZERO_ADDRESS,
} from "../../common/constants";
import { bigIntToBigDecimal } from "../../common/utils/numbers";
import { getTokenPriceSnapshot } from "../snapshots";
import { GaugeV2 } from "../../../generated/templates/CurveGauge/GaugeV2";
import { GaugeV3 } from "../../../generated/templates/CurveGauge/GaugeV3";
import { GaugePool, LiquidityPool } from "../../../generated/schema";
import { getOrCreateRewardToken, getRewardtoken } from "../../common/getters";
import { ADDRESS_ZERO, CURVE_TOKEN } from "../../common/constants/index";
import { CurveGauge } from "../../../generated/templates";
import { CurveRewards } from "../../../generated/templates/CurveGauge/CurveRewards";

export function getRewardTokenIndex(pool: LiquidityPool, tokenAddr: string): i32 {
  for (let i = 0; i < pool.rewardTokens.length; i++) {
    if (getRewardtoken(pool.rewardTokens[i]).token == tokenAddr) {
      return i;
    }
  }
  return -1;
}

export function getCrvInflationRate(timestamp: BigInt): BigInt {
  const crvTokenContract = CrvERC20.bind(CRV_TOKEN);
  const timestampPlus24Hours = timestamp.plus(BigInt.fromI32(SECONDS_PER_DAY));
  const crvTokenMintedResult = crvTokenContract.try_mintable_in_timeframe(timestamp, timestampPlus24Hours);
  if (crvTokenMintedResult.reverted) {
    log.warning("Call to mintable_in_timeframe reverted for timestamps {}, {}", [
      timestamp.toString(),
      timestampPlus24Hours.toString(),
    ]);
    return BIGINT_ZERO;
  }
  const crvTokenMinted = crvTokenMintedResult.value;
  return crvTokenMinted;
}

export function getCrvInflationRateUSD(crvTokenMinted: BigInt, blockNumber: BigInt, timestamp: BigInt): BigDecimal {
  const crvPrice =
    blockNumber.toI32() > CRV_POOL_START_BLOCK ? getTokenPriceSnapshot(CRV_TOKEN, timestamp, false) : BIGDECIMAL_ZERO;
  return bigIntToBigDecimal(crvTokenMinted, DEFAULT_DECIMALS).times(crvPrice);
}

export function isGaugeKilled(gauge: Address): boolean {
  const gaugeKillCall = Gauge.bind(gauge).try_is_killed();
  if (gaugeKillCall.reverted) {
    return false;
  }
  return gaugeKillCall.value;
}

export function setStakedOutputTokenAmount(pool: LiquidityPool): void {
  const gaugeContract = Gauge.bind(Address.fromString(pool.gauge));
  let stakedOutputTokenAmountCall = gaugeContract.try_totalSupply();
  const stakedOutputTokenAmount = stakedOutputTokenAmountCall.reverted
    ? BIGINT_ZERO
    : stakedOutputTokenAmountCall.value;
  pool.stakedOutputTokenAmount = stakedOutputTokenAmount;
  pool.save();
}

export function setRewardTokensV2(pool: LiquidityPool): void {
  if (!pool.rewardContract) {
    return;
  }
  const rewardContract = CurveRewards.bind(Address.fromString(pool.rewardContract!));
  const rewardTokenCall = rewardContract.try_rewardsToken();
  let rewardTokens = pool.rewardTokens;
  if (!rewardTokenCall.reverted) {
    const rewardTokenAddr = rewardTokenCall.value;
    if (rewardTokenAddr != ADDRESS_ZERO) {
      const rewardToken = getOrCreateRewardToken(rewardTokenAddr);
      rewardTokens.push(rewardToken.id);
      pool.rewardTokens = rewardTokens;
      pool.save();
    }
  }
}

export function setRewardTokensV3(pool: LiquidityPool): void {
  let rewardTokens = pool.rewardTokens;
  let gaugeV2 = GaugeV2.bind(Address.fromString(pool.gauge));
  let rewardTokenAddressCall = gaugeV2.try_reward_tokens(BIGINT_ZERO);
  if (!rewardTokenAddressCall.reverted) {
    for (let i = 0; i < 5; i++) {
      rewardTokenAddressCall = gaugeV2.try_reward_tokens(BigInt.fromI32(i));
      if (rewardTokenAddressCall.value == ADDRESS_ZERO) {
        break;
      }
      let rewardToken = getOrCreateRewardToken(rewardTokenAddressCall.value);
      rewardTokens.push(rewardToken.id);
    }
  }
  pool.rewardTokens = rewardTokens;
  pool.save();
}

export function setGaugeRewardTokens(pool: LiquidityPool): void {
  pool.rewardTokens = [getOrCreateRewardToken(CURVE_TOKEN).id];
  pool.save();
  if (pool.rewardContract) {
    setRewardTokensV2(pool);
  } else {
    setRewardTokensV3(pool);
  }
}

export function setGaugePool(pool: LiquidityPool): void {
  let gaugePool = new GaugePool(pool.gauge);
  gaugePool.pool = pool.id;
  gaugePool.save();
}

export function setGaugeRewardContract(pool: LiquidityPool): void {
  let gaugeV2 = GaugeV2.bind(Address.fromString(pool.gauge));
  let rewardContractCall = gaugeV2.try_reward_contract();
  if (!rewardContractCall.reverted) {
    pool.rewardContract = rewardContractCall.value.toHexString();
    pool.gaugeType = "v2";
    pool.save();
  }
  return;
}

export function setRewardGaugeType(pool: LiquidityPool): void {
  let gaugeV3 = GaugeV3.bind(Address.fromString(pool.gauge));
  if (!gaugeV3.try_reward_data(ADDRESS_ZERO).reverted) {
    pool.gaugeType = "v3";
    pool.save();
  }
}

export function initEmissionsArrays(pool: LiquidityPool): void {
  let rewardTokens = pool.rewardTokens;
  let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  for (let i = 0; i < pool.rewardTokens.length; i++) {
    rewardTokenEmissionsAmount[i] = BIGINT_ZERO;
    rewardTokenEmissionsUSD[i] = BIGDECIMAL_ZERO;
  }
  pool.rewardTokens = rewardTokens.sort();
  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  pool.save();
}

export function setGaugeData(pool: LiquidityPool): void {
  if (pool.gauge == ZERO_ADDRESS) {
    return;
  }
  CurveGauge.create(Address.fromString(pool.gauge));
  setStakedOutputTokenAmount(pool);
  setGaugeRewardContract(pool);
  setGaugeRewardTokens(pool);
  setGaugePool(pool);
  initEmissionsArrays(pool);
}
