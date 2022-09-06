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
  Notional__getActiveMarketsResultValue0Struct,
} from "../../generated/Notional/Notional";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  INT_ZERO,
  PROTOCOL_ID,
  SECONDS_PER_YEAR,
} from "../common/constants";
import { bigIntToBigDecimal } from "../common/numbers";
import { getOrCreateAccount } from "../getters/account";
import { getOrCreateMarket, getMarketsWithStatus } from "../getters/market";
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
import { addToArrayAtIndex, removeFromArrayAtIndex } from "../common/arrays";

export function handleLendBorrowTrade(event: LendBorrowTrade): void {
  // TODO: why is nonce null? reading nonce value results in subgraph error
  // log.error(" -- Before Nonce", []);
  // let nonce = event.transaction.nonce;
  // log.error(" -- After Nonce", [nonce.toString()]);

  let currencyId = event.params.currencyId;
  let maturity = event.params.maturity;
  let marketId = currencyId.toString() + "-" + maturity.toString();

  let market = getOrCreateMarket(event, marketId);
  let account = getOrCreateAccount(event.params.account.toHexString(), event);
  let token = getTokenFromCurrency(event, currencyId.toString());

  // update market
  market.inputTokenPriceUSD = token.lastPriceUSD!;
  //
  // TODO: market.rates cannot be fetched without settlement date
  // let interestRate = getOrCreateInterestRate(market.id);
  // let settlement = event.params.settlementDate;    // not available
  // Get 'impliedRate' from 'getMarket(currencyId, maturity, settlementDate);
  // interestRate.rate = impliedRate;
  // market.rates = [interestRate];
  //
  // TODO: market exchange rate, talking to notional on how to find this
  // market.exchangeRate
  //
  market.save();

  // marketstatus entity
  // TODO: we could make this protocol entity
  // TODO: do this getOrCreateMarket?
  let markets = getMarketsWithStatus(event);
  if (markets.activeMarkets.indexOf(market.id) < 0) {
    markets.activeMarkets = addToArrayAtIndex(
      markets.activeMarkets,
      market.id,
      0
    );
    markets.save();
  }

  // getActiveMarkets
  let currencyIds = [1, 2, 3, 4];
  let notional = Notional.bind(Address.fromString(PROTOCOL_ID));
  let activeMarkets: string[] = [];
  for (let i = 0; i < currencyIds.length; i++) {
    let call = notional.try_getActiveMarkets(currencyIds[i]);
    if (call.reverted) {
      log.error(
        "[handleLendBorrowTrade] getActiveMarkets for currencyId {} reverted",
        [currencyId.toString()]
      );
    } else {
      for (let j = 0; j < call.value.length; j++) {
        let currencyMarket =
          currencyIds[i].toString() + "-" + call.value[j].maturity.toString();
        activeMarkets = activeMarkets.concat([currencyMarket]);
      }
    }
  }

  for (let k = 0; k < markets.activeMarkets.length; k++) {
    if (!activeMarkets.includes(markets.activeMarkets[k])) {
      // event is irrelevant
      let m = getOrCreateMarket(event, markets.activeMarkets[k]);

      // status
      m.isActive = false;
      m.canBorrowFrom = false;

      // balances
      m.totalValueLockedUSD = BIGDECIMAL_ZERO;
      m.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
      m.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;

      // positions
      // TODO: should we update position counts manually to 0? do we need to manually close positions as markets mature?
      // positionCount
      // openPositionCount
      // closedPositionCount
      // lendingPositionCount
      // borrowingPositionCount

      m.save();

      let maturedMarketIndex = markets.activeMarkets.indexOf(m.id);
      markets.activeMarkets = removeFromArrayAtIndex(
        markets.activeMarkets,
        maturedMarketIndex
      );
      markets.maturedMarkets = addToArrayAtIndex(
        markets.maturedMarkets,
        m.id,
        0
      );
      markets.save();
    }
  }

  // account fCash before; we use asset entity to track fCash values before and after TX
  let fCashBeforeTransaction = getOrCreateAsset(
    account.id,
    currencyId.toString(),
    event.params.maturity
  ).notional;

  // update fCash asset values
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

  // account fCash after; we use asset entity to track fCash values before and after TX
  let fCashAfterTransaction = getOrCreateAsset(
    account.id,
    currencyId.toString(),
    event.params.maturity
  ).notional;

  // LendBorrow amounts (assetCash, fCash, USD)
  let cTokenAmount = event.params.netAssetCash;
  let fCashAmount = event.params.netfCash;
  let amountUSD = bigIntToBigDecimal(cTokenAmount, token.decimals).times(
    token.lastPriceUSD!
  );

  // we need absolute amounts for metrics; fCash is signed
  let absAmountUSD: BigDecimal = amountUSD;
  let absAmount: BigInt = cTokenAmount;
  let absfCashAmount: BigInt = fCashAmount;
  if (cTokenAmount < BIGINT_ZERO) {
    absAmountUSD = amountUSD.neg();
    absAmount = cTokenAmount.neg();
  }
  if (fCashAmount < BIGINT_ZERO) {
    absfCashAmount = fCashAmount.neg();
  }

  // TODO: Need to deal with int and float formats for getting the rate
  // let RATE_PRECISION: BigDecimal = BIGDECIMAL_ONE;
  // let SECONDS_IN_YEAR: BigInt = BigInt.fromI32(60 * 60 * 24 * 365);
  // let exchangeRate: BigDecimal = BIGDECIMAL_ZERO;
  // exchangeRate = bigIntToBigDecimal(absfCashAmount.div(absAmount));

  // let exchangeRateWithRatePrecision: BigDecimal = BIGDECIMAL_ZERO;
  // exchangeRateWithRatePrecision = bigIntToBigDecimal(
  //   bigIntToBigDecimal(absfCashAmount)
  //     .times(RATE_PRECISION)
  //     .div(absAmount)
  // );

  // let annualizedRate: BigDecimal = BIGDECIMAL_ZERO;
  // let annualizedRateWithRatePrecision: BigInt = BIGINT_ZERO;
  // let timeToMaturity: BigInt = maturity.minus(event.block.timestamp);
  // annualizedRateWithRatePrecision = RATE_PRECISION;
  // let whatever: BigInt = Math.log(
  //   exchangeRateWithRatePrecision.div(RATE_PRECISION)
  // )
  //   .times(SECONDS_IN_YEAR)
  //   .div(timeToMaturity)
  //   .times(RATE_PRECISION);

  // log.error(
  //   " ---> currencyId: {}, absfCash: {}, absAssetCash: {}, exchangeRate: {}, exchangeRateWithRatePrecision: {}",
  //   [
  //     currencyId.toString(),
  //     absfCashAmount.toString(),
  //     absAmount.toString(),
  //     exchangeRate.toString(),
  //     exchangeRateWithRatePrecision.toString(),
  //     // annualizedRate.toString(),
  //     // annualizedRateWithRatePrecision.toString(),
  //   ]
  // );

  // identify transaction type
  // transactions of different user intention may call the same action type in notional smart contract design
  // TODO: is there a way to identify if a transaction type is also liquidation event?
  if (
    fCashBeforeTransaction <= BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    createBorrow(event, market, absfCashAmount, absAmount, absAmountUSD);
  } else if (
    // This means they withdrew their deposit and borrowed at the same time.
    // No such events found but worth logging them.
    // TODO: Methodology Question: A) Is this possible? B) How should this be treated? Currently, I'm treating this as borrow.
    fCashBeforeTransaction > BIGINT_ZERO &&
    fCashAfterTransaction < BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    createBorrow(event, market, absfCashAmount, absAmount, absAmountUSD);
    log.info(
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
    // This means they withdrew their deposit and borrowed at the same time.
    // No such events found but worth logging them.
    // TODO: Methodology Question: A) Is this possible? B) How should this be treated? Currently, I'm treating this as borrow.
    fCashBeforeTransaction < BIGINT_ZERO &&
    fCashAfterTransaction > BIGINT_ZERO &&
    fCashAfterTransaction > fCashBeforeTransaction
  ) {
    createRepay(event, market, absfCashAmount, absAmount, absAmountUSD);
    log.info(
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
  let amount = event.params.netLocalFromLiquidator;
  // TODO: not possible to calculate
  // let profit

  // TODO: Blocker. cannot associate liquidation event with a market without maturity info.
  // let market = getOrCreateMarket(event, marketId); // marketId = currencyId.toString() + "-" + maturity.toString();

  // createliquidate(event, market, liquidator, liquidatee, amount);
  createLiquidate(event, currencyId.toString(), liquidator, liquidatee, amount);
}

export function handleLiquidateCollateralCurrency(
  event: LiquidateCollateralCurrency
): void {
  let currencyId = event.params.localCurrencyId as i32;
  let liquidatee = event.params.liquidated;
  let liquidator = event.params.liquidator;
  let amount = event.params.netLocalFromLiquidator;
  // TODO: not possible to calculate
  // let profit

  // TODO: Blocker. cannot associate liquidation event with a market without maturity info.
  // let market = getOrCreateMarket(event, marketId); // marketId = currencyId.toString() + "-" + maturity.toString();

  // createliquidate(event, market, liquidator, liquidatee, amount);
  createLiquidate(event, currencyId.toString(), liquidator, liquidatee, amount);
}

export function handleLiquidatefCash(event: LiquidatefCashEvent): void {
  let currencyId = event.params.localCurrencyId as i32;
  let liquidatee = event.params.liquidated;
  let liquidator = event.params.liquidator;
  let amount = event.params.netLocalFromLiquidator;
  // TODO: not possible to calculate
  // let profit

  // TODO: Blocker. cannot associate liquidation event with a market without maturity info.
  // let market = getOrCreateMarket(event, marketId); // marketId = currencyId.toString() + "-" + maturity.toString();

  // createliquidate(event, market, liquidator, liquidatee, amount);
  createLiquidate(event, currencyId.toString(), liquidator, liquidatee, amount);
}
