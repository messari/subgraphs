import { Address, log } from "@graphprotocol/graph-ts";
import { Factory } from "../generated/Factory/Factory";
import { PriceOracle } from "../generated/Factory/PriceOracle";
import {
  MANTISSA_DECIMALS,
  BIGDECIMAL_ONE,
  FACTORY_ADDRESS,
  BIGINT_ZERO,
  BIGDECIMAL_HUNDRED,
  BLOCKS_PER_DAY,
  PRICE_BASE,
  DISTRIBUTIONFACTOR_BASE,
} from "./common/constants";
import {
  getOrCreateToken,
  getOrCreateUnderlyingToken,
  getOrCreateMarket,
  getOrCreateProtocol,
  getOrCreateMarketStatus,
} from "./common/getters";
import { RewardDistributor, RewardDistributed, NewRewardToken } from "../generated/templates/Reward/RewardDistributor";
import { RewardToken, Token } from "../generated/schema";
import { RewardTokenType, BIGDECIMAL_ZERO } from "./common/constants";
import { decimalsToBigDecimal, BigDecimalTruncateToBigInt, prefixID } from "./common/utils";

export function handleNewRewardToken(event: NewRewardToken): void {
  // Add new reward token to the rewardToken entity
  let tokenAddr = event.params.newRewardToken.toHexString();
  getOrCreateToken(event.params.newRewardToken);

  let borrowRewardTokenId = prefixID(tokenAddr, RewardTokenType.BORROW);
  let borrowRewardToken = RewardToken.load(borrowRewardTokenId);
  if (borrowRewardToken == null) {
    borrowRewardToken = new RewardToken(borrowRewardTokenId);
    borrowRewardToken.token = tokenAddr;
    borrowRewardToken.type = RewardTokenType.BORROW;
    borrowRewardToken.save();
  }

  let depositRewardTokenId = prefixID(tokenAddr, RewardTokenType.DEPOSIT);
  let depositRewardToken = RewardToken.load(depositRewardTokenId);

  if (depositRewardToken == null) {
    depositRewardToken = new RewardToken(depositRewardTokenId);
    depositRewardToken.token = tokenAddr;
    depositRewardToken.type = RewardTokenType.DEPOSIT;
    depositRewardToken.save();
  }

  let protocol = getOrCreateProtocol();
  let markets = protocol.markets;
  for (let i = 0; i < markets.length; i++) {
    let marketId = markets[i];
    let market = getOrCreateMarket(marketId, event);
    market.rewardTokens = [borrowRewardTokenId, depositRewardTokenId];
    market.save();
  }
}

export function handleRewardDistributed(event: RewardDistributed): void {
  // RewardDistributed event is for individual account (borrower/depositor)
  // Since there is no event for market level/protocol level reward emission
  // we have to do the calculation by ourselves following the logic in
  // function _updateDistributionState in RewardDistributor.sol
  // It'd be more efficient to handle the DistributionSpeedsUpdated event
  // instead, but it was never emitted for some reason
  let protocol = getOrCreateProtocol();
  let markets = protocol.markets;
  let distributorContract = RewardDistributor.bind(event.address);
  let rewardToken = distributorContract.rewardToken();
  let decimals = getOrCreateToken(rewardToken).decimals;
  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
  let oracleContract = PriceOracle.bind(factoryContract.priceOracle());
  let rewardTokenPrice = oracleContract
    .getAssetPrice(rewardToken)
    .toBigDecimal()
    .div(decimalsToBigDecimal(PRICE_BASE));
  for (let i = 0; i < markets.length; i++) {
    let marketId = markets[i];
    let market = getOrCreateMarket(marketId, event);

    let marketAddr = Address.fromString(marketId);
    let distributionFactorMantissa = distributorContract.distributionFactorMantissa(marketAddr).toBigDecimal();
    let distributionFactor = distributionFactorMantissa.div(decimalsToBigDecimal(DISTRIBUTIONFACTOR_BASE));

    // rewards is only affected by speed and deltaBlocks
    let tryDistributionSpeed = distributorContract.try_distributionSpeed(marketAddr);
    let tryDistributionSupplySpeed = distributorContract.try_distributionSupplySpeed(marketAddr);

    let rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount!;
    let rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD!;
    if (!tryDistributionSpeed.reverted) {
      let emissionSpeedBorrow = tryDistributionSpeed.value;
      let emissionBD = emissionSpeedBorrow.toBigDecimal().times(BLOCKS_PER_DAY);
      rewardTokenEmissionsAmount[0] = BigDecimalTruncateToBigInt(emissionBD);
      rewardTokenEmissionsUSD[0] = emissionBD
        .div(decimalsToBigDecimal(decimals))
        .times(distributionFactor)
        .times(rewardTokenPrice);
    }

    if (!tryDistributionSupplySpeed.reverted) {
      let emissionSpeedSupply = tryDistributionSupplySpeed.value;
      let emissionBD = emissionSpeedSupply.toBigDecimal().times(BLOCKS_PER_DAY);
      rewardTokenEmissionsAmount[1] = BigDecimalTruncateToBigInt(emissionBD);
      rewardTokenEmissionsUSD[1] = emissionBD
        .div(decimalsToBigDecimal(decimals))
        .times(distributionFactor)
        .times(rewardTokenPrice);
    }

    market.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
    market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
    market.save();
  }
}
