import {
  Address,
  BigDecimal,
  dataSource,
  DataSourceContext,
  log,
} from "@graphprotocol/graph-ts";
import {
  LendingPoolConfiguratorUpdated,
  LendingPoolUpdated,
  PriceOracleUpdated,
  ProxyCreated,
  LendingPoolAddressesProvider as AddressProviderContract,
} from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  getNetworkSpecificConstant,
  InterestRateSide,
  InterestRateType,
  Protocol,
  ZERO_ADDRESS,
} from "./common/constants";
import {
  createInterestRate,
  getOrCreateMarket,
  getOrCreateToken,
} from "./common/initializers";
import {
  LendingPoolConfigurator as LendingPoolConfiguratorTemplate,
  LendingPool as LendingPoolTemplate,
  AToken as ATokenTemplate,
} from "../../../generated/templates";
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
  Repay,
  ReserveDataUpdated,
  ReserveUsedAsCollateralDisabled,
  ReserveUsedAsCollateralEnabled,
  Withdraw,
} from "../../../generated/templates/LendingPool/LendingPool";
import { createDepositEntity } from "./modules/Deposit";
import { calculateRevenues } from "./modules/Revenue";
import { updateFinancials, updateUsageMetrics } from "./modules/Metrics";
import { createWithdrawEntity } from "./modules/Withdraw";
import { createBorrowEntity } from "./modules/Borrow";
import { createRepayEntity } from "./modules/Repay";
import { createLiquidateEntity } from "./modules/Liquidate";
import { Transfer } from "../../../generated/templates/AToken/AToken";
import {
  ProtocolData,
  _handleBorrowingDisabledOnReserve,
  _handleBorrowingEnabledOnReserve,
  _handleCollateralConfigurationChanged,
  _handlePriceOracleUpdated,
  _handleReserveActivated,
  _handleReserveDataUpdated,
  _handleReserveDeactivated,
  _handleReserveInitialized,
} from "../../../src/mapping";
import { getOrCreateLendingProtocol } from "../../../src/helpers";
import { readValue } from "../../../src/constants";

function getProtocolData(): ProtocolData {
  let letants = getNetworkSpecificConstant();
  return new ProtocolData(
    letants.protocolAddress.toHexString(),
    Protocol.NAME,
    Protocol.SLUG,
    Protocol.SCHEMA_VERSION,
    Protocol.SUBGRAPH_VERSION,
    Protocol.METHODOLOGY_VERSION,
    letants.network
  );
}

///////////////////////////////////////////////
///// LendingPoolAddressProvider Handlers /////
///////////////////////////////////////////////

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  _handlePriceOracleUpdated(event.params.newAddress, getProtocolData());
}

export function handleLendingPoolUpdated(event: LendingPoolUpdated): void {
  let context = initiateContext(event.address);
  startIndexingLendingPool(event.params.newAddress, context);
}

export function handleLendingPoolConfiguratorUpdated(
  event: LendingPoolConfiguratorUpdated
): void {
  let context = initiateContext(event.address);
  startIndexingLendingPoolConfigurator(event.params.newAddress, context);
}

export function handleProxyCreated(event: ProxyCreated): void {
  // Event handler for lending pool or configurator contract creation
  let pool = event.params.id.toString();
  let address = event.params.newAddress;
  let context = initiateContext(event.address);

  log.info("[ProxyCreated]: {}", [pool]);

  if (pool == "LENDING_POOL") {
    startIndexingLendingPool(address, context);
  } else if (pool == "LENDING_POOL_CONFIGURATOR") {
    startIndexingLendingPoolConfigurator(address, context);
  }
}

export function startIndexingLendingPool(
  poolAddress: Address,
  context: DataSourceContext
): void {
  // Create a template for an implementation of a Lending Pool/Market
  // This indexes for events which users act upon a lending pool within the lendingPool.ts mapping script
  log.info("START INDEXING LENDING POOL", []);
  LendingPoolTemplate.createWithContext(poolAddress, context);
}

export function startIndexingLendingPoolConfigurator(
  configurator: Address,
  context: DataSourceContext
): void {
  // Create a template for an implementation of a Lending Pool Configurator
  // This indexes for events within the lendingPoolConfigurator.ts mapping script
  log.info("START INDEXING LENDING POOL CONFIG", []);
  LendingPoolConfiguratorTemplate.createWithContext(configurator, context);
}

function initiateContext(addrProvider: Address): DataSourceContext {
  // Add Lending Pool address, price oracle contract address,
  // and protocol id to the context for general accessibility
  let contract = AddressProviderContract.bind(addrProvider);
  log.info("AddrProvContract: " + addrProvider.toHexString(), []);
  // Get the lending pool
  let trylendingPool = contract.try_getLendingPool();
  let lendingPool = "";
  if (!trylendingPool.reverted) {
    lendingPool = trylendingPool.value.toHexString();
    log.info("initiateContext LP:" + lendingPool, []);
  }

  // Initialize the protocol entity
  let lendingProtocol = getOrCreateLendingProtocol(getProtocolData());

  let priceOracle = readValue<Address>(
    contract.try_getPriceOracle(),
    Address.fromString(ZERO_ADDRESS)
  );

  lendingProtocol._protocolPriceOracle = priceOracle.toHexString();
  lendingProtocol.save();

  let context = new DataSourceContext();
  context.setString("lendingPool", lendingPool);

  return context;
}

//////////////////////////////////////
///// Lending Pool Configuration /////
//////////////////////////////////////

export function getLendingPoolFromCtx(): string {
  // Get the lending pool with context
  let context = dataSource.context();
  return context.getString("lendingPool");
}

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market entity from reserve creation event
  // Attempt to load or create the market implementation

  ATokenTemplate.create(event.params.aToken);
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
    event.params.ltv
  );
}

export function handleBorrowingEnabledOnReserve(
  event: BorrowingEnabledOnReserve
): void {
  _handleBorrowingEnabledOnReserve(event.params.asset);
}

export function handleBorrowingDisabledOnReserve(
  event: BorrowingDisabledOnReserve
): void {
  _handleBorrowingDisabledOnReserve(event.params.asset);
}

export function handleReserveActivated(event: ReserveActivated): void {
  _handleReserveActivated(event.params.asset);
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  _handleReserveDeactivated(event.params.asset);
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  _handleReserveFactorChanged(event.params.asset, event.params.factor);
}

/////////////////////////////////
///// Lending Pool Handlers /////
/////////////////////////////////

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  _handleReserveDataUpdated(
    event.params.liquidityRate,
    event.params.liquidityIndex,
    event.params.variableBorrowRate,
    event.params.stableBorrowRate,
    getProtocolData(),
    event.params.reserve
  );
}

export function handleDeposit(event: Deposit): void {
  log.warning("Deposit handled: {}", [event.transaction.hash.toHexString()]); // TODO remove
  let amount = event.params.amount;
  let token = getOrCreateToken(event.params.reserve);
  let reserveAddress = event.params.reserve.toHexString();
  let market = getOrCreateMarket(event, reserveAddress);

  createDepositEntity(event, market, reserveAddress, amount);

  updateTVL(market, token, amount, false);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleWithdraw(event: Withdraw): void {
  let amount = event.params.amount;
  let token = getOrCreateToken(event.params.reserve);
  let reserveAddress = event.params.reserve.toHexString();
  let market = getOrCreateMarket(event, reserveAddress);

  createWithdrawEntity(event, market, reserveAddress, amount);

  updateTVL(market, token, amount, true);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleBorrow(event: Borrow): void {
  let amount = event.params.amount;
  let token = getOrCreateToken(event.params.reserve);
  let reserveAddress = event.params.reserve.toHexString();
  let market = getOrCreateMarket(event, reserveAddress);

  createBorrowEntity(event, market, reserveAddress, amount);

  updateTVL(market, token, amount, true);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleRepay(event: Repay): void {
  let amount = event.params.amount;
  let token = getOrCreateToken(event.params.reserve);
  let reserveAddress = event.params.reserve.toHexString();
  let market = getOrCreateMarket(event, reserveAddress);

  createRepayEntity(event, market, reserveAddress, amount);

  updateTVL(market, token, amount, false);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleLiquidationCall(event: LiquidationCall): void {
  let user = event.params.user.toHexString();
  let debtAsset = event.params.debtAsset.toHexString();
  let collateralAsset = event.params.collateralAsset.toHexString();
  let liquidator = event.params.liquidator.toHexString();
  let amount = event.params.liquidatedCollateralAmount;
  let market = getOrCreateMarket(event, collateralAsset);
  let token = getOrCreateToken(event.params.collateralAsset);

  createLiquidateEntity(
    event,
    market,
    user,
    debtAsset,
    collateralAsset,
    liquidator,
    amount
  );

  updateTVL(market, token, amount, false);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleReserveUsedAsCollateralEnabled(
  event: ReserveUsedAsCollateralEnabled
): void {
  // This Event handler enables a reserve/market to be used as collateral
  let marketAddr = event.params.reserve.toHexString();
  let market = getOrCreateMarket(event, marketAddr);
  market.canUseAsCollateral = true;
  market.save();
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  // This Event handler disables a reserve/market being used as collateral
  let marketAddr = event.params.reserve.toHexString();
  let market = getOrCreateMarket(event, marketAddr);
  market.canUseAsCollateral = false;
  market.save();
}

///////////////////////////
///// aToken Handlers /////
///////////////////////////

// TODO: won't do anything use diff method
export function handleATokenTransfer(event: Transfer): void {
  // Event handler for AToken transfers. This gets triggered upon transfers
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    log.warning("[ATokenTransfer] Txn: {}, amount: {}", [
      event.transaction.hash.toHexString(),
      event.params.value.toString(),
    ]);
  }
}
