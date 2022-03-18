import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";

import {
  RewardsClaimed,
  AaveIncentivesController as IncentivesControllerContract,
  RewardsAccrued
} from "../../generated/templates/IncentivesController/AaveIncentivesController";

import { Market, MarketDailySnapshot, RewardToken } from "../../generated/schema";

import {
  initRewardToken,
  loadMarketDailySnapshot,
  zeroAddr,
  loadMarket,
  getFinancialsDailySnapshot,
  getAssetPriceInUSDC,
  initToken
} from "./utilFunctions";

function getRewardTokenAddr(incentiveContAddr: Address): string {
  // Instantiate IncentivesController to get access to contract read methods
  const contract = IncentivesControllerContract.bind(incentiveContAddr);
  // Get the contract Reward Token's address
  const rewardTokenAddr = contract.REWARD_TOKEN().toHexString();
  return rewardTokenAddr;
}

// declare reward emissions array outside of function to avoid closure issues
let rewardEmissions: BigDecimal[] = [];
export function handleRewardsClaimed(event: RewardsClaimed): void {
  // Handle event emitted when reward tokens are claimed
  // event.address is the incentiveController address
  const incentiveContAddr = event.address;
  if (incentiveContAddr.toHexString() != zeroAddr) {
    const rewardTokenAddr = getRewardTokenAddr(incentiveContAddr);
    let market = loadMarket() as Market;
    // If the initRewardToken() call creates a new RewardToken implementation, the Market implementation adds the reward token to its array
    // Therefore the market needs to be pulled again to account for the updated RewardToken field 
    initRewardToken(Address.fromString(rewardTokenAddr), market);
    const tokenInstance = initToken(Address.fromString(rewardTokenAddr));
    const assetPriceInUSDC = getAssetPriceInUSDC(tokenInstance);
    market = loadMarket() as Market;
    // Load/Create the daily market snapshot entity instance
    const marketDailySnapshot = loadMarketDailySnapshot(event, market) as MarketDailySnapshot;
    let rewardTokenEmAmount: BigDecimal[] = [];
    if (marketDailySnapshot.rewardTokenEmissionsAmount) {
      rewardTokenEmAmount = marketDailySnapshot.rewardTokenEmissionsAmount as BigDecimal[];
    }
    let rewardTokenEmUSD: BigDecimal[] = [];
    if (marketDailySnapshot.rewardTokenEmissionsUSD) {
      rewardTokenEmUSD = marketDailySnapshot.rewardTokenEmissionsUSD  as BigDecimal[];
    }
    let rewardTokensList: string[] = [];
    if (market.rewardTokens) {
      rewardTokensList = market.rewardTokens as string[];
    }
    if (rewardTokensList.length > 0) {
      if (!rewardTokenEmAmount || 
        rewardTokenEmAmount.length < rewardTokensList.length || 
        !rewardTokenEmUSD || 
        rewardTokenEmUSD.length < rewardTokensList.length 
      ) {
        // If the current day's snapshot "rewardTokenEmissionsAmount" has not been initialized or is the incorrect length
        rewardEmissions = [];
        rewardTokensList.forEach(() => {
          // For each reward token, create a zero value to initialize the amount of reward emissions for that day
          rewardEmissions.push(new BigDecimal(new BigInt(0)));
        });
        rewardTokenEmAmount = rewardEmissions;
        rewardTokenEmUSD = rewardEmissions;
      }
      for (let i = 0; i < rewardTokensList.length; i++) {
        // Loop through the reward tokens on the market entity instance to compare the addresses to the reward token address
        const token = rewardTokensList[i];
        if (rewardTokenAddr === token) {
          // If the current token iteration is the reward token address which is to be updated-
          // Add the rewardTokenEmissionsAmount of that index by the amount of reward tokens claimed
          rewardTokenEmAmount[i].plus(new BigDecimal(event.params.amount));
          rewardTokenEmUSD[i].plus(assetPriceInUSDC.times(new BigDecimal(event.params.amount)));
        }
      }
    }
    marketDailySnapshot.rewardTokenEmissionsAmount = rewardTokenEmAmount;
    marketDailySnapshot.rewardTokenEmissionsUSD = rewardTokenEmUSD;
    marketDailySnapshot.save();
  }
}

export function handleRewardsAccrued(event: RewardsAccrued): void {
  // Financial daily snapshot, add the reward token value in USD to the financial supplyside revenue
  // Handle event emitted when reward tokens are accrued from deposits
  // event.address is the incentiveController address
  const incentiveContAddr = event.address;
  const market = loadMarket() as Market;
  const rewardTokenAddr = Address.fromString(getRewardTokenAddr(incentiveContAddr));
  // initRewardToken in case it has not been created as a RewardToken entity yet
  initRewardToken(rewardTokenAddr, market);
  // initToken of the RewardToken to be able to pull the reward token price in USDC
  const token = initToken(rewardTokenAddr);
  const rewardTokenInUSD = getAssetPriceInUSDC(token);
  const rewardAccruedInUSD = new BigDecimal(event.params.amount).times(rewardTokenInUSD)
  const financialsDailySnapshot = getFinancialsDailySnapshot(event);
  financialsDailySnapshot.supplySideRevenueUSD.plus(rewardAccruedInUSD);
  financialsDailySnapshot.save();
}