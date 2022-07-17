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
  getNetworkSpecificConstant,
  Protocol,
  USDC_TOKEN_ADDRESS,
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
import { AToken } from "../../../generated/templates/LendingPool/AToken";
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
  getOrCreateToken,
} from "../../../src/helpers";
import {
  BIGINT_ZERO,
  equalsIgnoreCase,
  exponentToBigDecimal,
  Network,
  readValue,
  RewardTokenType,
  SECONDS_PER_DAY,
  ZERO_ADDRESS,
} from "../../../src/constants";
import { Market } from "../../../generated/schema";
import { AaveIncentivesController } from "../../../generated/templates/LendingPool/AaveIncentivesController";
import { IPriceOracleGetter } from "../../../generated/templates/LendingPool/IPriceOracleGetter";

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

  let aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  let tryIncentiveController = aTokenContract.try_getIncentivesController();
  if (!tryIncentiveController.reverted) {
    let incentiveControllerContract = AaveIncentivesController.bind(
      tryIncentiveController.value
    );
    let tryRewardInfo = incentiveControllerContract.try_assets(
      Address.fromString(market.outputToken!)
    );
    if (!tryRewardInfo.reverted) {
      let tryRewardAsset = incentiveControllerContract.try_REWARD_TOKEN();
      if (!tryRewardAsset.reverted) {
        // create reward tokens
        let depositRewardToken = getOrCreateRewardToken(
          tryRewardAsset.value,
          RewardTokenType.DEPOSIT
        );
        let borrowRewardToken = getOrCreateRewardToken(
          tryRewardAsset.value,
          RewardTokenType.BORROW
        );
        let rewardDecimals = getOrCreateToken(tryRewardAsset.value).decimals;
        market.rewardTokens = [depositRewardToken.id, borrowRewardToken.id];

        // now get or create reward token and update fields
        let protocol = getOrCreateLendingProtocol(protocolData);
        let rewardsPerDay = tryRewardInfo.value.value0.times(
          BigInt.fromI32(SECONDS_PER_DAY)
        );
        let rewardTokenPriceUSD = getAssetPriceInUSDC(
          tryRewardAsset.value,
          Address.fromString(protocol.priceOracle)
        );
        let rewardsPerDayUSD = rewardsPerDay
          .toBigDecimal()
          .div(exponentToBigDecimal(rewardDecimals))
          .times(rewardTokenPriceUSD);

        // set rewards to arrays
        market.rewardTokenEmissionsAmount = [rewardsPerDay, rewardsPerDay];
        market.rewardTokenEmissionsUSD = [rewardsPerDayUSD, rewardsPerDayUSD];
      }
    }
  }
  market.save();

  let protocol = getOrCreateLendingProtocol(protocolData);
  let assetPriceUSD = getAssetPriceInUSDC(
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
    event.params.user
  );
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  // This Event handler disables a reserve/market being used as collateral
  _handleReserveUsedAsCollateralDisabled(
    event.params.reserve,
    event.params.user
  );
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

///////////////////
///// Helpers /////
///////////////////

function getAssetPriceInUSDC(
  tokenAddress: Address,
  priceOracle: Address
): BigDecimal {
  let oracle = IPriceOracleGetter.bind(priceOracle);
  let oracleResult = readValue<BigInt>(
    oracle.try_getAssetPrice(tokenAddress),
    BIGINT_ZERO
  );

  // if the result is zero or less, try the fallback oracle
  if (!oracleResult.gt(BIGINT_ZERO)) {
    let tryFallback = oracle.try_getFallbackOracle();
    if (tryFallback) {
      let fallbackOracle = IPriceOracleGetter.bind(tryFallback.value);
      oracleResult = readValue<BigInt>(
        fallbackOracle.try_getAssetPrice(tokenAddress),
        BIGINT_ZERO
      );
    }
  }

  // Mainnet Oracles return the price in eth, must convert to USD through the following method
  if (equalsIgnoreCase(dataSource.network(), Network.MAINNET)) {
    let priceUSDCInEth = readValue<BigInt>(
      oracle.try_getAssetPrice(Address.fromString(USDC_TOKEN_ADDRESS)),
      BIGINT_ZERO
    );

    return oracleResult.toBigDecimal().div(priceUSDCInEth.toBigDecimal());
  }

  // Avalanche Oracle return the price offset by 8 decimals
  if (equalsIgnoreCase(dataSource.network(), Network.AVALANCHE)) {
    return oracleResult.toBigDecimal().div(exponentToBigDecimal(AAVE_DECIMALS));
  }

  // otherwise return the output of the price oracle
  let inputToken = getOrCreateToken(tokenAddress);
  return oracleResult
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));
}
