/* eslint-disable @typescript-eslint/no-magic-numbers */
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
import { getOrCreateInterestRate } from "../getters/interestRate";
import { getOrCreateERC1155Token } from "../getters/token";

export function handleLendBorrowTrade(event: LendBorrowTrade): void {
  // params
  const currencyId = event.params.currencyId;
  const maturity = event.params.maturity;
  const marketId = currencyId.toString() + "-" + maturity.toString();

  // entities
  const market = getOrCreateMarket(event, marketId);
  const account = getOrCreateAccount(event.params.account.toHexString());
  const token = getTokenFromCurrency(event, currencyId.toString());

  // protocol contract
  const notional = Notional.bind(Address.fromString(PROTOCOL_ID));

  // update input token price
  const tokenPriceUSD = token.lastPriceUSD
    ? token.lastPriceUSD!
    : BIGDECIMAL_ZERO;
  market.inputTokenPriceUSD = tokenPriceUSD;

  // update liquidation params
  const rateStorageCall = notional.try_getRateStorage(currencyId);
  if (rateStorageCall.reverted) {
    log.error(
      "[handleLendBorrowTrade] getRateStorage for currencyId {} reverted",
      [currencyId.toString()]
    );
  } else {
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
    market.outputToken = getOrCreateERC1155Token(
      PROTOCOL_ID,
      encodedIdCall.value
    ).id;
  }

  market.save();

  // track status of markets
  const allMarkets = getMarketsWithStatus(event);
  if (allMarkets.activeMarkets.indexOf(market.id) < 0) {
    allMarkets.activeMarkets = addToArrayAtIndex(
      allMarkets.activeMarkets,
      market.id,
      0
    );
    allMarkets.save();
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

        // set/update current market attributes
        if (currencyMarket == market.id) {
          const mkt = getOrCreateMarket(event, currencyMarket);

          // set interest rate for market
          const interestRate = getOrCreateInterestRate(currencyMarket);
          const rate = bigIntToBigDecimal(impliedRate, RATE_PRECISION_DECIMALS);
          interestRate.rate = rate.times(BIGDECIMAL_HUNDRED);
          interestRate.save();

          // set exchange rate for market in event
          const timeToMaturity = bigIntToBigDecimal(
            maturity.minus(event.block.timestamp),
            0
          );

          // set exchange rate only when timeMaturity > 0
          if (timeToMaturity > BIGDECIMAL_ZERO) {
            const exchangeRate = BigDecimal.fromString(
              Math.exp(
                parseFloat(
                  rate.times(timeToMaturity).div(SECONDS_PER_YEAR).toString()
                )
              ).toString()
            );
            mkt.exchangeRate = exchangeRate;
          }

          mkt.save();
        }
      }
    }
  }

  // update market entities when they become inactive
  for (let k = 0; k < allMarkets.activeMarkets.length; k++) {
    if (!activeMarkets.includes(allMarkets.activeMarkets[k])) {
      const m = getOrCreateMarket(event, allMarkets.activeMarkets[k]);

      // market status
      m.isActive = false;
      m.canBorrowFrom = false;

      // manual update balances to 0
      m.totalValueLockedUSD = BIGDECIMAL_ZERO;
      m.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
      m.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;

      // manually update positions to 0
      m.positionCount = 0;
      m.closedPositionCount += m.openPositionCount;
      m.openPositionCount = 0;
      m.closedPositionCount = 0;
      m.lendingPositionCount = 0;
      m.borrowingPositionCount = 0;

      m.save();

      const maturedMarketIndex = allMarkets.activeMarkets.indexOf(m.id);
      allMarkets.activeMarkets = removeFromArrayAtIndex(
        allMarkets.activeMarkets,
        maturedMarketIndex
      );
      allMarkets.maturedMarkets = addToArrayAtIndex(
        allMarkets.maturedMarkets,
        m.id,
        0
      );
      allMarkets.save();
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
    // Update fCash for currency-maturity pair for an account when portfolio is empty
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
    tokenPriceUSD
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

  // Identify Transaction Type:
  // transactions of different user intention may call the
  // same action type in notional smart contract design
  if (
    fCashBeforeTransaction <= BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    createBorrow(event, market, absfCashAmount, absAmount, absAmountUSD);
  } else if (
    // Logging for reference. More details in README.
    fCashBeforeTransaction > BIGINT_ZERO &&
    fCashAfterTransaction < BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    log.warning(
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
    // Logging for reference. More details in README.
    fCashBeforeTransaction < BIGINT_ZERO &&
    fCashAfterTransaction > BIGINT_ZERO &&
    fCashAfterTransaction > fCashBeforeTransaction
  ) {
    log.warning(
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

  createLiquidate(event, currencyId, liquidator, liquidatee, amount);
}

export function handleLiquidateCollateralCurrency(
  event: LiquidateCollateralCurrency
): void {
  const currencyId: i32 = event.params.localCurrencyId;
  const liquidatee = event.params.liquidated;
  const liquidator = event.params.liquidator;
  const amount = event.params.netLocalFromLiquidator;

  createLiquidate(event, currencyId, liquidator, liquidatee, amount);
}

export function handleLiquidatefCash(event: LiquidatefCashEvent): void {
  const currencyId: i32 = event.params.localCurrencyId;
  const liquidatee = event.params.liquidated;
  const liquidator = event.params.liquidator;
  const amount = event.params.netLocalFromLiquidator;

  createLiquidate(event, currencyId, liquidator, liquidatee, amount);
}
