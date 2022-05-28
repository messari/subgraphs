// import { LiquidityPool } from "../../generated/schema";
// import { BigInt } from "@graphprotocol/graph-ts";

// export function handleRewards(pool: LiquidityPool, blockNumber: BigInt, timestamp: BigInt): void {
//   for (let i = 0; i < pool.rewardTokens!.length; i++) {
//     let rewardTokenId = pool.rewardTokens![i];
//     let rewardToken = getRewardtoken(rewardTokenId);
//     calculateEmissions(pool, blockNumber, timestamp, i);
//   }
// }

// export function calculateGaugeV1Emissions(
//     pool: LiquidityPool,
//     blockNumber: BigInt,
//     timestamp: BigInt, // @ts-ignore
//     rewardTokenIndex: i32,
//   ): void {
//     const gaugeController = GaugeController.bind(GAUGE_CONTROLLER);
//     let relativeWeightCall = gaugeController.try_gauge_relative_weight(Address.fromString(pool.gauge));
//     if (!relativeWeightCall.reverted) {
//       let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
//       let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
//       let tokensEmitted = getCrvInflationRate(timestamp);
//       const emissionsRate = tokensEmitted.times(relativeWeightCall.value).div(exponentToBigInt(DEFAULT_DECIMALS));
//       const inflationRateUSD = getCrvInflationRateUSD(tokensEmitted, blockNumber, timestamp);
//       rewardTokenEmissionsAmount[rewardTokenIndex] = emissionsRate;
//       rewardTokenEmissionsUSD[rewardTokenIndex] = inflationRateUSD;
//       pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
//       pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
//       pool.save();
//     } else {
//       log.error("Failed to get gauge relative weight for pool {}", [pool.id]);
//     }
//   }