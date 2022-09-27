import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
// import from the generated at root in order to reuse methods from root
import {
  NewPriceOracle,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  ActionPaused1,
  MarketEntered,
  MarketExited,
} from "../../../generated/Comptroller/Comptroller";
import {
  Mint,
  Redeem,
  Borrow as BorrowEvent,
  RepayBorrow,
  LiquidateBorrow,
  AccrueInterest,
  NewReserveFactor,
  Transfer,
} from "../../../generated/templates/CToken/CToken";
import {
  FinancialsDailySnapshot,
  LendingProtocol,
  Market,
  Token,
} from "../../../generated/schema";
import {
  cTokenDecimals,
  BIGINT_ZERO,
  Network,
  BIGDECIMAL_ZERO,
  exponentToBigDecimal,
  cTokenDecimalsBD,
  SECONDS_PER_DAY,
} from "../../../src/constants";
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
  _handleMarketEntered,
  getTokenPriceUSD,
  _handleTransfer,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import {
  BNB_USD_CHAINLINK_ORACLE,
  equalsIgnoreCase,
  ETH_ADDRESS,
  ETH_CUTOFF_BLOCK,
  getNetworkSpecificConstant,
} from "./constants";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import { getUsdPricePerToken } from "./prices";
import { Oracle } from "../../../generated/templates/CToken/Oracle";

// Global variables
let isDeprecated = false;

// Constant values
let constant = getNetworkSpecificConstant();
let comptrollerAddr = constant.comptrollerAddr;
let network = constant.network;
let unitPerYear = constant.unitPerYear;
let nativeToken = constant.nativeToken;
let nativeCToken = constant.nativeCToken;

export function handleNewPriceOracle(event: NewPriceOracle): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let protocol = getOrCreateProtocol();
  let newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketEntered(event: MarketEntered): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  _handleMarketEntered(
    comptrollerAddr,
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  _handleMarketEntered(
    comptrollerAddr,
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
}

export function handleMarketListed(event: MarketListed): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  CTokenTemplate.create(event.params.cToken);

  let cTokenAddr = event.params.cToken;
  // cream finance emits a MarketListed event that lists an invalid CToken
  // hardcode to skip it otherwise it messes up ETH token
  if (
    cTokenAddr ==
    Address.fromString("0xbdf447b39d152d6a234b4c02772b8ab5d1783f72")
  ) {
    return;
  }
  let cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  let protocol = getOrCreateProtocol();
  let cTokenContract = CToken.bind(event.params.cToken);
  let cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO
  );
  if (nativeToken && nativeCToken && cTokenAddr == nativeCToken!.address) {
    // compilor is too silly to figure out this is not-null, hence the !
    let marketListedData = new MarketListedData(
      protocol,
      nativeToken!,
      nativeCToken!,
      cTokenReserveFactorMantissa
    );
    _handleMarketListed(marketListedData, event);
    return;
  }

  let underlyingTokenAddrResult = cTokenContract.try_underlying();
  if (underlyingTokenAddrResult.reverted) {
    log.warning(
      "[handleMarketListed] could not fetch underlying token of cToken: {}",
      [cTokenAddr.toHexString()]
    );
    return;
  }
  let underlyingTokenAddr = underlyingTokenAddrResult.value;
  let underlyingTokenContract = ERC20.bind(underlyingTokenAddr);
  _handleMarketListed(
    new MarketListedData(
      protocol,
      new TokenData(
        underlyingTokenAddr,
        getOrElse<string>(underlyingTokenContract.try_name(), "unknown"),
        getOrElse<string>(underlyingTokenContract.try_symbol(), "unknown"),
        getOrElse<i32>(underlyingTokenContract.try_decimals(), 0)
      ),
      new TokenData(
        cTokenAddr,
        getOrElse<string>(cTokenContract.try_name(), "unknown"),
        getOrElse<string>(cTokenContract.try_symbol(), "unknown"),
        cTokenDecimals
      ),

      cTokenReserveFactorMantissa
    ),
    event
  );
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let marketID = event.params.cToken.toHexString();
  let collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, collateralFactorMantissa);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let protocol = getOrCreateProtocol();
  let newLiquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  _handleNewLiquidationIncentive(protocol, newLiquidationIncentive);
}

export function handleActionPaused(event: ActionPaused1): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let marketID = event.params.cToken.toHexString();
  let action = event.params.action;
  let pauseState = event.params.pauseState;
  _handleActionPaused(marketID, action, pauseState);
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let marketID = event.address.toHexString();
  let newReserveFactorMantissa = event.params.newReserveFactorMantissa;
  _handleNewReserveFactor(marketID, newReserveFactorMantissa);
}

export function handleMint(event: Mint): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let minter = event.params.minter;
  let mintAmount = event.params.mintAmount;
  let contract = CToken.bind(event.address);
  let balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.minter
  );
  _handleMint(
    comptrollerAddr,
    minter,
    mintAmount,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleRedeem(event: Redeem): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let redeemer = event.params.redeemer;
  let redeemAmount = event.params.redeemAmount;
  let contract = CToken.bind(event.address);
  let balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.redeemer
  );
  _handleRedeem(
    comptrollerAddr,
    redeemer,
    redeemAmount,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleBorrow(event: BorrowEvent): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let borrower = event.params.borrower;
  let borrowAmount = event.params.borrowAmount;
  let contract = CToken.bind(event.address);
  let borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleBorrow(
    comptrollerAddr,
    borrower,
    borrowAmount,
    borrowBalanceStoredResult,
    event
  );
}

export function handleRepayBorrow(event: RepayBorrow): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let borrower = event.params.borrower;
  let payer = event.params.payer;
  let repayAmount = event.params.repayAmount;
  let contract = CToken.bind(event.address);
  let borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleRepayBorrow(
    comptrollerAddr,
    borrower,
    payer,
    repayAmount,
    borrowBalanceStoredResult,
    event
  );
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let cTokenCollateral = event.params.cTokenCollateral;
  let liquidator = event.params.liquidator;
  let borrower = event.params.borrower;
  let seizeTokens = event.params.seizeTokens;
  let repayAmount = event.params.repayAmount;
  _handleLiquidateBorrow(
    comptrollerAddr,
    cTokenCollateral,
    liquidator,
    borrower,
    seizeTokens,
    repayAmount,
    event
  );
}

export function handleAccrueInterest(event: AccrueInterest): void {
  if (
    isDeprecated ||
    deprecateSubgraph(event.block.number, event.block.timestamp)
  ) {
    return;
  }

  let marketAddress = event.address;
  let market = Market.load(marketAddress.toHexString());
  if (!market) {
    log.warning("[handleAccrueInterest] market not found: {}", [
      marketAddress.toHexString(),
    ]);
    return;
  }
  let underlyingToken = Token.load(market.inputToken);
  if (!underlyingToken) {
    log.warning(
      "[handleAccrueInterest] input token: {} not found in market: {}",
      [market.inputToken, market.id]
    );
    return;
  }
  let cTokenContract = CToken.bind(marketAddress);
  let protocol = getOrCreateProtocol();
  let oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  let updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    getPriceUSD(
      oracleContract.try_getUnderlyingPrice(marketAddress),
      underlyingToken.decimals,
      event.block.number.toI32()
    ),
    unitPerYear
  );
  let interestAccumulated = event.params.interestAccumulated;
  let totalBorrows = event.params.totalBorrows;
  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    false, // do not update all prices
    event
  );
}

export function handleTransfer(event: Transfer): void {
  _handleTransfer(
    event,
    event.address.toHexString(),
    event.params.to,
    event.params.from,
    comptrollerAddr
  );
}

function getOrCreateProtocol(): LendingProtocol {
  let comptroller = Comptroller.bind(comptrollerAddr);
  let protocolData = new ProtocolData(
    comptrollerAddr,
    "CREAM Finance",
    "cream-finance",
    "2.0.1",
    "1.1.5",
    "1.0.0",
    network,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}

// this function will get the USD price of any asset on CREAM BSC / ETH
// CREAM's oracles are denoted in the network's native unit
// So on ethereum we need to multiply tryUnderlyingPrice by the price of ETH
function getPriceUSD(
  tryUnderlyingPrice: ethereum.CallResult<BigInt>,
  underlyingDecimals: i32,
  blockNumber: i32
): ethereum.CallResult<BigInt> {
  if (tryUnderlyingPrice.reverted) {
    return ethereum.CallResult.fromValue(BIGINT_ZERO);
  }

  if (equalsIgnoreCase(network, Network.MAINNET)) {
    let customPrice = getUsdPricePerToken(Address.fromString(ETH_ADDRESS));
    let ethPriceUSD = customPrice.usdPrice.div(customPrice.decimalsBaseTen);

    let priceInETH = getTokenPriceUSD(tryUnderlyingPrice, underlyingDecimals);
    let priceUSD = ethPriceUSD.times(priceInETH);

    // put the price back into BigInt form with correct decimal offset
    let mantissaDecimalFactor = 18 - underlyingDecimals + 18;
    let bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
    let returnValue = BigInt.fromString(
      priceUSD.times(bdFactor).truncate(0).toString()
    );
    return ethereum.CallResult.fromValue(returnValue);
  }
  if (equalsIgnoreCase(network, Network.BSC)) {
    let bnbPriceUSD: BigDecimal;
    if (blockNumber <= 1881676) {
      // cannot use Chainlink oracle
      // using LP pair to derive price
      // this is in effect for the first 2 months
      bnbPriceUSD = BIGDECIMAL_ZERO; // TODO: find way to get bnb price on chain here
    } else {
      // use chainlink oracle BNB/USD starting on block 1881676
      let chainlinkOracle = Oracle.bind(
        Address.fromString(BNB_USD_CHAINLINK_ORACLE)
      );
      let tryPriceUSD = chainlinkOracle.try_latestAnswer();
      bnbPriceUSD = tryPriceUSD.reverted
        ? BIGDECIMAL_ZERO
        : tryPriceUSD.value.toBigDecimal().div(cTokenDecimalsBD);
    }

    let priceInBNB = getTokenPriceUSD(tryUnderlyingPrice, underlyingDecimals);
    let priceUSD = bnbPriceUSD.times(priceInBNB);

    // put the price back into BigInt form with correct decimal offset
    let mantissaDecimalFactor = 18 - underlyingDecimals + 18;
    let bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
    let returnValue = BigInt.fromString(
      priceUSD.times(bdFactor).truncate(0).toString()
    );
    return ethereum.CallResult.fromValue(returnValue);
  }

  // Polygon / Arbitrum deployments return price like normal
  return ethereum.CallResult.fromValue(tryUnderlyingPrice.value);
}

////////////////////////////
//// Deprecate Subgraph ////
////////////////////////////

// this function will deprecate Ethereum subgraph after 10/17/2022
// return false if not deprecated
function deprecateSubgraph(blockNumber: BigInt, timestamp: BigInt): boolean {
  if (
    isDeprecated ||
    !equalsIgnoreCase(network, Network.MAINNET) ||
    blockNumber.toI32() < ETH_CUTOFF_BLOCK
  ) {
    // skip if already deprecated, not ethereum, or not past the CUTOFF block
    return false;
  }

  let protocol = getOrCreateProtocol();

  // deprecate markets first
  deprecateMarkets(protocol._marketIDs, blockNumber, timestamp);

  // finish off with the protocol
  deprecateProtocol(protocol, timestamp);

  isDeprecated = true;
  return true;
}

function deprecateMarkets(
  marketIDList: string[],
  blockNumber: BigInt,
  timestamp: BigInt
): void {
  for (let i = 0; i < marketIDList.length; i++) {
    let market = Market.load(marketIDList[i]);
    if (!market) {
      continue;
    }

    // zero out the market fields that need to be zero'd out
    market.isActive = false;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = false;
    market.rates = [];
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.exchangeRate = BIGDECIMAL_ZERO;
    market.rewardTokenEmissionsAmount = [];
    market.rewardTokenEmissionsUSD = [];
    market._borrowBalance = BIGINT_ZERO;

    market.save();

    // clear out last marketDaily / hourly snapshot
    clearMarketSnapshots(market, blockNumber, timestamp);
  }
}

function deprecateProtocol(protocol: LendingProtocol, timestamp: BigInt): void {
  protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
  protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;

  protocol.save();

  // clear out last financialsDailySnapshot
  clearFinancialSnapshot(timestamp);
}

function clearFinancialSnapshot(timestamp: BigInt): void {
  let financialsDailySnapshotID = (
    timestamp.toI32() / SECONDS_PER_DAY
  ).toString();
  let financiasDailySnapshot = FinancialsDailySnapshot.load(
    financialsDailySnapshotID
  );
  if (!financiasDailySnapshot) {
    log.warning(
      "[clearFinancialSnapshot] could not find FinancialsDailySnapshot with ID {}",
      [financialsDailySnapshotID]
    );
    return;
  }

  financiasDailySnapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
  financiasDailySnapshot.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  financiasDailySnapshot.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  financiasDailySnapshot.save();
}

function clearMarketSnapshots(
  market: Market,
  blockNumber: BigInt,
  timestamp: BigInt
): void {
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(
    market,
    timestamp,
    blockNumber
  );

  // clear out aggregated fields
  marketDailySnapshot.rates = [];
  marketDailySnapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
  marketDailySnapshot.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  marketDailySnapshot.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  marketDailySnapshot.inputTokenBalance = BIGINT_ZERO;
  marketDailySnapshot.inputTokenPriceUSD = BIGDECIMAL_ZERO;
  marketDailySnapshot.outputTokenSupply = BIGINT_ZERO;
  marketDailySnapshot.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  marketDailySnapshot.exchangeRate = BIGDECIMAL_ZERO;
  marketDailySnapshot.rewardTokenEmissionsAmount = [];
  marketDailySnapshot.rewardTokenEmissionsUSD = [];
  marketDailySnapshot.save();

  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(
    market,
    timestamp,
    blockNumber
  );
  marketHourlySnapshot.rates = [];
  marketHourlySnapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
  marketHourlySnapshot.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  marketHourlySnapshot.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  marketHourlySnapshot.inputTokenBalance = BIGINT_ZERO;
  marketHourlySnapshot.inputTokenPriceUSD = BIGDECIMAL_ZERO;
  marketHourlySnapshot.outputTokenSupply = BIGINT_ZERO;
  marketHourlySnapshot.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  marketHourlySnapshot.exchangeRate = BIGDECIMAL_ZERO;
  marketHourlySnapshot.rewardTokenEmissionsAmount = [];
  marketHourlySnapshot.rewardTokenEmissionsUSD = [];
  marketHourlySnapshot.save();
}
