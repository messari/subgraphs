import { ethereum, Address, log } from "@graphprotocol/graph-ts";
import {
  TotalVSTAIssuedUpdated,
  CommunityIssuance,
} from "../../generated/CommunityIssuance/CommunityIssuance";
import {
  getOrCreateMarketHourlySnapshot,
  getOrCreateMarketSnapshot,
  getOrCreateStabilityPool,
} from "../entities/market";
import {
  BIGDECIMAL_ZERO,
  MINUTES_PER_DAY,
  RewardTokenType,
  VSTA_ADDRESS,
} from "../utils/constants";
import { RewardToken } from "../../generated/schema";
import { getOrCreateAssetToken, getVSTATokenPrice } from "../entities/token";
import { exponentToBigDecimal } from "../utils/numbers";

/*
 * Update reward emssion
 *
 * @param event TotalVSTAIssuedUpdated event
 *
 */
export function handleTotalVSTAIssuedUpdated(
  event: TotalVSTAIssuedUpdated
): void {
  calculateDailyVSTARewards(event, event.params.stabilityPool);
}

function calculateDailyVSTARewards(event: ethereum.Event, pool: Address): void {
  const stabilityPool = getOrCreateStabilityPool(pool, null, event);
  const contract = CommunityIssuance.bind(event.address);
  const stabilityPoolRewardsResult = contract.try_stabilityPoolRewards(pool);
  if (stabilityPoolRewardsResult.reverted) {
    log.error(
      "[calculateDailyVestaRewards]CommunityIssuance.stabilityPoolRewards() reverted for tx {}",
      [event.transaction.hash.toHexString()]
    );
    return;
  }

  // read RewardDistributionPerMin from the `DistributionRewards` struct,
  // not using try_* here
  const rewardTokenEmissionAmount = stabilityPoolRewardsResult.value
    .getRewardDistributionPerMin()
    .times(MINUTES_PER_DAY);

  const VSTAToken = getOrCreateAssetToken(Address.fromString(VSTA_ADDRESS));
  const rewardTokens = stabilityPool.rewardTokens;
  if (!rewardTokens || rewardTokens.length == 0) {
    let rewardToken = RewardToken.load(VSTA_ADDRESS);
    if (!rewardToken) {
      rewardToken = new RewardToken(VSTA_ADDRESS);
      rewardToken.token = VSTAToken.id;
      rewardToken.type = RewardTokenType.DEPOSIT;
      rewardToken.save();
    }
    stabilityPool.rewardTokens = [rewardToken.id];
  }

  const VSTAPriceUSD = getVSTATokenPrice(event);
  let rewardTokenEmissionsUSD = BIGDECIMAL_ZERO;
  if (VSTAPriceUSD) {
    rewardTokenEmissionsUSD = rewardTokenEmissionAmount
      .divDecimal(exponentToBigDecimal(VSTAToken.decimals))
      .times(VSTAPriceUSD);
    VSTAToken.lastPriceUSD = VSTAPriceUSD;
    VSTAToken.lastPriceBlockNumber = event.block.number;
    VSTAToken.save();
  }
  stabilityPool.rewardTokenEmissionsAmount = [rewardTokenEmissionAmount];
  stabilityPool.rewardTokenEmissionsUSD = [rewardTokenEmissionsUSD];
  stabilityPool.save();

  getOrCreateMarketSnapshot(event, stabilityPool);
  getOrCreateMarketHourlySnapshot(event, stabilityPool);

  VSTAToken.lastPriceUSD = VSTAPriceUSD;
  VSTAToken.lastPriceBlockNumber = event.block.number;
  VSTAToken.save();
}
