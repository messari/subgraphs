import { TranchedPool } from "../../generated/schema";
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
  SharePriceUpdated,
} from "../../generated/templates/TranchedPool/TranchedPool";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  CONFIG_KEYS_ADDRESSES,
  PositionSide,
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
  getOrCreateProtocol,
} from "../common/getters";
import { CreditLine } from "../../generated/templates/TranchedPool/CreditLine";
import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  createTransaction,
  snapshotFinancials,
  snapshotMarket,
  updatePosition,
  updateRevenues,
  updateUsageMetrics,
} from "../common/helpers";
import {
  _handleDepositMessari,
  _handleDrawdownMessari,
  _handleRepayMessari,
  _handleWithdrawMessari,
} from "./helpers";

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
  const poolContract = TranchedPoolContract.bind(event.address);
  const configAddress = poolContract.config();
  const creditLineAddress = poolContract.creditLine();
  _handleDepositMessari(
    event.address.toHexString(),
    event.params.tokenId,
    event.params.amount,
    event.params.owner.toHexString(),
    configAddress,
    creditLineAddress,
    event
  );

  // save a mapping of tokenID to market (tranched pool) id for backer emission reward
  //const tokenId = event.params.tokenId.toHexString();
  //getOrCreatePoolToken(tokenId, market.id);
  //log.info("[handleDepositMade]poolToken({}, {})", [tokenId, market.id]);

  //
  handleDeposit(event);

  const transaction = createTransactionFromEvent(
    event,
    "TRANCHED_POOL_DEPOSIT",
    event.params.owner
  );
  transaction.loan = event.address.toHexString();
  transaction.sentAmount = event.params.amount;
  transaction.sentToken = "USDC";
  transaction.receivedNftId = event.params.tokenId.toString();
  transaction.receivedNftType = "POOL_TOKEN";
  transaction.save();

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
  _handleWithdrawMessari(
    event.address.toHexString(),
    event.params.principalWithdrawn,
    event.params.owner.toHexString(),
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

  const transaction = createTransactionFromEvent(
    event,
    event.params.owner.equals(seniorPoolAddress)
      ? "SENIOR_POOL_REDEMPTION"
      : "TRANCHED_POOL_WITHDRAWAL",
    event.params.owner
  );
  transaction.transactionHash = event.transaction.hash;
  transaction.loan = event.address.toHexString();
  transaction.sentNftId = event.params.tokenId.toString();
  transaction.sentNftType = "POOL_TOKEN";
  transaction.receivedAmount = event.params.interestWithdrawn.plus(
    event.params.principalWithdrawn
  );
  transaction.receivedToken = "USDC";
  transaction.save();

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
  _handleDrawdownMessari(
    marketID,
    event.params.amount,
    event.params.borrower.toHexString(),
    event
  );

  //
  const tranchedPool = assert(TranchedPool.load(marketID));
  getOrInitUser(event.params.borrower); // ensures that a wallet making a drawdown is correctly considered a user
  initOrUpdateTranchedPool(event.address, event.block.timestamp);
  updatePoolCreditLine(event.address, event.block.timestamp);
  updatePoolTokensRedeemable(tranchedPool);

  const transaction = createTransactionFromEvent(
    event,
    "TRANCHED_POOL_DRAWDOWN",
    event.params.borrower
  );
  transaction.loan = event.address.toHexString();
  transaction.receivedAmount = event.params.amount;
  transaction.receivedToken = "USDC";
  transaction.save();
}

export function handlePaymentApplied(event: PaymentApplied): void {
  _handleRepayMessari(
    event.address.toHexString(),
    event.params.principalAmount,
    event.params.interestAmount,
    event.params.reserveAmount,
    event.params.payer.toHexString(),
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

  const transaction = createTransactionFromEvent(
    event,
    "TRANCHED_POOL_REPAYMENT",
    event.params.payer
  );
  transaction.loan = event.address.toHexString();
  transaction.sentAmount = event.params.principalAmount.plus(
    event.params.interestAmount
  );
  transaction.sentToken = "USDC";
  transaction.save();
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

export function handleSharePriceUpdated(event: SharePriceUpdated): void {
  // handle migrated pools
  const marketID = event.address.toHexString();
  const market = getOrCreateMarket(marketID, event);
  if (!market._isMigratedTranchedPool) {
    // do nothing if it is not a migrated tranched pool
    return;
  }

  const tranchedPoolContract = TranchedPoolContract.bind(event.address);
  market.inputTokenBalance = tranchedPoolContract.getTranche(
    event.params.tranche
  ).principalDeposited;
  market.totalDepositBalanceUSD =
    market.inputTokenBalance.divDecimal(USDC_DECIMALS);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  // treat the migration as a one-off deposit
  market.cumulativeDepositUSD = market.totalDepositBalanceUSD;

  const configContract = GoldfinchConfigContract.bind(
    tranchedPoolContract.config()
  );
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
  const borrower = creditLineContract.borrower().toHexString();

  const curretLimitResult = creditLineContract.try_currentLimit();
  if (!curretLimitResult.reverted && curretLimitResult.value.gt(BIGINT_ZERO)) {
    market.isActive = true;
    market.canBorrowFrom = true;
  }
  const totalBorrowBalance = creditLineContract.balance();
  market.totalBorrowBalanceUSD = totalBorrowBalance.divDecimal(USDC_DECIMALS);

  // set _isMigratedTranchedPool to false, so we only process the migration once
  market._isMigratedTranchedPool = false;
  market.save();

  const protocol = getOrCreateProtocol();
  let marketIDs = protocol._marketIDs!;
  if (marketIDs.indexOf(market.id) < 0) {
    marketIDs = marketIDs.concat([market.id]);
  }
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol._marketIDs!.length; i++) {
    const mktID = protocol._marketIDs![i];
    const mkt = getOrCreateMarket(mktID, event);
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(
      mkt.totalDepositBalanceUSD
    );
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(
      mkt.totalBorrowBalanceUSD
    );
  }
  protocol._marketIDs = marketIDs;
  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  // treat the migration as a one-off deposit
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(
    market.totalDepositBalanceUSD
  );
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(
    market.totalBorrowBalanceUSD
  );
  protocol.save();

  log.info(
    "[handleSharePriceUpdated]migrated tranched pool {}: market.tvl={},market.totalBorrowUSD={},tx={}",
    [
      market.id,
      market.totalDepositBalanceUSD.toString(),
      market.totalBorrowBalanceUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  snapshotMarket(
    market,
    market.totalDepositBalanceUSD,
    event,
    TransactionType.DEPOSIT
  );
  snapshotMarket(
    market,
    market.totalBorrowBalanceUSD,
    event,
    TransactionType.BORROW
  );
  snapshotFinancials(
    protocol,
    market.totalDepositBalanceUSD,
    event,
    TransactionType.DEPOSIT
  );
  snapshotFinancials(
    protocol,
    market.totalBorrowBalanceUSD,
    event,
    TransactionType.BORROW
  );
  updateUsageMetrics(protocol, borrower, event, TransactionType.BORROW);
  // ignore the depositor usage metrics as we have no info

  //handle borrow positin & transaction
  const borrowerAccount = getOrCreateAccount(borrower);
  const borrowPositionID = updatePosition(
    protocol,
    market,
    borrowerAccount,
    totalBorrowBalance,
    PositionSide.BORROWER,
    TransactionType.BORROW,
    event
  );
  createTransaction(
    TransactionType.BORROW,
    market,
    borrower,
    borrowPositionID,
    totalBorrowBalance,
    totalBorrowBalanceUSD,
    event
  );

  //handle lending positin & transaction
  const lenderAccount = getOrCreateAccount(event.params.pool.toHexString());
  const lenderPositionID = updatePosition(
    protocol,
    market,
    lenderAccount,
    market.inputTokenBalance,
    PositionSide.LENDER,
    TransactionType.DEPOSIT,
    event
  );
  createTransaction(
    TransactionType.DEPOSIT,
    market,
    borrower,
    lenderPositionID,
    market.inputTokenBalance,
    market.totalDepositBalanceUSD,
    event
  );
}
