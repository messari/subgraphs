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
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_HUNDRED,
  PROTOCOL_ID,
  RATE_PRECISION_DECIMALS,
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
import { getOrCreateInterestRate } from "../getters/InterestRate";
import { getOrCreateERC1155Token } from "../getters/token";

export function handleLendBorrowTrade(event: LendBorrowTrade): void {
  // params
  const currencyId = event.params.currencyId;
  const maturity = event.params.maturity;
  const marketId = currencyId.toString() + "-" + maturity.toString();

  // entities
  const market = getOrCreateMarket(event, marketId);
  const account = getOrCreateAccount(event.params.account.toHexString(), event);
  const token = getTokenFromCurrency(event, currencyId.toString());

  // protocol contract
  const notional = Notional.bind(Address.fromString(PROTOCOL_ID));

  // update input token price
  market.inputTokenPriceUSD = token.lastPriceUSD!;

  // update liquidation params
  const rateStorageCall = notional.try_getRateStorage(currencyId);
  if (rateStorageCall.reverted) {
    log.error(
      "[handleLendBorrowTrade] getRateStorage for currencyId {} reverted",
      [currencyId.toString()]
    );
  } else {
    // TODO: WebAssembly division truncation vs 0.01
    market.maximumLTV = BigDecimal.fromString(
      (rateStorageCall.value.getEthRate().haircut * 0.01).toString()
    );
    market.liquidationThreshold = BigDecimal.fromString(
      (rateStorageCall.value.getEthRate().rateBuffer * 0.01).toString()
    );
    market.liquidationPenalty = BigDecimal.fromString(
      (
        rateStorageCall.value.getEthRate().liquidationDiscount - INT_HUNDRED
      ).toString()
    );
  }

  // update output token
  const encodedIdCall = notional.try_encodeToId(currencyId, maturity, 1);
  if (encodedIdCall.reverted) {
    log.error(
      "[handleLendBorrowTrade] encodeToId for currencyId {}, maturity {} reverted",
      [currencyId.toString(), maturity.toString()]
    );
  } else {
    // TODO: WebAssembly division truncation vs 0.01
    market.outputToken = getOrCreateERC1155Token(
      PROTOCOL_ID,
      encodedIdCall.value
    ).id;
  }

  market.save();

  // track market status
  const markets = getMarketsWithStatus(event);
  if (markets.activeMarkets.indexOf(market.id) < 0) {
    markets.activeMarkets = addToArrayAtIndex(
      markets.activeMarkets,
      market.id,
      0
    );
    markets.save();
  }

  // get active markets
  const currencyIds = [1, 2, 3, 4];
  let activeMarkets: string[] = [];
  for (let i = 0; i < currencyIds.length; i++) {
    const call = notional.try_getActiveMarkets(currencyIds[i]);
    if (call.reverted) {
      log.error(
        "[handleLendBorrowTrade] getActiveMarkets for currencyId {} reverted",
        [currencyIds[i].toString()]
      );
    } else {
      for (let j = 0; j < call.value.length; j++) {
        const maturity = call.value[j].maturity;
        const impliedRate = call.value[j].lastImpliedRate;
        const currencyMarket =
          currencyIds[i].toString() + "-" + maturity.toString();

        // set active markets for currency
        activeMarkets = activeMarkets.concat([currencyMarket]);

        if (currencyMarket == market.id) {
          const m = getOrCreateMarket(event, currencyMarket);

          // set interest rate for market in event
          const interestRate = getOrCreateInterestRate(currencyMarket);
          const r = bigIntToBigDecimal(impliedRate, RATE_PRECISION_DECIMALS);
          interestRate.rate = r.times(BIGDECIMAL_HUNDRED);
          interestRate.save();
          m.rates = [interestRate.id];

          // set exchange rate for market in event
          const timeToMaturity = bigIntToBigDecimal(
            maturity.minus(event.block.timestamp),
            0
          );

          // TODO: fix precision/decimals and remove two variables
          // set exchange rate when timeMaturity > 0
          if (timeToMaturity > BIGDECIMAL_ZERO) {
            const er0 = Math.exp(
              parseFloat(
                r.times(timeToMaturity).div(SECONDS_PER_YEAR).toString()
              )
            );
            const er = BigDecimal.fromString(er0.toString()).times(
              BIGDECIMAL_HUNDRED
            );
            m.exchangeRate = er;
          }

          // save
          m.save();
        }
      }
    }
  }

  for (let k = 0; k < markets.activeMarkets.length; k++) {
    if (!activeMarkets.includes(markets.activeMarkets[k])) {
      // event is irrelevant
      const m = getOrCreateMarket(event, markets.activeMarkets[k]);

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

      const maturedMarketIndex = markets.activeMarkets.indexOf(m.id);
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
  const fCashBeforeTransaction = getOrCreateAsset(
    account.id,
    currencyId.toString(),
    event.params.maturity
  ).notional;

  // update fCash asset values
  const accountPortfolioCallResult = notional.try_getAccountPortfolio(
    event.params.account
  );

  if (accountPortfolioCallResult.reverted) {
    log.error("[handleLendBorrowTrade] getAccountPortfolio reverted", []);
  } else {
    const portfolio = new Array<ethereum.Tuple>();
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
  const fCashAfterTransaction = getOrCreateAsset(
    account.id,
    currencyId.toString(),
    event.params.maturity
  ).notional;

  // LendBorrow amounts (assetCash, fCash, USD)
  const cTokenAmount = event.params.netAssetCash;
  const fCashAmount = event.params.netfCash;
  const amountUSD = bigIntToBigDecimal(cTokenAmount, token.decimals).times(
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

  // identify transaction type
  // transactions of different user intention may call the same action type in notional smart contract design
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
  const currencyId: i32 = event.params.localCurrencyId;
  const liquidatee = event.params.liquidated;
  const liquidator = event.params.liquidator;
  const amount = event.params.netLocalFromLiquidator;

  // log.error(
  //   "*************** [handleLiquidateLocalCurrency] tx: {}, localCurrencyId: {}",
  //   [
  //     event.transaction.hash.toHexString(),
  //     event.params.localCurrencyId.toString(),
  //   ]
  // );

  // TODO: Blocker. cannot associate liquidation event with a market without maturity info.
  // let market = getOrCreateMarket(event, marketId); // marketId = currencyId.toString() + "-" + maturity.toString();

  // createliquidate(event, market, liquidator, liquidatee, amount);
  createLiquidate(event, currencyId, liquidator, liquidatee, amount);
}

export function handleLiquidateCollateralCurrency(
  event: LiquidateCollateralCurrency
): void {
  const currencyId: i32 = event.params.localCurrencyId;
  const liquidatee = event.params.liquidated;
  const liquidator = event.params.liquidator;
  const amount = event.params.netLocalFromLiquidator;

  // log.error(
  //   "%%%%%%%%%%%%%%% [handleLiquidateCollateralCurrency] tx:{}, localCurrencyId: {}, collateralCurrencyId: {}, netLocalFromLiquidator: {}, netCollateralTransfer: {}, netNTokenTransfer: {}",
  //   [
  //     event.transaction.hash.toHexString(),
  //     event.params.localCurrencyId.toString(),
  //     event.params.collateralCurrencyId.toString(),
  //     event.params.netLocalFromLiquidator.toString(),
  //     event.params.netCollateralTransfer.toString(),
  //     event.params.netNTokenTransfer.toString(),
  //   ]
  // );

  // TODO: Blocker. cannot associate liquidation event with a market without maturity info.
  // let market = getOrCreateMarket(event, marketId); // marketId = currencyId.toString() + "-" + maturity.toString();

  // createliquidate(event, market, liquidator, liquidatee, amount);
  createLiquidate(event, currencyId, liquidator, liquidatee, amount);
}

export function handleLiquidatefCash(event: LiquidatefCashEvent): void {
  const currencyId: i32 = event.params.localCurrencyId;
  const liquidatee = event.params.liquidated;
  const liquidator = event.params.liquidator;
  const amount = event.params.netLocalFromLiquidator;

  // log.error(
  //   "$$$$$$$$$$$$$$$$$$$$ [handleLiquidatefCash] tx: {}, localCurrencyId: {}, fCashCurrencyId: {}, netLocalFromLiquidator: {}, fCashNotionalTransfer: {}",
  //   [
  //     event.transaction.hash.toHexString(),
  //     event.params.localCurrencyId.toString(),
  //     event.params.fCashCurrency.toString(),
  //     event.params.netLocalFromLiquidator.toString(),
  //     event.params.fCashNotionalTransfer.toString(),
  //   ]
  // );

  // TODO: Blocker. cannot associate liquidation event with a market without maturity info.
  // let market = getOrCreateMarket(event, marketId); // marketId = currencyId.toString() + "-" + maturity.toString();

  // createliquidate(event, market, liquidator, liquidatee, amount);
  createLiquidate(event, currencyId, liquidator, liquidatee, amount);
}
