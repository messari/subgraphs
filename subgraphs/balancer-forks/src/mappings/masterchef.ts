import {
  Deposit,
  LogSetPool,
  LogUpdatePool,
  MasterChefV2,
  UpdateEmissionRate,
  Withdraw,
} from "../../generated/MasterChefV2/MasterChefV2";

import { bigDecimal, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { getLiquidityPool, getOrCreateDex, getOrCreateRewardToken, getOrCreateToken } from "../common/getters";
import {
  BEETS,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  FBEETS,
  MASTERCHEFV2_ADDRESS,
  OHMYBEETS,
  REWARD_TOKEN,
  SECONDS_PER_DAY,
} from "../common/constants";
import { DEFAULT_DECIMALS } from "../prices/common/constants";
import { convertTokenToDecimal } from "../common/utils/utils";
import { LiquidityPool, RewardToken } from "../../generated/schema";
import { fetchPrice } from "../modules/Pricing";

export function handleUpdateEmissionRate(event: UpdateEmissionRate): void {
  log.info("[MasterChef] Log update emission rate {} {}", [
    event.params.user.toString(),
    event.params._beetsPerSec.toString(),
  ]);
  let protocol = getOrCreateDex();
  protocol.beetsPerBlock = event.params._beetsPerSec;
  protocol.save();
}

export function handleLogSetPool(event: LogSetPool): void {
  log.info("[MasterChefV2] Log Set Pool {} {} {} {}", [
    event.params.pid.toString(),
    event.params.allocPoint.toString(),
    event.params.rewarder.toHex(),
    event.params.overwrite == true ? "true" : "false",
  ]);
  //get the contract address
  let masterChef = MasterChefV2.bind(MASTERCHEFV2_ADDRESS);
  let poolAddress = masterChef.try_lpTokens(event.params.pid);
  if (poolAddress.reverted) {
    return;
  }
  let pool = getLiquidityPool(poolAddress.value.toHexString());

  let rewardToken = getOrCreateRewardToken(BEETS.toHexString());
  pool.rewardTokens = [rewardToken.id];
  let protocol = getOrCreateDex();
  protocol.totalAllocPoint = protocol.totalAllocPoint.plus(event.params.allocPoint.minus(pool.allocPoint));
  protocol.save();
  pool.allocPoint = event.params.allocPoint;
  let tokenAmount = pool.allocPoint
    .div(protocol.totalAllocPoint)
    .times(protocol.beetsPerBlock)
    .times(BigInt.fromI32(SECONDS_PER_DAY));
  pool.rewardTokenEmissionsAmount![0] = BigInt.fromString(
    convertTokenToDecimal(tokenAmount, DEFAULT_DECIMALS.toI32()).toString(),
  );
  pool.rewardTokenEmissionsUSD![0] = fetchPrice(BEETS).times(pool.rewardTokenEmissionsAmount![0].toBigDecimal());
  pool.save();
}

export function handleLogUpdatePool(event: LogUpdatePool): void {
  log.info("[MasterChefV2] Log Update Pool {} {} {} {}", [
    event.params.pid.toString(),
    event.params.lastRewardBlock.toString(),
    event.params.lpSupply.toString(),
    event.params.accBeetsPerShare.toString(),
  ]);

  //get the contract address
  let masterChef = MasterChefV2.bind(MASTERCHEFV2_ADDRESS);
  let poolAddress = masterChef.try_lpTokens(event.params.pid);
  if (poolAddress.reverted) {
    return;
  }
  let pool = LiquidityPool.load(poolAddress.value.toHexString());
  if (!pool) {
    if (FBEETS.toHexString() == poolAddress.value.toHexString()) {
      pool = createLiquidityPool(event, poolAddress.value.toHexString(), "FreshBeets", "FBEETS", [
        FBEETS.toHexString(),
      ]);
    }
    if (OHMYBEETS.toHexString() == poolAddress.value.toHexString()) {
      //BeethovenxOhmEmissionToken (OHMYBEETS)
      pool = createLiquidityPool(event, poolAddress.value.toHexString(), "BeethovenxOhmEmissionToken", "OHMYBEETS", [
        OHMYBEETS.toHexString(),
      ]);
    }
  }
  pool!.outputTokenSupply = event.params.lpSupply;
  pool!.save();
}

function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: string,
  name: string,
  symbol: string,
  inputTokens: string[],
): LiquidityPool {
  let protocol = getOrCreateDex();
  let inputTokenBalances: BigInt[] = [];
  let inputTokenBalancesAmount: BigDecimal[] = [];
  for (let index = 0; index < inputTokens.length; index++) {
    //create token if null
    getOrCreateToken(inputTokens[index]);
    inputTokenBalances.push(BIGINT_ZERO);
    inputTokenBalancesAmount.push(BIGDECIMAL_ZERO);
  }

  let pool = new LiquidityPool(poolAddress);

  pool.protocol = protocol.id;
  pool.inputTokens = inputTokens;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = inputTokenBalances;
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.stakedOutputTokenAmount = BIGINT_ZERO;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.name = protocol.name + " " + name;
  pool.symbol = symbol;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  pool.isSingleSided = false;
  pool.fees = [];
  if (REWARD_TOKEN != "") {
    let rewardToken = getOrCreateRewardToken(REWARD_TOKEN);
    pool.rewardTokens = [rewardToken.id];
    pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
  }
  pool.inputTokenWeights = [BIGDECIMAL_ONE];
  pool.allocPoint = BIGINT_ZERO;

  pool.save();
  protocol.totalPoolCount = protocol.totalPoolCount + 1;
  protocol.save();
  return pool;
}

export function handleDeposit(event: Deposit): void {
  log.info("[MasterChefV2] Log Deposit {} {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex(),
  ]);

  //get the contract address
  let masterChef = MasterChefV2.bind(MASTERCHEFV2_ADDRESS);
  let poolAddress = masterChef.try_lpTokens(event.params.pid);
  if (poolAddress.reverted) {
    return;
  }
  let pool = getLiquidityPool(poolAddress.value.toHexString());
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(event.params.amount);
  pool.save();
}

export function handleWithdraw(event: Withdraw): void {
  log.info("[MasterChefV2] Log Withdraw {} {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex(),
  ]);

  //get the contract address
  let masterChef = MasterChefV2.bind(MASTERCHEFV2_ADDRESS);
  let poolAddress = masterChef.try_lpTokens(event.params.pid);
  if (poolAddress.reverted) {
    return;
  }
  let pool = getLiquidityPool(poolAddress.value.toHexString());
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(event.params.amount);
  pool.save();
}
