import { InterestRate, TranchedPool, _PoolToken } from "../../generated/schema";
import { GoldfinchConfig as GoldfinchConfigContract } from "../../generated/templates/TranchedPool/GoldfinchConfig";
import { CreditLine as CreditLineContract } from "../../generated/templates/TranchedPool/CreditLine";
import {
  TranchedPool as TranchedPoolContract,
  CreditLineMigrated,
  DepositMade,
  DrawdownsPaused,
  DrawdownsUnpaused,
  WithdrawalMade,
  TrancheLocked,
  SliceCreated,
  EmergencyShutdown,
  DrawdownMade,
  PaymentApplied,
  ReserveFundsCollected,
} from "../../generated/templates/TranchedPool/TranchedPool";
import { PoolTokens as PoolTokensContract } from "../../generated/templates/TranchedPool/PoolTokens";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  CONFIG_KEYS_ADDRESSES,
  GFI_ADDRESS,
  InterestRateSide,
  InterestRateType,
  PositionSide,
  RewardTokenType,
  SECONDS_PER_YEAR,
  TransactionType,
  USDC_DECIMALS,
} from "../common/constants";
import { createTransactionFromEvent } from "../entities/helpers";
import {
  handleDeposit,
  updatePoolCreditLine,
  initOrUpdateTranchedPool,
  updatePoolRewardsClaimable,
  updatePoolTokensRedeemable,
  getLeverageRatioFromConfig,
} from "../entities/tranched_pool";
import { getOrInitUser } from "../entities/user";
import { createZapMaybe, deleteZapAfterUnzapMaybe } from "../entities/zapper";
import { getAddressFromConfig } from "../common/utils";
import {
  getOrCreateAccount,
  getOrCreateMarket,
  getOrCreatePoolToken,
  getOrCreateProtocol,
  getOrCreateRewardToken,
} from "../common/getters";
import { CreditLine } from "../../generated/templates/TranchedPool/CreditLine";
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  createTransaction,
  snapshotFinancials,
  snapshotMarket,
  updatePosition,
  updateRevenues,
  updateUsageMetrics,
} from "../common/helpers";

export function handleCreditLineMigrated(event: CreditLineMigrated): void {
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market._creditLine = event.params.newCreditLine.toHexString();
  const creditLineContract = CreditLine.bind(event.params.newCreditLine);
  const currentLimitResult = creditLineContract.try_currentLimit();
  if (
    !currentLimitResult.reverted &&
    currentLimitResult.value.le(BIGINT_ZERO)
  ) {
    creditLineContract.interestApr();
    market.canBorrowFrom = false;
  }
  market.save();

  //
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
  updatePoolCreditLine(event.address, event.block.timestamp);
}

export function handleDepositMade(event: DepositMade): void {
  const marketID = event.address.toHexString();
  const amount = event.params.amount;
  const amountUSD = amount.divDecimal(USDC_DECIMALS);
  const owner = event.params.owner.toHexString();

  const market = getOrCreateMarket(marketID, event);

  const tranchedPoolContract = TranchedPoolContract.bind(event.address);
  const configContract = GoldfinchConfigContract.bind(
    tranchedPoolContract.config()
  );
  const rewardTokenAddress = Address.fromString(GFI_ADDRESS);
  const rewardToken = getOrCreateRewardToken(
    rewardTokenAddress,
    RewardTokenType.DEPOSIT
  );

  market.rewardTokens = [rewardToken.id];

  if (!market._poolToken) {
    market._poolToken = configContract
      .getAddress(BigInt.fromI32(CONFIG_KEYS_ADDRESSES.PoolTokens))
      .toHexString();
  }

  const creditLineAddress = tranchedPoolContract.creditLine();
  const creditLineContract = CreditLineContract.bind(creditLineAddress);
  if (!market._creditLine) {
    market._creditLine = creditLineAddress.toHexString();
  }

  const curretLimitResult = creditLineContract.try_currentLimit();
  if (!curretLimitResult.reverted && curretLimitResult.value.gt(BIGINT_ZERO)) {
    market.isActive = true;
    market.canBorrowFrom = true;
  }

  market.inputTokenBalance = creditLineContract.balance();
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
  market.totalDepositBalanceUSD = market.totalDepositBalanceUSD.plus(amountUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  // calculate average daily emission since first deposit
  if (!market._rewardTimestamp) {
    market._rewardTimestamp = event.block.timestamp;
    market._cumulativeRewardAmount = BIGINT_ZERO;
  }
  market.save();
  log.info(
    "[handleDepositMade]depositAmountUSD={},totalDepositBalanceUSD={},tx={}",
    [
      amountUSD.toString(),
      market.totalDepositBalanceUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  const protocol = getOrCreateProtocol();
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(amountUSD);
  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.plus(amountUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.save();

  snapshotMarket(market, amountUSD, event, TransactionType.DEPOSIT);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.DEPOSIT);
  updateUsageMetrics(protocol, owner, event, TransactionType.DEPOSIT);

  const account = getOrCreateAccount(owner);
  const poolTokensContract = PoolTokensContract.bind(
    Address.fromString(market._poolToken!)
  );
  const accountBalance = poolTokensContract
    .tokens(event.params.tokenId)
    .getPrincipalAmount();
  const positionID = updatePosition(
    protocol,
    market,
    account,
    accountBalance,
    PositionSide.LENDER,
    TransactionType.DEPOSIT,
    event
  );

  createTransaction(
    TransactionType.DEPOSIT,
    market,
    owner,
    positionID,
    amount,
    amountUSD,
    event
  );

  // save a mapping of tokenID to market (tranched pool) id for backer emission reward
  //const tokenId = event.params.tokenId.toHexString();
  //getOrCreatePoolToken(tokenId, market.id);
  //log.info("[handleDepositMade]poolToken({}, {})", [tokenId, market.id]);

  //
  handleDeposit(event);

  createTransactionFromEvent(
    event,
    "TRANCHED_POOL_DEPOSIT",
    event.params.owner,
    event.params.amount,
    "USDC",
    event.address.toHexString()
  );

  createZapMaybe(event);
}

export function handleDrawdownsPaused(event: DrawdownsPaused): void {
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market.canBorrowFrom = false;
  market.save();
  //
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
}

export function handleDrawdownsUnpaused(event: DrawdownsUnpaused): void {
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market.canBorrowFrom = true;
  market.save();
  //
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
}

export function handleWithdrawalMade(event: WithdrawalMade): void {
  const marketID = event.address.toHexString();
  const amount = event.params.principalWithdrawn.plus(
    event.params.principalWithdrawn
  );
  const principalAmountUSD =
    event.params.principalWithdrawn.divDecimal(USDC_DECIMALS);
  const owner = event.params.owner.toHexString();

  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(marketID, event);

  const creditLineContract = CreditLineContract.bind(
    Address.fromString(market._creditLine!)
  );
  market.inputTokenBalance = creditLineContract.balance();
  market.totalDepositBalanceUSD =
    market.totalDepositBalanceUSD.minus(principalAmountUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.save();
  log.info(
    "[handleWithdrawalMade]withdrawAmountUSD={},totalDepositBalanceUSD={},tx={}",
    [
      principalAmountUSD.toString(),
      market.totalDepositBalanceUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.minus(principalAmountUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.save();

  snapshotMarket(market, principalAmountUSD, event, TransactionType.WITHDRAW);
  snapshotFinancials(
    protocol,
    principalAmountUSD,
    event,
    TransactionType.WITHDRAW
  );
  updateUsageMetrics(protocol, owner, event, TransactionType.WITHDRAW);

  const account = getOrCreateAccount(owner);
  const poolTokensContract = PoolTokensContract.bind(
    Address.fromString(market._poolToken!)
  );
  const accountBalance = poolTokensContract
    .tokens(event.params.tokenId)
    .getPrincipalAmount();
  const positionID = updatePosition(
    protocol,
    market,
    account,
    accountBalance,
    PositionSide.LENDER,
    TransactionType.WITHDRAW,
    event
  );

  createTransaction(
    TransactionType.WITHDRAW,
    market,
    owner,
    positionID,
    event.params.principalWithdrawn,
    principalAmountUSD,
    event
  );

  //
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
  updatePoolCreditLine(event.address, event.block.timestamp);

  const tranchedPoolContract = TranchedPoolContract.bind(event.address);
  const seniorPoolAddress = getAddressFromConfig(
    tranchedPoolContract,
    CONFIG_KEYS_ADDRESSES.SeniorPool
  );

  const category = event.params.owner.equals(seniorPoolAddress)
    ? "SENIOR_POOL_REDEMPTION"
    : "TRANCHED_POOL_WITHDRAWAL";
  createTransactionFromEvent(
    event,
    category,
    event.params.owner,
    amount,
    "USDC",
    event.address.toHexString()
  );

  deleteZapAfterUnzapMaybe(event);
}

export function handleTrancheLocked(event: TrancheLocked): void {
  const marketID = event.address.toHexString();
  const market = getOrCreateMarket(marketID, event);
  log.debug(
    "[handleTrancheLocked]market._interestTimestamp for market {} set to {}",
    [marketID, event.block.timestamp.toString()]
  );
  market._interestTimestamp = event.block.timestamp;
  market.save();
  //
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
  updatePoolCreditLine(event.address, event.block.timestamp);

  const tranchedPoolContract = TranchedPoolContract.bind(event.address);
  const goldfinchConfigContract = GoldfinchConfigContract.bind(
    tranchedPoolContract.config()
  );
  const tranchedPool = assert(TranchedPool.load(event.address.toHexString()));
  tranchedPool.estimatedLeverageRatio = getLeverageRatioFromConfig(
    goldfinchConfigContract
  );
  tranchedPool.save();
}

export function handleSliceCreated(event: SliceCreated): void {
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
  updatePoolCreditLine(event.address, event.block.timestamp);
}

export function handleEmergencyShutdown(event: EmergencyShutdown): void {
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market.canBorrowFrom = false;
  market.isActive = false;
  market.save();
  //
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
  updatePoolCreditLine(event.address, event.block.timestamp);
}

export function handleDrawdownMade(event: DrawdownMade): void {
  const marketID = event.address.toHexString();
  const amount = event.params.amount;
  const amountUSD = amount.divDecimal(USDC_DECIMALS);
  const borrower = event.params.borrower.toHexString();

  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(marketID, event);

  if (!market._interestTimestamp) {
    market._interestTimestamp = event.block.timestamp;
    log.debug(
      "[handleDrawdownMade]market._interestTimestamp for market {} set to {}",
      [marketID, event.block.timestamp.toString()]
    );
  }
  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.plus(amountUSD);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
  market.save();

  protocol.totalBorrowBalanceUSD =
    protocol.totalBorrowBalanceUSD.plus(amountUSD);
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(amountUSD);
  protocol.save();

  snapshotMarket(market, amountUSD, event, TransactionType.BORROW);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.BORROW);
  updateUsageMetrics(protocol, borrower, event, TransactionType.BORROW);

  const account = getOrCreateAccount(borrower);
  const creditLineContract = CreditLineContract.bind(
    Address.fromString(market._creditLine!)
  );
  const accountBalance = creditLineContract.balance();
  const positionID = updatePosition(
    protocol,
    market,
    account,
    accountBalance,
    PositionSide.BORROWER,
    TransactionType.BORROW,
    event
  );

  createTransaction(
    TransactionType.BORROW,
    market,
    borrower,
    positionID,
    amount,
    amountUSD,
    event
  );

  //
  const tranchedPool = assert(TranchedPool.load(marketID));
  getOrInitUser(event.params.borrower); // ensures that a wallet making a drawdown is correctly considered a user
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
  updatePoolCreditLine(event.address, event.block.timestamp);
  updatePoolTokensRedeemable(tranchedPool);

  createTransactionFromEvent(
    event,
    "TRANCHED_POOL_DRAWDOWN",
    event.params.borrower,
    event.params.amount,
    "USDC",
    tranchedPool.id
  );
}

export function handlePaymentApplied(event: PaymentApplied): void {
  const marketID = event.address.toHexString();
  const amount = event.params.interestAmount.plus(event.params.principalAmount);
  const interestAmountUSD =
    event.params.interestAmount.divDecimal(USDC_DECIMALS);
  const principleAmountUSD =
    event.params.principalAmount.divDecimal(USDC_DECIMALS);
  const payer = event.params.payer.toHexString();

  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(marketID, event);
  /*
  if (market._borrower != payer) {
    // if payer != borrower, use borrower for position
    log.error("[]payer {} != borrower {}", [payer, market._borrower!]);
  }
  */

  market.totalBorrowBalanceUSD =
    market.totalBorrowBalanceUSD.minus(principleAmountUSD);
  protocol.totalBorrowBalanceUSD =
    protocol.totalBorrowBalanceUSD.minus(principleAmountUSD);

  if (!market._interestTimestamp) {
    log.error(
      "[handlePaymentApplied]market._interestTimestamp for market {} not set",
      [marketID]
    );
    market._interestTimestamp = event.block.timestamp;
    market.save();
    return;
  }

  if (market.totalBorrowBalanceUSD.equals(BIGDECIMAL_ZERO)) {
    log.error(
      "[handlePaymentApplied]market.totalBorrowBalanceUSD={} for market {} at tx {}",
      [
        market.totalBorrowBalanceUSD.toString(),
        marketID,
        event.transaction.hash.toHexString(),
      ]
    );
    return;
  }
  if (market.totalDepositBalanceUSD.equals(BIGDECIMAL_ZERO)) {
    log.error(
      "[handlePaymentApplied]market.totalDepositBalanceUSD={} for market {} at tx {}",
      [
        market.totalDepositBalanceUSD.toString(),
        marketID,
        event.transaction.hash.toHexString(),
      ]
    );
    return;
  }

  // scale interest rate to APR
  // since interest is not compounding, apply a linear scaler based on time
  const InterestRateScaler = BigInt.fromI32(SECONDS_PER_YEAR).divDecimal(
    event.block.timestamp.minus(market._interestTimestamp!).toBigDecimal()
  );
  // even though rates are supposed to be "STABLE", but there may be late payment, writedown
  // the actual rate may not be stable
  const borrowerInterestRateID = `${marketID}-${InterestRateSide.BORROWER}-${InterestRateType.STABLE}`;
  const borrowerInterestRate = new InterestRate(borrowerInterestRateID);
  borrowerInterestRate.side = InterestRateSide.BORROWER;
  borrowerInterestRate.type = InterestRateType.STABLE;
  borrowerInterestRate.rate = interestAmountUSD
    .div(market.totalBorrowBalanceUSD)
    .times(InterestRateScaler)
    .times(BIGDECIMAL_HUNDRED);
  borrowerInterestRate.save();
  // senior and junior rates are different, this is an average of them
  const lenderInterestRateID = `${marketID}-${InterestRateSide.LENDER}-${InterestRateType.STABLE}`;
  const lenderInterestRate = new InterestRate(lenderInterestRateID);
  lenderInterestRate.side = InterestRateSide.LENDER;
  lenderInterestRate.type = InterestRateType.STABLE;
  lenderInterestRate.rate = interestAmountUSD
    .div(market.totalDepositBalanceUSD)
    .times(InterestRateScaler)
    .times(BIGDECIMAL_HUNDRED);
  lenderInterestRate.save();

  market.rates = [borrowerInterestRate.id, lenderInterestRate.id];
  market._interestTimestamp = event.block.timestamp;

  market.save();
  protocol.save();

  updateRevenues(
    protocol,
    market,
    interestAmountUSD,
    BIGDECIMAL_ZERO,
    event,
    true // update protocol level revenues
  );
  snapshotMarket(
    market,
    principleAmountUSD,
    event,
    TransactionType.REPAY,
    true //snapshotRates
  );
  snapshotFinancials(
    protocol,
    principleAmountUSD,
    event,
    TransactionType.REPAY
  );
  updateUsageMetrics(protocol, payer, event, TransactionType.REPAY);

  const account = getOrCreateAccount(payer);
  const creditLineContract = CreditLineContract.bind(
    Address.fromString(market._creditLine!)
  );
  const accountBalance = creditLineContract.balance();
  const positionID = updatePosition(
    protocol,
    market,
    account,
    accountBalance,
    PositionSide.BORROWER,
    TransactionType.REPAY,
    event
  );

  createTransaction(
    TransactionType.REPAY,
    market,
    market._borrower!,
    positionID,
    amount,
    principleAmountUSD,
    event
  );

  //
  getOrInitUser(event.params.payer); // ensures that a wallet making a payment is correctly considered a user
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
  updatePoolCreditLine(event.address, event.block.timestamp);

  const tranchedPool = assert(TranchedPool.load(event.address.toHexString()));
  tranchedPool.principalAmountRepaid = tranchedPool.principalAmountRepaid.plus(
    event.params.principalAmount
  );
  tranchedPool.interestAmountRepaid = tranchedPool.interestAmountRepaid.plus(
    event.params.interestAmount
  );
  tranchedPool.save();

  updatePoolTokensRedeemable(tranchedPool);
  updatePoolRewardsClaimable(
    tranchedPool,
    TranchedPoolContract.bind(event.address)
  );

  createTransactionFromEvent(
    event,
    "TRANCHED_POOL_REPAYMENT",
    event.params.payer,
    amount,
    "USDC",
    tranchedPool.id
  );
}

export function handleReserveFundsCollected(
  event: ReserveFundsCollected
): void {
  const marketID = event.address.toHexString();
  const amountUSD = event.params.amount.divDecimal(USDC_DECIMALS);
  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(marketID, event);

  updateRevenues(protocol, market, BIGDECIMAL_ZERO, amountUSD, event, true);
  //snapshots updated by updateRevenues()
}
