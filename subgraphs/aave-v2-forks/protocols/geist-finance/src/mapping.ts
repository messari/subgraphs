import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  CRV_ADDRESS,
  CRV_FTM_LP_ADDRESS,
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
} from "../../../generated/LendingPoolConfigurator/LendingPoolConfigurator";
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
} from "../../../generated/LendingPool/LendingPool";
import { GToken } from "../../../generated/LendingPool/GToken";
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
  _handleTransfer,
  _handleUnpaused,
  _handleWithdraw,
} from "../../../src/mapping";
import { getOrCreateRewardToken } from "../../../src/helpers";
import {
  BIGDECIMAL_THREE,
  BIGDECIMAL_ZERO,
  BIGINT_THREE,
  DEFAULT_DECIMALS,
  exponentToBigDecimal,
  RewardTokenType,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { Market } from "../../../generated/schema";
import { ChefIncentivesController } from "../../../generated/LendingPool/ChefIncentivesController";
import { SpookySwapOracle } from "../../../generated/LendingPool/SpookySwapOracle";
import { Transfer } from "../../../generated/templates/AToken/AToken";

function getProtocolData(): ProtocolData {
  return new ProtocolData(
    Protocol.PROTOCOL_ADDRESS,
    Protocol.NAME,
    Protocol.SLUG,
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
    event.params.variableDebtToken,
    getProtocolData()
    // No stable debt token in geist
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
  const protocolData = getProtocolData();

  // update rewards if there is an incentive controller
  const market = Market.load(event.params.reserve.toHexString());
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
  // Borrow rewards are 3x the rewards per day for deposits

  const gTokenContract = GToken.bind(Address.fromString(market.outputToken!));
  const tryIncentiveController = gTokenContract.try_getIncentivesController();
  if (!tryIncentiveController.reverted) {
    const incentiveControllerContract = ChefIncentivesController.bind(
      tryIncentiveController.value
    );
    const tryPoolInfo = incentiveControllerContract.try_poolInfo(
      Address.fromString(market.outputToken!)
    );
    const tryTotalAllocPoint =
      incentiveControllerContract.try_totalAllocPoint();
    const tryTotalRewardsPerSecond =
      incentiveControllerContract.try_rewardsPerSecond();

    if (
      !tryPoolInfo.reverted ||
      !tryTotalAllocPoint.reverted ||
      !tryTotalRewardsPerSecond.reverted
    ) {
      // create reward tokens
      const borrowRewardToken = getOrCreateRewardToken(
        Address.fromString(REWARD_TOKEN_ADDRESS),
        RewardTokenType.BORROW
      );
      const depositRewardToken = getOrCreateRewardToken(
        Address.fromString(REWARD_TOKEN_ADDRESS),
        RewardTokenType.DEPOSIT
      );
      market.rewardTokens = [borrowRewardToken.id, depositRewardToken.id];

      // calculate rewards per day
      const rewardsPerSecond = tryTotalRewardsPerSecond.value
        .times(tryPoolInfo.value.value1)
        .div(tryTotalAllocPoint.value);
      const rewardsPerDay = rewardsPerSecond.times(
        BigInt.fromI32(SECONDS_PER_DAY)
      );

      const rewardTokenPriceUSD = getGeistPriceUSD();
      const rewardsPerDayUSD = rewardsPerDay
        .toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS))
        .times(rewardTokenPriceUSD);

      // set rewards to arrays
      market.rewardTokenEmissionsAmount = [
        rewardsPerDay.times(BIGINT_THREE),
        rewardsPerDay,
      ];
      market.rewardTokenEmissionsUSD = [
        rewardsPerDayUSD.times(BIGDECIMAL_THREE),
        rewardsPerDayUSD,
      ];
    }
  }
  market.save();

  // update gToken price
  let assetPriceUSD: BigDecimal;

  // CRV prices are not returned from gCRV for the first 3 days
  // ie blocks 24879410 - 25266668
  if (
    market.id.toLowerCase() == CRV_ADDRESS.toLowerCase() &&
    event.block.number.toI64() <= 25266668
  ) {
    assetPriceUSD = getCRVPriceUSD();
  } else {
    const tryPrice = gTokenContract.try_getAssetPrice();
    if (tryPrice.reverted) {
      log.warning(
        "[handleReserveDataUpdated] Token price not found in Market: {}",
        [market.id]
      );
      return;
    }

    // get asset price normally
    assetPriceUSD = tryPrice.value
      .toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS));
  }

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handlePaused(event: Paused): void {
  _handlePaused(getProtocolData());
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

//////////////////////
//// AToken Event ////
//////////////////////

export function handleTransfer(event: Transfer): void {
  _handleTransfer(event, event.params.to, event.params.from, getProtocolData());
}

///////////////////
///// Helpers /////
///////////////////

//
//
// GEIST price is generated from FTM-GEIST reserve on SpookySwap
function getGeistPriceUSD(): BigDecimal {
  const geistFtmLP = SpookySwapOracle.bind(
    Address.fromString(GEIST_FTM_LP_ADDRESS)
  );

  const reserves = geistFtmLP.try_getReserves();

  if (reserves.reverted) {
    log.error("[getGeistPriceUSD] Unable to get price for asset {}", [
      REWARD_TOKEN_ADDRESS,
    ]);
    return BIGDECIMAL_ZERO;
  }
  const reserveFTM = reserves.value.value0;
  const reserveGEIST = reserves.value.value1;

  const priceGEISTinFTM = reserveFTM
    .toBigDecimal()
    .div(reserveGEIST.toBigDecimal());

  // get FTM price
  const gTokenContract = GToken.bind(Address.fromString(GFTM_ADDRESS));
  const tryPrice = gTokenContract.try_getAssetPrice();
  return tryPrice.reverted
    ? BIGDECIMAL_ZERO
    : tryPrice.value
        .toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS))
        .times(priceGEISTinFTM);
}

//
//
// GEIST price is generated from CRV-FTM LP on SpookySwap
function getCRVPriceUSD(): BigDecimal {
  const crvFtmLP = SpookySwapOracle.bind(
    Address.fromString(CRV_FTM_LP_ADDRESS)
  );

  const reserves = crvFtmLP.try_getReserves();

  if (reserves.reverted) {
    log.error("[getCRVPriceUSD] Unable to get price for asset {}", [
      CRV_ADDRESS,
    ]);
    return BIGDECIMAL_ZERO;
  }
  const reserveCRV = reserves.value.value0;
  const reserveFTM = reserves.value.value1;

  const priceCRVinFTM = reserveFTM
    .toBigDecimal()
    .div(reserveCRV.toBigDecimal());

  // get FTM price
  const gTokenContract = GToken.bind(Address.fromString(GFTM_ADDRESS));
  const tryPrice = gTokenContract.try_getAssetPrice();

  log.warning("crv price: ${}", [
    tryPrice.reverted
      ? BIGDECIMAL_ZERO.toString()
      : tryPrice.value
          .toBigDecimal()
          .div(exponentToBigDecimal(DEFAULT_DECIMALS))
          .times(priceCRVinFTM)
          .toString(),
  ]);

  return tryPrice.reverted
    ? BIGDECIMAL_ZERO
    : tryPrice.value
        .toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS))
        .times(priceCRVinFTM);
}
