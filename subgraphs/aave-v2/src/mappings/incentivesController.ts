import { Address, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";

import {
  RewardsClaimed,
  AaveIncentivesController as IncentivesControllerContract,
  RewardsAccrued
} from "../../generated/templates/IncentivesController/AaveIncentivesController";

import { Market, MarketDailySnapshot, RewardToken } from "../../generated/schema";

import {
  loadRewardToken,
  loadMarketDailySnapshot,
  initMarket,
  getFinancialsDailySnapshot,
  getAssetPriceInUSDC,
  getRewardTokenFromIncController,
  initToken
} from "./utilFunctions";

// declare reward emissions array outside of function to avoid closure issues
let rewardEmissions: BigInt[] = [];
let rewardEmissionsUSD: BigDecimal[] = [];

export function handleRewardsClaimed(event: RewardsClaimed): void {
  // Handle event emitted when reward tokens are claimed
  // event.address is the incentiveController address
  log.info('HANDLE REWARDS CLAIMED', [])
  const incentiveContAddr = event.address;
  const marketAddr = event.transaction.to as Address;
  if (incentiveContAddr != Address.zero()) {
    let market = initMarket(event, marketAddr.toHexString()) as Market;
    const rewardTokenAddr = getRewardTokenFromIncController(incentiveContAddr, market);
    // If the loadRewardToken() call creates a new RewardToken implementation, the Market implementation adds the reward token to its array
    // Therefore the market needs to be pulled again to account for the updated RewardToken field 
    loadRewardToken(Address.fromString(rewardTokenAddr), market);
    const tokenInstance = initToken(Address.fromString(rewardTokenAddr));
    const assetPriceInUSDC = getAssetPriceInUSDC(tokenInstance);
    market = initMarket(event, marketAddr.toHexString()) as Market;

    // Load/Create the daily market snapshot entity instance
    const marketDailySnapshot = loadMarketDailySnapshot(event, market) as MarketDailySnapshot;
    // Copy current snapshot data into temporary arrays to calculate in to avoid type errors
    let rewardTokenEmAmount: BigInt[] = [];
    if (marketDailySnapshot.rewardTokenEmissionsAmount) {
      rewardTokenEmAmount = marketDailySnapshot.rewardTokenEmissionsAmount as BigInt[];
    }
    let rewardTokenEmUSD: BigDecimal[] = [];
    if (marketDailySnapshot.rewardTokenEmissionsUSD) {
      rewardTokenEmUSD = marketDailySnapshot.rewardTokenEmissionsUSD  as BigDecimal[];
    }
    let rewardTokensList: string[] = [];
    if (market.rewardTokens) {
      rewardTokensList = market.rewardTokens as string[];
    }

    // Loop through the rewardTokens in the Market Entity to initialize/calc their current amounts
    if (rewardTokensList.length > 0) {
      if (!rewardTokenEmAmount || 
        rewardTokenEmAmount.length < rewardTokensList.length || 
        !rewardTokenEmUSD || 
        rewardTokenEmUSD.length < rewardTokensList.length 
      ) {
        // If the current day's snapshot reward token fields have not been initialized or are the incorrect length
        // rewardEmissions declared as a global variable to avoid closure issues
        rewardEmissions = [];
        rewardTokensList.forEach(() => {
          // For each reward token, create a zero value to initialize the amount of reward emissions for that day
          rewardEmissions.push(new BigInt(0));
          rewardEmissionsUSD.push(BigDecimal.fromString("0"));
        });
        // set both the token emissions amount and amount in USD to arrays of the same length with all indicies as zero values
        rewardTokenEmAmount = rewardEmissions;
        rewardTokenEmUSD = rewardEmissionsUSD;
      }
      for (let i = 0; i < rewardTokensList.length; i++) {
        // Loop through the reward tokens on the market entity instance to compare the addresses to the reward token address
        const token = rewardTokensList[i];
        if (rewardTokenAddr === token) {
          // If the current token iteration is the reward token address which is to be updated-
          // Add the rewardTokenEmissionsAmount of that index by the amount of reward tokens claimed
          rewardTokenEmAmount[i] = rewardTokenEmAmount[i].plus(event.params.amount);
          rewardTokenEmUSD[i] = rewardTokenEmUSD[i].plus(assetPriceInUSDC.times(new BigDecimal(event.params.amount)));
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
  log.info("HANDLE REWARDS ACCRUED", [])
  const incentiveContAddr = event.address;
  const marketAddr = event.transaction.to as Address;
  const market = initMarket(event, marketAddr.toHexString()) as Market;
  const rewardTokenAddr = Address.fromString(getRewardTokenFromIncController(incentiveContAddr, market));
  // loadRewardToken in case it has not been created as a RewardToken entity yet
  loadRewardToken(rewardTokenAddr, market);
  // initToken of the RewardToken to be able to pull the reward token price in USDC
  const token = initToken(rewardTokenAddr);
  const rewardTokenInUSD = getAssetPriceInUSDC(token);
  const rewardAccruedInUSD = new BigDecimal(event.params.amount).times(rewardTokenInUSD)
  const financialsDailySnapshot = getFinancialsDailySnapshot(event);
  financialsDailySnapshot.supplySideRevenueUSD = financialsDailySnapshot.supplySideRevenueUSD.plus(rewardAccruedInUSD);
  financialsDailySnapshot.save();
}