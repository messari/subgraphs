import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../configurations/configure";
import { GrailTokenV2 } from "../../../../generated/CamelotMaster/GrailTokenV2";
import { NFTPool } from "../../../../generated/CamelotMaster/NFTPool";
import { LiquidityPool } from "../../../../generated/schema";
import {
  BIGINT_ZERO,
  INT_FOUR,
  INT_ONE,
  INT_ZERO,
  MasterChef,
} from "../../../../src/common/constants";
import {
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../src/common/rewards";
import { Logger } from "../../../../src/common/utils/logger";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../src/common/utils/utils";
import {
  getOrCreateMasterChef,
  getOrCreateMasterChefStakingPool,
  updateMasterChefTotalAllocation,
} from "../common/masterchef/helpers";
import { XGRAIL_ADDRESS } from "./constants";

export function handleReward(event: ethereum.Event, address: Address): void {
  const logger = new Logger(event, "handleReward");
  const nftPool = NFTPool.bind(address);
  const poolInfo = nftPool.try_getPoolInfo();
  if (poolInfo.reverted) {
    logger.error("getPoolInfo failed", []);
    return;
  }
  const poolAddress = poolInfo.value.value0; // lpToken
  const stakedAmount = poolInfo.value.value5; // lpSupply
  const stakedAmountWithMultiplier = poolInfo.value.value6; // lpSupplyWithMultiplier
  const allocPoint = poolInfo.value.value7; // allocPoint
  const xGrailRewardsShare = convertTokenToDecimal(
    nftPool.xGrailRewardsShare(),
    INT_FOUR
  );
  const chefPool = getOrCreateMasterChefStakingPool(
    event,
    MasterChef.MINICHEF,
    poolAddress
  );
  updateMasterChefTotalAllocation(
    event,
    chefPool.poolAllocPoint,
    allocPoint,
    MasterChef.MINICHEF
  );
  chefPool.poolAllocPoint = allocPoint;
  chefPool.save();

  const chef = getOrCreateMasterChef(event, MasterChef.MINICHEF);
  const pool = LiquidityPool.load(poolAddress.toHexString());
  if (!pool) {
    logger.error("Failed to load pool {}", [poolAddress.toHexString()]);
    return;
  }
  pool.stakedOutputTokenAmount = stakedAmount;

  const grailToken = getOrCreateToken(event, NetworkConfigs.getRewardToken());
  const xGrailToken = getOrCreateToken(event, XGRAIL_ADDRESS);
  pool.rewardTokens = [
    getOrCreateRewardToken(event, NetworkConfigs.getRewardToken()).id,
    getOrCreateRewardToken(event, XGRAIL_ADDRESS).id,
  ];

  const rewardTokenContract = GrailTokenV2.bind(
    Address.fromString(grailToken.id)
  );
  const emissionRate = rewardTokenContract.masterEmissionRate();

  chef.rewardTokenRate = emissionRate;
  chef.lastUpdatedRewardRate = event.block.number;

  if (chef.totalAllocPoint.gt(BIGINT_ZERO)) {
    // Calculate Reward Emission

    let poolRewardTokenRate = chef.rewardTokenRate.times(
      chefPool.poolAllocPoint
    );

    if (stakedAmount.gt(BIGINT_ZERO)) {
      poolRewardTokenRate = poolRewardTokenRate.times(
        stakedAmountWithMultiplier
      );
      poolRewardTokenRate = poolRewardTokenRate.div(stakedAmount);
    }
    poolRewardTokenRate = poolRewardTokenRate.div(chef.totalAllocPoint);

    // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
    const rewardTokenRateBigDecimal = new BigDecimal(poolRewardTokenRate);
    const rewardTokenPerDay = getRewardsPerDay(
      event.block.timestamp,
      event.block.number,
      rewardTokenRateBigDecimal,
      chef.rewardTokenInterval
    );

    const xGrailPerDay = xGrailRewardsShare.times(rewardTokenPerDay);
    const grailPerDay = rewardTokenPerDay.minus(xGrailPerDay);

    pool.rewardTokenEmissionsAmount = [
      BigInt.fromString(roundToWholeNumber(grailPerDay).toString()),
      BigInt.fromString(roundToWholeNumber(xGrailPerDay).toString()),
    ];
    pool.rewardTokenEmissionsUSD = [
      convertTokenToDecimal(
        pool.rewardTokenEmissionsAmount![INT_ZERO],
        grailToken.decimals
      ).times(grailToken.lastPriceUSD!),
      convertTokenToDecimal(
        pool.rewardTokenEmissionsAmount![INT_ONE],
        xGrailToken.decimals
      ).times(grailToken.lastPriceUSD!), // use grail token for xGrail price data
    ];

    chefPool.lastRewardBlock = event.block.number;
  }

  chefPool.save();
  chef.save();
  grailToken.save();
  pool.save();
}
