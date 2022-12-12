import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import { BackerRewardsData, TranchedPool } from "../../generated/schema";
import { BackerRewards as BackerRewardsContract } from "../../generated/BackerRewards/BackerRewards";
import {
  BIGDECIMAL_ZERO,
  DAYS_PER_YEAR,
  GFI_ADDRESS,
  GFI_DECIMALS,
  RewardTokenType,
} from "../common/constants";
import {
  getGFIPrice,
  getOrCreateMarket,
  getOrCreateProtocol,
  getOrCreateRewardToken,
} from "../common/getters";
import { bigDecimalToBigInt } from "../common/utils";

const BACKER_REWARDS_ID = "1";

export function getBackerRewards(): BackerRewardsData {
  let backerRewards = BackerRewardsData.load(BACKER_REWARDS_ID);
  if (!backerRewards) {
    backerRewards = new BackerRewardsData(BACKER_REWARDS_ID);
    backerRewards.contractAddress = "";
    backerRewards.totalRewards = BigInt.zero();
    backerRewards.totalRewardPercentOfTotalGFI = BigDecimal.zero();
    backerRewards.maxInterestDollarsEligible = BigInt.zero();
  }
  return backerRewards;
}

export function updateBackerRewardsData(contractAddress: Address): void {
  const contract = BackerRewardsContract.bind(contractAddress);
  const backerRewards = getBackerRewards();
  backerRewards.contractAddress = contractAddress.toHexString();
  backerRewards.totalRewards = contract.totalRewards();
  backerRewards.totalRewardPercentOfTotalGFI = contract
    .totalRewardPercentOfTotalGFI()
    .toBigDecimal()
    .div(GFI_DECIMALS)
    .div(BigDecimal.fromString("100"));
  // Note that this is actually measured in GFI, not dollars
  backerRewards.maxInterestDollarsEligible =
    contract.maxInterestDollarsEligible();
  backerRewards.save();
}

export function updateMarketRewardTokenEmissions(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  for (let i = 0; i < protocol._marketIDs!.length; i++) {
    const marketID = protocol._marketIDs![i];
    // tranchedPool.estimatedJuniorApyFromGfiRaw is updated
    // in calculateApyFromGfiForAllPools()
    const tranchedPool = TranchedPool.load(marketID);
    if (!tranchedPool) {
      continue;
    }

    const market = getOrCreateMarket(marketID, event);
    const rewardTokens = market.rewardTokens;
    if (!rewardTokens || rewardTokens.length == 0) {
      // GFI reward token only for depositor (backers)
      const rewardTokenAddress = Address.fromString(GFI_ADDRESS);
      const rewardToken = getOrCreateRewardToken(
        rewardTokenAddress,
        RewardTokenType.DEPOSIT
      );
      market.rewardTokens = [rewardToken.id];
    }

    // reward token is for junior backers only, but messari
    // schema doesn't differentiate junor/senior tranche
    const rewardTokenEmissionsAmount = bigDecimalToBigInt(
      market.totalDepositBalanceUSD
        .times(tranchedPool.estimatedJuniorApyFromGfiRaw)
        .div(BigDecimal.fromString(DAYS_PER_YEAR.toString()))
        .times(GFI_DECIMALS)
    );
    const GFIpriceUSD = getGFIPrice(event);
    const rewardTokenEmissionsUSD = !GFIpriceUSD
      ? BIGDECIMAL_ZERO
      : rewardTokenEmissionsAmount.divDecimal(GFI_DECIMALS).times(GFIpriceUSD);
    market.rewardTokenEmissionsAmount = [rewardTokenEmissionsAmount];
    market.rewardTokenEmissionsUSD = [rewardTokenEmissionsUSD];
    log.info(
      "[updateMarketRewardTokenEmissions]daily emission amout={}, USD={} at tx {}",
      [
        rewardTokenEmissionsAmount.toString(),
        rewardTokenEmissionsUSD.toString(),
        event.transaction.hash.toHexString(),
      ]
    );
    market.save();
  }
}
