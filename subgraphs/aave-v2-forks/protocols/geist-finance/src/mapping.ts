import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  GEIST_FTM_LP_ADDRESS,
  GFTM_ADDRESS,
  Protocol,
  REWARD_TOKEN_ADDRESS,
} from "./constants";
import {
  BorrowingDisabledOnReserve,
  BorrowingEnabledOnReserve,
  CollateralConfigurationChanged,
  ReserveActivated,
  ReserveDeactivated,
  ReserveFactorChanged,
  ReserveInitialized,
} from "../../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator";
import {
  Borrow,
  Deposit,
  LiquidationCall,
  Paused,
  Repay,
  ReserveDataUpdated,
  ReserveUsedAsCollateralDisabled,
  ReserveUsedAsCollateralEnabled,
  Unpaused,
  Withdraw,
} from "../../../generated/templates/LendingPool/LendingPool";
import { GToken } from "../../../generated/templates/LendingPool/GToken";
import {
  ProtocolData,
  _handleBorrow,
  _handleBorrowingDisabledOnReserve,
  _handleBorrowingEnabledOnReserve,
  _handleCollateralConfigurationChanged,
  _handleDeposit,
  _handleLiquidate,
  _handlePaused,
  _handlePriceOracleUpdated,
  _handleRepay,
  _handleReserveActivated,
  _handleReserveDataUpdated,
  _handleReserveDeactivated,
  _handleReserveFactorChanged,
  _handleReserveInitialized,
  _handleReserveUsedAsCollateralDisabled,
  _handleReserveUsedAsCollateralEnabled,
  _handleUnpaused,
  _handleWithdraw,
} from "../../../src/mapping";
import { getOrCreateRewardToken } from "../../../src/helpers";
import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  exponentToBigDecimal,
  RewardTokenType,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { Market } from "../../../generated/schema";
import { ChefIncentivesController } from "../../../generated/templates/LendingPool/ChefIncentivesController";
import { SpookySwapOracle } from "../../../generated/templates/LendingPool/SpookySwapOracle";

function getProtocolData(): ProtocolData {
  return new ProtocolData(
    Protocol.PROTOCOL_ADDRESS,
    Protocol.NAME,
    Protocol.SLUG,
    Protocol.SCHEMA_VERSION,
    Protocol.SUBGRAPH_VERSION,
    Protocol.METHODOLOGY_VERSION,
    Protocol.NETWORK
  );
}

///////////////////////////////////////////////
///// LendingPoolAddressProvider Handlers /////
///////////////////////////////////////////////

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  _handlePriceOracleUpdated(event.params.newAddress, getProtocolData());
}

//////////////////////////////////////
///// Lending Pool Configuration /////
//////////////////////////////////////

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market entity from reserve creation event
  // Attempt to load or create the market implementation

  _handleReserveInitialized(
    event,
    event.params.asset,
    event.params.aToken,
    event.params.stableDebtToken,
    event.params.variableDebtToken,
    getProtocolData()
  );
}

export function handleCollateralConfigurationChanged(
  event: CollateralConfigurationChanged
): void {
  _handleCollateralConfigurationChanged(
    event.params.asset,
    event.params.liquidationBonus,
    event.params.liquidationThreshold,
    event.params.ltv,
    getProtocolData()
  );
}

export function handleBorrowingEnabledOnReserve(
  event: BorrowingEnabledOnReserve
): void {
  _handleBorrowingEnabledOnReserve(event.params.asset, getProtocolData());
}

export function handleBorrowingDisabledOnReserve(
  event: BorrowingDisabledOnReserve
): void {
  _handleBorrowingDisabledOnReserve(event.params.asset, getProtocolData());
}

export function handleReserveActivated(event: ReserveActivated): void {
  _handleReserveActivated(event.params.asset, getProtocolData());
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  _handleReserveDeactivated(event.params.asset, getProtocolData());
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  _handleReserveFactorChanged(
    event.params.asset,
    event.params.factor,
    getProtocolData()
  );
}

/////////////////////////////////
///// Lending Pool Handlers /////
/////////////////////////////////

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  let protocolData = getProtocolData();

  // update rewards if there is an incentive controller
  let market = Market.load(event.params.reserve.toHexString());
  if (!market) {
    log.warning("[handleReserveDataUpdated] Market not found", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  //
  //
  // Rewards / day calculation
  // rewards per second = totalRewardsPerSecond * (allocPoint / totalAllocPoint)
  // rewards per day = rewardsPerSecond * 60 * 60 * 24

  let gTokenContract = GToken.bind(Address.fromString(market.outputToken!));
  let tryIncentiveController = gTokenContract.try_getIncentivesController();
  if (!tryIncentiveController.reverted) {
    let incentiveControllerContract = ChefIncentivesController.bind(
      tryIncentiveController.value
    );
    let tryPoolInfo = incentiveControllerContract.try_poolInfo(
      Address.fromString(market.outputToken!)
    );
    let tryTotalAllocPoint = incentiveControllerContract.try_totalAllocPoint();
    let tryTotalRewardsPerSecond =
      incentiveControllerContract.try_rewardsPerSecond();

    if (
      !tryPoolInfo.reverted ||
      !tryTotalAllocPoint.reverted ||
      !tryTotalRewardsPerSecond.reverted
    ) {
      // create reward tokens
      let depositRewardToken = getOrCreateRewardToken(
        Address.fromString(REWARD_TOKEN_ADDRESS),
        RewardTokenType.DEPOSIT
      );
      let borrowRewardToken = getOrCreateRewardToken(
        Address.fromString(REWARD_TOKEN_ADDRESS),
        RewardTokenType.BORROW
      );
      market.rewardTokens = [depositRewardToken.id, borrowRewardToken.id];

      // calculate rewards per day
      let rewardsPerSecond = tryTotalRewardsPerSecond.value
        .times(tryPoolInfo.value.value1)
        .div(tryTotalAllocPoint.value);
      let rewardsPerDay = rewardsPerSecond.times(
        BigInt.fromI32(SECONDS_PER_DAY)
      );

      let rewardTokenPriceUSD = getGeistPriceUSD();
      let rewardsPerDayUSD = rewardsPerDay
        .toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS))
        .times(rewardTokenPriceUSD);

      // set rewards to arrays
      market.rewardTokenEmissionsAmount = [rewardsPerDay, rewardsPerDay];
      market.rewardTokenEmissionsUSD = [rewardsPerDayUSD, rewardsPerDayUSD];
    }
  }
  market.save();

  // update gToken price
  let tryPrice = gTokenContract.try_getAssetPrice();
  if (tryPrice.reverted) {
    log.warning(
      "[handleReserveDataUpdated] Token price not found in Market: {}",
      [market.id]
    );
    return;
  }
  let assetPriceUSD = tryPrice.value
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS));

  _handleReserveDataUpdated(
    event,
    event.params.liquidityRate,
    event.params.liquidityIndex,
    event.params.variableBorrowRate,
    event.params.stableBorrowRate,
    protocolData,
    event.params.reserve,
    assetPriceUSD
  );
}

export function handleReserveUsedAsCollateralEnabled(
  event: ReserveUsedAsCollateralEnabled
): void {
  // This Event handler enables a reserve/market to be used as collateral
  _handleReserveUsedAsCollateralEnabled(
    event.params.reserve,
    event.params.user,
    getProtocolData()
  );
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  // This Event handler disables a reserve/market being used as collateral
  _handleReserveUsedAsCollateralDisabled(
    event.params.reserve,
    event.params.user,
    getProtocolData()
  );
}

export function handlePaused(event: Paused): void {
  _handlePaused(getProtocolData());
}

export function handleUnpaused(event: Unpaused): void {
  _handleUnpaused(getProtocolData());
}

export function handleDeposit(event: Deposit): void {
  _handleDeposit(
    event,
    event.params.amount,
    event.params.reserve,
    getProtocolData(),
    event.params.onBehalfOf
  );
}

export function handleWithdraw(event: Withdraw): void {
  _handleWithdraw(
    event,
    event.params.amount,
    event.params.reserve,
    getProtocolData(),
    event.params.to
  );
}

export function handleBorrow(event: Borrow): void {
  _handleBorrow(
    event,
    event.params.amount,
    event.params.reserve,
    getProtocolData(),
    event.params.onBehalfOf
  );
}

export function handleRepay(event: Repay): void {
  _handleRepay(
    event,
    event.params.amount,
    event.params.reserve,
    getProtocolData(),
    event.params.user // address that is getting debt reduced
  );
}

export function handleLiquidationCall(event: LiquidationCall): void {
  _handleLiquidate(
    event,
    event.params.liquidatedCollateralAmount,
    event.params.collateralAsset,
    getProtocolData(),
    event.params.liquidator,
    event.params.user,
    event.params.debtAsset
  );
}

///////////////////
///// Helpers /////
///////////////////

//
//
// GEIST price is generated from FTM-GEIST reserve on SpookySwap
function getGeistPriceUSD(): BigDecimal {
  let geistFtmLP = SpookySwapOracle.bind(
    Address.fromString(GEIST_FTM_LP_ADDRESS)
  );

  let reserves = geistFtmLP.try_getReserves();

  if (reserves.reverted) {
    log.error("[getGeistPriceUSD] Unable to get price for asset", [
      REWARD_TOKEN_ADDRESS,
    ]);
    return BIGDECIMAL_ZERO;
  }
  let reserveFTM = reserves.value.value0;
  let reserveGEIST = reserves.value.value1;

  let priceGEISTinFTM = reserveFTM
    .toBigDecimal()
    .div(reserveGEIST.toBigDecimal());

  // get FTM price
  let gTokenContract = GToken.bind(Address.fromString(GFTM_ADDRESS));
  let tryPrice = gTokenContract.try_getAssetPrice();
  return tryPrice.reverted
    ? BIGDECIMAL_ZERO
    : tryPrice.value
        .toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS))
        .times(priceGEISTinFTM);
}
