import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
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
  LiquidationCall,
  Paused,
  Repay,
  ReserveDataUpdated,
  ReserveUsedAsCollateralDisabled,
  ReserveUsedAsCollateralEnabled,
  Unpaused,
  Withdraw,
} from "../../../generated/LendingPool/LendingPool";
import { AToken } from "../../../generated/LendingPool/AToken";
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
import {
  getOrCreateLendingProtocol,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../src/helpers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  exponentToBigDecimal,
  PositionSide,
  readValue,
  RewardTokenType,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { Market } from "../../../generated/schema";
import { ChefIncentivesController } from "../../../generated/LendingPool/ChefIncentivesController";
import { SushiSwapLP } from "../../../generated/LendingPool/SushiSwapLP";
import { IPriceOracleGetter } from "../../../generated/LendingPool/IPriceOracleGetter";
import { Transfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as StableTransfer } from "../../../generated/templates/StableDebtToken/StableDebtToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";

function getProtocolData(): ProtocolData {
  const constants = getNetworkSpecificConstant();
  return new ProtocolData(
    constants.protocolAddress.toHexString(),
    Protocol.NAME,
    Protocol.SLUG,
    constants.network
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
    getProtocolData(),
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
  const protocol = getOrCreateLendingProtocol(protocolData);

  // update rewards if there is an incentive controller
  const market = Market.load(event.params.reserve.toHexString());
  if (!market) {
    log.warning("[handleReserveDataUpdated] Market not found", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  // update rewards
  market.rewardTokens = [
    getOrCreateRewardToken(
      Address.fromString(UWU_TOKEN_ADDRESS),
      RewardTokenType.BORROW
    ).id,
    getOrCreateRewardToken(
      Address.fromString(UWU_TOKEN_ADDRESS),
      RewardTokenType.DEPOSIT
    ).id,
  ];
  market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
  market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  market.save();
  updateRewards(market);

  const assetPriceUSD = getAssetPriceInUSDC(
    Address.fromString(market.inputToken),
    Address.fromString(protocol.priceOracle)
  );

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
    event.params.user
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

/////////////////////////
//// Transfer Events ////
/////////////////////////

export function handleCollateralTransfer(event: CollateralTransfer): void {
  _handleTransfer(
    event,
    getProtocolData(),
    PositionSide.LENDER,
    event.params.to,
    event.params.from
  );
}

export function handleVariableTransfer(event: VariableTransfer): void {
  _handleTransfer(
    event,
    getProtocolData(),
    PositionSide.BORROWER,
    event.params.to,
    event.params.from
  );
}

export function handleStableTransfer(event: StableTransfer): void {
  _handleTransfer(
    event,
    getProtocolData(),
    PositionSide.BORROWER,
    event.params.to,
    event.params.from
  );
}

///////////////////
///// Helpers /////
///////////////////

function updateRewards(market: Market): void {
  // Get UWU rewards for the given pool
  const aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  const tryIncentiveController = aTokenContract.try_getIncentivesController();
  if (!tryIncentiveController.reverted) {
    const rewardEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    const rewardEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    const incentiveControllerContract = ChefIncentivesController.bind(
      tryIncentiveController.value
    );
    const tryDepPoolInfo = incentiveControllerContract.try_poolInfo(
      Address.fromString(market.outputToken!)
    );
    const tryBorPoolInfo = incentiveControllerContract.try_poolInfo(
      Address.fromString(market.vToken!)
    );
    const tryAllocPoints = incentiveControllerContract.try_totalAllocPoint();
    const tryRewardsPerSecond =
      incentiveControllerContract.try_rewardsPerSecond();

    // calculate rewards per pool
    // Rewards/sec/poolSide = rewardsPerSecond * poolAllocPoints / totalAllocPoints

    if (
      !tryBorPoolInfo.reverted &&
      !tryAllocPoints.reverted &&
      !tryRewardsPerSecond.reverted
    ) {
      const uwuToken = getOrCreateToken(Address.fromString(UWU_TOKEN_ADDRESS));
      const poolAllocPoints = tryBorPoolInfo.value.value1;

      const borRewardsPerDay = tryRewardsPerSecond.value
        .times(BigInt.fromI32(SECONDS_PER_DAY))
        .toBigDecimal()
        .div(exponentToBigDecimal(uwuToken.decimals))
        .times(
          poolAllocPoints
            .toBigDecimal()
            .div(tryAllocPoints.value.toBigDecimal())
        );
      const borRewardsPerDayBI = BigInt.fromString(
        borRewardsPerDay
          .times(exponentToBigDecimal(uwuToken.decimals))
          .truncate(0)
          .toString()
      );

      const uwuPriceUSD = getUwuPriceUSD();
      rewardEmissionsAmount[0] = borRewardsPerDayBI;
      rewardEmissionsUSD[0] = borRewardsPerDay.times(uwuPriceUSD);
    }

    if (
      !tryDepPoolInfo.reverted &&
      !tryAllocPoints.reverted &&
      !tryRewardsPerSecond.reverted
    ) {
      const uwuToken = getOrCreateToken(Address.fromString(UWU_TOKEN_ADDRESS));
      const poolAllocPoints = tryDepPoolInfo.value.value1;

      const depRewardsPerDay = tryRewardsPerSecond.value
        .times(BigInt.fromI32(SECONDS_PER_DAY))
        .toBigDecimal()
        .div(exponentToBigDecimal(uwuToken.decimals))
        .times(
          poolAllocPoints
            .toBigDecimal()
            .div(tryAllocPoints.value.toBigDecimal())
        );
      const depRewardsPerDayBI = BigInt.fromString(
        depRewardsPerDay
          .times(exponentToBigDecimal(uwuToken.decimals))
          .truncate(0)
          .toString()
      );

      const uwuPriceUSD = getUwuPriceUSD();
      rewardEmissionsAmount[1] = depRewardsPerDayBI;
      rewardEmissionsUSD[1] = depRewardsPerDay.times(uwuPriceUSD);
    }

    market.rewardTokenEmissionsAmount = rewardEmissionsAmount;
    market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
    market.save();
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
  const protocol = getOrCreateLendingProtocol(getProtocolData());
  const wethPriceUSD = getAssetPriceInUSDC(
    Address.fromString(WETH_TOKEN_ADDRESS),
    Address.fromString(protocol.priceOracle)
  );

  const uwuPriceUSD = wethPriceUSD.div(
    uwuReserveBalance.toBigDecimal().div(wethReserveBalance.toBigDecimal())
  );
  return uwuPriceUSD;
}
