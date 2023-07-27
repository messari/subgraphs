import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  CRV_ADDRESS,
  CRV_FTM_LP_ADDRESS,
  FLASHLOAN_PREMIUM_TOTAL,
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
  FlashLoan,
  LiquidationCall,
  Paused,
  Repay,
  ReserveDataUpdated,
  ReserveUsedAsCollateralDisabled,
  ReserveUsedAsCollateralEnabled,
  Swap,
  Unpaused,
  Withdraw,
} from "../../../generated/LendingPool/LendingPool";
import { GToken } from "../../../generated/LendingPool/GToken";
import {
  _handleBorrow,
  _handleBorrowingDisabledOnReserve,
  _handleBorrowingEnabledOnReserve,
  _handleCollateralConfigurationChanged,
  _handleDeposit,
  _handleFlashLoan,
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
  _handleSwapBorrowRateMode,
  _handleTransfer,
  _handleUnpaused,
  _handleWithdraw,
} from "../../../src/mapping";
import {
  exponentToBigDecimal,
  getBorrowBalances,
  getMarketFromToken,
  getOrCreateFlashloanPremium,
} from "../../../src/helpers";
import {
  BIGDECIMAL_THREE,
  BIGDECIMAL_ZERO,
  BIGINT_THREE,
  DEFAULT_DECIMALS,
  InterestRateMode,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { ChefIncentivesController } from "../../../generated/LendingPool/ChefIncentivesController";
import { SpookySwapOracle } from "../../../generated/LendingPool/SpookySwapOracle";
import { BalanceTransfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";
import {
  DataManager,
  ProtocolData,
  RewardData,
} from "../../../src/sdk/manager";
import {
  CollateralizationType,
  InterestRateType,
  LendingType,
  PermissionType,
  PositionSide,
  RewardTokenType,
  RiskType,
} from "../../../src/sdk/constants";
import { TokenManager } from "../../../src/sdk/token";

function getProtocolData(): ProtocolData {
  return new ProtocolData(
    Address.fromString(Protocol.PROTOCOL_ADDRESS),
    Protocol.PROTOCOL,
    Protocol.NAME,
    Protocol.SLUG,
    Protocol.NETWORK,
    LendingType.POOLED,
    PermissionType.PERMISSIONLESS,
    PermissionType.PERMISSIONLESS,
    PermissionType.ADMIN,
    CollateralizationType.OVER_COLLATERALIZED,
    RiskType.GLOBAL
  );
}
const protocolData = getProtocolData();

///////////////////////////////////////////////
///// LendingPoolAddressProvider Handlers /////
///////////////////////////////////////////////

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  _handlePriceOracleUpdated(event.params.newAddress, protocolData, event);
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
    protocolData
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
    protocolData
  );
}

export function handleBorrowingEnabledOnReserve(
  event: BorrowingEnabledOnReserve
): void {
  _handleBorrowingEnabledOnReserve(event.params.asset, protocolData);
}

export function handleBorrowingDisabledOnReserve(
  event: BorrowingDisabledOnReserve
): void {
  _handleBorrowingDisabledOnReserve(event.params.asset, protocolData);
}

export function handleReserveActivated(event: ReserveActivated): void {
  _handleReserveActivated(event.params.asset, protocolData);
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  _handleReserveDeactivated(event.params.asset, protocolData);
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  _handleReserveFactorChanged(
    event.params.asset,
    event.params.factor,
    protocolData
  );
}

/////////////////////////////////
///// Lending Pool Handlers /////
/////////////////////////////////

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  const market = getMarketFromToken(event.params.reserve, protocolData);
  if (!market) {
    log.warning("[handleReserveDataUpdated] Market not found for reserve {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );

  updateRewards(manager, event);

  const gTokenContract = GToken.bind(Address.fromBytes(market.outputToken!));
  // update gToken price
  let assetPriceUSD: BigDecimal;

  const CRV_PRICE_BLOCK_NUMBER = 25266668;
  // CRV prices are not returned from gCRV for the first 3 days
  // ie blocks 24879410 - 25266668
  if (
    market.id.toHexString().toLowerCase() == CRV_ADDRESS.toLowerCase() &&
    event.block.number.toI64() <= CRV_PRICE_BLOCK_NUMBER
  ) {
    assetPriceUSD = getCRVPriceUSD();
  } else {
    const tryPrice = gTokenContract.try_getAssetPrice();
    if (tryPrice.reverted) {
      log.warning(
        "[handleReserveDataUpdated] Token price not found in Market: {}",
        [market.id.toHexString()]
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
    event.params.variableBorrowIndex,
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
    protocolData
  );
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  // This Event handler disables a reserve/market being used as collateral
  _handleReserveUsedAsCollateralDisabled(
    event.params.reserve,
    event.params.user,
    protocolData
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handlePaused(event: Paused): void {
  _handlePaused(protocolData);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleUnpaused(event: Unpaused): void {
  _handleUnpaused(protocolData);
}

export function handleDeposit(event: Deposit): void {
  _handleDeposit(
    event,
    event.params.amount,
    event.params.reserve,
    protocolData,
    event.params.onBehalfOf
  );
}

export function handleWithdraw(event: Withdraw): void {
  _handleWithdraw(
    event,
    event.params.amount,
    event.params.reserve,
    protocolData,
    event.params.to
  );
}

export function handleBorrow(event: Borrow): void {
  _handleBorrow(
    event,
    event.params.amount,
    event.params.reserve,
    protocolData,
    event.params.onBehalfOf
  );
}

export function handleRepay(event: Repay): void {
  _handleRepay(
    event,
    event.params.amount,
    event.params.reserve,
    protocolData,
    event.params.user // address that is getting debt reduced
  );
}

export function handleLiquidationCall(event: LiquidationCall): void {
  _handleLiquidate(
    event,
    event.params.liquidatedCollateralAmount,
    event.params.collateralAsset,
    protocolData,
    event.params.liquidator,
    event.params.user,
    event.params.debtAsset,
    event.params.debtToCover
  );
}

export function handleFlashloan(event: FlashLoan): void {
  const flashloanPremium = getOrCreateFlashloanPremium(protocolData);
  flashloanPremium.premiumRateTotal = FLASHLOAN_PREMIUM_TOTAL;
  flashloanPremium.save();

  _handleFlashLoan(
    event.params.asset,
    event.params.amount,
    event.params.initiator,
    protocolData,
    event,
    event.params.premium,
    flashloanPremium
  );
}

export function handleSwapBorrowRateMode(event: Swap): void {
  const interestRateMode = event.params.rateMode.toI32();
  if (
    ![InterestRateMode.STABLE, InterestRateMode.VARIABLE].includes(
      interestRateMode
    )
  ) {
    log.error(
      "[handleSwapBorrowRateMode]interestRateMode {} is not one of [{}, {}]",
      [
        interestRateMode.toString(),
        InterestRateMode.STABLE.toString(),
        InterestRateMode.VARIABLE.toString(),
      ]
    );
    return;
  }

  const interestRateType =
    interestRateMode === InterestRateMode.STABLE
      ? InterestRateType.STABLE
      : InterestRateType.VARIABLE;
  const market = getMarketFromToken(event.params.reserve, protocolData);
  if (!market) {
    log.error("[handleLiquidationCall]Failed to find market for asset {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  const newBorrowBalances = getBorrowBalances(market, event.params.user);
  _handleSwapBorrowRateMode(
    event,
    market,
    event.params.user,
    newBorrowBalances,
    interestRateType,
    protocolData
  );
}
/////////////////////////
//// Transfer Events ////
/////////////////////////

export function handleCollateralTransfer(event: CollateralTransfer): void {
  _handleTransfer(
    event,
    protocolData,
    PositionSide.COLLATERAL,
    event.params.to,
    event.params.from,
    event.params.value
  );
}

export function handleVariableTransfer(event: VariableTransfer): void {
  _handleTransfer(
    event,
    protocolData,
    PositionSide.BORROWER,
    event.params.to,
    event.params.from,
    event.params.value
  );
}

///////////////////
///// Helpers /////
///////////////////

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

// Rewards / day calculation
// rewards per second = totalRewardsPerSecond * (allocPoint / totalAllocPoint)
// rewards per day = rewardsPerSecond * 60 * 60 * 24
// Borrow rewards are 3x the rewards per day for deposits
function updateRewards(manager: DataManager, event: ethereum.Event): void {
  const market = manager.getMarket();
  const gTokenContract = GToken.bind(Address.fromBytes(market.outputToken!));
  const tryIncentiveController = gTokenContract.try_getIncentivesController();
  if (!tryIncentiveController.reverted) {
    return;
  }
  const incentiveControllerContract = ChefIncentivesController.bind(
    tryIncentiveController.value
  );
  const tryPoolInfo = incentiveControllerContract.try_poolInfo(
    Address.fromBytes(market.outputToken!)
  );
  const tryTotalAllocPoint = incentiveControllerContract.try_totalAllocPoint();
  const tryTotalRewardsPerSecond =
    incentiveControllerContract.try_rewardsPerSecond();
  if (
    tryPoolInfo.reverted ||
    tryTotalAllocPoint.reverted ||
    tryTotalRewardsPerSecond.reverted
  ) {
    return;
  }

  // create reward tokens
  const tokenManager = new TokenManager(
    Address.fromString(REWARD_TOKEN_ADDRESS),
    event
  );
  const rewardTokenBorrow = tokenManager.getOrCreateRewardToken(
    RewardTokenType.VARIABLE_BORROW
  );
  const rewardTokenDeposit = tokenManager.getOrCreateRewardToken(
    RewardTokenType.DEPOSIT
  );
  const rewardTokenPriceUSD = getGeistPriceUSD();
  tokenManager.updatePrice(rewardTokenPriceUSD);

  // calculate rewards per day
  const rewardsPerSecond = tryTotalRewardsPerSecond.value
    .times(tryPoolInfo.value.value1)
    .div(tryTotalAllocPoint.value);
  const rewardsPerDay = rewardsPerSecond.times(BigInt.fromI32(SECONDS_PER_DAY));
  const rewardsPerDayUSD = rewardsPerDay
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .times(rewardTokenPriceUSD);

  const rewardDataBorrow = new RewardData(
    rewardTokenBorrow,
    rewardsPerDay.times(BIGINT_THREE),
    rewardsPerDayUSD.times(BIGDECIMAL_THREE)
  );
  const rewardDataDeposit = new RewardData(
    rewardTokenDeposit,
    rewardsPerDay,
    rewardsPerDayUSD
  );
  manager.updateRewards(rewardDataBorrow);
  manager.updateRewards(rewardDataDeposit);
}
