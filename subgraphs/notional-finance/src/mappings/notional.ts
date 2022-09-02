import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Notional,
  LendBorrowTrade,
  LiquidateCollateralCurrency,
  LiquidatefCashEvent,
  LiquidateLocalCurrency,
} from "../../generated/Notional/Notional";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, PROTOCOL_ID } from "../common/constants";
import { bigIntToBigDecimal } from "../common/numbers";
import { getOrCreateAccount } from "../getters/account";
import { getOrCreateMarket } from "../getters/market";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../setters/transactions";
import {
  getOrCreateAsset,
  updateAccountAssetOnEmptyPortfolio,
  updateAccountAssets,
} from "../getters/accountAssets";
import { getTokenFromCurrency } from "../common/util";

export function handleLendBorrowTrade(event: LendBorrowTrade): void {
  let currencyId = event.params.currencyId;
  let maturity = event.params.maturity;
  // TODO: why is nonce null? reading nonce value results in subgraph error
  // log.error(" -- Before Nonce", []);
  // let nonce = event.transaction.nonce;
  // log.error(" -- After Nonce", [nonce.toString()]);

  let marketId = currencyId.toString() + "-" + maturity.toString();
  let market = getOrCreateMarket(event, marketId);
  let account = getOrCreateAccount(event.params.account.toHexString(), event);
  let token = getTokenFromCurrency(event, currencyId.toString());

  // TODO: verify this is accurate?
  market.inputTokenPriceUSD = token.lastPriceUSD!;

  // TODO: market.rates cannot be fetched without settlement date
  // let settlement = event.params.settlementDate;
  // let interestRate = getOrCreateInterestRate(market.id);
  // Get 'impliedRate' from 'getMarket(currencyId, maturity, settlementDate);
  // interestRate.rate = impliedRate;
  // market.rates = [interestRate];

  // TODO: market exchange rate, talking to notional on how to find this
  // market.exchangeRate

  market.save();

  // LendBorrow amount in USD
  let cTokenAmount = event.params.netAssetCash;
  let fCashAmount = event.params.netfCash;
  let amountUSD = bigIntToBigDecimal(cTokenAmount, token.decimals).times(
    token.lastPriceUSD!
  );

  // fCash before
  let fCashBeforeTransaction = getOrCreateAsset(
    account.id,
    currencyId.toString(),
    event.params.maturity
  ).notional;

  // update and get asset
  let notional = Notional.bind(Address.fromString(PROTOCOL_ID));
  let accountPortfolioCallResult = notional.try_getAccountPortfolio(
    event.transaction.from
  );

  if (accountPortfolioCallResult.reverted) {
    log.error("[handleLendBorrowTrade] getAccountPortfolio reverted", []);
  } else {
    let portfolio = new Array<ethereum.Tuple>();
    for (let i = 0; i < accountPortfolioCallResult.value.length; i++) {
      portfolio.push(accountPortfolioCallResult.value[i]);
    }
    updateAccountAssets(account, portfolio, event);
    // Update fCash for currency-maturity for an account when portfolio is empty
    if (portfolio.length == 0) {
      updateAccountAssetOnEmptyPortfolio(
        account.id,
        currencyId.toString(),
        event.params.maturity,
        event
      );
    }
  }

  // fCash after
  let fCashAfterTransaction = getOrCreateAsset(
    account.id,
    currencyId.toString(),
    event.params.maturity
  ).notional;

  // use absolute amounts
  let absAmountUSD: BigDecimal = amountUSD;
  let absAmount: BigInt = cTokenAmount;
  let absfCashAmount: BigInt = fCashAmount;
  if (amountUSD < BIGDECIMAL_ZERO) {
    absAmountUSD = amountUSD.neg();
    absAmount = cTokenAmount.neg();
    absfCashAmount = fCashAmount.neg();
  }

  if (
    fCashBeforeTransaction <= BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    createBorrow(event, market, absfCashAmount, absAmount, absAmountUSD);
  } else if (
    // This means they withdrew their deposit and borrowed at the same time. Is this possible?
    // No such events found but worth logging them.
    // TODO: How should this be treated? Currently, I'm treating this as borrow.
    fCashBeforeTransaction > BIGINT_ZERO &&
    fCashAfterTransaction < BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    createBorrow(event, market, absfCashAmount, absAmount, absAmountUSD);
    log.error(
      " -- Withdraw and Borrow at the same time, account: {}, hash: {}, fCashAmount: {}",
      [account.id, event.transaction.hash.toHexString(), fCashAmount.toString()]
    );
  } else if (
    fCashBeforeTransaction > BIGINT_ZERO &&
    fCashAfterTransaction >= BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    createWithdraw(event, market, absfCashAmount, absAmount, absAmountUSD);
  } else if (
    // This means they withdrew their deposit and borrowed at the same time. Is this possible?
    // No such events found but worth logging them.
    // TODO: How should this be treated? Currently, I'm treating this as Repay.
    fCashBeforeTransaction < BIGINT_ZERO &&
    fCashAfterTransaction > BIGINT_ZERO &&
    fCashAfterTransaction > fCashBeforeTransaction
  ) {
    createRepay(event, market, absfCashAmount, absAmount, absAmountUSD);
    log.error(
      " -- Repay and Deposit at the same time, account: {}, hash: {}, fCashAmount: {}",
      [account.id, event.transaction.hash.toHexString(), fCashAmount.toString()]
    );
  } else if (
    fCashBeforeTransaction >= BIGINT_ZERO &&
    fCashAfterTransaction > fCashBeforeTransaction
  ) {
    createDeposit(event, market, absfCashAmount, absAmount, absAmountUSD);
  } else if (
    fCashBeforeTransaction < BIGINT_ZERO &&
    fCashAfterTransaction <= BIGINT_ZERO &&
    fCashAfterTransaction > fCashBeforeTransaction
  ) {
    createRepay(event, market, absfCashAmount, absAmount, absAmountUSD);
  }
}

export function handleLiquidateLocalCurrency(
  event: LiquidateLocalCurrency
): void {
  let currencyId = event.params.localCurrencyId as i32;
  let liquidatee = event.params.liquidated;
  let liquidator = event.params.liquidator;
  let market = getOrCreateMarket(event, currencyId.toString());
  let amount = event.params.netLocalFromLiquidator;
  // TODO: not possible to calculate
  // let profit

  createLiquidate(event, market, liquidator, liquidatee, amount);
}

export function handleLiquidateCollateralCurrency(
  event: LiquidateCollateralCurrency
): void {
  event.params._event;
  let currencyId = event.params.localCurrencyId as i32;
  let liquidatee = event.params.liquidated;
  let liquidator = event.params.liquidator;
  let market = getOrCreateMarket(event, currencyId.toString());
  let amount = event.params.netLocalFromLiquidator;
  // TODO: not possible to calculate
  // let profit

  createLiquidate(event, market, liquidator, liquidatee, amount);
}

export function handleLiquidatefCash(event: LiquidatefCashEvent): void {
  // TODO: remove
  // if (event.params.localCurrencyId == event.params.fCashCurrency) {
  //   liq.type = LocalFcash;
  // } else {
  //   liq.type = CrossCurrencyFcash;
  // }
  let currencyId = event.params.localCurrencyId as i32;
  let liquidatee = event.params.liquidated;
  let liquidator = event.params.liquidator;
  let market = getOrCreateMarket(event, currencyId.toString());
  let amount = event.params.netLocalFromLiquidator;
  // TODO: not possible to calculate
  // let profit

  createLiquidate(event, market, liquidator, liquidatee, amount);
}
