// fuse handlers
import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  ProtocolData,
  _getOrCreateProtocol,
  _handleNewReserveFactor,
  _handleNewCollateralFactor,
  _handleMarketListed,
  MarketListedData,
  TokenData,
  _handleMint,
  _handleRedeem,
  _handleBorrow,
  _handleRepayBorrow,
  _handleLiquidateBorrow,
  UpdateMarketData,
  getOrElse,
  _handleActionPaused,
  updateProtocol,
  snapshotFinancials,
  setSupplyInterestRate,
  convertRatePerUnitToAPY,
  setBorrowInterestRate,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  _handleMarketEntered,
  _handleTransfer,
} from "../../../src/mapping";
import { PoolRegistered } from "../../../generated/FusePoolDirectory/FusePoolDirectory";
import {
  BLOCKLIST_MARKETS,
  compareNormalizedString,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  FLOAT_ADDRESS,
  FLOAT_MARKET_ADDRESS,
  FMIM_ADDRESS,
  getNetworkSpecificConstant,
  GOHM_ADDRESS,
  METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  SCHEMA_VERSION,
  SOHM_ADDRESS,
  SUBGRAPH_VERSION,
  VESPER_V_DOLLAR_ADDRESS,
  ZERO_ADDRESS,
} from "./constants";
import {
  ActionPaused1,
  Comptroller,
  MarketEntered,
  MarketExited,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from "../../../generated/templates/Comptroller/Comptroller";
import {
  AccrueInterest,
  Borrow,
  LiquidateBorrow,
  Mint,
  NewReserveFactor,
  Redeem,
  RepayBorrow,
  Transfer,
} from "../../../generated/templates/CToken/CToken";
import {
  NewAdminFee,
  NewFuseFee,
  CToken,
} from "../../../generated/templates/CToken/CToken";
import {
  Comptroller as ComptrollerTemplate,
  CToken as CTokenTemplate,
} from "../../../generated/templates";
import { LendingProtocol, Token } from "../../../generated/schema";
import { ERC20 } from "../../../generated/templates/Comptroller/ERC20";
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
  Network,
  RewardTokenType,
} from "../../../src/constants";
import {
  InterestRate,
  Market,
  RewardToken,
  _FusePool,
} from "../../../generated/schema";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import { getUsdPricePerToken } from "./prices";
import {
  getOrCreateCircularBuffer,
  getRewardsPerDay,
  RewardIntervalType,
} from "./rewards";
import { FuseComptroller } from "../../../generated/templates/CToken/FuseComptroller";
import { RewardsDistributorDelegator } from "../../../generated/templates/CToken/RewardsDistributorDelegator";

//////////////////////////////////
//// Chain-specific Constants ////
//////////////////////////////////

const constants = getNetworkSpecificConstant();
const FACTORY_CONTRACT = constants.fusePoolDirectoryAddress;
const PROTOCOL_NETWORK = constants.network;

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

  const troller = Comptroller.bind(event.params.pool.comptroller);

  // populate pool data
  const poolData = new ProtocolData(
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
  const pool = new _FusePool(event.params.pool.comptroller.toHexString());
  pool.name = event.params.pool.name;
  pool.poolNumber = event.params.index.toString();
  pool.marketIDs = [];

  // set price oracle for pool entity
  const tryOracle = troller.try_oracle();
  if (tryOracle.reverted) {
    pool.priceOracle = "";
  } else {
    pool.priceOracle = tryOracle.value.toHexString();
  }

  // set liquidation incentive for pool entity
  const tryLiquidationIncentive = troller.try_liquidationIncentiveMantissa();
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

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    Address.fromString(FACTORY_CONTRACT),
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    Address.fromString(FACTORY_CONTRACT),
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
}

// add a new market
export function handleMarketListed(event: MarketListed): void {
  // skip the blocklisted markets
  if (
    BLOCKLIST_MARKETS.includes(event.params.cToken.toHexString().toLowerCase())
  ) {
    return;
  }

  const protocol = LendingProtocol.load(FACTORY_CONTRACT);
  if (!protocol) {
    // best effort
    log.warning("[handleMarketListed] Protocol not found: {}", [
      FACTORY_CONTRACT,
    ]);
    return;
  }

  // get/create ctoken
  CTokenTemplate.create(event.params.cToken);
  const cTokenContract = CToken.bind(event.params.cToken);
  const cToken = new TokenData(
    event.params.cToken,
    getOrElse(cTokenContract.try_name(), "UNKNOWN"),
    getOrElse(cTokenContract.try_symbol(), "UNKNOWN"),
    getOrElse(cTokenContract.try_decimals(), -1)
  );

  // get/create underlying token
  const underlyingAddress = getOrElse(
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
    const underlyingContract = ERC20.bind(underlyingAddress);
    underlyingToken = new TokenData(
      underlyingAddress,
      getOrElse(underlyingContract.try_name(), "UNKNOWN"),
      getOrElse(underlyingContract.try_symbol(), "UNKOWN"),
      getOrElse(underlyingContract.try_decimals(), -1)
    );
  }

  // populate market data
  const marketData = new MarketListedData(
    protocol,
    underlyingToken,
    cToken,
    getOrElse(cTokenContract.try_reserveFactorMantissa(), BIGINT_ZERO)
  );

  _handleMarketListed(marketData, event);

  // fuse-specific: add fuseFees and adminFees

  // get fuse fee - rari collects this (ie, protocol revenue)
  const tryFuseFeeMantissa = cTokenContract.try_fuseFeeMantissa();
  updateOrCreateRariFee(
    tryFuseFeeMantissa.reverted ? BIGINT_ZERO : tryFuseFeeMantissa.value,
    RariFee.FUSE_FEE,
    event.params.cToken.toHexString()
  );

  // get admin fee - pool owners (admin) collect this (ie, protocol revenue)
  const tryAdminFeeMantissa = cTokenContract.try_adminFeeMantissa();
  updateOrCreateRariFee(
    tryAdminFeeMantissa.reverted ? BIGINT_ZERO : tryAdminFeeMantissa.value,
    RariFee.ADMIN_FEE,
    event.params.cToken.toHexString()
  );

  // add market ID to the fuse pool
  const pool = _FusePool.load(event.address.toHexString());
  if (!pool) {
    // best effort
    log.warning("[handleMarketListed] FusePool not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }
  const markets = pool.marketIDs;
  markets.push(event.params.cToken.toHexString());
  pool.marketIDs = markets;
  pool.save();

  // set liquidation incentive (fuse-specific)
  const market = Market.load(event.params.cToken.toHexString())!;
  market.liquidationPenalty = pool.liquidationIncentive;
  market.save();
}

// update a given markets collateral factor
export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const marketID = event.params.cToken.toHexString();
  const newCollateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, newCollateralFactorMantissa);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  const liquidationIncentive = event.params.newLiquidationIncentiveMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .minus(BIGDECIMAL_ONE)
    .times(BIGDECIMAL_HUNDRED);
  const pool = _FusePool.load(event.address.toHexString());
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
    const market = Market.load(pool.marketIDs[i]);
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
  const pool = _FusePool.load(event.address.toHexString());
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
  const marketID = event.params.cToken.toHexString();
  const action = event.params.action;
  const pauseState = event.params.pauseState;
  _handleActionPaused(marketID, action, pauseState);
}

/////////////////////////
//// CToken Handlers ////
/////////////////////////

export function handleMint(event: Mint): void {
  const minter = event.params.minter;
  const mintAmount = event.params.mintAmount;
  const factoryContract = Address.fromString(FACTORY_CONTRACT);
  const contract = CToken.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.minter
  );
  _handleMint(
    factoryContract,
    minter,
    mintAmount,
    outputTokenSupplyResult,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleRedeem(event: Redeem): void {
  const redeemer = event.params.redeemer;
  const redeemAmount = event.params.redeemAmount;
  const factoryContract = Address.fromString(FACTORY_CONTRACT);
  const contract = CToken.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.redeemer
  );
  _handleRedeem(
    factoryContract,
    redeemer,
    redeemAmount,
    outputTokenSupplyResult,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleBorrow(event: Borrow): void {
  const borrower = event.params.borrower;
  const borrowAmount = event.params.borrowAmount;
  const totalBorrows = event.params.totalBorrows;
  const factoryContract = Address.fromString(FACTORY_CONTRACT);
  const contract = CToken.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleBorrow(
    factoryContract,
    borrower,
    borrowAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event
  );
}

export function handleRepayBorrow(event: RepayBorrow): void {
  const borrower = event.params.borrower;
  const payer = event.params.payer;
  const repayAmount = event.params.repayAmount;
  const totalBorrows = event.params.totalBorrows;
  const factoryContract = Address.fromString(FACTORY_CONTRACT);
  const contract = CToken.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleRepayBorrow(
    factoryContract,
    borrower,
    payer,
    repayAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event
  );
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const cTokenCollateral = event.params.cTokenCollateral;
  const liquidator = event.params.liquidator;
  const borrower = event.params.borrower;
  const seizeTokens = event.params.seizeTokens;
  const repayAmount = event.params.repayAmount;
  const factoryContract = Address.fromString(FACTORY_CONTRACT);
  _handleLiquidateBorrow(
    factoryContract,
    cTokenCollateral,
    liquidator,
    borrower,
    seizeTokens,
    repayAmount,
    event
  );
}

export function handleAccrueInterest(event: AccrueInterest): void {
  const marketAddress = event.address;
  // get comptroller address
  let trollerAddr: Address;
  if (
    (trollerAddr = getComptrollerAddress(event)) ==
    Address.fromString(ZERO_ADDRESS)
  ) {
    log.warning("[handleAccrueInterest] Comptroller address not found.", []);
    return;
  }

  const cTokenContract = CToken.bind(marketAddress);
  const pool = _FusePool.load(trollerAddr.toHexString());
  if (!pool) {
    // best effort
    log.warning("[handleAccrueInterest] FusePool not found: {}", [
      trollerAddr.toHexString(),
    ]);
    return;
  }
  const oracleContract = PriceOracle.bind(Address.fromString(pool.priceOracle));

  let blocksPerYear: i32;
  let blocksPerDay: BigDecimal;
  if (compareNormalizedString(dataSource.network(), Network.MAINNET)) {
    // calculate blocks/yr on ethereum
    // get rolling blocks/day count
    getRewardsPerDay(
      event.block.timestamp,
      event.block.number,
      BIGDECIMAL_ZERO,
      RewardIntervalType.BLOCK
    );
    blocksPerDay = getOrCreateCircularBuffer().blocksPerDay;
    const blocksPerDayBI = BigInt.fromString(
      blocksPerDay.truncate(0).toString()
    );

    blocksPerYear = blocksPerDayBI.toI32() * DAYS_PER_YEAR;
  } else {
    // Arbitrum One block speed is the same as ethereum
    // we do this b/c we cannot calculate the arbitrum block speed accurately
    // see discussion: https://github.com/messari/subgraphs/issues/939
    blocksPerYear = ETHEREUM_BLOCKS_PER_YEAR;
    blocksPerDay = BigDecimal.fromString(
      (ETHEREUM_BLOCKS_PER_YEAR / 365).toString()
    );
  }

  //
  // replacing _handleAccrueInterest() to properly derive assetPrice
  //

  const marketID = event.address.toHexString();
  const market = Market.load(marketID);
  if (!market) {
    log.warning("[handleAccrueInterest] Market not found: {}", [marketID]);
    return;
  }

  // Around block 13818884 sOHM pools were updated to gOHM
  // we need to update these pools to account for this otherwise the underlying currency is wrong
  if (market.inputToken.toLowerCase() == SOHM_ADDRESS.toLowerCase()) {
    const underlying = cTokenContract.underlying();
    if (underlying.toHexString().toLowerCase() == GOHM_ADDRESS.toLowerCase()) {
      log.warning(
        "[handleAccrueInterest] sOHM migrated to gOHM in market: {} at block: {}",
        [marketID, event.block.number.toString()]
      );

      const newInputToken = new Token(GOHM_ADDRESS);
      const tokenContract = ERC20.bind(Address.fromString(GOHM_ADDRESS));
      newInputToken.name = getOrElse(tokenContract.try_name(), "UNKNOWN");
      newInputToken.symbol = getOrElse(tokenContract.try_symbol(), "UNKOWN");
      newInputToken.decimals = getOrElse(tokenContract.try_decimals(), -1);
      newInputToken.save();

      market.inputToken = newInputToken.id;
      market.save();
    }
  }

  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    blocksPerYear
  );

  // creates and initializes market snapshots

  //
  // daily snapshot
  //
  getOrCreateMarketDailySnapshot(
    market,
    event.block.timestamp,
    event.block.number
  );

  //
  // hourly snapshot
  //
  getOrCreateMarketHourlySnapshot(
    market,
    event.block.timestamp,
    event.block.number
  );

  // handles fuse and admin fees (ie, protocol-side)
  updateMarket(
    updateMarketData,
    marketID,
    event.params.interestAccumulated,
    event.params.totalBorrows,
    event.block.number,
    event.block.timestamp,
    trollerAddr,
    blocksPerDay,
    true // update all prices on each transaction for arbitrum / ethereum
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
  const marketID = event.address.toHexString();
  const newReserveFactorMantissa = event.params.newReserveFactorMantissa;
  _handleNewReserveFactor(marketID, newReserveFactorMantissa);
}

export function handleTransfer(event: Transfer): void {
  const factoryContract = Address.fromString(FACTORY_CONTRACT);
  _handleTransfer(
    event,
    event.address.toHexString(),
    event.params.to,
    event.params.from,
    factoryContract
  );
}

/////////////////
//// Helpers ////
/////////////////

function getComptrollerAddress(event: ethereum.Event): Address {
  const cTokenContract = CToken.bind(event.address);
  const tryComptroller = cTokenContract.try_comptroller();

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
  const rariFeeId =
    InterestRateSide.BORROWER + "-" + rariFeeType + "-" + marketID;
  let rariFee = InterestRate.load(rariFeeId);

  // calculate fee rate
  const rate = rateMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .times(BIGDECIMAL_HUNDRED);

  if (!rariFee) {
    rariFee = new InterestRate(rariFeeId);
    rariFee.side = InterestRateSide.BORROWER;
    rariFee.type = InterestRateType.STABLE;

    // add to market rates array
    const market = Market.load(marketID);
    if (!market) {
      // best effort
      return;
    }
    const rates = market.rates;
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
  blockTimestamp: BigInt,
  comptroller: Address,
  blocksPerDay: BigDecimal,
  updateMarketPrices: boolean
): void {
  const market = Market.load(marketID);
  if (!market) {
    log.warning("[updateMarket] Market not found: {}", [marketID]);
    return;
  }

  const underlyingToken = Token.load(market.inputToken);
  if (!underlyingToken) {
    log.warning("[updateMarket] Underlying token not found: {}", [
      market.inputToken,
    ]);
    return;
  }

  if (updateMarketPrices) {
    updateAllMarketPrices(comptroller, blockNumber);
  }

  // update this market's price no matter what
  // grab price of ETH then multiply by underlying price
  const customETHPrice = getUsdPricePerToken(Address.fromString(ETH_ADDRESS));
  const ethPriceUSD = customETHPrice.usdPrice.div(
    customETHPrice.decimalsBaseTen
  );

  let underlyingTokenPriceUSD: BigDecimal;
  if (updateMarketData.getUnderlyingPriceResult.reverted) {
    log.warning("[updateMarket] Underlying price not found for market: {}", [
      marketID,
    ]);
    const backupPrice = getUsdPricePerToken(
      Address.fromString(market.inputToken)
    );
    underlyingTokenPriceUSD = backupPrice.usdPrice.div(
      backupPrice.decimalsBaseTen
    );
  } else {
    const mantissaDecimalFactor = 18 - underlyingToken.decimals + 18;
    const bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
    const priceInEth = updateMarketData.getUnderlyingPriceResult.value
      .toBigDecimal()
      .div(bdFactor);
    underlyingTokenPriceUSD = priceInEth.times(ethPriceUSD); // get price in USD
  }

  // Protect fMIM from price oracle manipulation on 2/1/22-2/4/22
  // The average price on those days is $0.99632525
  if (
    marketID.toLowerCase() == FMIM_ADDRESS.toLowerCase() &&
    blockTimestamp.toI32() >= 1643695208 && // beginning of day 2/1
    blockTimestamp.toI32() <= 1643954408 // EOD 2/4
  ) {
    underlyingTokenPriceUSD = BigDecimal.fromString("0.99632525");
  }

  // create a threshold for Vesper Pool V-Dollar price to use another oracle if:
  // the price is outside of the threshold ($0.50-$2.00)
  if (
    marketID.toLowerCase() == VESPER_V_DOLLAR_ADDRESS.toLowerCase() &&
    (underlyingTokenPriceUSD.le(BigDecimal.fromString(".5")) ||
      underlyingTokenPriceUSD.ge(BigDecimal.fromString("2")))
  ) {
    const customPrice = getUsdPricePerToken(
      Address.fromString(market.inputToken)
    );
    underlyingTokenPriceUSD = customPrice.usdPrice.div(
      customPrice.decimalsBaseTen
    );
  }

  // fix FLOAT price exploit and high dailyDeposit at block number 14006054
  if (
    marketID.toLowerCase() == FLOAT_MARKET_ADDRESS.toLowerCase() &&
    blockNumber.toI32() == 14006054
  ) {
    const customPrice = getUsdPricePerToken(Address.fromString(FLOAT_ADDRESS));
    underlyingTokenPriceUSD = customPrice.usdPrice.div(
      customPrice.decimalsBaseTen
    );
  }

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
    const outputToken = Token.load(market.outputToken!);
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
    const oneCTokenInUnderlying =
      updateMarketData.exchangeRateStoredResult.value
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
      const mantissaFactorBD = exponentToBigDecimal(
        underlyingToken.decimals - outputTokenDecimals
      );
      const inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .times(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(
        inputTokenBalanceBD.toString()
      );
    } else {
      // we want to divide back the difference to decrease the BD
      const mantissaFactorBD = exponentToBigDecimal(
        outputTokenDecimals - underlyingToken.decimals
      );
      const inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .div(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(
        inputTokenBalanceBD.toString()
      );
    }
  }

  const underlyingSupplyUSD = market.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);
  market.totalValueLockedUSD = underlyingSupplyUSD;
  market.totalDepositBalanceUSD = underlyingSupplyUSD;

  market._borrowBalance = newTotalBorrow;
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

  // update rewards
  const troller = FuseComptroller.bind(comptroller);
  const tryRewardDistributors = troller.try_getRewardsDistributors();
  if (!tryRewardDistributors.reverted) {
    const rewardDistributors = tryRewardDistributors.value;
    updateRewards(rewardDistributors, marketID, blocksPerDay, blockNumber);
  }

  // calculate new interests accumulated
  // With fuse protocol revenue includes (reserve factor + fuse fee + admin fee)
  const fuseFeeId =
    InterestRateSide.BORROWER + "-" + RariFee.FUSE_FEE + "-" + marketID;
  const fuseFee = InterestRate.load(fuseFeeId)!.rate.div(
    exponentToBigDecimal(INT_TWO)
  );

  const adminFeeId =
    InterestRateSide.BORROWER + "-" + RariFee.ADMIN_FEE + "-" + marketID;
  const adminFee = InterestRate.load(adminFeeId)!.rate.div(
    exponentToBigDecimal(INT_TWO)
  );

  const interestAccumulatedUSD = interestAccumulatedMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);

  const protocolSideRevenueUSDDelta = interestAccumulatedUSD.times(
    market._reserveFactor.plus(fuseFee).plus(adminFee)
  );
  const supplySideRevenueUSDDelta = interestAccumulatedUSD.minus(
    protocolSideRevenueUSDDelta
  );

  market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  market.save();

  // update daily fields in marketDailySnapshot
  const dailySnapshot = getOrCreateMarketDailySnapshot(
    market,
    blockTimestamp,
    blockNumber
  );
  dailySnapshot.dailyTotalRevenueUSD = dailySnapshot.dailyTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  dailySnapshot.dailyProtocolSideRevenueUSD =
    dailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  dailySnapshot.dailySupplySideRevenueUSD =
    dailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  dailySnapshot.save();

  // update hourly fields in marketHourlySnapshot
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(
    market,
    blockTimestamp,
    blockNumber
  );
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(interestAccumulatedUSD);
  hourlySnapshot.hourlyProtocolSideRevenueUSD =
    hourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSDDelta
    );
  hourlySnapshot.hourlySupplySideRevenueUSD =
    hourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  hourlySnapshot.save();
}

function updateRewards(
  rewardDistributor: Address[],
  marketID: string,
  blocksPerDay: BigDecimal,
  blockNumber: BigInt
): void {
  const market = Market.load(marketID);
  if (!market) {
    log.warning("[getRewardDistributorData] Market {} not found", [marketID]);
    return;
  }

  // grab reward amounts
  let rewardEmissions: BigInt[] = [];
  let rewardEmissionsUSD: BigDecimal[] = [];
  let rewardTokens: string[] = [];

  for (let i = 0; i < rewardDistributor.length; i++) {
    // setup reward arrays for distributor i
    // always borrow side first
    const distributorRewards: BigInt[] = [BIGINT_ZERO, BIGINT_ZERO];
    const distributorRewardsUSD: BigDecimal[] = [
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
    ];
    const distributorTokens: string[] = [ZERO_ADDRESS, ZERO_ADDRESS];

    // get distributor contract and grab borrow/supply distribution
    const distributor = RewardsDistributorDelegator.bind(rewardDistributor[i]);
    const tryBorrowSpeeds = distributor.try_compBorrowSpeeds(
      Address.fromString(marketID)
    );
    const trySupplySpeeds = distributor.try_compSupplySpeeds(
      Address.fromString(marketID)
    );
    const tryRewardToken = distributor.try_rewardToken();

    // create reward token if available
    if (!tryRewardToken.reverted) {
      let token = Token.load(tryRewardToken.value.toHexString());
      if (!token) {
        const tokenContract = ERC20.bind(tryRewardToken.value);
        token = new Token(tryRewardToken.value.toHexString());
        token.name = getOrElse(tokenContract.try_name(), "UNKNOWN");
        token.symbol = getOrElse(tokenContract.try_symbol(), "UNKOWN");
        token.decimals = getOrElse(tokenContract.try_decimals(), -1);
        token.save();
      }

      // get reward token price
      const customPrice = getUsdPricePerToken(Address.fromString(token.id));
      const rewardTokenPriceUSD = customPrice.usdPrice.div(
        customPrice.decimalsBaseTen
      );
      token.lastPriceUSD = rewardTokenPriceUSD;
      token.lastPriceBlockNumber = blockNumber;
      token.save();

      // borrow speeds
      if (!tryBorrowSpeeds.reverted) {
        const borrowRewardsBD = tryBorrowSpeeds.value
          .toBigDecimal()
          .div(exponentToBigDecimal(token.decimals));
        const rewardsPerDay = borrowRewardsBD.times(blocksPerDay);
        distributorRewards[0] = BigInt.fromString(
          rewardsPerDay.truncate(0).toString()
        );
        distributorRewardsUSD[0] = rewardsPerDay.times(rewardTokenPriceUSD);

        // create borrow reward token
        const rewardTokenId = RewardTokenType.BORROW + "-" + token.id;
        let rewardToken = RewardToken.load(rewardTokenId);
        if (!rewardToken) {
          rewardToken = new RewardToken(rewardTokenId);
          rewardToken.token = token.id;
          rewardToken.type = RewardTokenType.BORROW;
          rewardToken.save();
        }
        distributorTokens[0] = rewardToken.id;
      }

      // supply speeds
      if (!trySupplySpeeds.reverted) {
        const supplyRewardsBD = trySupplySpeeds.value
          .toBigDecimal()
          .div(exponentToBigDecimal(token.decimals));
        const rewardsPerDay = supplyRewardsBD.times(blocksPerDay);
        distributorRewards[1] = BigInt.fromString(
          rewardsPerDay.truncate(0).toString()
        );
        distributorRewardsUSD[1] = rewardsPerDay.times(rewardTokenPriceUSD);

        // create supply reward token
        const rewardTokenId = RewardTokenType.DEPOSIT + "-" + token.id;
        let rewardToken = RewardToken.load(rewardTokenId);
        if (!rewardToken) {
          rewardToken = new RewardToken(rewardTokenId);
          rewardToken.token = token.id;
          rewardToken.type = RewardTokenType.DEPOSIT;
          rewardToken.save();
        }
        distributorTokens[1] = rewardToken.id;
      }
    }

    // concat this rewardDistributor results to cumulative results
    rewardEmissions = rewardEmissions.concat(distributorRewards);
    rewardEmissionsUSD = rewardEmissionsUSD.concat(distributorRewardsUSD);
    rewardTokens = rewardTokens.concat(distributorTokens);
  }

  // update market
  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = rewardEmissions;
  market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
  market.save();
}

function updateAllMarketPrices(
  comptrollerAddr: Address,
  blockNumber: BigInt
): void {
  const protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.warning("[updateAllMarketPrices] protocol not found: {}", [
      comptrollerAddr.toHexString(),
    ]);
    return;
  }
  const priceOracle = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );

  for (let i = 0; i < protocol._marketIDs.length; i++) {
    const market = Market.load(protocol._marketIDs[i]);
    if (!market) {
      break;
    }
    const underlyingToken = Token.load(market.inputToken);
    if (!underlyingToken) {
      break;
    }

    // update market price
    const customETHPrice = getUsdPricePerToken(Address.fromString(ETH_ADDRESS));
    const ethPriceUSD = customETHPrice.usdPrice.div(
      customETHPrice.decimalsBaseTen
    );
    const tryUnderlyingPrice = priceOracle.try_getUnderlyingPrice(
      Address.fromString(market.id)
    );

    let underlyingTokenPriceUSD: BigDecimal;
    if (tryUnderlyingPrice.reverted) {
      break;
    } else {
      const mantissaDecimalFactor = 18 - underlyingToken.decimals + 18;
      const bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
      const priceInEth = tryUnderlyingPrice.value.toBigDecimal().div(bdFactor);
      underlyingTokenPriceUSD = priceInEth.times(ethPriceUSD); // get price in USD
    }

    underlyingToken.lastPriceUSD = underlyingTokenPriceUSD;
    underlyingToken.lastPriceBlockNumber = blockNumber;
    underlyingToken.save();

    market.inputTokenPriceUSD = underlyingTokenPriceUSD;

    // update TVL, supplyUSD, borrowUSD
    market.totalDepositBalanceUSD = market.inputTokenBalance
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
      .times(underlyingTokenPriceUSD);
    market.totalBorrowBalanceUSD = market._borrowBalance
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
      .times(underlyingTokenPriceUSD);
    market.totalValueLockedUSD = market.inputTokenBalance
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingToken.decimals))
      .times(underlyingTokenPriceUSD);
    market.save();
  }
}
