import { Address, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";

import { RewardsAccrued, RewardsClaimed } from "../../generated/templates/IncentivesController/AaveIncentivesController";

import { Market } from "../../generated/schema";

import {
  getMarketDailySnapshot,
  initMarket,
  getAssetPriceInUSDC,
  getRewardTokensFromIncController,
  amountInUSD,
  initToken,
} from "./utilFunctions";

// declare reward arrays outside of function to avoid closure issues
let rewardTokenEmAmount: BigInt[] = [];
let rewardTokenEmUSD: BigDecimal[] = [];
let marketSnapRewardAmounts: BigInt[] = [];
let marketSnapRewardAmountsUSD: BigDecimal[] = [];
export function handleRewardsAccrued(event: RewardsAccrued): void {
  // Handle event emitted when reward tokens are accrued from deposits
  // event.address is the incentiveController address
  log.info("HANDLE REWARDS ACCRUED", [])
  const incentiveContAddr = event.address;
  const marketAddr = event.transaction.to as Address;
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr.toHexString()) as Market;
  const rewardTokens = getRewardTokensFromIncController(incentiveContAddr, market);
  if (!rewardTokens) {
    log.debug('Could not properly instantiate reward tokens from incentive controller', []);
    return 
  }

  // !!! FOR THE TIME BEING, PULL THE USD VALUE FOR REWARD TOKEN IDX 0, AS THE ONLY DIFFERENCE BETWEEN TOKEN IDX 0 AND 1 ARE THE TYPE
  // PULL THE USD AMOUNT ONLY ONCE, AS IT IS THE SAME TOKEN CONTRACT
  const token = initToken(Address.fromString(rewardTokens[0].id));
  const rewardAccruedInUSD: BigDecimal[] = [amountInUSD(token, event.params.amount), amountInUSD(token, event.params.amount)];
  
  const marketSnap = getMarketDailySnapshot(event, market);
  
  rewardTokenEmAmount = [];
  if (market.rewardTokenEmissionsAmount) {
    rewardTokenEmAmount = market.rewardTokenEmissionsAmount as BigInt[];
  }
  rewardTokenEmUSD = [];
  if (market.rewardTokenEmissionsUSD) {
    rewardTokenEmUSD = market.rewardTokenEmissionsUSD as BigDecimal[];
  }

  marketSnapRewardAmounts = [];
  if (marketSnap.rewardTokenEmissionsAmount) {
    marketSnapRewardAmounts = marketSnap.rewardTokenEmissionsAmount as BigInt[];
  }
  marketSnapRewardAmountsUSD = [];
  if (marketSnap.rewardTokenEmissionsUSD) {
    marketSnapRewardAmountsUSD = marketSnap.rewardTokenEmissionsUSD as BigDecimal[];
  }
  
  for (let i = 0; i < rewardTokens.length; i++) {
    // Loop through the reward tokens on the market entity instance to compare the addresses to the reward token address
    // RATHER THAN CHECKING ID's, NEED TO CHECK IF THE REWARD ACCRUED IS FOR A BORROW OR DEPOSIT
    // LOOP THE TOKENS TO FIND THE APPROPRIATE TOKEN TYPE AND CHANGE THE BALANCE
    
    // if (rewardTokens[i].type === PARAM.TYPE) {
      // If the current token iteration is the reward token address which is to be updated-
      // Add the rewardTokenEmissionsAmount of that index by the amount of reward tokens claimed
      rewardTokenEmAmount[i] = rewardTokenEmAmount[i].plus(event.params.amount);
      rewardTokenEmUSD[i] = rewardTokenEmUSD[i].plus(rewardAccruedInUSD[i]);
      marketSnapRewardAmounts[i] = marketSnapRewardAmounts[i].plus(event.params.amount);
      marketSnapRewardAmountsUSD[i] = marketSnapRewardAmountsUSD[i].plus(rewardAccruedInUSD[i]);
    // }
  }
  
  market.rewardTokenEmissionsAmount = rewardTokenEmAmount;
  market.rewardTokenEmissionsUSD = rewardTokenEmUSD;
  marketSnap.rewardTokenEmissionsAmount = marketSnapRewardAmounts;
  marketSnap.rewardTokenEmissionsUSD = marketSnapRewardAmountsUSD;
  market.save();
  marketSnap.save();
}
