import { Address, log } from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  FLASHLOAN_PREMIUM_TOTAL,
  getNetworkSpecificConstant,
  Protocol,
  rTOKEN_DECIMALS,
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
import { RToken } from "../../../generated/LendingPool/RToken";
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
import { BIGDECIMAL_ZERO, InterestRateMode } from "../../../src/constants";
import { updateMarketRewards } from "./rewards";
import { BalanceTransfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";
import { DataManager, ProtocolData } from "../../../src/sdk/manager";
import {
  exponentToBigDecimal,
  getBorrowBalances,
  getMarketFromToken,
  getOrCreateFlashloanPremium,
} from "../../../src/helpers";
import {
  CollateralizationType,
  InterestRateType,
  LendingType,
  PermissionType,
  PositionSide,
  RiskType,
} from "../../../src/sdk/constants";

function getProtocolData(): ProtocolData {
  const networkSpecific = getNetworkSpecificConstant();

  return new ProtocolData(
    Address.fromString(networkSpecific.protocolAddress),
    Protocol.PROTOCOL,
    Protocol.NAME,
    Protocol.SLUG,
    networkSpecific.network,
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
    // No stable debt token in radiant
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
  // update rewards if there is an incentive controller
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

  const rTokenContract = RToken.bind(Address.fromBytes(market.outputToken!));
  updateMarketRewards(manager, event, rTokenContract);

  let assetPriceUSD = BIGDECIMAL_ZERO;
  const tryPrice = rTokenContract.try_getAssetPrice();
  if (tryPrice.reverted) {
    log.error(
      "[handleReserveDataUpdated] Token price not found for Market {}; default to 0.0",
      [market.id.toHexString()]
    );
  } else {
    assetPriceUSD = tryPrice.value
      .toBigDecimal()
      .div(exponentToBigDecimal(rTOKEN_DECIMALS));
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
