import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
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
  LendingProtocol,
  Market,
  MarketDailySnapshot,
  RewardToken,
  Token,
} from "../../../generated/schema";
import {
  cTokenDecimals,
  Network,
  BIGINT_ZERO,
  SECONDS_PER_YEAR,
  RewardTokenType,
  SECONDS_PER_DAY,
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
  getMarketDailySnapshotID,
  _handleTransfer,
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import {
  comptrollerAddr,
  JOE_ADDRESS,
  REWARD_DISTRIBUTOR_ADDRESS,
  WAVAX_ADDRESS,
} from "./constants";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import { RewardDistributor as RewardsContract } from "../../../generated/templates/CToken/RewardDistributor";

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
  const cTokenCollateral = event.params.jTokenCollateral;
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
  const market = Market.load(marketAddress.toHexString());
  const cTokenContract = CToken.bind(marketAddress);
  const protocol = getOrCreateProtocol();
  const oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerSecond(),
    cTokenContract.try_borrowRatePerSecond(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    SECONDS_PER_YEAR
  );
  const interestAccumulated = event.params.interestAccumulated;
  const totalBorrows = event.params.totalBorrows;

  // check for the state of canBorrowFrom and canUseAsCollateral on this market
  // the events do not seem to reflect the contract state
  const marketDailySnapshotID = getMarketDailySnapshotID(
    marketAddress.toHexString(),
    event.block.timestamp.toI32()
  );
  const marketDailySnapshot = MarketDailySnapshot.load(marketDailySnapshotID);
  if (!market) {
    log.warning("[handleAccrueInterest] market not found for address: {}", [
      marketAddress.toHexString(),
    ]);
    return;
  }
  if (!marketDailySnapshot) {
    // make a check for canBorrowFrom / canUseAsCollateral
    const comptroller = Comptroller.bind(comptrollerAddr);
    const tryBorrowPaused = comptroller.try_borrowGuardianPaused(marketAddress);
    const tryMintPaused = comptroller.try_mintGuardianPaused(marketAddress);
    market.canBorrowFrom = !tryBorrowPaused.reverted
      ? !tryBorrowPaused.value
      : market.canBorrowFrom;
    market.isActive = !tryMintPaused.reverted
      ? !tryMintPaused.value
      : market.isActive;
    market.save();
  }

  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    false, // do not update all market prices
    event
  );

  // reward distribution contract not deployed until block 15711425
  if (event.block.number.toI32() < 15711425) {
    updateRewards(event.address);
  }
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
    "Banker Joe",
    "banker-joe",
    Network.AVALANCHE,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}

// Emits rewards in AVAX or JOE
function updateRewards(marketID: Address): void {
  const market = Market.load(marketID.toHexString());
  if (!market) {
    log.warning("[updateRewards] market not found for address: {}", [
      marketID.toHexString(),
    ]);
    return;
  }
  const rewardsContract = RewardsContract.bind(REWARD_DISTRIBUTOR_ADDRESS);

  // always in this order to stay alphabetical
  const tryBorrowRewardSpeedsAVAX = rewardsContract.try_rewardBorrowSpeeds(
    1,
    Address.fromString(market.outputToken!)
  );
  const tryBorrowRewardSpeedsJOE = rewardsContract.try_rewardBorrowSpeeds(
    0,
    Address.fromString(market.outputToken!)
  );
  const trySupplyRewardSpeedsAVAX = rewardsContract.try_rewardSupplySpeeds(
    1,
    Address.fromString(market.outputToken!)
  );
  const trySupplyRewardSpeedsJOE = rewardsContract.try_rewardSupplySpeeds(
    0,
    Address.fromString(market.outputToken!)
  );

  const rewardTokens: string[] = [];
  const rewardAmounts: BigInt[] = [];
  const rewardEmissionsUSD: BigDecimal[] = [];

  if (!tryBorrowRewardSpeedsAVAX.reverted) {
    const rewardToken = getOrCreateRewardToken(
      WAVAX_ADDRESS,
      RewardTokenType.BORROW
    );
    const token = Token.load(rewardToken.token);
    if (!token) {
      log.warning("[updateRewards] token not found for address: {}", [
        WAVAX_ADDRESS.toHexString(),
      ]);
      return;
    }
    rewardTokens.push(rewardToken.id);
    const rewardsBI = tryBorrowRewardSpeedsAVAX.value.times(
      BigInt.fromI64(SECONDS_PER_DAY)
    );
    rewardAmounts.push(rewardsBI);
    rewardEmissionsUSD.push(
      rewardsBI
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(token.lastPriceUSD!)
    );
  }

  if (!tryBorrowRewardSpeedsJOE.reverted) {
    const rewardToken = getOrCreateRewardToken(
      JOE_ADDRESS,
      RewardTokenType.BORROW
    );
    const token = Token.load(rewardToken.token);
    if (!token) {
      log.warning("[updateRewards] token not found for address: {}", [
        JOE_ADDRESS.toHexString(),
      ]);
      return;
    }
    rewardTokens.push(rewardToken.id);
    const rewardsBI = tryBorrowRewardSpeedsJOE.value.times(
      BigInt.fromI64(SECONDS_PER_DAY)
    );
    rewardAmounts.push(rewardsBI);
    rewardEmissionsUSD.push(
      rewardsBI
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(token.lastPriceUSD!)
    );
  }

  if (!trySupplyRewardSpeedsAVAX.reverted) {
    const rewardToken = getOrCreateRewardToken(
      WAVAX_ADDRESS,
      RewardTokenType.DEPOSIT
    );
    const token = Token.load(rewardToken.token);
    if (!token) {
      log.warning("[updateRewards] token not found for address: {}", [
        WAVAX_ADDRESS.toHexString(),
      ]);
      return;
    }
    rewardTokens.push(rewardToken.id);
    const rewardsBI = trySupplyRewardSpeedsAVAX.value.times(
      BigInt.fromI64(SECONDS_PER_DAY)
    );
    rewardAmounts.push(rewardsBI);
    rewardEmissionsUSD.push(
      rewardsBI
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(token.lastPriceUSD!)
    );
  }

  if (!trySupplyRewardSpeedsJOE.reverted) {
    const rewardToken = getOrCreateRewardToken(
      JOE_ADDRESS,
      RewardTokenType.BORROW
    );
    const token = Token.load(rewardToken.token);
    if (!token) {
      log.warning("[updateRewards] token not found for address: {}", [
        JOE_ADDRESS.toHexString(),
      ]);
      return;
    }
    rewardTokens.push(rewardToken.id);
    const rewardsBI = trySupplyRewardSpeedsJOE.value.times(
      BigInt.fromI64(SECONDS_PER_DAY)
    );
    rewardAmounts.push(rewardsBI);
    rewardEmissionsUSD.push(
      rewardsBI
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(token.lastPriceUSD!)
    );
  }

  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = rewardAmounts;
  market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
  market.save();
}

function getOrCreateRewardToken(
  tokenAddress: Address,
  type: string
): RewardToken {
  const rewardTokenID = type.concat("-").concat(tokenAddress.toHexString());
  let rewardToken = RewardToken.load(rewardTokenID);
  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenID);
    rewardToken.type = type;
    rewardToken.token = tokenAddress.toHexString();
    rewardToken.save();
  }

  return rewardToken;
}
