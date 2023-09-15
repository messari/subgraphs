/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  Address,
  BigInt,
  BigDecimal,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { CallableLoan, PoolToken } from "../../../generated/schema";
import { CallableLoan as CallableLoanContract } from "../../../generated/templates/CallableLoan/CallableLoan";

const INTEREST_DECIMALS = BigDecimal.fromString("1000000000000000000");

export function initCallableLoan(
  address: Address,
  block: ethereum.Block
): CallableLoan {
  const id = address.toHexString();
  const callableLoan = new CallableLoan(id);
  const callableLoanContract = CallableLoanContract.bind(address);
  callableLoan.address = address;
  callableLoan.creditLineAddress = callableLoanContract.creditLine();
  callableLoan.fundingLimit = callableLoanContract.limit();
  callableLoan.principalAmount = BigInt.zero();
  callableLoan.initialInterestOwed = BigInt.zero(); // This gets set on drawdown
  callableLoan.rawGfiApy = BigDecimal.zero();
  callableLoan.totalDeposited = BigInt.zero();
  callableLoan.remainingCapacity = callableLoan.fundingLimit;
  callableLoan.createdAt = block.timestamp.toI32();
  callableLoan.fundableAt = callableLoanContract.getFundableAt().toI32();
  callableLoan.availableForDrawdown = callableLoanContract.totalPrincipalPaid();
  if (callableLoan.fundableAt == 0) {
    callableLoan.fundableAt = callableLoan.createdAt;
  }
  callableLoan.allowedUidTypes = [];
  const allowedUidTypes = callableLoanContract.getAllowedUIDTypes();
  for (let i = 0; i < allowedUidTypes.length; i++) {
    const uidType = allowedUidTypes[i];
    if (uidType.equals(BigInt.fromI32(0))) {
      callableLoan.allowedUidTypes = callableLoan.allowedUidTypes.concat([
        "NON_US_INDIVIDUAL",
      ]);
    } else if (uidType.equals(BigInt.fromI32(1))) {
      callableLoan.allowedUidTypes = callableLoan.allowedUidTypes.concat([
        "US_ACCREDITED_INDIVIDUAL",
      ]);
    } else if (uidType.equals(BigInt.fromI32(2))) {
      callableLoan.allowedUidTypes = callableLoan.allowedUidTypes.concat([
        "US_NON_ACCREDITED_INDIVIDUAL",
      ]);
    } else if (uidType.equals(BigInt.fromI32(3))) {
      callableLoan.allowedUidTypes = callableLoan.allowedUidTypes.concat([
        "US_ENTITY",
      ]);
    } else if (uidType.equals(BigInt.fromI32(4))) {
      callableLoan.allowedUidTypes = callableLoan.allowedUidTypes.concat([
        "NON_US_ENTITY",
      ]);
    }
  }
  callableLoan.backers = [];
  callableLoan.numBackers = 0;
  callableLoan.isPaused = callableLoanContract.paused();
  callableLoan.drawdownsPaused = callableLoanContract.drawdownsPaused();
  callableLoan.tokens = [];

  callableLoan.balance = callableLoanContract.balance();
  callableLoan.termEndTime = callableLoanContract.termEndTime();
  callableLoan.termStartTime = callableLoanContract.termStartTime();
  callableLoan.interestRateBigInt = callableLoanContract.interestApr();
  callableLoan.interestRate =
    callableLoan.interestRateBigInt.divDecimal(INTEREST_DECIMALS);
  callableLoan.usdcApy = callableLoan.interestRate.times(
    BigDecimal.fromString("0.9")
  ); // TODO could fetch the protocol fee from GoldfinchConfig, but this is OK for now
  callableLoan.lateFeeRate = callableLoanContract
    .lateFeeApr()
    .divDecimal(INTEREST_DECIMALS);
  callableLoan.lastFullPaymentTime = callableLoanContract
    .lastFullPaymentTime()
    .toI32();
  //callableLoan.borrowerContract = callableLoanContract.borrower().toHexString();

  //const schedulingResult =
  //  generateRepaymentScheduleForCallableLoan(callableLoan);
  //callableLoan.repaymentSchedule = schedulingResult.repaymentIds
  //callableLoan.numRepayments = schedulingResult.repaymentIds.length;
  //callableLoan.termInSeconds = schedulingResult.termInSeconds;
  //callableLoan.repaymentFrequency = schedulingResult.repaymentFrequency;

  callableLoan.principalAmountRepaid = BigInt.zero();
  callableLoan.interestAmountRepaid = BigInt.zero();

  return callableLoan;
}

// TODO this function exists for tranched pools too. Try to consolidate them?
export function updatePoolTokensRedeemable(callableLoan: CallableLoan): void {
  const callableLoanContract = CallableLoanContract.bind(
    Address.fromBytes(callableLoan.address)
  );
  const poolTokenIds = callableLoan.tokens;
  for (let i = 0; i < poolTokenIds.length; i++) {
    const poolToken = PoolToken.load(poolTokenIds[i]);
    if (!poolToken) {
      continue;
    }

    const availableToWithdrawResult =
      callableLoanContract.try_availableToWithdraw(
        BigInt.fromString(poolToken.id)
      );
    if (!availableToWithdrawResult.reverted) {
      poolToken.interestRedeemable = availableToWithdrawResult.value.value0;
    } else {
      log.warning(
        "availableToWithdraw reverted for pool token {} on CallableLoan {}",
        [poolToken.id, callableLoan.id]
      );
    }
    poolToken.save();
  }
}
