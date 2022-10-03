import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
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
  SECONDS_PER_DAY,
  RewardTokenType,
  exponentToBigDecimal,
  INT_ZERO,
  INT_ONE,
  BIGDECIMAL_ZERO,
  mantissaFactor,
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
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import {
  bstnOracle,
  cBSTNContract,
  comptrollerAddr,
  nativeCToken,
  nativeToken,
  rewardDistributorAddress,
  REWARD_TOKENS,
} from "./constants";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import { RewardDistributor } from "../../../generated/templates/CToken/RewardDistributor";

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let protocol = getOrCreateProtocol();
  let newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
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
  // update rewards for market after the RewardDistributor is created at block 60837741
  if (event.block.number.toI64() > 60837741) {
    updateRewards(marketAddress, event.block.number);
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
  let comptroller = Comptroller.bind(comptrollerAddr);
  let protocolData = new ProtocolData(
    comptrollerAddr,
    "Bastion Protocol",
    "bastion-protocol",
    "2.0.1",
    "1.1.5",
    "1.0.0",
    Network.AURORA,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}

//
//
// Update the rewards arrays in a given market
// can be done for supply / borrow side triggered by Supply/BorrowSpeedUpdate events
function updateRewards(marketAddress: Address, blockNumber: BigInt): void {
  let market = Market.load(marketAddress.toHexString());
  if (!market) {
    log.warning("[updateRewards] Market not found: {}", [
      marketAddress.toHexString(),
    ]);
    return;
  }

  // setup variables and contracts
  let rewardTokens: string[] = [];
  let rewardEmissions: BigInt[] = [];
  let rewardEmissionsUSD: BigDecimal[] = [];

  let rewardDistributorContract = RewardDistributor.bind(
    rewardDistributorAddress
  );

  // look for borrow-side rewards
  // must check both types of rewards (see constants.ts for details)
  let tryBorrowZero = rewardDistributorContract.try_rewardBorrowSpeeds(
    INT_ZERO,
    marketAddress
  );
  let tryBorrowOne = rewardDistributorContract.try_rewardBorrowSpeeds(
    INT_ONE,
    marketAddress
  );
  let borrowRewardSpeed: BigInt | null = null;
  let borrowRewardToken: RewardToken | null = null;
  let token: Token | null = null;

  if (!tryBorrowZero.reverted) {
    borrowRewardSpeed = tryBorrowZero.value;

    // load BSTN token
    token = Token.load(REWARD_TOKENS[INT_ZERO].toHexString());
    if (!token) {
      let BSTNContract = ERC20.bind(REWARD_TOKENS[INT_ZERO]);
      token = new Token(REWARD_TOKENS[INT_ZERO].toHexString());
      token.name = getOrElse<string>(
        BSTNContract.try_name(),
        "Bastion Protocol"
      );
      token.symbol = getOrElse<string>(BSTNContract.try_symbol(), "BSTN");
      token.decimals = getOrElse<i32>(BSTNContract.try_decimals(), 18);
    }
    token.lastPriceUSD = getBastionPrice();
    token.lastPriceBlockNumber = blockNumber;
    token.save();

    borrowRewardToken = getOrCreateRewardToken(token, RewardTokenType.BORROW);
  }

  if (!tryBorrowOne.reverted) {
    if (
      borrowRewardSpeed &&
      borrowRewardSpeed.gt(BIGINT_ZERO) &&
      tryBorrowOne.value.gt(BIGINT_ZERO)
    ) {
      log.warning(
        "[updateRewards] Multiple reward speeds found for borrow side: {} {} {}",
        [
          marketAddress.toHexString(),
          borrowRewardSpeed.toString(),
          tryBorrowOne.value.toString(),
        ]
      );
      return;
    }
    if (tryBorrowOne.value.gt(BIGINT_ZERO)) {
      borrowRewardSpeed = tryBorrowOne.value;

      // load wNEAR token
      token = Token.load(REWARD_TOKENS[INT_ONE].toHexString());
      if (!token) {
        // wNEAR is already made from the NEAR market
        log.warning("[updateRewards] wNEAR not found: {} {}", [
          REWARD_TOKENS[INT_ONE].toHexString(),
          borrowRewardSpeed.toString(),
        ]);
        return;
      }

      borrowRewardToken = getOrCreateRewardToken(token, RewardTokenType.BORROW);
    }
  }

  // if a borrow side reward is successfully found, update rewards
  if (borrowRewardSpeed && token) {
    let priceUSD = token.lastPriceUSD ? token.lastPriceUSD : BIGDECIMAL_ZERO;
    rewardTokens.push(borrowRewardToken!.id);
    let dailyBorrowRewards = borrowRewardSpeed.times(
      BigInt.fromI32(SECONDS_PER_DAY)
    );
    rewardEmissions.push(dailyBorrowRewards);
    rewardEmissionsUSD.push(
      dailyBorrowRewards
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(priceUSD!)
    );
  }

  // look for supply-side rewards
  // must check both types of rewards (see constants.ts for details)
  let trySupplyZero = rewardDistributorContract.try_rewardSupplySpeeds(
    INT_ZERO,
    marketAddress
  );
  let trySupplyOne = rewardDistributorContract.try_rewardSupplySpeeds(
    INT_ONE,
    marketAddress
  );
  let supplyRewardSpeed: BigInt | null = null;
  let supplyRewardToken: RewardToken | null = null;

  if (!trySupplyZero.reverted) {
    supplyRewardSpeed = trySupplyZero.value;

    // load BSTN token
    token = Token.load(REWARD_TOKENS[INT_ZERO].toHexString());
    if (!token) {
      let BSTNContract = ERC20.bind(REWARD_TOKENS[INT_ZERO]);
      token = new Token(REWARD_TOKENS[INT_ZERO].toHexString());
      token.name = getOrElse<string>(
        BSTNContract.try_name(),
        "Bastion Protocol"
      );
      token.symbol = getOrElse<string>(BSTNContract.try_symbol(), "BSTN");
      token.decimals = getOrElse<i32>(BSTNContract.try_decimals(), 18);
    }
    token.lastPriceUSD = getBastionPrice();
    token.lastPriceBlockNumber = blockNumber;
    token.save();

    supplyRewardToken = getOrCreateRewardToken(token, RewardTokenType.DEPOSIT);
  }

  if (!trySupplyOne.reverted) {
    if (
      supplyRewardSpeed &&
      supplyRewardSpeed.gt(BIGINT_ZERO) &&
      trySupplyOne.value.gt(BIGINT_ZERO)
    ) {
      log.warning(
        "[updateRewards] Multiple reward speeds found for supply side: {} {}",
        [marketAddress.toHexString()]
      );
    }

    if (trySupplyOne.value.gt(BIGINT_ZERO)) {
      supplyRewardSpeed = trySupplyOne.value;

      // load wNEAR token
      token = Token.load(REWARD_TOKENS[INT_ONE].toHexString());
      if (!token) {
        // wNEAR is already made from the NEAR market
        log.warning("[updateRewards] wNEAR not found: {}", [
          REWARD_TOKENS[INT_ONE].toHexString(),
        ]);
        return;
      }

      supplyRewardToken = getOrCreateRewardToken(
        token,
        RewardTokenType.DEPOSIT
      );
    }
  }

  // if a supply side reward is successfully found, update rewards
  if (supplyRewardSpeed && token) {
    let priceUSD = token.lastPriceUSD ? token.lastPriceUSD : BIGDECIMAL_ZERO;
    rewardTokens.push(supplyRewardToken!.id);
    let dailySupplyRewards = supplyRewardSpeed.times(
      BigInt.fromI32(SECONDS_PER_DAY)
    );
    rewardEmissions.push(dailySupplyRewards);
    rewardEmissionsUSD.push(
      supplyRewardSpeed
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(priceUSD!)
    );
  }

  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = rewardEmissions;
  market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
  market.save();
}

function getOrCreateRewardToken(token: Token, type: string): RewardToken {
  let rewardTokenId = type + "-" + token.id;
  let rewardToken = RewardToken.load(rewardTokenId);

  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenId);
    rewardToken.token = token.id;
    rewardToken.type = type;
    rewardToken.save();
  }

  return rewardToken;
}

//
//
// Get the current price of BSTN for rewards calculations
function getBastionPrice(): BigDecimal {
  let oracleContract = PriceOracle.bind(bstnOracle);

  let priceUSD = getOrElse(
    oracleContract.try_getUnderlyingPrice(cBSTNContract),
    BIGINT_ZERO
  );
  return priceUSD.toBigDecimal().div(exponentToBigDecimal(mantissaFactor));
}
