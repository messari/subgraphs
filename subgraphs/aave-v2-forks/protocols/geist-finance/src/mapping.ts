import {
  Address,
  BigDecimal,
  BigInt,
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
  GEIST_FTM_LP_ADDRESS,
  GFTM_ADDRESS,
  Protocol,
  REWARD_TOKEN_ADDRESS,
} from "./constants";
import {
  LendingPoolConfigurator as LendingPoolConfiguratorTemplate,
  LendingPool as LendingPoolTemplate,
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
import { GToken } from "../../../generated/templates/LendingPool/GToken";
import {
  ProtocolData,
  _handleBorrow,
  _handleBorrowingDisabledOnReserve,
  _handleBorrowingEnabledOnReserve,
  _handleCollateralConfigurationChanged,
  _handleDeposit,
  _handleLiquidate,
  _handlePriceOracleUpdated,
  _handleRepay,
  _handleReserveActivated,
  _handleReserveDataUpdated,
  _handleReserveDeactivated,
  _handleReserveFactorChanged,
  _handleReserveInitialized,
  _handleReserveUsedAsCollateralDisabled,
  _handleReserveUsedAsCollateralEnabled,
  _handleWithdraw,
} from "../../../src/mapping";
import {
  getOrCreateLendingProtocol,
  getOrCreateRewardToken,
} from "../../../src/helpers";
import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  exponentToBigDecimal,
  readValue,
  RewardTokenType,
  SECONDS_PER_DAY,
  ZERO_ADDRESS,
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

  lendingProtocol.priceOracle = priceOracle.toHexString();
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
  let protocolData = getProtocolData();

  // update rewards if there is an incentive controller
  let market = Market.load(event.params.reserve.toHexString());
  if (!market) {
    log.warning("[handleReserveDataUpdated] Market not found", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  let gTokenContract = GToken.bind(Address.fromString(market.outputToken!));
  let tryIncentiveController = gTokenContract.try_getIncentivesController();
  if (!tryIncentiveController.reverted) {
    let incentiveControllerContract = ChefIncentivesController.bind(
      tryIncentiveController.value
    );
    let tryPoolInfo = incentiveControllerContract.try_poolInfo(
      Address.fromString(market.outputToken!)
    );
    if (!tryPoolInfo.reverted) {
      let tryEmissions = incentiveControllerContract.try_emissionSchedule(
        tryPoolInfo.value.value1
      ); // parameter is allocPoint
      if (!tryEmissions.reverted) {
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

        // update reward token fields
        let rewardsPerDay = tryEmissions.value.value1.times(
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
  _handleReserveUsedAsCollateralEnabled(event.params.reserve);
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  // This Event handler disables a reserve/market being used as collateral
  _handleReserveUsedAsCollateralDisabled(event.params.reserve);
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
    event.params.debtAsset,
    event.params.liquidator,
    event.params.user
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
    .div(reserveGEIST)
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS));

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
