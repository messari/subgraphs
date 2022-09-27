import {
  BulletLoans,
  LoanCreated,
  LoanRepaid,
} from "../../generated/BulletLoans/BulletLoans";
import { createBorrow, createRepay } from "../entities/event";
import {
  getMarket,
  changeMarketBorrowBalance,
  addMarketProtocolSideRevenue,
  addMarketSupplySideRevenue,
  updateMarketRates,
} from "../entities/market";
import { changeUserStableBorrowerPosition } from "../entities/position";
import { getOrCreateToken } from "../entities/token";
import { amountInUSD } from "../entities/price";
import {
  BIGDECIMAL_HUNDRED,
  BIGINT_TEN,
  BIGINT_NEGATIVE_ONE,
  SECONDS_PER_YEAR,
  TRUNCATE_LENGTH,
  BIGDECIMAL_ONE,
} from "../utils/constants";
import { exponent } from "../utils/numbers";

export function handleLoanCreated(event: LoanCreated): void {
  const instrumentId = event.params.instrumentId;
  const contract = BulletLoans.bind(event.address);
  const loansResult = contract.try_loans(instrumentId);
  if (!loansResult.reverted) {
    const loans = loansResult.value;
    const ownerOfResult = contract.try_ownerOf(instrumentId);
    if (!ownerOfResult.reverted) {
      const market = getMarket(ownerOfResult.value);
      createBorrow(
        event,
        market,
        loans.getUnderlyingToken(),
        loans.getRecipient(),
        loans.getPrincipal()
      );

      const rate = loans
        .getTotalDebt()
        .toBigDecimal()
        .div(loans.getPrincipal().toBigDecimal());
      const apy = exponent(
        rate,
        SECONDS_PER_YEAR.div(loans.getDuration()).toI32()
      )
        .minus(BIGDECIMAL_ONE)
        .times(BIGDECIMAL_HUNDRED)
        .truncate(TRUNCATE_LENGTH);
      updateMarketRates(event, market, apy);

      changeMarketBorrowBalance(event, market, loans.getPrincipal(), false);
      changeUserStableBorrowerPosition(
        event,
        loans.getRecipient(),
        market,
        loans.getPrincipal()
      );
    }
  }
}

export function handleLoanRepaid(event: LoanRepaid): void {
  const instrumentId = event.params.instrumentId;
  const contract = BulletLoans.bind(event.address);
  const loansResult = contract.try_loans(instrumentId);
  if (loansResult.reverted) {
    return;
  }
  const loans = loansResult.value;

  const ownerOfResult = contract.try_ownerOf(instrumentId);
  if (ownerOfResult.reverted) {
    return;
  }
  const market = getMarket(ownerOfResult.value);
  createRepay(
    event,
    market,
    loans.getUnderlyingToken(),
    loans.getRecipient(),
    event.params.amount
  );

  const balanceChange = event.params.amount
    .times(loans.getPrincipal())
    .div(loans.getTotalDebt())
    .times(BIGINT_NEGATIVE_ONE);
  changeMarketBorrowBalance(event, market, balanceChange, false);
  changeUserStableBorrowerPosition(
    event,
    loans.getRecipient(),
    market,
    balanceChange
  );

  const amountRepaid = loans.getAmountRepaid();
  if (amountRepaid >= loans.getTotalDebt()) {
    const principal = loans.getPrincipal();
    const fee = amountRepaid.minus(principal).div(BIGINT_TEN);
    const underlyingToken = getOrCreateToken(loans.getUnderlyingToken());
    addMarketProtocolSideRevenue(
      event,
      market,
      amountInUSD(fee, underlyingToken)
    );
    addMarketSupplySideRevenue(
      event,
      market,
      amountInUSD(amountRepaid.minus(principal).minus(fee), underlyingToken)
    );
  }
}
