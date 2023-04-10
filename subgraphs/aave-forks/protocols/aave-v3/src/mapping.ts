import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  DataSourceContext,
  log,
  ethereum,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  PriceOracleUpdated,
  ProxyCreated,
} from "../../../generated/templates/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  AAVE_DECIMALS,
  getNetworkSpecificConstant,
  POOL_ADDRESSES_PROVIDER_ID_KEY,
  Protocol,
  PROTOCOL_ID_KEY,
  IavsTokenType,
  USDC_POS_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS,
} from "./constants";
import {
  CollateralConfigurationChanged,
  ReserveFactorChanged,
  ReserveActive,
  ReserveBorrowing,
  ReserveFrozen,
  ReserveInitialized,
  ReservePaused,
} from "../../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator";
import {
  Borrow,
  LendingPool as LendingPoolContract,
  LiquidationCall,
  Repay,
  ReserveDataUpdated,
  ReserveUsedAsCollateralDisabled,
  ReserveUsedAsCollateralEnabled,
  Supply,
  Withdraw,
} from "../../../generated/templates/LendingPool/LendingPool";
import {
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
  _handleTransfer,
  _handleWithdraw,
} from "../../../src/mapping";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  equalsIgnoreCase,
  exponentToBigDecimal,
  InterestRateType,
  INT_TWO,
  Network,
  PositionSide,
  readValue,
  RewardTokenType,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { Market, RewardToken, Token } from "../../../generated/schema";
import {
  AddressesProviderRegistered,
  PoolAddressesProviderRegistry,
} from "../../../generated/PoolAddressesProviderRegistry/PoolAddressesProviderRegistry";
import { AssetConfigUpdated } from "../../../generated/RewardsController/RewardsController";
import { Transfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as StableTransfer } from "../../../generated/templates/StableDebtToken/StableDebtToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";
import {
  LendingPool as LendingPoolTemplate,
  LendingPoolAddressesProvider,
  LendingPoolConfigurator,
} from "../../../generated/templates";
import { IPriceOracleGetter } from "../../../generated/LendingPool/IPriceOracleGetter";
import { AaveOracle } from "../../../generated/LendingPool/AaveOracle";
import {
  DataManager,
  ProtocolData,
  RewardData,
} from "../../../src/sdk/manager";
import {
  CollateralizationType,
  LendingType,
  PermissionType,
  RiskType,
} from "../../../src/sdk/constants";
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

// PoolAddressesProviderRegistry
export function handleAddressesProviderRegistered(
  event: AddressesProviderRegistered
): void {
  const poolAddressesProviderRegistry = PoolAddressesProviderRegistry.bind(
    event.address
  );
  if (poolAddressesProviderRegistry.getAddressesProvidersList().length > 1) {
    // TODO: add support for additional pools, when it becomes necessary
    log.error("Additional pool address providers not supported", []);
    return;
  }

  const context = new DataSourceContext();
  context.setString(PROTOCOL_ID_KEY, dataSource.address().toHexString());
  LendingPoolAddressesProvider.createWithContext(
    event.params.addressesProvider,
    context
  );
}

///////////////////////////////////////////////
///// PoolAddressProvider Handlers /////
///////////////////////////////////////////////r
export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  _handlePriceOracleUpdated(event.params.newAddress, protocolData);
}

export function handleProxyCreated(event: ProxyCreated): void {
  const context = dataSource.context();
  context.setString(
    POOL_ADDRESSES_PROVIDER_ID_KEY,
    event.address.toHexString()
  );
  const id = event.params.id.toString();
  if ("POOL" == id) {
    LendingPoolTemplate.createWithContext(event.params.proxyAddress, context);
  } else if ("POOL_CONFIGURATOR" == id) {
    LendingPoolConfigurator.createWithContext(
      event.params.proxyAddress,
      context
    );
  }
}

///////////////////////////////////////////////
///// RewardController Handlers /////
///////////////////////////////////////////////
export function handleAssetConfigUpdated(event: AssetConfigUpdated): void {
  const assetAddress = event.params.asset;
  const assetToken = Token.load(assetAddress);
  if (!assetToken || !assetToken._market || !assetToken._iavsTokenType) {
    log.error(
      "[handleAssetConfigUpdated]Failed to find token {} or assetToken._market/assetToken._iavsTokenType is null",
      [assetAddress.toHexString()]
    );
    return;
  }

  const marketId = Address.fromBytes(assetToken._market!);
  const market = Market.load(marketId);
  if (!market) {
    log.error("[handleAssetConfigUpdated]Market {} not found", [
      marketId.toHexString(),
    ]);
    return;
  }

  const manager = new DataManager(
    marketId,
    market.inputToken,
    event,
    protocolData
  );

  // There can be more than one reward tokens for a side,
  // e.g. one reward token for variable borrowing
  // and another for stable borrowing
  let rewardTokenType: string;
  let interestRateType: string;
  if (
    assetToken._iavsTokenType &&
    assetToken._iavsTokenType! == IavsTokenType.ATOKEN
  ) {
    rewardTokenType = RewardTokenType.DEPOSIT;
    interestRateType = InterestRateType.VARIABLE;
  } else if (
    assetToken._iavsTokenType &&
    assetToken._iavsTokenType! == IavsTokenType.STOKEN
  ) {
    rewardTokenType = RewardTokenType.BORROW;
    interestRateType = InterestRateType.STABLE;
  } else if (
    assetToken._iavsTokenType &&
    assetToken._iavsTokenType! == IavsTokenType.VTOKEN
  ) {
    rewardTokenType = RewardTokenType.BORROW;
    interestRateType = InterestRateType.VARIABLE;
  } else {
    log.error("Failed to update rewards, could not find asset: {}", [
      assetAddress.toHexString(),
    ]);
    return;
  }

  const tokenManager = new TokenManager(event.params.reward, event);
  const rewardToken = tokenManager.getOrCreateRewardToken(
    rewardTokenType,
    interestRateType
  );
  rewardToken._distributionEnd = event.params.newDistributionEnd;
  rewardToken.save();

  const emission = event.params.newEmission.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );

  if (market.oracle) {
    const rewardTokenPriceUSD = getAssetPriceInUSDC(
      Address.fromBytes(rewardToken.token),
      Address.fromBytes(market.oracle!),
      event.block.number
    );
    if (rewardTokenPriceUSD.gt(BIGDECIMAL_ZERO)) {
      tokenManager.updatePrice(rewardTokenPriceUSD);
    }
  }
  const emissionUSD = tokenManager.getAmountUSD(emission);
  const rewardData = new RewardData(rewardToken, emission, emissionUSD);
  manager.updateRewards(rewardData);
}

///////////////////////////////////////////////
///// PoolConfigurator Handlers /////
///////////////////////////////////////////////
export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market entity from reserve creation event
  // Attempt to load or create the market implementation

  _handleReserveInitialized(
    event,
    event.params.asset, //input Token/underlying asset
    event.params.aToken, //output Token
    event.params.variableDebtToken,
    protocolData,
    event.params.stableDebtToken
  );

  const marketId = event.params.aToken;
  const assetTokenManager = new TokenManager(event.params.asset, event);
  const assetToken = assetTokenManager.getToken();

  // map tokens to market
  assetToken._market = marketId; //this is the market id
  assetToken._iavsTokenType = IavsTokenType.INPUTTOKEN;
  assetToken.save();

  const aTokenManager = new TokenManager(event.params.aToken, event);
  const aToken = aTokenManager.getToken();
  aToken._market = marketId;
  aToken._iavsTokenType = IavsTokenType.ATOKEN;
  aToken.save();

  const vTokenManager = new TokenManager(event.params.variableDebtToken, event);
  const vToken = vTokenManager.getToken();
  vToken._market = marketId;
  vToken._iavsTokenType = IavsTokenType.VTOKEN;
  vToken.save();

  const sTokenManager = new TokenManager(event.params.stableDebtToken, event);
  const sToken = sTokenManager.getToken();
  sToken._market = marketId;
  sToken._iavsTokenType = IavsTokenType.STOKEN;
  sToken.save();
}

export function handleCollateralConfigurationChanged(
  event: CollateralConfigurationChanged
): void {
  const marketId = getMarketIdFromToken(event.params.asset);
  if (!marketId) {
    log.error(
      "[handleCollateralConfigurationChanged]Failed to find market for asset {}",
      [event.params.asset.toHexString()]
    );
    return;
  }
  _handleCollateralConfigurationChanged(
    marketId,
    event.params.liquidationBonus,
    event.params.liquidationThreshold,
    event.params.ltv
  );
}

export function handleReserveActive(event: ReserveActive): void {
  const marketId = getMarketIdFromToken(event.params.asset);
  if (!marketId) {
    log.error(
      "[handleCollateralConfigurationChanged]Failed to find market for asset {}",
      [event.params.asset.toHexString()]
    );
    return;
  }
  _handleReserveActivated(marketId);
}

export function handleReserveBorrowing(event: ReserveBorrowing): void {
  const marketId = getMarketIdFromToken(event.params.asset);
  if (!marketId) {
    log.error("[handleReserveBorrowing]Failed to find market for asset {}", [
      event.params.asset.toHexString(),
    ]);
    return;
  }
  if (event.params.enabled) {
    _handleBorrowingEnabledOnReserve(marketId);
  } else {
    _handleBorrowingDisabledOnReserve(marketId);
  }
}

export function handleReserveFrozen(event: ReserveFrozen): void {
  const marketId = getMarketIdFromToken(event.params.asset);
  if (!marketId) {
    log.error("[handleReserveFrozen]Failed to find market for asset {}", [
      event.params.asset.toHexString(),
    ]);
    return;
  }
  _handleReserveDeactivated(marketId);
}

export function handleReservePaused(event: ReservePaused): void {
  const marketId = getMarketIdFromToken(event.params.asset);
  if (!marketId) {
    log.error("[handleReservePaused]Failed to find market for asset {}", [
      event.params.asset.toHexString(),
    ]);
    return;
  }
  _handleReserveDeactivated(marketId);
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  const marketId = getMarketIdFromToken(event.params.asset);
  if (!marketId) {
    log.error(
      "[handleReserveFactorChanged]Failed to find market for asset {}",
      [event.params.asset.toHexString()]
    );
    return;
  }
  _handleReserveFactorChanged(marketId, event.params.newReserveFactor);
}

/////////////////////////////////
///// Lending Pool Handlers /////
/////////////////////////////////
export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  const marketId = getMarketIdFromToken(event.params.reserve);
  if (!marketId || !Market.load(marketId)) {
    log.warning("[handleReserveDataUpdated]Market not found for reserve {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  const market = Market.load(marketId);
  if (!market) {
    log.warning("[handleReserveDataUpdated]market {} does not exist", [
      marketId.toHexString(),
    ]);
    return;
  }
  const assetPriceUSD = getAssetPriceInUSDC(
    Address.fromBytes(market.inputToken),
    Address.fromBytes(market.oracle!),
    event.block.number
  );

  _handleReserveDataUpdated(
    event,
    event.params.liquidityRate,
    event.params.liquidityIndex,
    event.params.variableBorrowRate,
    event.params.stableBorrowRate,
    protocolData,
    marketId,
    assetPriceUSD
  );
}

export function handleReserveUsedAsCollateralEnabled(
  event: ReserveUsedAsCollateralEnabled
): void {
  const marketId = getMarketIdFromToken(event.params.reserve);
  if (!marketId) {
    log.error(
      "[handleReserveUsedAsCollateralEnabled]Failed to find market for asset {}",
      [event.params.reserve.toHexString()]
    );
    return;
  }
  // This Event handler enables a reserve/market to be used as collateral
  _handleReserveUsedAsCollateralEnabled(marketId, event.params.user);
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  const marketId = getMarketIdFromToken(event.params.reserve);
  if (!marketId) {
    log.error(
      "[handleReserveUsedAsCollateralDisabled]Failed to find market for asset {}",
      [event.params.reserve.toHexString()]
    );
    return;
  }
  // This Event handler disables a reserve/market being used as collateral
  _handleReserveUsedAsCollateralDisabled(marketId, event.params.user);
}

export function handleDeposit(event: Supply): void {
  const marketId = getMarketIdFromToken(event.params.reserve);
  if (!marketId) {
    log.error("[handleDeposit]Failed to find market for asset {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }
  _handleDeposit(
    event,
    event.params.amount,
    marketId,
    protocolData,
    event.params.onBehalfOf
  );
}

export function handleWithdraw(event: Withdraw): void {
  const marketId = getMarketIdFromToken(event.params.reserve);
  if (!marketId) {
    log.error("[handleWithdraw]Failed to find market for asset {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }
  _handleWithdraw(
    event,
    event.params.amount,
    marketId,
    protocolData,
    event.params.user
  );
}

export function handleBorrow(event: Borrow): void {
  const marketId = getMarketIdFromToken(event.params.reserve);
  if (!marketId) {
    log.error("[handleBorrow]Failed to find market for asset {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  setReserveFactor(marketId, event.address, event.params.reserve);

  _handleBorrow(
    event,
    event.params.amount,
    marketId,
    protocolData,
    event.params.onBehalfOf
  );
}

export function handleRepay(event: Repay): void {
  const marketId = getMarketIdFromToken(event.params.reserve);
  if (!marketId) {
    log.error("[handleRepay]Failed to find market for asset {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }
  _handleRepay(
    event,
    event.params.amount,
    marketId,
    protocolData,
    event.params.user
  );
}

export function handleLiquidationCall(event: LiquidationCall): void {
  const collateralMarketId = getMarketIdFromToken(event.params.collateralAsset);
  if (!collateralMarketId) {
    log.error("[handleLiquidationCall]Failed to find market for asset {}", [
      event.params.collateralAsset.toHexString(),
    ]);
    return;
  }

  const debtMarketId = getMarketIdFromToken(event.params.debtAsset);
  if (!debtMarketId) {
    log.error("[handleLiquidationCall]Failed to find market for asset {}", [
      event.params.debtAsset.toHexString(),
    ]);
    return;
  }

  _handleLiquidate(
    event,
    event.params.liquidatedCollateralAmount,
    collateralMarketId,
    protocolData,
    event.params.liquidator,
    event.params.user,
    debtMarketId,
    event.params.debtToCover
  );
}

/////////////////////////
//// Transfer Events ////
/////////////////////////

export function handleCollateralTransfer(event: CollateralTransfer): void {
  _handleTransfer(
    event,
    protocolData,
    PositionSide.LENDER,
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
function getAssetPriceInUSDC(
  tokenAddress: Address,
  priceOracle: Address,
  blockNumber: BigInt
): BigDecimal {
  const oracle = AaveOracle.bind(priceOracle);
  const priceDecimals = readValue<BigInt>(
    oracle.try_BASE_CURRENCY_UNIT(),
    BigInt.fromI32(10).pow(AAVE_DECIMALS as u8)
  ).toBigDecimal();

  const oracleResult = readValue<BigInt>(
    oracle.try_getAssetPrice(tokenAddress),
    BIGINT_ZERO
  );

  if (oracleResult.gt(BIGINT_ZERO)) {
    return oracleResult.toBigDecimal().div(priceDecimals);
  }

  //fall back to v2 price oracle
  return getAssetPriceFallback(tokenAddress, priceOracle, blockNumber);
}

function getAssetPriceFallback(
  tokenAddress: Address,
  priceOracle: Address,
  blockNumber: BigInt
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

  // Mainnet Oracles return the price in eth, must convert to USD through the following method
  if (equalsIgnoreCase(dataSource.network(), Network.MAINNET)) {
    const priceUSDCInEth = readValue<BigInt>(
      oracle.try_getAssetPrice(Address.fromString(USDC_TOKEN_ADDRESS)),
      BIGINT_ZERO
    );

    if (priceUSDCInEth.equals(BIGINT_ZERO)) {
      return BIGDECIMAL_ZERO;
    } else {
      return oracleResult.toBigDecimal().div(priceUSDCInEth.toBigDecimal());
    }
  }

  // Polygon Oracle returns price in ETH, must convert to USD with following method
  if (equalsIgnoreCase(dataSource.network(), Network.MATIC)) {
    // there was misprice at block 15783457 that affects 2 transactions
    // we will override the price at this block to $1.55615781978
    // this price is derived using the following method on that block using historical contract calls
    // The contract calls return 634291527055835 / 407601027988722 = our new price
    if (blockNumber.equals(BigInt.fromI32(15783457))) {
      return BigDecimal.fromString("1.55615781978");
    }

    const priceUSDCInEth = readValue<BigInt>(
      oracle.try_getAssetPrice(Address.fromString(USDC_POS_TOKEN_ADDRESS)),
      BIGINT_ZERO
    );

    if (priceUSDCInEth.equals(BIGINT_ZERO)) {
      return BIGDECIMAL_ZERO;
    } else {
      // USD price = token oracle result / USDC POS oracle result
      return oracleResult.toBigDecimal().div(priceUSDCInEth.toBigDecimal());
    }
  }
  return oracleResult.toBigDecimal().div(exponentToBigDecimal(AAVE_DECIMALS));
}

function getMarketIdFromToken(tokenAddress: Address): Address | null {
  const token = Token.load(tokenAddress);
  if (!token || !token._market) {
    log.error(
      "[getMarketIdFromToken]token {} not exist or token._market = null",
      [tokenAddress.toHexString()]
    );
    return null;
  }
  const marketId = Address.fromBytes(token._market!);
  return marketId;
}

function setReserveFactor(
  marketId: Address,
  poolAddress: Address,
  reserve: Address
): void {
  // Set reserveFactor if not set, as setReserveFactor may be never called
  const market = Market.load(marketId);
  if (!market) {
    log.warning("[setReserveFactor]market {} does not exist", [
      marketId.toHexString(),
    ]);
    return;
  }

  if (!market.reserveFactor || market.reserveFactor!.equals(BIGDECIMAL_ZERO)) {
    // see https://github.com/aave/aave-v3-core/blob/1e46f1cbb7ace08995cb4c8fa4e4ece96a243be3/contracts/protocol/libraries/configuration/ReserveConfiguration.sol#L377
    // for how to decode configuration data to get reserve factor
    const reserveFactorMask =
      "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000FFFFFFFFFFFFFFFF";
    const reserveFactorStartBitPosition = 64 as u8;

    const maskArray = new Uint8Array(32);
    maskArray.set(Bytes.fromHexString(reserveFactorMask));
    // BITWISE NOT
    for (let i = 0; i < maskArray.length; i++) {
      maskArray[i] = ~maskArray[i];
    }
    // reverse for little endian
    const reserveFactorMaskBigInt = BigInt.fromUnsignedBytes(
      Bytes.fromUint8Array(maskArray.reverse())
    );

    const pool = LendingPoolContract.bind(poolAddress);
    const poolConfigData = pool.getConfiguration(reserve).data;
    const reserveFactor = poolConfigData
      .bitAnd(reserveFactorMaskBigInt)
      .rightShift(reserveFactorStartBitPosition);

    log.info("[setReserveFactor]reserveFactor set to {}", [
      reserveFactor.toString(),
    ]);
    market.reserveFactor = reserveFactor
      .toBigDecimal()
      .div(exponentToBigDecimal(INT_TWO));
    market.save();
  }
}
