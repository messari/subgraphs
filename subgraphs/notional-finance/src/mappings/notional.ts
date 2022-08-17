import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Notional,
  LendBorrowTrade,
  LiquidateCollateralCurrency,
  LiquidatefCashEvent,
  LiquidateLocalCurrency,
  Notional__getAccountPortfolioResultValue0Struct,
} from "../../generated/Notional/Notional";
import { Account } from "../../generated/schema";
import {
  BIGINT_ZERO,
  cDAI_ADDRESS,
  cETH_ADDRESS,
  cUSDC_ADDRESS,
  cWBTC_ADDRESS,
  MAX_UINT,
  PROTOCOL_ID,
} from "../common/constants";
import { bigIntToBigDecimal } from "../common/numbers";
import { getOrCreateAccount } from "../getters/account";
import { getOrCreateMarket } from "../getters/market";
import { getOrCreateToken } from "../getters/token";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../getters/transactions";
import {
  getOrCreateAsset,
  updateAssetOnEmptyPortfolio,
  updateAssetsAndAccountPortfolio,
} from "../getters/AccountPortfolio";

// Cash Balance = Asset Cash = cDAI
// nToken Balance = nToken
// fCash = fCashDAI
// assetDebt
// portfolioDebt
export function handleLendBorrowTrade(event: LendBorrowTrade): void {
  // getOrCreateToken, update Token price
  let currencyId = event.params.currencyId;
  let account = getOrCreateAccount(event.params.account.toHexString(), event);
  let amount = event.params.netAssetCash;

  // TODO: clumsy, make this a helper function
  let tokenAddress: string = "";
  if (currencyId == 1) {
    tokenAddress = cETH_ADDRESS;
  } else if ((currencyId = 2)) {
    tokenAddress = cDAI_ADDRESS;
  } else if ((currencyId = 3)) {
    tokenAddress = cUSDC_ADDRESS;
  } else if ((currencyId = 4)) {
    tokenAddress = cWBTC_ADDRESS;
  }
  let token = getOrCreateToken(
    Address.fromString(tokenAddress),
    event.block.number
  );

  let marketId = currencyId.toString() + "-" + event.params.maturity.toString();
  let market = getOrCreateMarket(event, marketId);
  market.inputToken = token.id;
  market.save();

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
    updateAssetsAndAccountPortfolio(account, portfolio, event);
    // TODO: is there a better way to do this?
    // Update fCash for currency-maturity for account = 0, when portfolio is empty
    if (portfolio.length == 0) {
      updateAssetOnEmptyPortfolio(
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

  // fCash change
  let fCashDifference = fCashAfterTransaction.minus(fCashBeforeTransaction);

  // TODO: review if we need to use AssetExchangeRate instead of an oracle for accuracy
  // github.com/notional-finance/subgraph-v2/blob/master/src/notional.ts#L307-L325
  // fCash in USD
  let amountUSD = bigIntToBigDecimal(event.params.netAssetCash, 8).times(
    token.lastPriceUSD!
  );

  if (
    fCashBeforeTransaction <= BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    log.error(
      "borrow, open position, fCashBefore: {}, fCashAfter: {}, market: {}, account: {}, txhash: {}, timestamp: {}",
      [
        fCashBeforeTransaction.toString(),
        fCashAfterTransaction.toString(),
        marketId.toString(),
        event.params.account.toHexString(),
        event.transaction.hash.toHexString(),
        event.block.timestamp.toString(),
      ]
    );
    createBorrow(event, market, amount, amountUSD);
  } else if (
    // This means they withdrew their deposit and borrowed at the same time.
    // TODO: How should this be treated? Currently, I'm treating this as borrow.
    fCashBeforeTransaction > BIGINT_ZERO &&
    fCashAfterTransaction < BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    log.error(
      "withdraw and borrow position, fCashBefore: {}, fCashAfter: {}, market: {}, account: {}, txhash: {}, timestamp: {}",
      [
        fCashBeforeTransaction.toString(),
        fCashAfterTransaction.toString(),
        marketId.toString(),
        event.params.account.toHexString(),
        event.transaction.hash.toHexString(),
        event.block.timestamp.toString(),
      ]
    );
    createBorrow(event, market, amount, amountUSD);
  } else if (
    fCashBeforeTransaction > BIGINT_ZERO &&
    fCashAfterTransaction >= BIGINT_ZERO &&
    fCashAfterTransaction < fCashBeforeTransaction
  ) {
    if (fCashAfterTransaction == BIGINT_ZERO) {
      log.error(
        "withdraw, close position, fCashBefore: {}, fCashAfter: {}, market: {}, account: {}, txhash: {}, timestamp: {}",
        [
          fCashBeforeTransaction.toString(),
          fCashAfterTransaction.toString(),
          marketId.toString(),
          event.params.account.toHexString(),
          event.transaction.hash.toHexString(),
          event.block.timestamp.toString(),
        ]
      );
    } else {
      log.error(
        "withdraw, update position, fCashBefore: {}, fCashAfter: {}, market: {}, account: {}, txhash: {}, timestamp: {}",
        [
          fCashBeforeTransaction.toString(),
          fCashAfterTransaction.toString(),
          marketId.toString(),
          event.params.account.toHexString(),
          event.transaction.hash.toHexString(),
          event.block.timestamp.toString(),
        ]
      );
    }
    createWithdraw(event, market, amount, amountUSD);
  } else if (
    // This means they repaid the loan and deposited at the same time.
    // TODO: How should this be treated? Currently, I'm treating this as repay.
    // VERIFIED: Nobody so far has ever repaid more than they owe.
    fCashBeforeTransaction < BIGINT_ZERO &&
    fCashAfterTransaction > BIGINT_ZERO &&
    fCashAfterTransaction > fCashBeforeTransaction
  ) {
    log.error(
      "repay and deposit position, fCashBefore: {}, fCashAfter: {}, market: {}, account: {}, txhash: {}, timestamp: {}",
      [
        fCashBeforeTransaction.toString(),
        fCashAfterTransaction.toString(),
        marketId.toString(),
        event.params.account.toHexString(),
        event.transaction.hash.toHexString(),
        event.block.timestamp.toString(),
      ]
    );
    createRepay(event, market, amount, amountUSD);
  } else if (
    fCashBeforeTransaction >= BIGINT_ZERO &&
    fCashAfterTransaction > fCashBeforeTransaction
  ) {
    log.error("", []);
    log.error(
      "lending/deposit, open position, fCashBefore: {}, fCashAfter: {}, market: {}, account: {}, txhash: {}, timestamp: {}",
      [
        fCashBeforeTransaction.toString(),
        fCashAfterTransaction.toString(),
        marketId.toString(),
        event.params.account.toHexString(),
        event.transaction.hash.toHexString(),
        event.block.timestamp.toString(),
      ]
    );
    createDeposit(event, market, amount, amountUSD);
  } else if (
    fCashBeforeTransaction < BIGINT_ZERO &&
    fCashAfterTransaction <= BIGINT_ZERO &&
    fCashAfterTransaction > fCashBeforeTransaction
  ) {
    if (fCashAfterTransaction == BIGINT_ZERO) {
      log.error(
        "repay, close position, fCashBefore: {}, fCashAfter: {}, market: {}, account: {}, txhash: {}, timestamp: {}",
        [
          fCashBeforeTransaction.toString(),
          fCashAfterTransaction.toString(),
          marketId.toString(),
          event.params.account.toHexString(),
          event.transaction.hash.toHexString(),
          event.block.timestamp.toString(),
        ]
      );
    } else {
      log.error(
        "repay, update position, fCashBefore: {}, fCashAfter: {}, market: {}, account: {} txhash: {}, timestamp: {}",
        [
          fCashBeforeTransaction.toString(),
          fCashAfterTransaction.toString(),
          marketId.toString(),
          event.params.account.toHexString(),
          event.transaction.hash.toHexString(),
          event.block.timestamp.toString(),
        ]
      );
    }
    createRepay(event, market, amount, amountUSD);
  }
}

/**
 * Liquidations
 * amounts are in cDAI
 * convert cDAI to USD (cDAI * USD) or (cDAI * DAI * USD)
 */
export function handleLiquidateLocalCurrency(
  event: LiquidateLocalCurrency
): void {
  let currencyId = event.params.localCurrencyId as i32;
  let liquidatee = event.params.liquidated;
  let liquidator = event.params.liquidator;
  let market = getOrCreateMarket(event, currencyId.toString());
  let amount = event.params.netLocalFromLiquidator;
  // profit

  createLiquidate(event, market, liquidator, liquidatee, amount);
}

export function handleLiquidateCollateralCurrency(
  event: LiquidateCollateralCurrency
): void {
  let currencyId = event.params.localCurrencyId as i32;
  let liquidatee = event.params.liquidated;
  let liquidator = event.params.liquidator;
  let market = getOrCreateMarket(event, currencyId.toString());
  let amount = event.params.netLocalFromLiquidator;
  // profit

  createLiquidate(event, market, liquidator, liquidatee, amount);
}

export function handleLiquidatefCash(event: LiquidatefCashEvent): void {
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
  // profit

  createLiquidate(event, market, liquidator, liquidatee, amount);
}
