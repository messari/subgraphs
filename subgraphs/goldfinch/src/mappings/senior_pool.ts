import { Address } from "@graphprotocol/graph-ts";
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
} from "../../generated/templates/SeniorPool/SeniorPool";
import { Fidu as FiduContract } from "../../generated/templates/SeniorPool/Fidu";

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
  USDC_DECIMALS,
} from "../common/constants";
import { createTransactionFromEvent } from "../entities/helpers";
import {
  updatePoolInvestments,
  updatePoolStatus,
} from "../entities/senior_pool";
import { handleDeposit } from "../entities/user";
import { bigIntToBDUseDecimals, getAddressFromConfig } from "../common/utils";
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
  const account = getOrCreateAccount(capitalProvider);
  const inputToken = getOrCreateToken(Address.fromString(market.inputToken));
  const outputToken = getOrCreateToken(Address.fromString(FIDU_ADDRESS));
  const rewardToken = getOrCreateRewardToken(
    Address.fromString(GFI_ADDRESS),
    RewardTokenType.DEPOSIT
  );

  market.outputToken = outputToken.id;
  market.rewardTokens = [rewardToken.id];
  // USDC
  market.inputTokenBalance = market.inputTokenBalance.plus(event.params.amount);
  market.inputTokenPriceUSD = bigIntToBDUseDecimals(
    market.inputTokenBalance,
    inputToken.decimals
  );
  market.inputTokenPriceUSD = BIGDECIMAL_ONE;
  const seniorPoolContract = SeniorPoolContract.bind(event.address);
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

  market.totalDepositBalanceUSD = market.totalDepositBalanceUSD.plus(amountUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
  // calculate average daily emission since first deposit
  if (!market._rewardTimestamp) {
    market._rewardTimestamp = event.block.timestamp;
    market._cumulativeRewardAmount = BIGINT_ZERO;
  }

  market.save();

  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.plus(amountUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(amountUSD);
  protocol.save();

  snapshotMarket(market, amountUSD, event, TransactionType.DEPOSIT);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.DEPOSIT);
  updateUsageMetrics(protocol, capitalProvider, event, TransactionType.DEPOSIT);

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
  /*
  const rewardTokenAddr = getStakingRewardsAddressFromSeniorPoolAddress(
    event.address
  );
  */

  const rewardTokenAddress = Address.fromString(rewardToken.token);
  updatePoolStatus(event.address);
  handleDeposit(event);
  // Purposefully ignore deposits from StakingRewards contract because those will get captured as DepositAndStake events instead
  if (!event.params.capitalProvider.equals(rewardTokenAddress)) {
    createTransactionFromEvent(
      event,
      "SENIOR_POOL_DEPOSIT",
      event.params.capitalProvider,
      event.params.amount
    );
  }
}

export function handleWithdrawalMade(event: WithdrawalMade): void {
  const capitalProvider = event.params.capitalProvider.toHexString();
  const amount = event.params.userAmount.plus(event.params.reserveAmount);
  const amountUSD = amount.divDecimal(USDC_DECIMALS);

  const protocol = getOrCreateProtocol();
  const market = getOrCreateMarket(event.address.toHexString(), event);
  const account = getOrCreateAccount(capitalProvider);
  const outputToken = getOrCreateToken(Address.fromString(FIDU_ADDRESS));
  //const outputToken = Token.load(market.outputToken!)!;

  // USDC
  market.totalDepositBalanceUSD =
    market.totalDepositBalanceUSD.minus(amountUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.inputTokenBalance = market.inputTokenBalance.minus(amount);
  market.inputTokenPriceUSD = BIGDECIMAL_ONE;

  const seniorPoolContract = SeniorPoolContract.bind(event.address);
  const fiduContract = FiduContract.bind(Address.fromString(FIDU_ADDRESS));
  const accountBalance = fiduContract.balanceOf(event.params.capitalProvider);
  market.outputTokenSupply = fiduContract.totalSupply();
  market.outputTokenPriceUSD = bigIntToBDUseDecimals(
    seniorPoolContract.sharePrice(),
    outputToken.decimals
  );

  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.minus(amountUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;

  snapshotMarket(market, amountUSD, event, TransactionType.WITHDRAW);
  snapshotFinancials(protocol, amountUSD, event, TransactionType.WITHDRAW);
  updateUsageMetrics(
    protocol,
    capitalProvider,
    event,
    TransactionType.WITHDRAW
  );

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

  // ORIGINAL CODE BELOW

  const stakingRewardsAddress = getStakingRewardsAddressFromSeniorPoolAddress(
    event.address
  );

  updatePoolStatus(event.address);
  // Purposefully ignore withdrawals made by StakingRewards contract because those will be captured as UnstakeAndWithdraw
  if (!event.params.capitalProvider.equals(stakingRewardsAddress)) {
    createTransactionFromEvent(
      event,
      "SENIOR_POOL_WITHDRAWAL",
      event.params.capitalProvider,
      event.params.userAmount
    );
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

  snapshotMarket(market, newBorrowUSD, event, null);

  // deduct investment amount from TVL/totalDepositBalance to avoid double counting
  // because they will be counted as deposits to invested tranched pools
  // Similarly, not updating protocol.totalBorrowBalanceUSD to avoid double counting
  const protocol = getOrCreateProtocol();
  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.minus(newBorrowUSD);
  protocol.cumulativeBorrowUSD =
    protocol.cumulativeDepositUSD.minus(newBorrowUSD);
  protocol.save();

  //
  updatePoolStatus(event.address);
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

  snapshotMarket(market, newBorrowUSD, event, null);

  // deduct investment amount from TVL/totalDepositBalance to avoid double counting
  // because they will be counted as deposits to invested tranched pools
  // Similarly, not updating protocol.totalBorrowBalanceUSD to avoid double counting
  const protocol = getOrCreateProtocol();
  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.minus(newBorrowUSD);
  protocol.cumulativeBorrowUSD =
    protocol.cumulativeDepositUSD.minus(newBorrowUSD);
  protocol.save();

  // no need to snapshotFinancials here because it will be snapshoted
  // when DepositMade is handled in tranched pool
  // not updating usage metrics as this is not a transaction type of interest

  // ORIGINAL CODE
  updatePoolStatus(event.address);
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
  updatePoolStatus(event.address);
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
  updatePoolStatus(event.address);
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
  // writing down eats into supply side revenue
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(amountUSD);
  market.cumulativeTotalRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(
    market.cumulativeProtocolSideRevenueUSD
  );
  market.save();
  outputToken.save();
  market.save();

  const protocol = getOrCreateProtocol();
  protocol.totalDepositBalanceUSD =
    protocol.totalDepositBalanceUSD.plus(amountUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.totalBorrowBalanceUSD =
    protocol.totalBorrowBalanceUSD.plus(amountUSD);
  // writing down eats into supply side revenue
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
  updatePoolStatus(event.address);
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
  updatePoolStatus(event.address);
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
