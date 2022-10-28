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
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  CONFIG_KEYS_ADDRESSES,
  InterestRateSide,
  InterestRateType,
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
  getOrCreateMarket,
  getOrCreatePoolToken,
  getOrCreateProtocol,
} from "../common/getters";
import { CreditLine } from "../../generated/templates/TranchedPool/CreditLine";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  snapshotFinancials,
  snapshotMarket,
  updateRevenues,
  updateUsageMetrics,
} from "../common/helpers";

export function handleCreditLineMigrated(event: CreditLineMigrated): void {
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market._creditLine = event.params.newCreditLine.toHexString();
  const creditLineContract = CreditLine.bind(event.params.newCreditLine);
  if (creditLineContract.currentLimit().le(BIGINT_ZERO)) {
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
  const creditLineContract = CreditLineContract.bind(
    Address.fromString(market._creditLine!)
  );
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

  const protocol = getOrCreateProtocol();
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(amountUSD);
  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.plus(amountUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.save();

  snapshotMarket(market, amountUSD, event, TransactionType.DEPOSIT);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.DEPOSIT);
  updateUsageMetrics(protocol, owner, event, TransactionType.DEPOSIT);

  // save a mapping of tokenID to market (tranched pool) id for backer emission reward
  const tokenId = event.params.tokenId.toHexString();
  getOrCreatePoolToken(tokenId, market.id);

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

  const market = getOrCreateMarket(marketID, event);
  const creditLineContract = CreditLineContract.bind(
    Address.fromString(market._creditLine!)
  );
  market.inputTokenBalance = creditLineContract.balance();
  market.totalDepositBalanceUSD =
    market.totalDepositBalanceUSD.minus(principalAmountUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.save();

  const protocol = getOrCreateProtocol();
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

  const market = getOrCreateMarket(marketID, event);
  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.plus(amountUSD);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
  market.save();

  const protocol = getOrCreateProtocol();
  protocol.totalBorrowBalanceUSD =
    protocol.totalBorrowBalanceUSD.plus(amountUSD);
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(amountUSD);
  protocol.save();

  snapshotMarket(market, amountUSD, event, TransactionType.BORROW);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.BORROW);
  updateUsageMetrics(protocol, borrower, event, TransactionType.BORROW);

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
  if (market._borrower != payer) {
    // if payer != borrower, use borrower for position
  }

  market.totalBorrowBalanceUSD =
    market.totalBorrowBalanceUSD.minus(principleAmountUSD);
  if (event.params.remainingAmount.equals(BIGINT_ZERO)) {
    // close borrow position
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
  borrowerInterestRate.rate = interestAmountUSD
    .div(market.totalBorrowBalanceUSD)
    .times(InterestRateScaler)
    .times(BIGDECIMAL_HUNDRED);
  borrowerInterestRate.save();
  // senior and junior rates are different, this is an average of them
  const lenderInterestRateID = `${marketID}-${InterestRateSide.LENDER}-${InterestRateType.STABLE}`;
  const lenderInterestRate = new InterestRate(lenderInterestRateID);
  lenderInterestRate.rate = interestAmountUSD
    .div(market.totalDepositBalanceUSD)
    .times(InterestRateScaler)
    .times(BIGDECIMAL_HUNDRED);
  lenderInterestRate.save();

  market.rates = [borrowerInterestRate.id, lenderInterestRate.id];
  market._interestTimestamp = event.block.timestamp;

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
}
