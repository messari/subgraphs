import { Address, BigInt, dataSource, log } from "@graphprotocol/graph-ts";
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
  BIGINT_ZERO,
  SECONDS_PER_DAY,
  exponentToBigDecimal,
  bigDecimalToBigInt,
  RewardTokenType,
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
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import { getNetworkSpecificConstant } from "./constants";

import { StakingRewardsCreated } from "../../../generated/StakingRewardsFactory/StakingRewardsFactory";
import { StakingRewards as StakingRewardsTemplate } from "../../../generated/templates";
import {
  RewardPaid,
  StakingRewards as StakingRewardsContract,
} from "../../../generated/templates/StakingRewards/StakingRewards";

// Constant values
const constant = getNetworkSpecificConstant();
const comptrollerAddr = constant.comptrollerAddr;
const network = constant.network;
const unitPerYear = constant.unitPerYear;

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const protocol = getOrCreateProtocol();
  const newPriceOracle = event.params.newPriceOracle;
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

  const cTokenAddr = event.params.cToken;
  const cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }

  // handle edge case
  // iron bank (ethereum) has 2 cySUSD tokens: 0x4e3a36a633f63aee0ab57b5054ec78867cb3c0b8 (deployed earlier) and 0xa7c4054AFD3DbBbF5bFe80f41862b89ea05c9806 (in use)
  // the former totalBorrows is unreasonably huge for some reason
  // according to iron bank dashboard https://app.ib.xyz/markets/Ethereum we should use the newer one instead, which has reasonable totalBorrows number
  // since the bad version only exists for 20+ blocks, it is fine to skip it
  if (
    dataSource.network() == "mainnet" &&
    cTokenAddr ==
      Address.fromString("0x4e3a36a633f63aee0ab57b5054ec78867cb3c0b8")
  ) {
    return;
  }

  // this is a new cToken, a new underlying token, and a new market

  const protocol = getOrCreateProtocol();
  const cTokenContract = CToken.bind(event.params.cToken);
  const cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO
  );

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
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const marketID = event.params.cToken.toHexString();
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
  const marketID = event.params.cToken.toHexString();
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
  const cTokenCollateral = event.params.cTokenCollateral;
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
  const cTokenContract = CToken.bind(marketAddress);
  const protocol = getOrCreateProtocol();
  const oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    unitPerYear
  );
  const interestAccumulated = event.params.interestAccumulated;
  const totalBorrows = event.params.totalBorrows;
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

export function handleStakingRewardsCreated(
  event: StakingRewardsCreated
): void {
  log.info(
    "[handleStakingRewardsCreated]StakingReward contract {} created for token {} at tx {}",
    [
      event.params.stakingRewards.toHexString(),
      event.params.stakingToken.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );

  StakingRewardsTemplate.create(event.params.stakingRewards);
}

export function handleRewardPaid(event: RewardPaid): void {
  const rewardContract = StakingRewardsContract.bind(event.address);
  const marketID = rewardContract.getStakingToken().toHexString();

  const market = Market.load(marketID);
  if (!market) {
    log.error(
      "[handleRewardPaid]market does not exist for staking token {} at tx {}",
      [marketID, event.transaction.hash.toHexString()]
    );
    return;
  }
  // to get token decimals & prices
  const token = Token.load(event.params.rewardsToken.toHexString())!;

  const marketRewardTokens = market.rewardTokens;
  if (!marketRewardTokens || marketRewardTokens.length == 0) {
    const rewardTokenID = `${RewardTokenType.DEPOSIT}-${token.id}`;
    let rewardToken = RewardToken.load(rewardTokenID);
    if (!rewardToken) {
      rewardToken = new RewardToken(rewardTokenID);
      rewardToken.type = RewardTokenType.DEPOSIT;
      rewardToken.save();
    }
    market.rewardTokens = [rewardToken.id];
  }

  const _cumulativeRewardAmount = market._cumulativeRewardAmount;
  if (_cumulativeRewardAmount) {
    market._cumulativeRewardAmount = market._cumulativeRewardAmount!.plus(
      event.params.reward
    );
  } else {
    market._cumulativeRewardAmount = event.params.reward;
  }
  market.save();

  const currTimestamp = event.block.timestamp;
  if (!market._rewardLastUpdatedTimestamp) {
    log.info(
      "[handleRewardPaid]_rewardLastUpdatedTimestamp for market {} not set, skip updating reward emission, current timestamp={}",
      [market.id, currTimestamp.toString()]
    );
    market._rewardLastUpdatedTimestamp = currTimestamp;
    market.save();
    return;
  }

  // update reward emission every day or longer
  if (
    currTimestamp.lt(
      market._rewardLastUpdatedTimestamp!.plus(BigInt.fromI32(SECONDS_PER_DAY))
    )
  ) {
    log.info(
      "[handleRewardPaid]Reward emission updated less than 1 day ago (_rewardLastUpdatedTimestamp={}, current timestamp={}), skip updating reward emission",
      [market._rewardLastUpdatedTimestamp!.toString(), currTimestamp.toString()]
    );
    return;
  }

  const secondsSince = currTimestamp
    .minus(market._rewardLastUpdatedTimestamp!)
    .toBigDecimal();
  const dailyScaler = BigInt.fromI32(SECONDS_PER_DAY).divDecimal(secondsSince);
  const rewardTokenEmissionsAmount = bigDecimalToBigInt(
    market._cumulativeRewardAmount!.toBigDecimal().times(dailyScaler)
  );

  const rewardTokenEmissionsUSD = rewardTokenEmissionsAmount
    .divDecimal(exponentToBigDecimal(token.decimals))
    .times(token.lastPriceUSD!);
  market.rewardTokenEmissionsAmount = [rewardTokenEmissionsAmount];
  market.rewardTokenEmissionsUSD = [rewardTokenEmissionsUSD];

  //reset _cumulativeRewardAmount and _rewardTimestamp for next update
  market._rewardLastUpdatedTimestamp = currTimestamp;
  market._cumulativeRewardAmount = BIGINT_ZERO;
  market.save();
}

function getOrCreateProtocol(): LendingProtocol {
  const comptroller = Comptroller.bind(comptrollerAddr);
  const protocolData = new ProtocolData(
    comptrollerAddr,
    "Iron Bank",
    "iron-bank",
    network,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}
