import { Address } from "@graphprotocol/graph-ts";
import {
  Withdrawn,
  Redeemed,
} from "../../generated/templates/LoanToken/LoanToken";
import { createBorrow, createRepay } from "../entities/event";
import {
  getMarket,
  changeMarketBorrowBalance,
  addMarketProtocolSideRevenue,
  addMarketSupplySideRevenue,
} from "../entities/market";
import {
  BIGDECIMAL_HUNDRED,
  BIGINT_NEGATIVE_ONE,
  BIGINT_TEN,
  LEGACY_POOL_ADDRESS,
  LEGACY_POOL_TOKEN_ADDRESS,
} from "../utils/constants";
import { LoanToken } from "../../generated/templates/LoanToken/LoanToken";
import { changeUserStableBorrowerPosition } from "../entities/position";
import { getOrCreateToken } from "../entities/token";
import { amountInUSD } from "../entities/price";
import { updateMarketRates } from "../entities/market";

export function handleWithdrawn(event: Withdrawn): void {
  const timestamp = event.block.timestamp.toString();
  const contract = LoanToken.bind(event.address);
  const poolResult = contract.try_pool();
  let poolAddress: string;
  if (poolResult.reverted) {
    // Handling for leagcy loan token contract
    poolAddress = LEGACY_POOL_ADDRESS;
  } else {
    poolAddress = poolResult.value.toHexString();
  }
  const market = getMarket(Address.fromString(poolAddress));

  const tokenResult = contract.try_token();
  let tokenAddress: string;
  if (tokenResult.reverted) {
    // Handling for leagcy loan token contract
    tokenAddress = LEGACY_POOL_TOKEN_ADDRESS;
  } else {
    tokenAddress = tokenResult.value.toHexString();
  }

  const apyResult = contract.try_apy();
  if (!apyResult.reverted) {
    updateMarketRates(
      event,
      market,
      apyResult.value.toBigDecimal().div(BIGDECIMAL_HUNDRED)
    );
  }

  const amountResult = contract.try_amount();
  if (amountResult.reverted) {
    return;
  }
  const amount = amountResult.value;
  createBorrow(
    event,
    market,
    Address.fromString(tokenAddress),
    event.params.beneficiary,
    amount
  );
  changeMarketBorrowBalance(event, market, amount, true);

  const borrowerResult = contract.try_borrower();
  if (borrowerResult.reverted) {
    return;
  }
  changeUserStableBorrowerPosition(event, borrowerResult.value, market, amount);
}

export function handleRedeemed(event: Redeemed): void {
  const contract = LoanToken.bind(event.address);
  const tryPoolResult = contract.try_pool();
  if (tryPoolResult.reverted) {
    return;
  }
  const pool = tryPoolResult.value;
  const market = getMarket(pool);

  const tryTokenResult = contract.try_token();
  if (tryTokenResult.reverted) {
    return;
  }
  const token = tryTokenResult.value;

  const tryBorrowerResult = contract.try_borrower();
  if (tryBorrowerResult.reverted) {
    return;
  }
  const borrower = tryBorrowerResult.value;

  createRepay(event, market, token, borrower, event.params.redeemedAmount);

  const balanceChange = event.params.redeemedAmount.times(BIGINT_NEGATIVE_ONE);
  changeMarketBorrowBalance(event, market, balanceChange, true);
  changeUserStableBorrowerPosition(event, borrower, market, balanceChange);

  const tryStatusResult = contract.try_status();
  if (tryStatusResult.reverted) {
    return;
  }
  const status = tryStatusResult.value;
  if (status == 3) {
    const tryAmountResult = contract.try_amount();
    if (tryAmountResult.reverted) {
      return;
    }
    const amount = tryAmountResult.value;

    const tryDebtResult = contract.try_debt();
    if (tryDebtResult.reverted) {
      return;
    }
    const debt = tryDebtResult.value;

    const fee = debt.minus(amount).div(BIGINT_TEN);
    const underlyingToken = getOrCreateToken(token);
    addMarketProtocolSideRevenue(
      event,
      market,
      amountInUSD(fee, underlyingToken)
    );
    addMarketSupplySideRevenue(
      event,
      market,
      amountInUSD(debt.minus(amount).minus(fee), underlyingToken)
    );
  }
}
