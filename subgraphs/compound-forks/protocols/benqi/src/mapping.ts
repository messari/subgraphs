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
  MarketExited,
  MarketEntered,
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
  Market,
  RewardToken,
  Token,
} from "../../../generated/schema";
import {
  cTokenDecimals,
  Network,
  BIGINT_ZERO,
  SECONDS_PER_YEAR,
  InterestRateSide,
  RewardTokenType,
  BIGDECIMAL_ZERO,
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
  _handleMarketEntered,
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import { OldComptroller } from "../../../generated/templates/CToken/OldComptroller";
import { JoePair } from "../../../generated/templates/CToken/JoePair";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import {
  comptrollerAddr,
  QiAddr,
  nativeCToken,
  nativeToken,
  AVAXAddr,
  qiAVAXAddr,
  TraderJoeQiWavaxPairAddr,
  TraderJoeQiWavaxPairStartBlock,
  oldComptrollerAddr,
} from "./constants";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";

class RewardTokenEmission {
  amount: BigInt;
  USD: BigDecimal;
  constructor(amount: BigInt, USD: BigDecimal) {
    this.amount = amount;
    this.USD = USD;
  }
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let protocol = getOrCreateProtocol();
  let newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    event.params.qiToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    event.params.qiToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
}

export function handleMarketListed(event: MarketListed): void {
  CTokenTemplate.create(event.params.qiToken);

  let cTokenAddr = event.params.qiToken;
  let cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  let protocol = getOrCreateProtocol();
  let cTokenContract = CToken.bind(event.params.qiToken);
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
    initMarketRewards(cTokenAddr.toHexString());
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
  initMarketRewards(cTokenAddr.toHexString());
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let marketID = event.params.qiToken.toHexString();
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
  let marketID = event.params.qiToken.toHexString();
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
  let cTokenCollateral = event.params.qiTokenCollateral;
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
  setMarketRewards(marketAddress, event.block.number.toI32());

  let cTokenContract = CToken.bind(marketAddress);
  let protocol = getOrCreateProtocol();
  let oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  let updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerTimestamp(),
    cTokenContract.try_borrowRatePerTimestamp(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    SECONDS_PER_YEAR
  );

  let interestAccumulated = event.params.interestAccumulated;
  let totalBorrows = event.params.totalBorrows;
  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    event
  );
}

function getOrCreateProtocol(): LendingProtocol {
  let comptroller = Comptroller.bind(comptrollerAddr);
  let protocolData = new ProtocolData(
    comptrollerAddr,
    "BENQI",
    "benqi",
    "2.0.1",
    "1.1.0",
    "1.0.0",
    Network.AVALANCHE,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );

  return _getOrCreateProtocol(protocolData);
}

// rewardTokens = [QI-supply, AVAX-supply, QI-borrow, AVAX-borrow]
function initMarketRewards(marketID: string): void {
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[initMarketRewards] market not found: {}", [marketID]);
    return;
  }

  let QiToken = Token.load(QiAddr.toHexString());
  if (!QiToken) {
    QiToken = new Token(QiAddr.toHexString());
    QiToken.name = "BENQI";
    QiToken.symbol = "QI";
    QiToken.decimals = 18;
    QiToken.save();
  }
  let AVAXToken = Token.load(AVAXAddr.toHexString());
  if (!AVAXToken) {
    AVAXToken = new Token(AVAXAddr.toHexString());
    AVAXToken.name = "AVAX";
    AVAXToken.symbol = "AVAX";
    AVAXToken.decimals = 18;
    AVAXToken.save();
  }

  let supplyRewardToken0 = RewardToken.load(
    InterestRateSide.LENDER.concat("-").concat(QiAddr.toHexString())
  );
  if (!supplyRewardToken0) {
    supplyRewardToken0 = new RewardToken(
      InterestRateSide.LENDER.concat("-").concat(QiAddr.toHexString())
    );
    supplyRewardToken0.token = QiToken.id;
    supplyRewardToken0.type = RewardTokenType.DEPOSIT;
    supplyRewardToken0.save();
  }

  let supplyRewardToken1 = RewardToken.load(
    InterestRateSide.LENDER.concat("-").concat(AVAXAddr.toHexString())
  );
  if (!supplyRewardToken1) {
    supplyRewardToken1 = new RewardToken(
      InterestRateSide.LENDER.concat("-").concat(AVAXAddr.toHexString())
    );
    supplyRewardToken1.token = AVAXToken.id;
    supplyRewardToken1.type = RewardTokenType.DEPOSIT;
    supplyRewardToken1.save();
  }

  let borrowRewardToken0 = RewardToken.load(
    InterestRateSide.BORROWER.concat("-").concat(QiAddr.toHexString())
  );
  if (!borrowRewardToken0) {
    borrowRewardToken0 = new RewardToken(
      InterestRateSide.BORROWER.concat("-").concat(QiAddr.toHexString())
    );
    borrowRewardToken0.token = QiToken.id;
    borrowRewardToken0.type = RewardTokenType.BORROW;
    borrowRewardToken0.save();
  }

  let borrowRewardToken1 = RewardToken.load(
    InterestRateSide.BORROWER.concat("-").concat(AVAXAddr.toHexString())
  );
  if (!borrowRewardToken1) {
    borrowRewardToken1 = new RewardToken(
      InterestRateSide.BORROWER.concat("-").concat(AVAXAddr.toHexString())
    );
    borrowRewardToken1.token = AVAXToken.id;
    borrowRewardToken1.type = RewardTokenType.BORROW;
    borrowRewardToken1.save();
  }

  market.rewardTokens = [
    supplyRewardToken0.id,
    supplyRewardToken1.id,
    borrowRewardToken0.id,
    borrowRewardToken1.id,
  ];
  market.rewardTokenEmissionsAmount = [
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
  ];
  market.rewardTokenEmissionsUSD = [
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
  ];
  market.save();
}

function setMarketRewards(marketAddress: Address, blockNumber: i32): void {
  let marketID = marketAddress.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[setMarketRewards] Market not found: {}", [marketID]);
    return;
  }

  let AVAXMarket = Market.load(qiAVAXAddr.toHexString());
  if (!AVAXMarket) {
    log.warning("[setMarketRewards] qiAVAX market not found: {}", [
      qiAVAXAddr.toHexString(),
    ]);
    return;
  }

  let QiPriceUSD = BIGDECIMAL_ZERO;
  let AVAXPriceUSD = AVAXMarket.inputTokenPriceUSD;
  if (blockNumber >= TraderJoeQiWavaxPairStartBlock) {
    let oneQiInAVAX = getOneQiInAVAX();
    QiPriceUSD = AVAXPriceUSD.times(oneQiInAVAX);
  }

  let supplyQiEmission: RewardTokenEmission;
  let supplyAVAXEmission: RewardTokenEmission;
  let borrowQiEmission: RewardTokenEmission;
  let borrowAVAXEmission: RewardTokenEmission;

  // In Comptroller, 0 = Qi, 1 = AVAX
  if (blockNumber < 14000970) {
    // before 0xb8b3dc402f7e5BfB2883D9Ab1641CEC95D88702D gets deployed
    let oldComptroller = OldComptroller.bind(oldComptrollerAddr);
    supplyQiEmission = getRewardTokenEmission(
      oldComptroller.try_rewardSpeeds(0, marketAddress),
      18,
      QiPriceUSD
    );
    supplyAVAXEmission = getRewardTokenEmission(
      oldComptroller.try_rewardSpeeds(1, marketAddress),
      18,
      AVAXPriceUSD
    );
    borrowQiEmission = getRewardTokenEmission(
      oldComptroller.try_rewardSpeeds(0, marketAddress),
      18,
      QiPriceUSD
    );
    borrowAVAXEmission = getRewardTokenEmission(
      oldComptroller.try_rewardSpeeds(1, marketAddress),
      18,
      AVAXPriceUSD
    );
  } else {
    let comptroller = Comptroller.bind(comptrollerAddr);
    supplyQiEmission = getRewardTokenEmission(
      comptroller.try_supplyRewardSpeeds(0, marketAddress),
      18,
      QiPriceUSD
    );
    supplyAVAXEmission = getRewardTokenEmission(
      comptroller.try_supplyRewardSpeeds(1, marketAddress),
      18,
      AVAXPriceUSD
    );
    borrowQiEmission = getRewardTokenEmission(
      comptroller.try_borrowRewardSpeeds(0, marketAddress),
      18,
      QiPriceUSD
    );
    borrowAVAXEmission = getRewardTokenEmission(
      comptroller.try_borrowRewardSpeeds(1, marketAddress),
      18,
      AVAXPriceUSD
    );
  }

  market.rewardTokenEmissionsAmount = [
    supplyQiEmission.amount,
    supplyAVAXEmission.amount,
    borrowQiEmission.amount,
    borrowAVAXEmission.amount,
  ];
  market.rewardTokenEmissionsUSD = [
    supplyQiEmission.USD,
    supplyAVAXEmission.USD,
    borrowQiEmission.USD,
    borrowAVAXEmission.USD,
  ];
  market.save();
}

function getRewardTokenEmission(
  rewardSpeedsResult: ethereum.CallResult<BigInt>,
  tokenDecimals: i32,
  tokenPriceUSD: BigDecimal
): RewardTokenEmission {
  if (rewardSpeedsResult.reverted) {
    log.warning("[getRewardTokenEmission] result reverted", []);
    return new RewardTokenEmission(BIGINT_ZERO, BIGDECIMAL_ZERO);
  }
  let rewardAmountPerSecond = rewardSpeedsResult.value;
  let rewardAmount = rewardAmountPerSecond.times(
    BigInt.fromI32(SECONDS_PER_YEAR)
  );
  let rewardUSD = rewardAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(tokenDecimals))
    .times(tokenPriceUSD);
  return new RewardTokenEmission(rewardAmount, rewardUSD);
}

// Fetch Qi vs AVAX price from Trader Joe
function getOneQiInAVAX(): BigDecimal {
  let joePairContract = JoePair.bind(TraderJoeQiWavaxPairAddr);
  let getReservesResult = joePairContract.try_getReserves();
  if (getReservesResult.reverted) {
    log.warning("[getOneQiInAVAX] result reverted", []);
    return BIGDECIMAL_ZERO;
  }
  let QiReserve = getReservesResult.value.value0;
  let WAVAXReserve = getReservesResult.value.value1;
  return WAVAXReserve.toBigDecimal().div(QiReserve.toBigDecimal());
}
