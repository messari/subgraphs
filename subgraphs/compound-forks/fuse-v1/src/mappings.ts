// fuse v1 handlers
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  ProtocolData,
  _getOrCreateProtocol,
  _handleNewReserveFactor,
  _handleNewCollateralFactor,
  _handleNewPriceOracle,
  _handleMarketListed,
  MarketListedData,
  TokenData,
  _handleNewLiquidationIncentive,
  _handleMint,
  _handleRedeem,
  _handleBorrow,
  _handleRepayBorrow,
  _handleLiquidateBorrow,
  UpdateMarketData,
  _handleAccrueInterest,
  getOrElse,
  _handleActionPaused,
  snapshotMarket,
  updateProtocol,
  snapshotFinancials,
  setSupplyInterestRate,
  convertRatePerUnitToAPY,
  setBorrowInterestRate,
  getOrCreateMarketDailySnapshot,
} from "../../src/mapping";
import { PoolRegistered } from "../generated/FusePoolDirectory/FusePoolDirectory";
import {
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  FACTORY_CONTRACT,
  METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_NETWORK,
  PROTOCOL_SLUG,
  SCHEMA_VERSION,
  SUBGRAPH_VERSION,
  ZERO_ADDRESS,
} from "./constants";
import {
  ActionPaused1,
  Comptroller,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from "../../generated/Comptroller/Comptroller";
import {
  AccrueInterest,
  Borrow,
  LiquidateBorrow,
  Mint,
  NewReserveFactor,
  Redeem,
  RepayBorrow,
} from "../../generated/templates/CToken/CToken";
import {
  NewAdminFee,
  NewFuseFee,
  CToken,
} from "../generated/templates/CToken/CToken";
import {
  Comptroller as ComptrollerTemplate,
  CToken as CTokenTemplate,
} from "../generated/templates";
import { LendingProtocol, Token } from "../../generated/schema";
import { ERC20 } from "../generated/templates/Comptroller/ERC20";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  cTokenDecimals,
  DAYS_PER_YEAR,
  ETHEREUM_BLOCKS_PER_YEAR,
  exponentToBigDecimal,
  InterestRateSide,
  InterestRateType,
  INT_TWO,
  mantissaFactor,
  mantissaFactorBD,
} from "../../src/constants";
import { InterestRate, Market, _FusePool } from "../generated/schema";
import { PriceOracle } from "../generated/templates/CToken/PriceOracle";
import { getUsdPricePerToken } from "./prices";
import {
  getOrCreateCircularBuffer,
  getRewardsPerDay,
  RewardIntervalType,
} from "./rewards";

//////////////////////
//// Fuse Enum(s) ////
//////////////////////

export namespace RariFee {
  export const FUSE_FEE = "FUSE_FEE";
  export const ADMIN_FEE = "ADMIN_FEE";
}

/////////////////////////////////
//// Pool Directory Handlers ////
/////////////////////////////////

// creates a new LendingProtocol for a new fuse "pool"
export function handlePoolRegistered(event: PoolRegistered): void {
  // create Comptroller template
  ComptrollerTemplate.create(event.params.pool.comptroller);

  let troller = Comptroller.bind(event.params.pool.comptroller);

  // populate pool data
  let poolData = new ProtocolData(
    Address.fromString(FACTORY_CONTRACT),
    PROTOCOL_NAME,
    PROTOCOL_SLUG,
    SCHEMA_VERSION,
    SUBGRAPH_VERSION,
    METHODOLOGY_VERSION,
    PROTOCOL_NETWORK,
    troller.try_liquidationIncentiveMantissa(),
    troller.try_oracle()
  );

  // only needed to create the new pool (ie, pool's Comptroller implementation)
  _getOrCreateProtocol(poolData);

  // create helper fuse pool entity
  let pool = new _FusePool(event.params.pool.comptroller.toHexString());
  pool.poolNumber = event.params.index.toString();
  pool.marketIDs = [];

  // set price oracle for pool entity
  let tryOracle = troller.try_oracle();
  if (tryOracle.reverted) {
    pool.priceOracle = "";
  } else {
    pool.priceOracle = tryOracle.value.toHexString();
  }

  // set liquidation incentive for pool entity
  let tryLiquidationIncentive = troller.try_liquidationIncentiveMantissa();
  if (tryLiquidationIncentive.reverted) {
    log.warning(
      "[getOrCreateProtocol] liquidationIncentiveMantissaResult reverted",
      []
    );
  } else {
    pool.liquidationIncentive = tryLiquidationIncentive.value
      .toBigDecimal()
      .div(mantissaFactorBD)
      .times(BIGDECIMAL_HUNDRED);
  }
  pool.save();
}

//////////////////////////////
//// Comptroller Handlers ////
//////////////////////////////

// Note: these are pool level functions in fuse, but each pool is a Comptroller impl
// Source: https://docs.rari.capital/fuse

// add a new market
export function handleMarketListed(event: MarketListed): void {
  let protocol = LendingProtocol.load(FACTORY_CONTRACT);
  if (!protocol) {
    // best effort
    log.warning("[handleMarketListed] Protocol not found: {}", [
      FACTORY_CONTRACT,
    ]);
    return;
  }

  // get/create ctoken
  CTokenTemplate.create(event.params.cToken);
  let cTokenContract = CToken.bind(event.params.cToken);
  let cToken = new TokenData(
    event.params.cToken,
    getOrElse(cTokenContract.try_name(), "UNKNOWN"),
    getOrElse(cTokenContract.try_symbol(), "UNKNOWN"),
    getOrElse(cTokenContract.try_decimals(), -1)
  );

  // get/create underlying token
  let underlyingAddress = getOrElse(
    cTokenContract.try_underlying(),
    Address.fromString(ZERO_ADDRESS)
  );

  let underlyingToken: TokenData;
  if (underlyingAddress == Address.fromString(ZERO_ADDRESS)) {
    // this is ETH
    underlyingToken = new TokenData(
      Address.fromString(ETH_ADDRESS),
      ETH_NAME,
      ETH_SYMBOL,
      mantissaFactor
    );
  } else {
    let underlyingContract = ERC20.bind(underlyingAddress);
    underlyingToken = new TokenData(
      underlyingAddress,
      getOrElse(underlyingContract.try_name(), "UNKNOWN"),
      getOrElse(underlyingContract.try_symbol(), "UNKOWN"),
      getOrElse(underlyingContract.try_decimals(), -1)
    );
  }

  // populatet market data
  let marketData = new MarketListedData(
    protocol,
    underlyingToken,
    cToken,
    getOrElse(cTokenContract.try_reserveFactorMantissa(), BIGINT_ZERO)
  );

  _handleMarketListed(marketData, event);

  // fuse-specific: add fuseFees and adminFees

  // get fuse fee - rari collects this (ie, protocol revenue)
  let tryFuseFeeMantissa = cTokenContract.try_fuseFeeMantissa();
  updateOrCreateRariFee(
    tryFuseFeeMantissa.reverted ? BIGINT_ZERO : tryFuseFeeMantissa.value,
    RariFee.FUSE_FEE,
    event.params.cToken.toHexString()
  );

  // get admin fee - pool owners (admin) collect this (ie, protocol revenue)
  let tryAdminFeeMantissa = cTokenContract.try_adminFeeMantissa();
  updateOrCreateRariFee(
    tryAdminFeeMantissa.reverted ? BIGINT_ZERO : tryAdminFeeMantissa.value,
    RariFee.ADMIN_FEE,
    event.params.cToken.toHexString()
  );

  // add market ID to the fuse pool
  let pool = _FusePool.load(event.address.toHexString());
  if (!pool) {
    // best effort
    log.warning("[handleMarketListed] FusePool not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }
  let markets = pool.marketIDs;
  markets.push(event.params.cToken.toHexString());
  pool.marketIDs = markets;
  pool.save();

  // set liquidation incentive (fuse-specific)
  let market = Market.load(event.params.cToken.toHexString())!;
  market.liquidationPenalty = pool.liquidationIncentive;
  market.save();
}

// update a given markets collateral factor
export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  _handleNewCollateralFactor(event);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  let liquidationIncentive = event.params.newLiquidationIncentiveMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .minus(BIGDECIMAL_ONE)
    .times(BIGDECIMAL_HUNDRED);
  let pool = _FusePool.load(event.address.toHexString());
  if (!pool) {
    // best effort
    log.warning("[handleNewLiquidationIncentive] FusePool not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }
  pool.liquidationIncentive = liquidationIncentive;
  pool.save();

  for (let i = 0; i < pool.marketIDs.length; i++) {
    let market = Market.load(pool.marketIDs[i]);
    if (!market) {
      log.warning("[handleNewLiquidationIncentive] Market not found: {}", [
        pool.marketIDs[i],
      ]);
      // best effort
      continue;
    }
    market.liquidationPenalty = liquidationIncentive;
    market.save();
  }
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let pool = _FusePool.load(event.address.toHexString());
  if (!pool) {
    // best effort
    log.warning("[handleNewPriceOracle] FusePool not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }
  pool.priceOracle = event.params.newPriceOracle.toHexString();
  pool.save();
}

export function handleActionPaused(event: ActionPaused1): void {
  _handleActionPaused(event);
}

/////////////////////////
//// CToken Handlers ////
/////////////////////////

export function handleMint(event: Mint): void {
  _handleMint(Address.fromString(FACTORY_CONTRACT), event);
}

export function handleRedeem(event: Redeem): void {
  _handleRedeem(Address.fromString(FACTORY_CONTRACT), event);
}

export function handleBorrow(event: Borrow): void {
  _handleBorrow(Address.fromString(FACTORY_CONTRACT), event);
}

export function handleRepayBorrow(event: RepayBorrow): void {
  _handleRepayBorrow(Address.fromString(FACTORY_CONTRACT), event);
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  _handleLiquidateBorrow(Address.fromString(FACTORY_CONTRACT), event);
}

export function handleAccrueInterest(event: AccrueInterest): void {
  let marketAddress = event.address;
  // get comptroller address
  let trollerAddr: Address;
  if (
    (trollerAddr = getComptrollerAddress(event)) ==
    Address.fromString(ZERO_ADDRESS)
  ) {
    log.warning("[handleAccrueInterest] Comptroller address not found.", []);
    return;
  }

  let cTokenContract = CToken.bind(marketAddress);
  let pool = _FusePool.load(trollerAddr.toHexString());
  if (!pool) {
    // best effort
    log.warning("[handleAccrueInterest] FusePool not found: {}", [
      trollerAddr.toHexString(),
    ]);
    return;
  }
  let oracleContract = PriceOracle.bind(Address.fromString(pool.priceOracle));

  // get rolling blocks/day count
  getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    BIGDECIMAL_ZERO,
    RewardIntervalType.BLOCK
  );
  let blocksPerDayBD = getOrCreateCircularBuffer().blocksPerDay;
  let blocksPerDayBI = BigInt.fromString(blocksPerDayBD.truncate(0).toString());
  let blocksPerYear: i32;
  if (blocksPerDayBI.isI32()) {
    blocksPerYear = blocksPerDayBI.toI32() * DAYS_PER_YEAR;
  } else {
    blocksPerYear = ETHEREUM_BLOCKS_PER_YEAR;
  }

  let updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    blocksPerYear
  );

  //
  // replacing _handleAccrueInterst() to properly derive assetPrice
  //

  let marketID = event.address.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleAccrueInterest] Market not found: {}", [marketID]);
    return;
  }

  // creates and initializes market snapshots
  snapshotMarket(
    event.address.toHexString(),
    event.block.number,
    event.block.timestamp
  );

  // handles fuse and admin fees (ie, protocol-side)
  updateMarket(
    updateMarketData,
    marketID,
    event.params.interestAccumulated,
    event.params.totalBorrows,
    event.block.number,
    event.block.timestamp
  );
  updateProtocol(Address.fromString(FACTORY_CONTRACT));

  snapshotFinancials(
    Address.fromString(FACTORY_CONTRACT),
    event.block.number,
    event.block.timestamp
  );
}

export function handleNewFuseFee(event: NewFuseFee): void {
  updateOrCreateRariFee(
    event.params.newFuseFeeMantissa,
    RariFee.FUSE_FEE,
    event.address.toHexString()
  );
}

export function handleNewAdminFee(event: NewAdminFee): void {
  updateOrCreateRariFee(
    event.params.newAdminFeeMantissa,
    RariFee.ADMIN_FEE,
    event.address.toHexString()
  );
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  _handleNewReserveFactor(event);
}

/////////////////
//// Helpers ////
/////////////////

function getComptrollerAddress(event: ethereum.Event): Address {
  let cTokenContract = CToken.bind(event.address);
  let tryComptroller = cTokenContract.try_comptroller();

  if (tryComptroller.reverted) {
    // comptroller does not exist
    log.warning(
      "[handleTransaction] Comptroller not found for transaction: {}",
      [event.transaction.hash.toHexString()]
    );
    return Address.fromString(ZERO_ADDRESS);
  }

  return tryComptroller.value;
}

// updates the rate or creates the rari fee (either fuse or admin fee)
function updateOrCreateRariFee(
  rateMantissa: BigInt,
  rariFeeType: string,
  marketID: string
): void {
  let rariFeeId =
    InterestRateSide.BORROWER + "-" + rariFeeType + "-" + marketID;
  let rariFee = InterestRate.load(rariFeeId);

  // calculate fee rate
  let rate = rateMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .times(BIGDECIMAL_HUNDRED);

  if (!rariFee) {
    rariFee = new InterestRate(rariFeeId);
    rariFee.side = InterestRateSide.BORROWER;
    rariFee.type = InterestRateType.STABLE;

    // add to market rates array
    let market = Market.load(marketID);
    if (!market) {
      // best effort
      return;
    }
    let rates = market.rates;
    rates.push(rariFee.id);
    market.rates = rates;
    market.save();
  }

  rariFee.rate = rate;
  rariFee.save();
}

// this function will "override" the updateMarket() function in ../../src/mapping.ts
// this function accounts for price oracles returning price in ETH in fuse
// this function calculates revenues with admin and fuse fees as well (fuse-specific)
function updateMarket(
  updateMarketData: UpdateMarketData,
  marketID: string,
  interestAccumulatedMantissa: BigInt,
  newTotalBorrow: BigInt,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[updateMarket] Market not found: {}", [marketID]);
    return;
  }

  let underlyingToken = Token.load(market.inputToken);
  if (!underlyingToken) {
    log.warning("[updateMarket] Underlying token not found: {}", [
      market.inputToken,
    ]);
    return;
  }

  let underlyingTokenPriceUSD = getTokenPriceUSD(
    updateMarketData.getUnderlyingPriceResult,
    underlyingToken.decimals
  );

  underlyingToken.lastPriceUSD = underlyingTokenPriceUSD;
  underlyingToken.lastPriceBlockNumber = blockNumber;
  underlyingToken.save();

  market.inputTokenPriceUSD = underlyingTokenPriceUSD;

  if (updateMarketData.totalSupplyResult.reverted) {
    log.warning("[updateMarket] Failed to get totalSupply of Market {}", [
      marketID,
    ]);
  } else {
    market.outputTokenSupply = updateMarketData.totalSupplyResult.value;
  }

  // get correct outputTokenDecimals for generic exchangeRate calculation
  let outputTokenDecimals = cTokenDecimals;
  if (market.outputToken) {
    let outputToken = Token.load(market.outputToken!);
    if (!outputToken) {
      log.warning("[updateMarket] Output token not found: {}", [
        market.outputToken!,
      ]);
    } else {
      outputTokenDecimals = outputToken.decimals;
    }
  }

  if (updateMarketData.exchangeRateStoredResult.reverted) {
    log.warning(
      "[updateMarket] Failed to get exchangeRateStored of Market {}",
      [marketID]
    );
  } else {
    // Formula: check out "Interpreting Exchange Rates" in https://compound.finance/docs#protocol-math
    let oneCTokenInUnderlying = updateMarketData.exchangeRateStoredResult.value
      .toBigDecimal()
      .div(
        exponentToBigDecimal(
          mantissaFactor + underlyingToken.decimals - outputTokenDecimals
        )
      );
    market.exchangeRate = oneCTokenInUnderlying;
    market.outputTokenPriceUSD = oneCTokenInUnderlying.times(
      underlyingTokenPriceUSD
    );

    // calculate inputTokenBalance only if exchangeRate is updated properly
    // mantissaFactor = (inputTokenDecimals - outputTokenDecimals)  (Note: can be negative)
    // inputTokenBalance = (outputSupply * exchangeRate) * (10 ^ mantissaFactor)
    if (underlyingToken.decimals > outputTokenDecimals) {
      // we want to multiply out the difference to expand BD
      let mantissaFactorBD = exponentToBigDecimal(
        underlyingToken.decimals - outputTokenDecimals
      );
      let inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .times(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(
        inputTokenBalanceBD.toString()
      );
    } else {
      // we want to divide back the difference to decrease the BD
      let mantissaFactorBD = exponentToBigDecimal(
        outputTokenDecimals - underlyingToken.decimals
      );
      let inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .div(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(
        inputTokenBalanceBD.toString()
      );
    }
  }

  let underlyingSupplyUSD = market.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);
  market.totalValueLockedUSD = underlyingSupplyUSD;
  market.totalDepositBalanceUSD = underlyingSupplyUSD;

  market.totalBorrowBalanceUSD = newTotalBorrow
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);

  if (updateMarketData.supplyRateResult.reverted) {
    log.warning("[updateMarket] Failed to get supplyRate of Market {}", [
      marketID,
    ]);
  } else {
    setSupplyInterestRate(
      marketID,
      convertRatePerUnitToAPY(
        updateMarketData.supplyRateResult.value,
        updateMarketData.unitPerYear
      )
    );
  }

  if (updateMarketData.borrowRateResult.reverted) {
    log.warning("[updateMarket] Failed to get borrowRate of Market {}", [
      marketID,
    ]);
  } else {
    setBorrowInterestRate(
      marketID,
      convertRatePerUnitToAPY(
        updateMarketData.borrowRateResult.value,
        updateMarketData.unitPerYear
      )
    );
  }

  // calculate new interests accumulated
  // With fuse protocol revenue includes (reserve factor + fuse fee + admin fee)

  let fuseFeeId =
    InterestRateSide.BORROWER + "-" + RariFee.FUSE_FEE + "-" + marketID;
  let fuseFee = InterestRate.load(fuseFeeId)!.rate.div(
    exponentToBigDecimal(INT_TWO)
  );

  let adminFeeId =
    InterestRateSide.BORROWER + "-" + RariFee.ADMIN_FEE + "-" + marketID;
  let adminFee = InterestRate.load(adminFeeId)!.rate.div(
    exponentToBigDecimal(INT_TWO)
  );

  let interestAccumulatedUSD = interestAccumulatedMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);

  let protocolSideRevenueUSDDelta = interestAccumulatedUSD.times(
    market._reserveFactor.plus(fuseFee).plus(adminFee)
  );
  let supplySideRevenueUSDDelta = interestAccumulatedUSD.minus(
    protocolSideRevenueUSDDelta
  );

  market._cumulativeTotalRevenueUSD = market._cumulativeTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  market._cumulativeProtocolSideRevenueUSD =
    market._cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  market._cumulativeSupplySideRevenueUSD =
    market._cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  market.save();

  // update daily fields in snapshot
  let snapshot = getOrCreateMarketDailySnapshot(
    market.id,
    blockTimestamp.toI32()
  );
  snapshot._dailyTotalRevenueUSD = snapshot._dailyTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  snapshot._dailyProtocolSideRevenueUSD =
    snapshot._dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  snapshot._dailySupplySideRevenueUSD =
    snapshot._dailySupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  snapshot.save();
}

// this function will "override" the getTokenPrice() function in ../../src/mapping.ts
function getTokenPriceUSD(
  getUnderlyingPriceResult: ethereum.CallResult<BigInt>,
  underlyingDecimals: i32
): BigDecimal {
  let mantissaDecimalFactor = 18 - underlyingDecimals + 18;
  let bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
  let priceInETH = getOrElse<BigInt>(getUnderlyingPriceResult, BIGINT_ZERO)
    .toBigDecimal()
    .div(bdFactor);

  // grab the price of ETH to find token price
  const priceOffset = 6;
  let ethPrice = getUsdPricePerToken(
    Address.fromString(ETH_ADDRESS)
  ).usdPrice.div(exponentToBigDecimal(priceOffset));
  return ethPrice.times(priceInETH);
}
