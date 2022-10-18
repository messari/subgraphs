import { Address, log } from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import { Protocol, rTOKEN_DECIMALS } from "./constants";
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
import { RToken } from "../../../generated/LendingPool/RToken";
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
import { BIGDECIMAL_ZERO, exponentToBigDecimal } from "../../../src/constants";
import { Market } from "../../../generated/schema";
import { updateMarketRewards } from "./rewards";
import { Transfer } from "../../../generated/templates/AToken/AToken";

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
    event.params.variableDebtToken,
    getProtocolData()
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
    log.error("[handleReserveDataUpdated] Market not found", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  const rTokenContract = RToken.bind(Address.fromString(market.outputToken!));

  updateMarketRewards(event, market, rTokenContract);

  let assetPriceUSD = BIGDECIMAL_ZERO;
  const tryPrice = rTokenContract.try_getAssetPrice();
  if (tryPrice.reverted) {
    log.error(
      "[handleReserveDataUpdated] Token price not found in Market: {}",
      [market.id]
    );
  }

  assetPriceUSD = tryPrice.value
    .toBigDecimal()
    .div(exponentToBigDecimal(rTOKEN_DECIMALS));

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
