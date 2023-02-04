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
  TokenType,
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
  _handleTransfer,
  _handleWithdraw,
} from "../../../src/mapping";
import {
  getOrCreateLendingProtocol,
  getOrCreateMarket,
  getOrCreateToken,
} from "../../../src/helpers";
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

function getProtocolData(): ProtocolData {
  const constants = getNetworkSpecificConstant();
  return new ProtocolData(
    constants.protocolAddress.toHexString(),
    Protocol.NAME,
    Protocol.SLUG,
    constants.network
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
  const assetAddress = event.params.asset.toHexString();
  const assetToken = Token.load(assetAddress);
  if (!assetToken || !assetToken._market || !assetToken._type) {
    log.error(
      "[handleAssetConfigUpdated]Failed to find token {} or assetToken._market/assetToken._type is null",
      [assetAddress]
    );
    return;
  }

  const marketId = Address.fromString(assetToken._market!);
  const market = Market.load(marketId.toHexString());
  if (!market) {
    log.error("[handleAssetConfigUpdated]Market {} not found", [
      marketId.toHexString(),
    ]);
    return;
  }

  // There can be more than one reward tokens for a side,
  // e.g. one reward token for variable borrowing
  // and another for stable borrowing
  let rewardTokenType: string;
  let interestRateType: string;
  if (assetToken._type! == TokenType.ATOKEN) {
    rewardTokenType = RewardTokenType.DEPOSIT;
    interestRateType = InterestRateType.VARIABLE;
  } else if (assetToken._type! == TokenType.STOKEN) {
    rewardTokenType = RewardTokenType.BORROW;
    interestRateType = InterestRateType.STABLE;
  } else if (assetToken._type! == TokenType.VTOKEN) {
    rewardTokenType = RewardTokenType.BORROW;
    interestRateType = InterestRateType.VARIABLE;
  } else {
    log.error("Failed to update rewards, could not find asset: {}", [
      assetAddress,
    ]);
    return;
  }

  const rewardToken = getOrCreateRewardToken(
    event.params.reward,
    rewardTokenType,
    interestRateType,
    event.params.newDistributionEnd
  );

  updateMarketRewards(event, market, rewardToken, event.params.newEmission);
}

///////////////////////////////////////////////
///// PoolConfigurator Handlers /////
///////////////////////////////////////////////
export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market entity from reserve creation event
  // Attempt to load or create the market implementation

  _handleReserveInitialized(
    event,
    event.params.aToken, // marketID & input Token (underlying asset)
    event.params.aToken,
    event.params.variableDebtToken,
    protocolData,
    event.params.stableDebtToken
  );

  const assetToken = getOrCreateToken(event.params.asset);
  const market = getOrCreateMarket(event.params.aToken, protocolData);
  market.inputToken = assetToken.id;
  market.save();

  // map tokens to market
  assetToken._market = market.id;
  assetToken._type = TokenType.INPUTTOKEN;
  assetToken.save();

  const aToken = getOrCreateToken(event.params.aToken);
  aToken._market = market.id;
  aToken._type = TokenType.ATOKEN;
  aToken.save();

  const vToken = getOrCreateToken(event.params.variableDebtToken);
  vToken._market = market.id;
  vToken._type = TokenType.VTOKEN;
  vToken.save();

  const sToken = getOrCreateToken(event.params.stableDebtToken);
  sToken._market = market.id;
  sToken._type = TokenType.STOKEN;
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
    event.params.ltv,
    protocolData
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
  _handleReserveActivated(marketId, protocolData);
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
    _handleBorrowingEnabledOnReserve(marketId, protocolData);
  } else {
    _handleBorrowingDisabledOnReserve(marketId, protocolData);
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
  _handleReserveDeactivated(marketId, protocolData);
}

export function handleReservePaused(event: ReservePaused): void {
  const marketId = getMarketIdFromToken(event.params.asset);
  if (!marketId) {
    log.error("[handleReservePaused]Failed to find market for asset {}", [
      event.params.asset.toHexString(),
    ]);
    return;
  }
  _handleReserveDeactivated(marketId, protocolData);
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
  _handleReserveFactorChanged(
    marketId,
    event.params.newReserveFactor,
    protocolData
  );
}

/////////////////////////////////
///// Lending Pool Handlers /////
/////////////////////////////////
export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  const protocol = getOrCreateLendingProtocol(protocolData);
  const marketId = getMarketIdFromToken(event.params.reserve);
  if (!marketId || !Market.load(marketId.toHexString())) {
    log.warning("[handleReserveDataUpdated]Market not found for reserve {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  const market = Market.load(marketId.toHexString())!;
  const assetPriceUSD = getAssetPriceInUSDC(
    Address.fromString(market.inputToken),
    Address.fromString(protocol._priceOracle),
    event.block.number
  );

  // TODO: better to pass market and protocol
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
  _handleReserveUsedAsCollateralEnabled(
    marketId,
    event.params.user,
    protocolData
  );
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
  _handleReserveUsedAsCollateralDisabled(
    marketId,
    event.params.user,
    protocolData
  );
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
    event.params.from
  );
}

export function handleVariableTransfer(event: VariableTransfer): void {
  _handleTransfer(
    event,
    protocolData,
    PositionSide.BORROWER,
    event.params.to,
    event.params.from
  );
}

export function handleStableTransfer(event: StableTransfer): void {
  _handleTransfer(
    event,
    protocolData,
    PositionSide.BORROWER,
    event.params.to,
    event.params.from
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

function getMarketIdFromToken(token: Address): Address | null {
  const tokenAddress = token.toHexString();
  const tokenEntity = Token.load(tokenAddress);
  if (!tokenEntity || !tokenEntity._market) {
    log.error(
      "[getMarketIdFromToken]token {} not exist or token._market = null",
      [tokenAddress]
    );
    return null;
  }
  const marketId = Address.fromString(tokenEntity._market!);
  return marketId;
}

function getOrCreateRewardToken(
  tokenAddress: Address,
  rewardTokenType: string,
  interestRateType: string,
  distributionEnd: BigInt
): RewardToken {
  const token = getOrCreateToken(tokenAddress);
  // deposit-variable-0x123, borrow-stable-0x123, borrow-variable-0x123
  const id = `${rewardTokenType}-${interestRateType}-${token.id}`;

  let rewardToken = RewardToken.load(id);
  if (!rewardToken) {
    rewardToken = new RewardToken(id);
    rewardToken.token = token.id;
    rewardToken.type = rewardTokenType;
  }
  rewardToken._distributionEnd = distributionEnd;
  rewardToken.save();

  return rewardToken;
}

export function updateMarketRewards(
  event: ethereum.Event,
  market: Market,
  rewardToken: RewardToken,
  emissionRate: BigInt
): void {
  let rewardTokens = market.rewardTokens;
  let rewardTokenEmissions = market.rewardTokenEmissionsAmount;
  let rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  if (rewardTokens == null) {
    rewardTokens = [];
    rewardTokenEmissions = [];
    rewardTokenEmissionsUSD = [];
  }

  let rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  if (rewardTokenIndex == -1) {
    rewardTokenIndex = rewardTokens.push(rewardToken.id) - 1;
    rewardTokenEmissions!.push(BIGINT_ZERO);
    rewardTokenEmissionsUSD!.push(BIGDECIMAL_ZERO);
  }
  rewardTokenEmissions![rewardTokenIndex] = emissionRate.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = rewardTokenEmissions;
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  market.save();

  sortRewardTokens(market);
  updateMarketRewardEmissions(market, event);
}

function updateMarketRewardEmissions(
  market: Market,
  event: ethereum.Event
): void {
  if (market.rewardTokens == null) {
    return;
  }

  const protocol = getOrCreateLendingProtocol(protocolData);
  const rewardTokens = market.rewardTokens!;
  const rewardEmissions = market.rewardTokenEmissionsAmount!;
  const rewardEmissionsUSD = market.rewardTokenEmissionsUSD!;
  for (let i = 0; i < rewardTokens.length; i++) {
    const rewardToken = RewardToken.load(rewardTokens[i])!;
    if (event.block.timestamp.gt(rewardToken._distributionEnd!)) {
      rewardEmissions[i] = BIGINT_ZERO;
      rewardEmissionsUSD[i] = BIGDECIMAL_ZERO;
    } else {
      const token = Token.load(rewardToken.token)!;
      let rewardTokenPriceUSD = token.lastPriceUSD;
      rewardTokenPriceUSD = getAssetPriceInUSDC(
        Address.fromString(token.id),
        Address.fromString(protocol._priceOracle),
        event.block.number
      );

      rewardEmissionsUSD[i] = rewardEmissions[i]
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(rewardTokenPriceUSD);
    }
  }
  market.rewardTokenEmissionsAmount = rewardEmissions;
  market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
  market.save();
}

function sortRewardTokens(market: Market): void {
  if (market.rewardTokens!.length <= 1) {
    return;
  }

  const tokens = market.rewardTokens;
  const emissions = market.rewardTokenEmissionsAmount;
  const emissionsUSD = market.rewardTokenEmissionsUSD;
  multiArraySort(tokens!, emissions!, emissionsUSD!);

  market.rewardTokens = tokens;
  market.rewardTokenEmissionsAmount = emissions;
  market.rewardTokenEmissionsUSD = emissionsUSD;
  market.save();
}

function multiArraySort(
  ref: Array<string>,
  arr1: Array<BigInt>,
  arr2: Array<BigDecimal>
): void {
  if (ref.length != arr1.length || ref.length != arr2.length) {
    // cannot sort
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < ref.length; i++) {
    sorter[i] = [ref[i], arr1[i].toString(), arr2[i].toString()];
  }

  sorter.sort(function (a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    ref[i] = sorter[i][0];
    arr1[i] = BigInt.fromString(sorter[i][1]);
    arr2[i] = BigDecimal.fromString(sorter[i][2]);
  }
}

function setReserveFactor(
  marketId: Address,
  poolAddress: Address,
  reserve: Address
): void {
  // Set reserveFactor if not set, as setReserveFactor may be never called
  const market = getOrCreateMarket(marketId, protocolData);
  if (market._reserveFactor.equals(BIGDECIMAL_ZERO)) {
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
    market._reserveFactor = reserveFactor
      .toBigDecimal()
      .div(exponentToBigDecimal(INT_TWO));
    market.save();
  }
}
