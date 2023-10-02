import { GoldfinchConfig as GoldfinchConfigContract } from "../../generated/templates/TranchedPool/GoldfinchConfig";
import { CreditLine as CreditLineContract } from "../../generated/templates/TranchedPool/CreditLine";
import { PoolTokens as PoolTokensContract } from "../../generated/templates/TranchedPool/PoolTokens";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  CONFIG_KEYS_ADDRESSES,
  PositionSide,
  TransactionType,
  USDC_DECIMALS,
} from "../common/constants";
import {
  getOrCreateAccount,
  getOrCreateMarket,
  getOrCreateProtocol,
} from "../common/getters";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  createTransaction,
  snapshotFinancials,
  snapshotMarket,
  updatePosition,
  updateRevenues,
  updateUsageMetrics,
} from "../common/helpers";
import { updateInterestRates } from "../entities/market";

export function _handleDepositMessari(
  marketID: string,
  tokenID: BigInt,
  amount: BigInt,
  owner: string,
  configAddress: Address | null,
  creditLineAddress: Address | null,
  event: ethereum.Event
): void {
  const amountUSD = amount.divDecimal(USDC_DECIMALS);
  const market = getOrCreateMarket(marketID, event);

  if (!market._poolToken && configAddress) {
    const configContract = GoldfinchConfigContract.bind(configAddress);
    market._poolToken = configContract
      .getAddress(BigInt.fromI32(CONFIG_KEYS_ADDRESSES.PoolTokens))
      .toHexString();
  }

  if (!market._interestTimestamp) {
    market._interestTimestamp = event.block.timestamp;
    log.debug(
      "[handleDepositMade]market._interestTimestamp for market {} set to {}",
      [marketID, event.block.timestamp.toString()]
    );
  }

  if (creditLineAddress) {
    const creditLineContract = CreditLineContract.bind(creditLineAddress);
    if (!market._creditLine) {
      market._creditLine = creditLineAddress.toHexString();
    }

    const curretLimitResult = creditLineContract.try_currentLimit();
    if (
      !curretLimitResult.reverted &&
      curretLimitResult.value.gt(BIGINT_ZERO)
    ) {
      market.isActive = true;
      market.canBorrowFrom = true;
    }
  }

  market.inputTokenBalance = market.inputTokenBalance.plus(amount);
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
  market.totalDepositBalanceUSD =
    market.inputTokenBalance.divDecimal(USDC_DECIMALS);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.save();

  const protocol = getOrCreateProtocol();
  let marketIDs = protocol._marketIDs!;
  if (marketIDs.indexOf(market.id) < 0) {
    marketIDs = marketIDs.concat([market.id]);
  }
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol._marketIDs!.length; i++) {
    const mktID = protocol._marketIDs![i];
    const mkt = getOrCreateMarket(mktID, event);
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(
      mkt.totalDepositBalanceUSD
    );
  }
  protocol._marketIDs = marketIDs;
  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(amountUSD);
  protocol.save();

  log.info(
    "[handleDepositMade]market {}: amountUSD={},market.tvl={},protocl.tvl={},tx={}",
    [
      market.id,
      amountUSD.toString(),
      market.totalValueLockedUSD.toString(),
      protocol.totalValueLockedUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  snapshotMarket(market, amountUSD, event, TransactionType.DEPOSIT);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.DEPOSIT);
  updateUsageMetrics(protocol, owner, event, TransactionType.DEPOSIT);

  const account = getOrCreateAccount(owner);
  const poolTokensContract = PoolTokensContract.bind(
    Address.fromString(market._poolToken!)
  );
  const accountBalance = poolTokensContract
    .tokens(tokenID)
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
}

export function _handleWithdrawMessari(
  marketID: string,
  principalWithdrawn: BigInt,
  owner: string,
  event: ethereum.Event
): void {
  const principalAmountUSD = principalWithdrawn.divDecimal(USDC_DECIMALS);
  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(marketID, event);

  market.inputTokenBalance = market.inputTokenBalance.minus(principalWithdrawn);
  market.totalDepositBalanceUSD =
    market.inputTokenBalance.divDecimal(USDC_DECIMALS);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.save();

  let marketIDs = protocol._marketIDs!;
  if (marketIDs.indexOf(market.id) < 0) {
    marketIDs = marketIDs.concat([market.id]);
  }
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol._marketIDs!.length; i++) {
    const mktID = protocol._marketIDs![i];
    const mkt = getOrCreateMarket(mktID, event);
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(
      mkt.totalDepositBalanceUSD
    );
  }
  protocol._marketIDs = marketIDs;
  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.save();

  log.info(
    "[handleWithdrawalMade]market {}: withdrawAmountUSD={},market.tvl={},protocl.tvl={},tx={}",
    [
      market.id,
      principalAmountUSD.toString(),
      market.totalValueLockedUSD.toString(),
      protocol.totalValueLockedUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  snapshotMarket(market, principalAmountUSD, event, TransactionType.WITHDRAW);
  snapshotFinancials(
    protocol,
    principalAmountUSD,
    event,
    TransactionType.WITHDRAW
  );
  updateUsageMetrics(protocol, owner, event, TransactionType.WITHDRAW);

  const account = getOrCreateAccount(owner);
  const creditLineContract = CreditLineContract.bind(
    Address.fromString(market._creditLine!)
  );
  const accountBalance = creditLineContract.balance();
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
    principalWithdrawn,
    principalAmountUSD,
    event
  );
}

export function _handleDrawdownMessari(
  marketID: string,
  amount: BigInt,
  borrower: string,
  event: ethereum.Event
): void {
  const amountUSD = amount.divDecimal(USDC_DECIMALS);
  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(marketID, event);

  if (!market._interestTimestamp) {
    market._interestTimestamp = event.block.timestamp;
    log.debug(
      "[handleDrawdownMade]market._interestTimestamp for market {} set to {}",
      [marketID, event.block.timestamp.toString()]
    );
  }
  const creditLineContract = CreditLineContract.bind(
    Address.fromString(market._creditLine!)
  );

  market.totalBorrowBalanceUSD = creditLineContract
    .balance()
    .divDecimal(USDC_DECIMALS);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
  if (!market._borrower) {
    market._borrower = borrower;
  }
  market.save();

  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol._marketIDs!.length; i++) {
    const mktID = protocol._marketIDs![i];
    const mkt = getOrCreateMarket(mktID, event);
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(
      mkt.totalBorrowBalanceUSD
    );
  }

  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(amountUSD);
  protocol.save();

  snapshotMarket(market, amountUSD, event, TransactionType.BORROW);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.BORROW);
  updateUsageMetrics(protocol, borrower, event, TransactionType.BORROW);

  const account = getOrCreateAccount(borrower);
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
}

export function _handleRepayMessari(
  marketID: string,
  principalAmount: BigInt,
  interestAmount: BigInt,
  reserveAmount: BigInt,
  payer: string,
  event: ethereum.Event
): void {
  const amount = interestAmount.plus(principalAmount);
  const interestAmountUSD = interestAmount.divDecimal(USDC_DECIMALS);
  const principleAmountUSD = principalAmount.divDecimal(USDC_DECIMALS);
  const reserveAmountUSD = reserveAmount.divDecimal(USDC_DECIMALS);
  const tx = event.transaction.hash.toHexString();

  log.info(
    "[handlePaymentApplied]market {} payment interestAmountUSD {} + principleAmountUSD {} received at tx {}",
    [marketID, interestAmountUSD.toString(), principleAmountUSD.toString(), tx]
  );

  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(marketID, event);

  const creditLineContract = CreditLineContract.bind(
    Address.fromString(market._creditLine!)
  );
  market.totalBorrowBalanceUSD = creditLineContract
    .balance()
    .divDecimal(USDC_DECIMALS);

  // lenders receive interestAmountUSD - reserveAmountUSD
  if (market._interestTimestamp) {
    if (!market._borrowerInterestAmountUSD) {
      market._borrowerInterestAmountUSD = BIGDECIMAL_ZERO;
    }
    market._borrowerInterestAmountUSD = market
      ._borrowerInterestAmountUSD!.plus(interestAmountUSD)
      .plus(reserveAmountUSD);
    if (!market._lenderInterestAmountUSD) {
      market._lenderInterestAmountUSD = BIGDECIMAL_ZERO;
    }
    market._lenderInterestAmountUSD =
      market._lenderInterestAmountUSD!.plus(interestAmountUSD);
    market.save();

    updateInterestRates(
      market,
      market._borrowerInterestAmountUSD!,
      market._lenderInterestAmountUSD!,
      event
    );
  } else {
    // for migrated tranched pools, there is no
    // TrancheLocked or DrawdownMade event, market._interestTimestamp
    // is not set, ignore the current interest payments and start
    // interest rates calcuation from now to the next payment
    market._interestTimestamp = event.block.timestamp;
    market.save();
  }

  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol._marketIDs!.length; i++) {
    const mktID = protocol._marketIDs![i];
    const mkt = getOrCreateMarket(mktID, event);
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(
      mkt.totalBorrowBalanceUSD
    );
  }
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
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
}
