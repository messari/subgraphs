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
  getOrCreateLendingProtocol,
  getOrCreateMarket,
  getOrCreateToken,
} from "./common/initializers";
import {
  bigIntToBigDecimal,
  rayToWad,
  readValue,
  updateTVL,
} from "./common/utils";
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
  _handleCollateralConfigurationChanged,
  _handlePriceOracleUpdated,
  _handleReserveInitialized,
} from "../../../src/mapping";

function getProtocolData(): ProtocolData {
  let constants = getNetworkSpecificConstant();
  return new ProtocolData(
    constants.protocolAddress.toHexString(),
    Protocol.NAME,
    Protocol.SLUG,
    Protocol.SCHEMA_VERSION,
    Protocol.SUBGRAPH_VERSION,
    Protocol.METHODOLOGY_VERSION,
    constants.network
  );
}

///////////////////////////////////////////////
///// LendingPoolAddressProvider Handlers /////
///////////////////////////////////////////////

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  _handlePriceOracleUpdated(event.params.newAddress, getProtocolData());
}

export function handleLendingPoolUpdated(event: LendingPoolUpdated): void {
  const context = initiateContext(event.address);
  startIndexingLendingPool(event.params.newAddress, context);
}

export function handleLendingPoolConfiguratorUpdated(
  event: LendingPoolConfiguratorUpdated
): void {
  const context = initiateContext(event.address);
  startIndexingLendingPoolConfigurator(event.params.newAddress, context);
}

export function handleProxyCreated(event: ProxyCreated): void {
  // Event handler for lending pool or configurator contract creation
  const pool = event.params.id.toString();
  const address = event.params.newAddress;
  const context = initiateContext(event.address);

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
  const contract = AddressProviderContract.bind(addrProvider);
  log.info("AddrProvContract: " + addrProvider.toHexString(), []);
  // Get the lending pool
  const trylendingPool = contract.try_getLendingPool();
  let lendingPool = "";
  if (!trylendingPool.reverted) {
    lendingPool = trylendingPool.value.toHexString();
    log.info("initiateContext LP:" + lendingPool, []);
  }

  // Initialize the protocol entity
  const lendingProtocol = getOrCreateLendingProtocol();

  const priceOracle = readValue<Address>(
    contract.try_getPriceOracle(),
    Address.fromString(ZERO_ADDRESS)
  );

  lendingProtocol._protocolPriceOracle = priceOracle.toHexString();
  lendingProtocol.save();

  const context = new DataSourceContext();
  context.setString("lendingPool", lendingPool);

  return context;
}

//////////////////////////////////////
///// Lending Pool Configuration /////
//////////////////////////////////////

export function getLendingPoolFromCtx(): string {
  // Get the lending pool with context
  const context = dataSource.context();
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
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);
  market.canBorrowFrom = true;
  market.save();

  log.info("[BorowEnabledOnReserve] MarketId: {}", [marketAddress]);
}

export function handleBorrowingDisabledOnReserve(
  event: BorrowingDisabledOnReserve
): void {
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);
  market.canBorrowFrom = false;
  market.save();

  log.info("[BorowDisabledOnReserve] MarketId: {}", [marketAddress]);
}

export function handleReserveActivated(event: ReserveActivated): void {
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);
  market.isActive = true;
  market.save();

  log.info("[ReserveActivated] MarketId: {}", [marketAddress]);
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);
  market.isActive = false;
  market.save();

  log.info("[ReserveDeactivated] MarketId: {}", [marketAddress]);
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);

  // Set the reserve factor as an integer * 100 of a percent
  // (ie 2500 represents 25% of the reserve)
  market.reserveFactor = event.params.factor;
  market.save();

  log.info("[ReserveFactorChanged] MarketId: {}, reserveFactor: {}", [
    marketAddress,
    market.reserveFactor.toString(),
  ]);
}

/////////////////////////////////
///// Lending Pool Handlers /////
/////////////////////////////////

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  // This event handler updates the deposit/borrow rates on a market
  //  when the state of a reserve is updated

  log.warning("reserve: {}", [event.transaction.hash.toHexString()]);

  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress);

  let stableBorrowRate = createInterestRate(
    market.id,
    InterestRateSide.BORROWER,
    InterestRateType.STABLE,
    bigIntToBigDecimal(rayToWad(event.params.stableBorrowRate))
  );

  let variableBorrowRate = createInterestRate(
    market.id,
    InterestRateSide.BORROWER,
    InterestRateType.VARIABLE,
    bigIntToBigDecimal(rayToWad(event.params.variableBorrowRate))
  );

  let depositRate = createInterestRate(
    market.id,
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE,
    bigIntToBigDecimal(rayToWad(event.params.liquidityRate))
  );

  market.rewardTokens = [
    stableBorrowRate.id,
    variableBorrowRate.id,
    depositRate.id,
  ];

  market.save();
}

export function handleDeposit(event: Deposit): void {
  log.warning("Deposit handled: {}", [event.transaction.hash.toHexString()]); // TODO remove
  const amount = event.params.amount;
  const token = getOrCreateToken(event.params.reserve);
  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress);

  createDepositEntity(event, market, reserveAddress, amount);

  updateTVL(market, token, amount, false);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleWithdraw(event: Withdraw): void {
  const amount = event.params.amount;
  const token = getOrCreateToken(event.params.reserve);
  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress);

  createWithdrawEntity(event, market, reserveAddress, amount);

  updateTVL(market, token, amount, true);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleBorrow(event: Borrow): void {
  const amount = event.params.amount;
  const token = getOrCreateToken(event.params.reserve);
  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress);

  createBorrowEntity(event, market, reserveAddress, amount);

  updateTVL(market, token, amount, true);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleRepay(event: Repay): void {
  const amount = event.params.amount;
  const token = getOrCreateToken(event.params.reserve);
  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress);

  createRepayEntity(event, market, reserveAddress, amount);

  updateTVL(market, token, amount, false);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleLiquidationCall(event: LiquidationCall): void {
  const user = event.params.user.toHexString();
  const debtAsset = event.params.debtAsset.toHexString();
  const collateralAsset = event.params.collateralAsset.toHexString();
  const liquidator = event.params.liquidator.toHexString();
  const amount = event.params.liquidatedCollateralAmount;
  const market = getOrCreateMarket(event, collateralAsset);
  const token = getOrCreateToken(event.params.collateralAsset);

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
  const marketAddr = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, marketAddr);
  market.canUseAsCollateral = true;
  market.save();
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  // This Event handler disables a reserve/market being used as collateral
  const marketAddr = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, marketAddr);
  market.canUseAsCollateral = false;
  market.save();
}

///////////////////////////
///// aToken Handlers /////
///////////////////////////

export function handleATokenTransfer(event: Transfer): void {
  // Event handler for AToken transfers. This gets triggered upon transfers
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    log.warning("[ATokenTransfer] Txn: {}, amount: {}", [
      event.transaction.hash.toHexString(),
      event.params.value.toString(),
    ]);
  }
}
