import { Address, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";

import { RewardsAccrued } from "../../generated/templates/IncentivesController/AaveIncentivesController";

import { Market } from "../../generated/schema";

import {
  getMarketDailySnapshot,
  initMarket,
  getAssetPriceInUSDC,
  getRewardTokenFromIncController,
} from "./utilFunctions";

// declare reward arrays outside of function to avoid closure issues
let rewardTokenEmAmount: BigInt[] = [];
let rewardTokenEmUSD: BigDecimal[] = [];
let rewardTokensList: string[] = [];
let marketSnapRewardAmounts: BigInt[] = [];
let marketSnapRewardAmountsUSD: BigDecimal[] = [];
export function handleRewardsAccrued(event: RewardsAccrued): void {
  // Handle event emitted when reward tokens are accrued from deposits
  // event.address is the incentiveController address
  log.info("HANDLE REWARDS ACCRUED", [])
  const incentiveContAddr = event.address;
  const marketAddr = event.transaction.to as Address;
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr.toHexString()) as Market;
  const rewardToken = getRewardTokenFromIncController(incentiveContAddr, market);
  const rewardTokenInUSD = getAssetPriceInUSDC(Address.fromString(rewardToken.id));
  const rewardAccruedInUSD = new BigDecimal(event.params.amount).times(rewardTokenInUSD);
  const marketSnap = getMarketDailySnapshot(event, market);
  
  rewardTokenEmAmount = [];
  if (market.rewardTokenEmissionsAmount) {
    rewardTokenEmAmount = market.rewardTokenEmissionsAmount as BigInt[];
  }
  rewardTokenEmUSD = [];
  if (market.rewardTokenEmissionsUSD) {
    rewardTokenEmUSD = market.rewardTokenEmissionsUSD as BigDecimal[];
  }
  rewardTokensList = [];
  if (market.rewardTokens) {
    rewardTokensList = market.rewardTokens as string[];
  }
  marketSnapRewardAmounts = [];
  if (marketSnap.rewardTokenEmissionsAmount) {
    marketSnapRewardAmounts = marketSnap.rewardTokenEmissionsAmount as BigInt[];
  }
  marketSnapRewardAmountsUSD = [];
  if (marketSnap.rewardTokenEmissionsUSD) {
    marketSnapRewardAmountsUSD = marketSnap.rewardTokenEmissionsUSD as BigDecimal[];
  }
  
  for (let i = 0; i < rewardTokensList.length; i++) {
    // Loop through the reward tokens on the market entity instance to compare the addresses to the reward token address
    if (rewardToken.id === rewardTokensList[i]) {
      // If the current token iteration is the reward token address which is to be updated-
      // Add the rewardTokenEmissionsAmount of that index by the amount of reward tokens claimed
      rewardTokenEmAmount[i] = rewardTokenEmAmount[i].plus(event.params.amount);
      rewardTokenEmUSD[i] = rewardTokenEmUSD[i].plus(rewardAccruedInUSD);
      marketSnapRewardAmounts[i] = marketSnapRewardAmounts[i].plus(event.params.amount);
      marketSnapRewardAmountsUSD[i] = marketSnapRewardAmountsUSD[i].plus(rewardAccruedInUSD);
    }
  }
  
  market.rewardTokenEmissionsAmount = rewardTokenEmAmount;
  market.rewardTokenEmissionsUSD = rewardTokenEmUSD;
  marketSnap.rewardTokenEmissionsAmount = marketSnapRewardAmounts;
  marketSnap.rewardTokenEmissionsUSD = marketSnapRewardAmountsUSD;
  market.save();
  marketSnap.save();
}
