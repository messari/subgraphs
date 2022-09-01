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
  Notional__getAccountPortfolioResultValue0Struct,
} from "../../generated/Notional/Notional";
import { Account } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
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
import { getTokenFromCurrency } from "../common/helpers";
import { getOrCreateInterestRate } from "../getters/InterestRate";

// Cash Balance = Asset Cash = cDAI
// nToken Balance = nToken
// fCash = fCashDAI
// assetDebt
// portfolioDebt
export function handleLendBorrowTrade(event: LendBorrowTrade): void {
  // TODO: repeat this for an account with two deposits or borrows to check count in createPosition
  // if (
  //   event.params.account.toHexString() ==
  //   "0xd4e26683635bf3dc9ead5f31b935c33cc1ce1838"
  // ) {
  // getOrCreateToken, update Token price
  let currencyId = event.params.currencyId;
  let maturity = event.params.maturity;
  // TODO: settlement date isn't available, required for updating the rate
  // let settlement = event.params.settlementDate;

  let account = getOrCreateAccount(event.params.account.toHexString(), event);
  let marketId = currencyId.toString() + "-" + maturity.toString();
  let market = getOrCreateMarket(event, marketId);
  let token = getTokenFromCurrency(event, currencyId.toString());

  // TODO: verify this is accurate?
  market.inputTokenPriceUSD = token.lastPriceUSD!;

  // TODO: market rate
  // let interestRate = getOrCreateInterestRate(market.id);
  // Get 'impliedRate' from 'getMarket(currencyId, maturity, settlementDate);
  // interestRate.rate = impliedRate;
  // market.rates = [interestRate];
  // market.outputTokenPriceUSD = BIGDECIMAL_ZERO; HOW DO WE REPRESENT THIS?

  // TODO: market exchange rate
  // market.exchangeRate

  market.save();

  // USD amount of Lend Borrow Trade
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
    updateAssetsAndAccountPortfolio(account, portfolio, event);
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

  // TODO: review if we need to use AssetExchangeRate instead of an oracle for accuracy
  // github.com/notional-finance/subgraph-v2/blob/master/src/notional.ts#L307-L325
  // fCash in USD
  // TODO: check tokenDecimals is accurate
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
    // This means they withdrew their deposit and borrowed at the same time.
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
    // This means they withdrew their deposit and borrowed at the same time.
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
  // }
}

/**
 * Liquidations
 * amounts are in cDAI
 * convert cDAI to USD (cDAI * USD) or (cDAI * DAI * USD)
 */
// TODO: are these events redundant given some of the withdraws and repays are likely
// liquidatio events?
// export function handleLiquidateLocalCurrency(
//   event: LiquidateLocalCurrency
// ): void {
//   if (
//     event.params.liquidated.toHexString() ==
//     "0xd4e26683635bf3dc9ead5f31b935c33cc1ce1838"
//   ) {
//     let currencyId = event.params.localCurrencyId as i32;
//     let liquidatee = event.params.liquidated;
//     let liquidator = event.params.liquidator;
//     let market = getOrCreateMarket(event, currencyId.toString());
//     // TODO: fix this amount
//     let amount = event.params.netLocalFromLiquidator;
//     // profit

//     createLiquidate(event, market, liquidator, liquidatee, amount);
//   }
// }

// export function handleLiquidateCollateralCurrency(
//   event: LiquidateCollateralCurrency
// ): void {
//   if (
//     event.params.liquidated.toHexString() ==
//     "0xd4e26683635bf3dc9ead5f31b935c33cc1ce1838"
//   ) {
//     event.params._event
//     let currencyId = event.params.localCurrencyId as i32;
//     let liquidatee = event.params.liquidated;
//     let liquidator = event.params.liquidator;
//     let market = getOrCreateMarket(event, currencyId.toString());
//     // TODO: fix this amount
//     let amount = event.params.netLocalFromLiquidator;
//     // profit

//     createLiquidate(event, market, liquidator, liquidatee, amount);
//   }
// }

// export function handleLiquidatefCash(event: LiquidatefCashEvent): void {
//   // if (event.params.localCurrencyId == event.params.fCashCurrency) {
//   //   liq.type = LocalFcash;
//   // } else {
//   //   liq.type = CrossCurrencyFcash;
//   // }
//   if (
//     event.params.liquidated.toHexString() ==
//     "0xd4e26683635bf3dc9ead5f31b935c33cc1ce1838"
//   ) {
//     let currencyId = event.params.localCurrencyId as i32;
//     let liquidatee = event.params.liquidated;
//     let liquidator = event.params.liquidator;
//     let market = getOrCreateMarket(event, currencyId.toString());
//     // TODO: fix this amount
//     let amount = event.params.netLocalFromLiquidator;
//     // profit

//     createLiquidate(event, market, liquidator, liquidatee, amount);
//   }
// }

// TODO: use MarketInitialized to create markets and update exchangeRate, Rate?
export function handleMarketsInitialized(): void {}

export function handleUpdateInitializationParameters(): void {}
