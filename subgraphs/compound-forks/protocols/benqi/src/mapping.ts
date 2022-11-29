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
  Transfer,
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
  _handleTransfer,
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
  const protocol = getOrCreateProtocol();
  const newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.qiToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.qiToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
}

export function handleMarketListed(event: MarketListed): void {
  CTokenTemplate.create(event.params.qiToken);

  const cTokenAddr = event.params.qiToken;
  const cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  const protocol = getOrCreateProtocol();
  const cTokenContract = CToken.bind(event.params.qiToken);
  const cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO
  );
  if (cTokenAddr == nativeCToken.address) {
    const marketListedData = new MarketListedData(
      protocol,
      nativeToken,
      nativeCToken,
      cTokenReserveFactorMantissa
    );
    _handleMarketListed(marketListedData, event);
    initMarketRewards(cTokenAddr.toHexString());
    return;
  }

  const underlyingTokenAddrResult = cTokenContract.try_underlying();
  if (underlyingTokenAddrResult.reverted) {
    log.warning(
      "[handleMarketListed] could not fetch underlying token of cToken: {}",
      [cTokenAddr.toHexString()]
    );
    return;
  }
  const underlyingTokenAddr = underlyingTokenAddrResult.value;
  const underlyingTokenContract = ERC20.bind(underlyingTokenAddr);
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
  const marketID = event.params.qiToken.toHexString();
  const collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, collateralFactorMantissa);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  const protocol = getOrCreateProtocol();
  const newLiquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  _handleNewLiquidationIncentive(protocol, newLiquidationIncentive);
}

export function handleActionPaused(event: ActionPaused1): void {
  const marketID = event.params.qiToken.toHexString();
  const action = event.params.action;
  const pauseState = event.params.pauseState;
  _handleActionPaused(marketID, action, pauseState);
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  const marketID = event.address.toHexString();
  const newReserveFactorMantissa = event.params.newReserveFactorMantissa;
  _handleNewReserveFactor(marketID, newReserveFactorMantissa);
}

export function handleMint(event: Mint): void {
  const minter = event.params.minter;
  const mintAmount = event.params.mintAmount;
  const contract = CToken.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.minter
  );
  _handleMint(
    comptrollerAddr,
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
  const contract = CToken.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.redeemer
  );
  _handleRedeem(
    comptrollerAddr,
    redeemer,
    redeemAmount,
    outputTokenSupplyResult,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleBorrow(event: BorrowEvent): void {
  const borrower = event.params.borrower;
  const borrowAmount = event.params.borrowAmount;
  const totalBorrows = event.params.totalBorrows;
  const contract = CToken.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleBorrow(
    comptrollerAddr,
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
  const contract = CToken.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleRepayBorrow(
    comptrollerAddr,
    borrower,
    payer,
    repayAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event
  );
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const cTokenCollateral = event.params.qiTokenCollateral;
  const liquidator = event.params.liquidator;
  const borrower = event.params.borrower;
  const seizeTokens = event.params.seizeTokens;
  const repayAmount = event.params.repayAmount;
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
  const marketAddress = event.address;
  setMarketRewards(marketAddress, event.block.number.toI32());

  const cTokenContract = CToken.bind(marketAddress);
  const protocol = getOrCreateProtocol();
  const oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerTimestamp(),
    cTokenContract.try_borrowRatePerTimestamp(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    SECONDS_PER_YEAR
  );

  const interestAccumulated = event.params.interestAccumulated;
  const totalBorrows = event.params.totalBorrows;
  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    false, // do not update all market prices
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
  const comptroller = Comptroller.bind(comptrollerAddr);
  const protocolData = new ProtocolData(
    comptrollerAddr,
    "BENQI",
    "benqi",
    Network.AVALANCHE,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );

  return _getOrCreateProtocol(protocolData);
}

// rewardTokens = [QI-supply, AVAX-supply, QI-borrow, AVAX-borrow]
function initMarketRewards(marketID: string): void {
  const market = Market.load(marketID);
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
  const marketID = marketAddress.toHexString();
  const market = Market.load(marketID);
  if (!market) {
    log.warning("[setMarketRewards] Market not found: {}", [marketID]);
    return;
  }

  const AVAXMarket = Market.load(qiAVAXAddr.toHexString());
  if (!AVAXMarket) {
    log.warning("[setMarketRewards] qiAVAX market not found: {}", [
      qiAVAXAddr.toHexString(),
    ]);
    return;
  }

  let QiPriceUSD = BIGDECIMAL_ZERO;
  const AVAXPriceUSD = AVAXMarket.inputTokenPriceUSD;
  if (blockNumber >= TraderJoeQiWavaxPairStartBlock) {
    const oneQiInAVAX = getOneQiInAVAX();
    QiPriceUSD = AVAXPriceUSD.times(oneQiInAVAX);
  }

  let supplyQiEmission: RewardTokenEmission;
  let supplyAVAXEmission: RewardTokenEmission;
  let borrowQiEmission: RewardTokenEmission;
  let borrowAVAXEmission: RewardTokenEmission;

  // In Comptroller, 0 = Qi, 1 = AVAX
  if (blockNumber < 14000970) {
    // before 0xb8b3dc402f7e5BfB2883D9Ab1641CEC95D88702D gets deployed
    const oldComptroller = OldComptroller.bind(oldComptrollerAddr);
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
    const comptroller = Comptroller.bind(comptrollerAddr);
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
  const rewardAmountPerSecond = rewardSpeedsResult.value;
  const rewardAmount = rewardAmountPerSecond.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  const rewardUSD = rewardAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(tokenDecimals))
    .times(tokenPriceUSD);
  return new RewardTokenEmission(rewardAmount, rewardUSD);
}

// Fetch Qi vs AVAX price from Trader Joe
function getOneQiInAVAX(): BigDecimal {
  const joePairContract = JoePair.bind(TraderJoeQiWavaxPairAddr);
  const getReservesResult = joePairContract.try_getReserves();
  if (getReservesResult.reverted) {
    log.warning("[getOneQiInAVAX] result reverted", []);
    return BIGDECIMAL_ZERO;
  }
  const QiReserve = getReservesResult.value.value0;
  const WAVAXReserve = getReservesResult.value.value1;
  return WAVAXReserve.toBigDecimal().div(QiReserve.toBigDecimal());
}
