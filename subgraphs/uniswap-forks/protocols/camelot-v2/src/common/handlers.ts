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
  TransferType,
  XGRAIL_ADDRESS,
} from "./constants";
import {
  getOrCreateRewardToken,
  getOrCreateToken,
  getOrCreateTransfer,
} from "./getters";
import {
  getOrCreateMasterChef,
  getOrCreateMasterChefStakingPool,
  updateMasterChefTotalAllocation,
} from "./masterchef/helpers";
import { getRewardsPerDay } from "./rewards";
import { Logger } from "./utils/logger";
import { bigIntToBigDecimal } from "./utils/numbers";
import { convertTokenToDecimal, roundToWholeNumber } from "./utils/utils";

// Handle data from transfer event for mints. Used to populate Deposit entity in the Mint event.
export function handleTransferMint(
  event: ethereum.Event,
  pool: LiquidityPool,
  value: BigInt,
  to: string
): void {
  const transfer = getOrCreateTransfer(event);

  // Tracks supply of minted LP tokens
  pool.outputTokenSupply = pool.outputTokenSupply!.plus(value);

  // if - create new mint if no mints so far or if last one is done already
  // else - This is done to remove a potential feeto mint --- Not active
  if (!transfer.type) {
    transfer.type = TransferType.MINT;

    // Address that is minted to
    transfer.sender = to;
    transfer.liquidity = value;
  } else if (transfer.type == TransferType.MINT) {
    // Updates the liquidity if the previous mint was a fee mint
    // Address that is minted to
    transfer.sender = to;
    transfer.liquidity = value;
  }

  transfer.save();
  pool.save();
}

/**
 * There are two Transfer event handlers for Burns because when the LP token is burned,
 * there the LP tokens are first transfered to the liquidity pool, and then the LP tokens are burned
 * to the null address from the particular liquidity pool.
 */

// Handle data from transfer event for burns. Used to populate Deposit entity in the Burn event.
export function handleTransferToPoolBurn(
  event: ethereum.Event,
  from: string
): void {
  const transfer = getOrCreateTransfer(event);

  transfer.type = TransferType.BURN;
  transfer.sender = from;

  transfer.save();
}

// Handle data from transfer event for burns. Used to populate Deposit entity in the Burn event.
export function handleTransferBurn(
  event: ethereum.Event,
  pool: LiquidityPool,
  value: BigInt,
  from: string
): void {
  const transfer = getOrCreateTransfer(event);

  // Tracks supply of minted LP tokens
  pool.outputTokenSupply = pool.outputTokenSupply!.minus(value);

  // Uses address from the transfer to pool part of the burn. Set transfer type from this handler.
  if (transfer.type == TransferType.BURN) {
    transfer.liquidity = value;
  } else {
    transfer.type = TransferType.BURN;
    transfer.sender = from;
    transfer.liquidity = value;
  }

  transfer.save();
  pool.save();
}

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
  const xGrailRewardsShare = bigIntToBigDecimal(
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
