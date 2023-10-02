import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  FLASHLOAN_PREMIUM_TOTAL,
  getNetworkSpecificConstant,
  Protocol,
  UWU_DECIMALS,
  UWU_TOKEN_ADDRESS,
  UWU_WETH_LP,
  WETH_TOKEN_ADDRESS,
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
import { AToken } from "../../../generated/LendingPool/AToken";
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
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  InterestRateMode,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { _DefaultOracle } from "../../../generated/schema";
import { ChefIncentivesController } from "../../../generated/LendingPool/ChefIncentivesController";
import { SushiSwapLP } from "../../../generated/LendingPool/SushiSwapLP";
import { IPriceOracleGetter } from "../../../generated/LendingPool/IPriceOracleGetter";
import { BalanceTransfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as StableTransfer } from "../../../generated/templates/StableDebtToken/StableDebtToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";
import {
  DataManager,
  ProtocolData,
  RewardData,
} from "../../../src/sdk/manager";
import {
  LendingType,
  PermissionType,
  CollateralizationType,
  RiskType,
  PositionSide,
  RewardTokenType,
  InterestRateType,
} from "../../../src/sdk/constants";
import {
  exponentToBigDecimal,
  getBorrowBalances,
  getMarketFromToken,
  getOrCreateFlashloanPremium,
  readValue,
} from "../../../src/helpers";
import { TokenManager } from "../../../src/sdk/token";

function getProtocolData(): ProtocolData {
  const constants = getNetworkSpecificConstant();
  return new ProtocolData(
    constants.protocolAddress,
    Protocol.PROTOCOL,
    Protocol.NAME,
    Protocol.SLUG,
    constants.network,
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
    protocolData,
    event.params.stableDebtToken
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
    log.warning("[handleReserveDataUpdated] Market not found", [
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

  const assetPriceUSD = getAssetPriceInUSDC(
    Address.fromBytes(market.inputToken),
    manager.getOracleAddress()
  );

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
  updateRewards(manager, event);
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
    event.params.user
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

export function handleStableTransfer(event: StableTransfer): void {
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

function updateRewards(manager: DataManager, event: ethereum.Event): void {
  const market = manager.getMarket();
  // Get UWU rewards for the given pool
  const aTokenContract = AToken.bind(Address.fromBytes(market.outputToken!));
  const tryIncentiveController = aTokenContract.try_getIncentivesController();
  if (!tryIncentiveController.reverted) {
    log.warning(
      "[updateRewards]aToken {} getIncentivesController() call reverted",
      [market.outputToken!.toHexString()]
    );
    return;
  }

  const rewardEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
  const rewardEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  const incentiveControllerContract = ChefIncentivesController.bind(
    tryIncentiveController.value
  );
  const tryDepPoolInfo = incentiveControllerContract.try_poolInfo(
    Address.fromBytes(market.outputToken!)
  );
  const tryBorPoolInfo = incentiveControllerContract.try_poolInfo(
    Address.fromBytes(market._vToken!)
  );
  const tryAllocPoints = incentiveControllerContract.try_totalAllocPoint();
  const tryRewardsPerSecond =
    incentiveControllerContract.try_rewardsPerSecond();

  const tokenManager = new TokenManager(
    Address.fromString(UWU_TOKEN_ADDRESS),
    event
  );
  const uwuToken = tokenManager.getToken();
  const rewardTokenBorrow = tokenManager.getOrCreateRewardToken(
    RewardTokenType.VARIABLE_BORROW
  );
  const rewardTokenDeposit = tokenManager.getOrCreateRewardToken(
    RewardTokenType.DEPOSIT
  );
  const uwuPriceUSD = getUwuPriceUSD();
  tokenManager.updatePrice(uwuPriceUSD);

  // calculate rewards per pool
  // Rewards/sec/poolSide = rewardsPerSecond * poolAllocPoints / totalAllocPoints
  if (
    !tryBorPoolInfo.reverted &&
    !tryAllocPoints.reverted &&
    !tryRewardsPerSecond.reverted
  ) {
    const poolAllocPoints = tryBorPoolInfo.value.value1;

    const borRewardsPerDay = tryRewardsPerSecond.value
      .times(BigInt.fromI32(SECONDS_PER_DAY))
      .toBigDecimal()
      .div(exponentToBigDecimal(uwuToken.decimals))
      .times(
        poolAllocPoints.toBigDecimal().div(tryAllocPoints.value.toBigDecimal())
      );
    const borRewardsPerDayBI = BigInt.fromString(
      borRewardsPerDay
        .times(exponentToBigDecimal(uwuToken.decimals))
        .truncate(0)
        .toString()
    );

    const rewardDataBorrow = new RewardData(
      rewardTokenBorrow,
      borRewardsPerDayBI,
      borRewardsPerDay.times(uwuPriceUSD)
    );
    manager.updateRewards(rewardDataBorrow);
  }

  if (
    !tryDepPoolInfo.reverted &&
    !tryAllocPoints.reverted &&
    !tryRewardsPerSecond.reverted
  ) {
    const poolAllocPoints = tryDepPoolInfo.value.value1;

    const depRewardsPerDay = tryRewardsPerSecond.value
      .times(BigInt.fromI32(SECONDS_PER_DAY))
      .toBigDecimal()
      .div(exponentToBigDecimal(uwuToken.decimals))
      .times(
        poolAllocPoints.toBigDecimal().div(tryAllocPoints.value.toBigDecimal())
      );
    const depRewardsPerDayBI = BigInt.fromString(
      depRewardsPerDay
        .times(exponentToBigDecimal(uwuToken.decimals))
        .truncate(0)
        .toString()
    );

    rewardEmissionsAmount[1] = depRewardsPerDayBI;
    rewardEmissionsUSD[1] = depRewardsPerDay.times(uwuPriceUSD);
    const rewardDataDeposit = new RewardData(
      rewardTokenDeposit,
      depRewardsPerDayBI,
      depRewardsPerDay.times(uwuPriceUSD)
    );
    manager.updateRewards(rewardDataDeposit);
  }
}

function getAssetPriceInUSDC(
  tokenAddress: Address,
  priceOracle: Address
): BigDecimal {
  const oracle = IPriceOracleGetter.bind(priceOracle);
  let oracleResult = readValue<BigInt>(
    oracle.try_getAssetPrice(tokenAddress),
    BIGINT_ZERO
  );

  // if the result is zero or less, try the fallback oracle
  if (!oracleResult.gt(BIGINT_ZERO)) {
    const tryFallback = oracle.try_getFallbackOracle();
    if (tryFallback) {
      const fallbackOracle = IPriceOracleGetter.bind(tryFallback.value);
      oracleResult = readValue<BigInt>(
        fallbackOracle.try_getAssetPrice(tokenAddress),
        BIGINT_ZERO
      );
    }
  }

  return oracleResult.toBigDecimal().div(exponentToBigDecimal(UWU_DECIMALS));
}

//
// get UWU price based off WETH price
function getUwuPriceUSD(): BigDecimal {
  const sushiContract = SushiSwapLP.bind(Address.fromString(UWU_WETH_LP));
  const tryReserves = sushiContract.try_getReserves();
  if (tryReserves.reverted) {
    log.warning("[getUwuPriceUSD] failed to get reserves for UWU-WETH LP", []);
    return BIGDECIMAL_ZERO;
  }

  const uwuReserveBalance = tryReserves.value.value0;
  const wethReserveBalance = tryReserves.value.value1;

  if (
    uwuReserveBalance.equals(BIGINT_ZERO) ||
    wethReserveBalance.equals(BIGINT_ZERO)
  ) {
    log.warning("[getUwuPriceUSD] UWU or WETH reserve balance is zero", []);
    return BIGDECIMAL_ZERO;
  }

  // get WETH price in USD
  const defaultOracle = _DefaultOracle.load(protocolData.protocolID);
  if (!defaultOracle || !defaultOracle.oracle) {
    log.warning("[getUwuPriceUSD]defaultOracle.oracle for {} is not set", [
      protocolData.protocolID.toHexString(),
    ]);
    return BIGDECIMAL_ZERO;
  }
  const wethPriceUSD = getAssetPriceInUSDC(
    Address.fromString(WETH_TOKEN_ADDRESS),
    Address.fromBytes(defaultOracle.oracle)
  );

  const uwuPriceUSD = wethPriceUSD.div(
    uwuReserveBalance.toBigDecimal().div(wethReserveBalance.toBigDecimal())
  );
  return uwuPriceUSD;
}
