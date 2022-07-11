import {
  Address,
  bigDecimal,
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
} from "../../../generated/Comptroller/Comptroller";
import {
  Mint,
  Redeem,
  Borrow as BorrowEvent,
  RepayBorrow,
  LiquidateBorrow,
  AccrueInterest,
  NewReserveFactor,
} from "../../../generated/templates/CToken/CToken";

import {
  LendingProtocol,
  Token,
  Market,
  RewardToken,
} from "../../../generated/schema";
import {
  cTokenDecimals,
  Network,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  SECONDS_PER_YEAR,
  RewardTokenType,
  exponentToBigDecimal,
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
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Core } from "../../../generated/Comptroller/Core";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import {
  comptrollerAddr,
  nativeCToken,
  nativeToken,
  TONICAddress,
  tTONICAddress,
  CRONOS_BLOCKSPERDAY,
  ORACLE_ADDRESS,
  WCROUSDC_ADDRESS,
} from "./constants";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import { VVSlp } from "../../../generated/templates/CToken/VVSlp";

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let protocol = getOrCreateProtocol();
  let newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketListed(event: MarketListed): void {
  CTokenTemplate.create(event.params.cToken);

  let cTokenAddr = event.params.cToken;
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
  if (cTokenAddr == nativeCToken.address) {
    let marketListedData = new MarketListedData(
      protocol,
      nativeToken,
      nativeCToken,
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
  let marketID = event.params.cToken.toHexString();
  let collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, collateralFactorMantissa);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  let protocol = getOrCreateProtocol();
  let newLiquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  _handleNewLiquidationIncentive(protocol, newLiquidationIncentive);
}

export function handleActionPaused(event: ActionPaused1): void {
  let marketID = event.params.cToken.toHexString();
  let action = event.params.action;
  let pauseState = event.params.pauseState;
  _handleActionPaused(marketID, action, pauseState);
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  let marketID = event.address.toHexString();
  let newReserveFactorMantissa = event.params.newReserveFactorMantissa;
  _handleNewReserveFactor(marketID, newReserveFactorMantissa);
}

export function handleMint(event: Mint): void {
  let minter = event.params.minter;
  let mintAmount = event.params.mintAmount;
  _handleMint(comptrollerAddr, minter, mintAmount, event);
}

export function handleRedeem(event: Redeem): void {
  let redeemer = event.params.redeemer;
  let redeemAmount = event.params.redeemAmount;
  _handleRedeem(comptrollerAddr, redeemer, redeemAmount, event);
}

export function handleBorrow(event: BorrowEvent): void {
  let borrower = event.params.borrower;
  let borrowAmount = event.params.borrowAmount;
  _handleBorrow(comptrollerAddr, borrower, borrowAmount, event);
}

export function handleRepayBorrow(event: RepayBorrow): void {
  let payer = event.params.payer;
  let repayAmount = event.params.repayAmount;
  _handleRepayBorrow(comptrollerAddr, payer, repayAmount, event);
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
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
  let marketAddress = event.address;
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
    oracleContract.try_getUnderlyingPrice(marketAddress),
    SECONDS_PER_YEAR
  );
  let interestAccumulated = event.params.interestAccumulated;
  let totalBorrows = event.params.totalBorrows;

  let marketID = marketAddress.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleAccrueInterest] Market not found: {}", [marketID]);
    return;
  }
  updateTONICRewards(event, market, protocol);

  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    true,
    event
  );
}

function getOrCreateProtocol(): LendingProtocol {
  let comptroller = Comptroller.bind(comptrollerAddr);
  let protocolData = new ProtocolData(
    comptrollerAddr,
    "Tectonic",
    "tectonic",
    "1.3.0",
    "1.0.0",
    "1.0.0",
    Network.CRONOS,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );

  return _getOrCreateProtocol(protocolData);
}

function updateTONICRewards(
  event: AccrueInterest,
  market: Market,
  protocol: LendingProtocol
): void {
  let rewardTokenBorrow: RewardToken | null = null;
  let rewardTokenDeposit: RewardToken | null = null;

  // check if market has Tonic reward tokens
  if (market.rewardTokens == null) {
    // get or create Tonic token
    let TonicToken = Token.load(TONICAddress);
    if (!TonicToken) {
      let tokenContract = ERC20.bind(Address.fromString(TONICAddress));
      TonicToken = new Token(TONICAddress);
      TonicToken.name = getOrElse(tokenContract.try_name(), "unkown");
      TonicToken.symbol = getOrElse(tokenContract.try_symbol(), "unkown");
      TonicToken.decimals = getOrElse(tokenContract.try_decimals(), 0);
      TonicToken.save();
    }

    let borrowID = RewardTokenType.BORROW.concat("-").concat(TONICAddress);
    rewardTokenBorrow = RewardToken.load(borrowID);
    if (!rewardTokenBorrow) {
      rewardTokenBorrow = new RewardToken(borrowID);
      rewardTokenBorrow.token = TonicToken.id; // Tonic already made from tTonic market
      rewardTokenBorrow.type = RewardTokenType.BORROW;
      rewardTokenBorrow.save();
    }
    let depositID = RewardTokenType.DEPOSIT.concat("-").concat(TONICAddress);
    rewardTokenDeposit = RewardToken.load(depositID);
    if (!rewardTokenDeposit) {
      rewardTokenDeposit = new RewardToken(depositID);
      rewardTokenDeposit.token = TonicToken.id; // Tonic already made from tTonic market
      rewardTokenDeposit.type = RewardTokenType.DEPOSIT;
      rewardTokenDeposit.save();
    }

    market.rewardTokens = [rewardTokenDeposit.id, rewardTokenBorrow.id];
    market.save();
  }

  // get TONIC distribution/block
  // let rewardDecimals = Token.load(TONICAddress)!.decimals;
  let rewardDecimals = 18; // TONIC 18 decimals
  let troller = Core.bind(comptrollerAddr);
  let blocksPerDay = BigInt.fromString(
    CRONOS_BLOCKSPERDAY.truncate(0).toString()
  );

  let TonicPriceUSD = BIGDECIMAL_ZERO;
  let supplyTonicPerDay = BIGINT_ZERO;
  let borrowTonicPerDay = BIGINT_ZERO;

  // Tonic speeds are the same for supply/borrow side
  let tryTonicSpeed = troller.try_tonicSpeeds(event.address);
  supplyTonicPerDay = tryTonicSpeed.reverted
    ? BIGINT_ZERO
    : tryTonicSpeed.value.times(blocksPerDay);
  borrowTonicPerDay = supplyTonicPerDay;

  if (event.block.number.gt(BigInt.fromI32(1337194))) {
    let oracleContract = PriceOracle.bind(
      Address.fromString(protocol._priceOracle)
    );
    let price = oracleContract.try_getUnderlyingPrice(
      Address.fromString(tTONICAddress)
    );
    if (price.reverted) {
      log.warning("[updateTonicrewards] getUnderlyingPrice reverted", []);
    } else {
      TonicPriceUSD = price.value
        .toBigDecimal()
        .div(exponentToBigDecimal(rewardDecimals));
    }
  }

  let borrowTonicPerDayUSD = borrowTonicPerDay
    .toBigDecimal()
    .div(exponentToBigDecimal(rewardDecimals))
    .times(TonicPriceUSD);
  let supplyTonicPerDayUSD = supplyTonicPerDay
    .toBigDecimal()
    .div(exponentToBigDecimal(rewardDecimals))
    .times(TonicPriceUSD);
  market.rewardTokenEmissionsAmount = [borrowTonicPerDay, supplyTonicPerDay]; // same order as market.rewardTokens
  market.rewardTokenEmissionsUSD = [borrowTonicPerDayUSD, supplyTonicPerDayUSD];
  market.save();
}
