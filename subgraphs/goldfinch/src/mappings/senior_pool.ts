import { Address, log } from "@graphprotocol/graph-ts";
import {
  SeniorPool as SeniorPoolContract,
  DepositMade,
  InterestCollected,
  InvestmentMadeInJunior,
  InvestmentMadeInSenior,
  PrincipalCollected,
  PrincipalWrittenDown,
  ReserveFundsCollected,
  WithdrawalMade,
} from "../../generated/SeniorPool/SeniorPool";
import { Fidu as FiduContract } from "../../generated/SeniorPool/Fidu";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  CONFIG_KEYS_ADDRESSES,
  FIDU_ADDRESS,
  GFI_ADDRESS,
  PositionSide,
  RewardTokenType,
  TransactionType,
  FIDU_DECIMALS,
  USDC_DECIMALS,
} from "../common/constants";
import {
  createTransactionFromEvent,
  usdcWithFiduPrecision,
} from "../entities/helpers";
import {
  updatePoolInvestments,
  updatePoolStatus,
} from "../entities/senior_pool";
import { handleDeposit } from "../entities/user";
import {
  bigDecimalToBigInt,
  bigIntToBDUseDecimals,
  getAddressFromConfig,
} from "../common/utils";
import {
  getOrCreateAccount,
  getOrCreateMarket,
  getOrCreateProtocol,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../common/getters";
import { Token } from "../../generated/schema";
import {
  createTransaction,
  snapshotFinancials,
  snapshotMarket,
  updatePosition,
  updateRevenues,
  updateUsageMetrics,
} from "../common/helpers";

export function handleDepositMade(event: DepositMade): void {
  const capitalProvider = event.params.capitalProvider.toHexString();
  const amount = event.params.amount;
  const amountUSD = amount.divDecimal(USDC_DECIMALS);
  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(event.address.toHexString(), event);
  const inputToken = getOrCreateToken(Address.fromString(market.inputToken));
  const outputToken = getOrCreateToken(Address.fromString(FIDU_ADDRESS));
  const rewardToken = getOrCreateRewardToken(
    Address.fromString(GFI_ADDRESS),
    RewardTokenType.DEPOSIT
  );

  market.outputToken = outputToken.id;
  market.rewardTokens = [rewardToken.id];
  // USDC
  market.inputTokenPriceUSD = BIGDECIMAL_ONE;
  const seniorPoolContract = SeniorPoolContract.bind(event.address);
  market.inputTokenBalance = seniorPoolContract.assets();
  market.totalDepositBalanceUSD =
    market.inputTokenBalance.divDecimal(USDC_DECIMALS);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);

  const fiduContract = FiduContract.bind(
    Address.fromString(market.outputToken!)
  );
  market.outputTokenSupply = fiduContract.totalSupply();
  const accountBalance = fiduContract.balanceOf(event.params.capitalProvider);
  market.outputTokenPriceUSD = bigIntToBDUseDecimals(
    seniorPoolContract.sharePrice(),
    outputToken.decimals
  );
  market.exchangeRate = bigIntToBDUseDecimals(
    event.params.amount,
    inputToken.decimals
  ).div(bigIntToBDUseDecimals(event.params.shares, outputToken.decimals));

  // calculate average daily emission since first deposit
  if (!market._rewardTimestamp) {
    market._rewardTimestamp = event.block.timestamp;
    market._cumulativeRewardAmount = BIGINT_ZERO;
  }

  let marketIDs = protocol._marketIDs!;
  if (marketIDs.indexOf(market.id) < 0) {
    marketIDs = marketIDs.concat([market.id]);
  }
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol._marketIDs!.length; i++) {
    const mkt = getOrCreateMarket(protocol._marketIDs![i], event);
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(
      mkt.totalDepositBalanceUSD
    );
    log.info("[handleDepositMade]mkt {} totalDepositBalanceUSD={}", [
      mkt.id,
      mkt.totalDepositBalanceUSD.toString(),
    ]);
  }

  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(amountUSD);
  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  market.save();
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

  assert(
    protocol.totalValueLockedUSD.ge(BIGDECIMAL_ZERO),
    `TVL ${
      protocol.totalValueLockedUSD
    } <= 0 after tx ${event.transaction.hash.toHexString()}`
  );

  snapshotMarket(market, amountUSD, event, TransactionType.DEPOSIT);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.DEPOSIT);
  updateUsageMetrics(protocol, capitalProvider, event, TransactionType.DEPOSIT);

  const account = getOrCreateAccount(capitalProvider);
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
    capitalProvider,
    positionID,
    amount,
    amountUSD,
    event
  );

  // ORIGINAL CODE BELOW
  const rewardTokenAddress = Address.fromString(rewardToken.token);
  updatePoolStatus(event);
  handleDeposit(event);
  // Purposefully ignore deposits from StakingRewards contract because those will get captured as DepositAndStake events instead
  if (!event.params.capitalProvider.equals(rewardTokenAddress)) {
    const transaction = createTransactionFromEvent(
      event,
      "SENIOR_POOL_DEPOSIT",
      event.params.capitalProvider
    );

    transaction.sentAmount = event.params.amount;
    transaction.sentToken = "USDC";
    transaction.receivedAmount = event.params.shares;
    transaction.receivedToken = "FIDU";

    // usdc / fidu
    transaction.fiduPrice = usdcWithFiduPrecision(event.params.amount).div(
      event.params.shares
    );

    transaction.save();
  }
}

export function handleWithdrawalMade(event: WithdrawalMade): void {
  const capitalProvider = event.params.capitalProvider.toHexString();
  const amount = event.params.userAmount.plus(event.params.reserveAmount);
  const amountUSD = amount.divDecimal(USDC_DECIMALS);

  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(event.address.toHexString(), event);
  const outputToken = getOrCreateToken(Address.fromString(FIDU_ADDRESS));
  //const outputToken = Token.load(market.outputToken!)!;

  const seniorPoolContract = SeniorPoolContract.bind(event.address);
  market.inputTokenBalance = seniorPoolContract.assets();
  market.totalDepositBalanceUSD =
    market.inputTokenBalance.divDecimal(USDC_DECIMALS);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  assert(
    market.totalValueLockedUSD.ge(BIGDECIMAL_ZERO),
    `market ${market.id} TVL ${
      market.totalValueLockedUSD
    } < 0 after tx ${event.transaction.hash.toHexString()}`
  );

  const fiduContract = FiduContract.bind(Address.fromString(FIDU_ADDRESS));
  const accountBalance = fiduContract.balanceOf(event.params.capitalProvider);
  market.outputTokenSupply = fiduContract.totalSupply();
  market.outputTokenPriceUSD = bigIntToBDUseDecimals(
    seniorPoolContract.sharePrice(),
    outputToken.decimals
  );

  let marketIDs = protocol._marketIDs!;
  if (marketIDs.indexOf(market.id) < 0) {
    marketIDs = marketIDs.concat([market.id]);
  }
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < marketIDs.length; i++) {
    const mkt = getOrCreateMarket(marketIDs[i], event);
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(
      mkt.totalDepositBalanceUSD
    );
  }
  protocol._marketIDs = marketIDs;
  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;

  snapshotMarket(market, amountUSD, event, TransactionType.WITHDRAW);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.WITHDRAW);
  updateUsageMetrics(
    protocol,
    capitalProvider,
    event,
    TransactionType.WITHDRAW
  );

  const account = getOrCreateAccount(capitalProvider);
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
    capitalProvider,
    positionID,
    amount,
    amountUSD,
    event
  );

  market.save();
  protocol.save();
  log.info(
    "[handleWithdrawalMade]market {}: amountUSD={},market.tvl={},protocl.tvl={},tx={}",
    [
      market.id,
      amountUSD.toString(),
      market.totalValueLockedUSD.toString(),
      protocol.totalValueLockedUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  // ORIGINAL CODE BELOW
  updatePoolStatus(event);
  const stakingRewardsAddress = getStakingRewardsAddressFromSeniorPoolAddress(
    event.address
  );
  // Purposefully ignore withdrawals made by StakingRewards contract because those will be captured as UnstakeAndWithdraw
  if (!event.params.capitalProvider.equals(stakingRewardsAddress)) {
    const transaction = createTransactionFromEvent(
      event,
      "SENIOR_POOL_WITHDRAWAL",
      event.params.capitalProvider
    );

    const seniorPoolContract = SeniorPoolContract.bind(event.address);
    const sharePrice = seniorPoolContract.sharePrice();
    const BI_FIDU_DECIMALS = bigDecimalToBigInt(FIDU_DECIMALS);
    const BI_USDC_DECIMALS = bigDecimalToBigInt(USDC_DECIMALS);
    transaction.sentAmount = event.params.userAmount
      .plus(event.params.reserveAmount)
      .times(BI_FIDU_DECIMALS)
      .div(BI_USDC_DECIMALS)
      .times(BI_FIDU_DECIMALS)
      .div(sharePrice);
    transaction.sentToken = "FIDU";
    transaction.receivedAmount = event.params.userAmount;
    transaction.receivedToken = "USDC";
    transaction.fiduPrice = sharePrice;

    transaction.save();
  }
}
// this event is never emitted in the current version
// because senior pool never invests in junior tranche
export function handleInvestmentMadeInJunior(
  event: InvestmentMadeInJunior
): void {
  const newBorrowUSD = event.params.amount.divDecimal(USDC_DECIMALS);
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market.totalBorrowBalanceUSD =
    market.totalBorrowBalanceUSD.plus(newBorrowUSD);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(newBorrowUSD);
  market.save();

  snapshotMarket(market, newBorrowUSD, event, TransactionType.BORROW);

  // deduct investment amount from TVL/totalDepositBalance to avoid double counting
  // because they will be counted as deposits to invested tranched pools
  // Also not update protocol.totalBorrowBalanceUSD to avoid double counting
  const protocol = getOrCreateProtocol();
  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.minus(newBorrowUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.save();

  log.info(
    "[handleInvestmentMadeInJunior]market {}: amountUSD={},market.tvl={},protocl.tvl={},tx={}",
    [
      market.id,
      newBorrowUSD.toString(),
      market.totalValueLockedUSD.toString(),
      protocol.totalValueLockedUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  //
  updatePoolStatus(event);
  updatePoolInvestments(event.address, event.params.tranchedPool);
}

export function handleInvestmentMadeInSenior(
  event: InvestmentMadeInSenior
): void {
  const newBorrowUSD = event.params.amount.divDecimal(USDC_DECIMALS);
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market.totalBorrowBalanceUSD =
    market.totalBorrowBalanceUSD.plus(newBorrowUSD);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(newBorrowUSD);
  market.save();

  snapshotMarket(market, newBorrowUSD, event, TransactionType.BORROW);

  // deduct investment amount from TVL/totalDepositBalance to avoid double counting
  // because they will be counted as deposits to invested tranched pools
  // Similarly, not updating protocol.totalBorrowBalanceUSD to avoid double counting
  const protocol = getOrCreateProtocol();
  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.minus(newBorrowUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.save();

  log.info(
    "[handleInvestmentMadeInSenior]market {}: amountUSD={},market.tvl={},protocl.tvl={},tx={}",
    [
      market.id,
      newBorrowUSD.toString(),
      market.totalValueLockedUSD.toString(),
      protocol.totalValueLockedUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  // no need to snapshotFinancials here because it will be snapshoted
  // when DepositMade is handled in tranched pool
  // not updating usage metrics as this is not a transaction type of interest

  // ORIGINAL CODE
  updatePoolStatus(event);
  updatePoolInvestments(event.address, event.params.tranchedPool);
}

export function handleInterestCollected(event: InterestCollected): void {
  // this is the interest for the supply side; protocol side is
  // handled in handleReserveFundsCollected
  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(event.address.toHexString(), event);
  const outputToken = Token.load(market.outputToken!)!;
  const newSupplySideRevUSD = event.params.amount.divDecimal(USDC_DECIMALS);

  const seniorPoolContract = SeniorPoolContract.bind(event.address);
  outputToken.lastPriceUSD = bigIntToBDUseDecimals(
    seniorPoolContract.sharePrice(),
    outputToken.decimals
  );
  market.outputTokenPriceUSD = outputToken.lastPriceUSD!;
  market.save();
  outputToken.save();

  // depending on whether the interest is from compound or from a tranched pool
  // if it is from compound, update protocol level revenue
  // if it is from a tranched pool, the interest revenue has been accounted there
  let updateProtocol = false;
  if (event.params.payer == event.address) {
    // interest from compound sweep, new revenue not having been accounted
    updateProtocol = true;
  }
  updateRevenues(
    protocol,
    market,
    newSupplySideRevUSD,
    BIGDECIMAL_ZERO,
    event,
    updateProtocol
  );

  // ORIGINAL CODE
  updatePoolStatus(event);
}

export function handlePrincipalCollected(event: PrincipalCollected): void {
  const deltaBorrowUSD = event.params.amount.divDecimal(USDC_DECIMALS);
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market.totalBorrowBalanceUSD =
    market.totalBorrowBalanceUSD.minus(deltaBorrowUSD);
  market.save();

  const protocol = getOrCreateProtocol();
  protocol.totalBorrowBalanceUSD =
    protocol.totalBorrowBalanceUSD.minus(deltaBorrowUSD);
  protocol.save();

  snapshotMarket(market, deltaBorrowUSD, event, null);
  snapshotFinancials(protocol, deltaBorrowUSD, event, null);

  // ORIGINAL CODE
  updatePoolStatus(event);
}

export function handlePrincipalWrittenDown(event: PrincipalWrittenDown): void {
  // writing down amount can be positive (recovering of previous writing down) or negative
  const amountUSD = event.params.amount.divDecimal(USDC_DECIMALS);
  const market = getOrCreateMarket(event.address.toHexString(), event);
  const outputToken = Token.load(market.outputToken!)!;
  market.inputTokenBalance = market.inputTokenBalance.plus(event.params.amount);
  market.totalDepositBalanceUSD = market.totalDepositBalanceUSD.plus(amountUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.plus(amountUSD);

  const seniorPoolContract = SeniorPoolContract.bind(event.address);
  outputToken.lastPriceUSD = bigIntToBDUseDecimals(
    seniorPoolContract.sharePrice(),
    outputToken.decimals
  );
  market.outputTokenPriceUSD = outputToken.lastPriceUSD!;
  // writing down eats into supply side revenue this can cause
  // cumulative total/supply side revenue to decrease
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(amountUSD);
  market.cumulativeTotalRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(
    market.cumulativeProtocolSideRevenueUSD
  );
  market.save();
  outputToken.save();
  assert(
    market.totalValueLockedUSD.ge(BIGDECIMAL_ZERO),
    `market ${market.id} TVL ${
      market.totalValueLockedUSD
    } < 0 after tx ${event.transaction.hash.toHexString()}`
  );

  const protocol = getOrCreateProtocol();
  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.plus(amountUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.totalBorrowBalanceUSD =
    protocol.totalBorrowBalanceUSD.plus(amountUSD);
  // writing down eats into supply side revenue, this can cause
  // cumulative supply side revenue to decrease
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(amountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(
      protocol.cumulativeProtocolSideRevenueUSD
    );
  protocol.save();

  snapshotMarket(market, amountUSD, event, null, false);
  snapshotFinancials(protocol, amountUSD, event, null);

  //
  updatePoolStatus(event);
}

export function handleReserveFundsCollected(
  event: ReserveFundsCollected
): void {
  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(event.address.toHexString(), event);
  const newProtocolSideRevenueUSD =
    event.params.amount.divDecimal(USDC_DECIMALS);
  updateRevenues(
    protocol,
    market,
    BIGDECIMAL_ZERO,
    newProtocolSideRevenueUSD,
    event,
    true
  );

  //
  updatePoolStatus(event);
}

// Helper function to extract the StakingRewards address from the config on Senior Pool
function getStakingRewardsAddressFromSeniorPoolAddress(
  seniorPoolAddress: Address
): Address {
  const seniorPoolContract = SeniorPoolContract.bind(seniorPoolAddress);
  return getAddressFromConfig(
    seniorPoolContract,
    CONFIG_KEYS_ADDRESSES.StakingRewards
  );
}
