import { Address } from "@graphprotocol/graph-ts";
import { PoolToken, CallableLoan } from "../../../generated/schema";
import {
  CallableLoan as CallableLoanContract,
  CallRequestSubmitted,
  DepositMade,
  DrawdownMade,
  DrawdownsPaused,
  DrawdownsUnpaused,
  PaymentApplied,
  WithdrawalMade,
} from "../../../generated/templates/CallableLoan/CallableLoan";
import { createTransactionFromEvent } from "../../entities/helpers";
import { getOrInitUser } from "../../entities/user";
import { getOrCreateMarket } from "../../common/getters";
import {
  _handleDepositMessari,
  _handleDrawdownMessari,
  _handleRepayMessari,
  _handleWithdrawMessari,
} from "../helpers";
import { updatePoolTokensRedeemable } from "./helpers";

function getCallableLoan(address: Address): CallableLoan {
  return assert(CallableLoan.load(address.toHexString()));
}

export function handleDepositMade(event: DepositMade): void {
  const poolContract = CallableLoanContract.bind(event.address);
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

  //
  const callableLoan = getCallableLoan(event.address);
  const callableLoanContract = CallableLoanContract.bind(event.address);
  callableLoan.availableForDrawdown = callableLoanContract.totalPrincipalPaid();
  callableLoan.totalDeposited = callableLoan.totalDeposited.plus(
    event.params.amount
  );
  const user = getOrInitUser(event.params.owner);
  callableLoan.backers = callableLoan.backers.concat([user.id]);
  callableLoan.numBackers = callableLoan.backers.length;
  callableLoan.save();

  const transaction = createTransactionFromEvent(
    event,
    "TRANCHED_POOL_DEPOSIT",
    event.params.owner
  );
  transaction.loan = event.address.toHexString();
  transaction.sentToken = "USDC";
  transaction.sentAmount = event.params.amount;
  transaction.save();
}

export function handleWithdrawalMade(event: WithdrawalMade): void {
  _handleWithdrawMessari(
    event.address.toHexString(),
    event.params.principalWithdrawn,
    event.params.owner.toHexString(),
    event
  );
  //
  const callableLoan = getCallableLoan(event.address);
  const callableLoanContract = CallableLoanContract.bind(event.address);
  callableLoan.availableForDrawdown = callableLoanContract.totalPrincipalPaid();
  callableLoan.totalDeposited = callableLoan.totalDeposited.minus(
    event.params.principalWithdrawn
  );
  callableLoan.save();

  const poolToken = assert(PoolToken.load(event.params.tokenId.toString()));
  poolToken.interestRedeemable = poolToken.interestRedeemable.minus(
    event.params.interestWithdrawn
  );
  poolToken.save();

  const transaction = createTransactionFromEvent(
    event,
    "TRANCHED_POOL_WITHDRAWAL",
    event.params.owner
  );
  transaction.loan = event.address.toHexString();
  transaction.receivedToken = "USDC";
  transaction.receivedAmount = event.params.interestWithdrawn.plus(
    event.params.principalWithdrawn
  );
  transaction.save();
}

export function handleDrawdownMade(event: DrawdownMade): void {
  _handleDrawdownMessari(
    event.address.toHexString(),
    event.params.amount,
    event.params.borrower.toHexString(),
    event
  );

  //
  const callableLoan = getCallableLoan(event.address);
  updatePoolTokensRedeemable(callableLoan); // Results of availableToWithdraw change after the pool is drawn down (they become 0)
  const callableLoanContract = CallableLoanContract.bind(event.address);
  callableLoan.availableForDrawdown = callableLoanContract.totalPrincipalPaid();
  callableLoan.principalAmount = callableLoan.principalAmount.plus(
    event.params.amount
  );
  callableLoan.balance = callableLoanContract.balance();
  callableLoan.termStartTime = callableLoanContract.termStartTime();
  callableLoan.termEndTime = callableLoanContract.termEndTime();
  callableLoan.initialInterestOwed = callableLoanContract.interestOwedAt(
    callableLoan.termEndTime
  );
  callableLoan.isPaused = callableLoanContract.paused();
  callableLoan.drawdownsPaused = callableLoanContract.drawdownsPaused();
  //deleteCallableLoanRepaymentSchedule(callableLoan);
  //const schedulingResult =
  //  generateRepaymentScheduleForCallableLoan(callableLoan);
  //callableLoan.repaymentSchedule = schedulingResult.repaymentIds;
  //callableLoan.numRepayments = schedulingResult.repaymentIds.length;
  //callableLoan.termInSeconds = schedulingResult.termInSeconds;
  //callableLoan.repaymentFrequency = schedulingResult.repaymentFrequency;
  callableLoan.save();

  const transaction = createTransactionFromEvent(
    event,
    "TRANCHED_POOL_DRAWDOWN",
    event.params.borrower
  );
  transaction.loan = event.address.toHexString();
  transaction.receivedToken = "USDC";
  transaction.receivedAmount = event.params.amount;
  transaction.save();
}

export function handlePaymentApplied(event: PaymentApplied): void {
  _handleRepayMessari(
    event.address.toHexString(),
    event.params.principal,
    event.params.interest,
    event.params.reserve,
    event.params.payer.toHexString(),
    event
  );

  //
  const callableLoanContract = CallableLoanContract.bind(event.address);
  const callableLoan = getCallableLoan(event.address);
  callableLoan.availableForDrawdown = callableLoanContract.totalPrincipalPaid();
  updatePoolTokensRedeemable(callableLoan); // Results of availableToWithdraw change after a repayment is made (principal or interest can increase)
  callableLoan.balance = callableLoan.balance.minus(event.params.principal);
  callableLoan.lastFullPaymentTime = callableLoanContract
    .lastFullPaymentTime()
    .toI32();
  callableLoan.principalAmountRepaid = callableLoan.principalAmountRepaid.plus(
    event.params.principal
  );
  callableLoan.interestAmountRepaid = callableLoan.interestAmountRepaid.plus(
    event.params.interest
  );
  /*
  if (!event.params.principal.isZero()) {
    // Regenerate the repayment schedule when a principal payment is made
    deleteCallableLoanRepaymentSchedule(callableLoan);
    const schedulingResult =
      generateRepaymentScheduleForCallableLoan(callableLoan);
    callableLoan.repaymentSchedule = schedulingResult.repaymentIds;
  }
  */

  callableLoan.save();

  /*
  updateTotalPrincipalCollected(event.params.principal);
  updateTotalInterestCollected(event.params.interest);
  updateTotalReserveCollected(event.params.reserve);
  */

  const transaction = createTransactionFromEvent(
    event,
    "TRANCHED_POOL_REPAYMENT",
    event.params.payer
  );
  transaction.loan = event.address.toHexString();
  transaction.sentToken = "USDC";
  transaction.sentAmount = event.params.principal.plus(event.params.interest);
  transaction.save();
}

export function handleDrawdownsPaused(event: DrawdownsPaused): void {
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market.canBorrowFrom = false;
  market.save();
  //
  const callableLoan = getCallableLoan(event.address);
  const callableLoanContract = CallableLoanContract.bind(event.address);
  callableLoan.drawdownsPaused = callableLoanContract.drawdownsPaused();
  callableLoan.save();
}

export function handleDrawdownsUnpaused(event: DrawdownsUnpaused): void {
  const market = getOrCreateMarket(event.address.toHexString(), event);
  market.canBorrowFrom = true;
  market.save();
  //
  const callableLoan = getCallableLoan(event.address);
  const callableLoanContract = CallableLoanContract.bind(event.address);
  callableLoan.drawdownsPaused = callableLoanContract.drawdownsPaused();
  callableLoan.save();
}

export function handleCallRequestSubmitted(event: CallRequestSubmitted): void {
  const callableLoanContract = CallableLoanContract.bind(event.address);
  const poolToken = assert(
    PoolToken.load(event.params.callRequestedTokenId.toString())
  );
  poolToken.isCapitalCalled = true;
  poolToken.calledAt = event.block.timestamp.toI32();
  poolToken.callDueAt = callableLoanContract.nextPrincipalDueTime().toI32();
  poolToken.save();

  const transaction = createTransactionFromEvent(
    event,
    "CALL_REQUEST_SUBMITTED",
    Address.fromString(poolToken.user)
  );
  transaction.loan = event.address.toHexString();
  transaction.receivedToken = "USDC";
  transaction.receivedAmount = event.params.callAmount;
  transaction.save();
}
