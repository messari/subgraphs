import {
  BigDecimal,
  BigInt,
  Address,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Notional/ERC20";
import {
  BIGDECIMAL_ZERO,
  NOTIONAL_USER_REVENUE_SHARE,
  NOTIONAL_PROTOCOL_REVENUE_SHARE,
  TransactionType,
  NOTIONAL_TRADE_FEES,
  PROTOCOL_ID,
  cETH_ADDRESS,
  cDAI_ADDRESS,
  cUSDC_ADDRESS,
  cWBTC_ADDRESS,
} from "../common/constants";
import { bigIntToBigDecimal } from "../common/numbers";
import { getOrCreateFinancialsDailySnapshot } from "../getters/financialMetrics";
import {
  getOrCreateMarket,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
} from "../getters/market";
import { getOrCreateLendingProtocol } from "../getters/protocol";
import { getOrCreateToken } from "../getters/token";

// TODO: need right amountUSD
export function updateFinancials(
  event: ethereum.Event,
  amountUSD: BigDecimal,
  marketId: string
): void {
  let financialsDailySnapshots = getOrCreateFinancialsDailySnapshot(event);
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, marketId);
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, marketId);
  let market = getOrCreateMarket(event, marketId);
  let protocol = getOrCreateLendingProtocol();

  // fees and revenue amounts
  let feesUSD = amountUSD.times(NOTIONAL_TRADE_FEES);
  let totalRevenueUSD = feesUSD;
  let supplySideRevenueUSD = feesUSD.times(NOTIONAL_USER_REVENUE_SHARE);
  let protocolSideRevenueUSD = feesUSD.times(NOTIONAL_PROTOCOL_REVENUE_SHARE);

  // market cumulatives
  market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  market.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  market.save();

  // protocol cumulatives
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );

  // financials daily - daily revenues
  financialsDailySnapshots.dailyTotalRevenueUSD = financialsDailySnapshots.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  financialsDailySnapshots.dailySupplySideRevenueUSD = financialsDailySnapshots.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  financialsDailySnapshots.dailyProtocolSideRevenueUSD = financialsDailySnapshots.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );

  // financials daily - cumulative revenues
  financialsDailySnapshots.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialsDailySnapshots.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsDailySnapshots.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  // market daily - daily revenues
  marketDailySnapshot.dailyTotalRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  marketDailySnapshot.dailySupplySideRevenueUSD = marketDailySnapshot.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  marketDailySnapshot.dailyProtocolSideRevenueUSD = marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );

  // market daily - cumulative revenues
  marketDailySnapshot.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD;
  marketDailySnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketDailySnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;

  // market hourly - hourly revenues
  marketHourlySnapshot.hourlyTotalRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  marketHourlySnapshot.hourlySupplySideRevenueUSD = marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD = marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );

  // market hourly - cumulative revenues
  marketHourlySnapshot.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD;
  marketHourlySnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;

  // TODO: liquidate metrics are still pending
  financialsDailySnapshots.cumulativeLiquidateUSD =
    protocol.cumulativeLiquidateUSD;

  financialsDailySnapshots.save();
  marketDailySnapshot.save();
  marketHourlySnapshot.save();
  protocol.save();
}

export function updateTVL(event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtocol();
  let financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
  let protocolTotalValueLockedUSD = BIGDECIMAL_ZERO;

  let tokenAddress = [cETH_ADDRESS, cDAI_ADDRESS, cUSDC_ADDRESS, cWBTC_ADDRESS];

  for (let i = 0; i < tokenAddress.length; i++) {
    let assetToken = getOrCreateToken(
      Address.fromString(tokenAddress[i]),
      event.block.number
    );
    let erc20 = ERC20.bind(Address.fromString(assetToken.id));
    let assetTokenBalance = erc20.balanceOf(Address.fromString(PROTOCOL_ID));

    protocolTotalValueLockedUSD = protocolTotalValueLockedUSD.plus(
      bigIntToBigDecimal(assetTokenBalance, 8).times(assetToken.lastPriceUSD!)
    );
  }

  financialsDailySnapshot.totalValueLockedUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshot.totalDepositBalanceUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  protocol.totalValueLockedUSD = protocolTotalValueLockedUSD;
  protocol.totalDepositBalanceUSD = protocolTotalValueLockedUSD;

  financialsDailySnapshot.save();
  protocol.save();
}

export function updateMarket(
  marketId: string,
  transactionType: string,
  cTokenAmount: BigInt,
  amountUSD: BigDecimal,
  event: ethereum.Event
): void {
  let market = getOrCreateMarket(event, marketId);
  let protocol = getOrCreateLendingProtocol();

  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market.id);
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market.id);
  let financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);

  // amount in USD
  let amount = cTokenAmount;
  let token = getOrCreateToken(
    Address.fromString(market.inputToken),
    event.block.number
  );
  let priceUSD = token.lastPriceUSD!;
  // let amountUSD = bigIntToBigDecimal(amount, token.decimals).times(priceUSD!);

  // last updated block number and timestamp
  marketHourlySnapshot.blockNumber = event.block.number;
  marketHourlySnapshot.timestamp = event.block.timestamp;
  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;

  if (transactionType == TransactionType.DEPOSIT) {
    // tvl in market
    let inputTokenBalance = market.inputTokenBalance.plus(amount);
    market.inputTokenBalance = inputTokenBalance;
    market.totalValueLockedUSD = bigIntToBigDecimal(
      inputTokenBalance,
      token.decimals
    ).times(priceUSD!);

    // update total deposit amount
    market.totalDepositBalanceUSD = bigIntToBigDecimal(
      inputTokenBalance,
      token.decimals
    ).times(priceUSD!);

    // update deposit amounts
    market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(amountUSD);
    marketHourlySnapshot.cumulativeDepositUSD = marketHourlySnapshot.cumulativeDepositUSD.plus(
      amountUSD
    );
    marketDailySnapshot.cumulativeDepositUSD = marketDailySnapshot.cumulativeDepositUSD.plus(
      amountUSD
    );
    financialsDailySnapshot.cumulativeDepositUSD = financialsDailySnapshot.cumulativeDepositUSD.plus(
      amountUSD
    );
    protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(
      amountUSD
    );
    marketHourlySnapshot.hourlyDepositUSD = marketHourlySnapshot.hourlyDepositUSD.plus(
      amountUSD
    );
    marketDailySnapshot.dailyDepositUSD = marketDailySnapshot.dailyDepositUSD.plus(
      amountUSD
    );
    financialsDailySnapshot.dailyDepositUSD = financialsDailySnapshot.dailyDepositUSD.plus(
      amountUSD
    );
  } else if (transactionType == TransactionType.WITHDRAW) {
    // tvl in market
    let inputTokenBalance = market.inputTokenBalance.minus(amount);
    market.inputTokenBalance = inputTokenBalance;
    market.totalValueLockedUSD = bigIntToBigDecimal(
      inputTokenBalance,
      token.decimals
    ).times(priceUSD!);

    // update total deposit amount
    market.totalDepositBalanceUSD = bigIntToBigDecimal(
      inputTokenBalance,
      token.decimals
    ).times(priceUSD!);

    // update withdraw amounts
    marketDailySnapshot.dailyWithdrawUSD = marketDailySnapshot.dailyWithdrawUSD.plus(
      amountUSD
    );
    financialsDailySnapshot.dailyWithdrawUSD = financialsDailySnapshot.dailyWithdrawUSD.plus(
      amountUSD
    );
  } else if (transactionType == TransactionType.BORROW) {
    // update total borrow amount
    let outputTokenSupply = market.outputTokenSupply.plus(amount);
    market.outputTokenSupply = outputTokenSupply;
    market.totalBorrowBalanceUSD = bigIntToBigDecimal(
      outputTokenSupply,
      token.decimals
    ).times(priceUSD!);

    // update borrow amounts
    market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(amountUSD);
    marketHourlySnapshot.cumulativeBorrowUSD = marketHourlySnapshot.cumulativeBorrowUSD.plus(
      amountUSD
    );
    marketDailySnapshot.cumulativeBorrowUSD = marketDailySnapshot.cumulativeBorrowUSD.plus(
      amountUSD
    );
    financialsDailySnapshot.cumulativeBorrowUSD = financialsDailySnapshot.cumulativeBorrowUSD.plus(
      amountUSD
    );
    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(amountUSD);
    marketHourlySnapshot.hourlyBorrowUSD = marketHourlySnapshot.hourlyBorrowUSD.plus(
      amountUSD
    );
    marketDailySnapshot.dailyBorrowUSD = marketDailySnapshot.dailyBorrowUSD.plus(
      amountUSD
    );
    financialsDailySnapshot.dailyBorrowUSD = financialsDailySnapshot.dailyBorrowUSD.plus(
      amountUSD
    );
  } else if (transactionType == TransactionType.REPAY) {
    // update total borrow amount
    let outputTokenSupply = market.outputTokenSupply.minus(amount);
    market.outputTokenSupply = outputTokenSupply;
    market.totalBorrowBalanceUSD = bigIntToBigDecimal(
      outputTokenSupply,
      token.decimals
    ).times(priceUSD!);

    // update repay amounts
    marketDailySnapshot.dailyRepayUSD = marketDailySnapshot.dailyRepayUSD.plus(
      amountUSD
    );
    financialsDailySnapshot.dailyRepayUSD = financialsDailySnapshot.dailyRepayUSD.plus(
      amountUSD
    );
  }

  // requires market and protocol to be udpated before snapshots
  market.save();
  protocol.save();
  financialsDailySnapshot.save();

  // update hourly snapshot
  marketHourlySnapshot.protocol = protocol.id;
  marketHourlySnapshot.market = market.id;
  marketHourlySnapshot.rates = market.rates;
  marketHourlySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketHourlySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketHourlySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketHourlySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourlySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketHourlySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketHourlySnapshot.inputTokenBalance = market.inputTokenBalance;
  marketHourlySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketHourlySnapshot.outputTokenSupply = market.outputTokenSupply;
  marketHourlySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketHourlySnapshot.blockNumber = event.block.number;
  marketHourlySnapshot.timestamp = event.block.timestamp;

  // update daily snapshot
  marketDailySnapshot.protocol = protocol.id;
  marketDailySnapshot.market = market.id;
  marketDailySnapshot.rates = market.rates;
  marketDailySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDailySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketDailySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketDailySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketDailySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketDailySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketDailySnapshot.inputTokenBalance = market.inputTokenBalance;
  marketDailySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketDailySnapshot.outputTokenSupply = market.outputTokenSupply;
  marketDailySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;

  marketHourlySnapshot.save();
  marketDailySnapshot.save();
}

// TODO: delete, not required, addressed in updateMarket()
// Update MarketDailySnapshot entity
// export function updateMarketMetrics(
//   event: ethereum.Event,
//   market: Market
// ): void {
//   let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market.id);
//   let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market.id);
//   // if (!marketHourlySnapshot || !marketDailySnapshot) {
//   //   return;
//   // }
//   let protocol = getOrCreateLendingProtocol();

//   marketHourlySnapshot.protocol = protocol.id;
//   marketHourlySnapshot.market = market.id;
//   marketHourlySnapshot.rates = market.rates;
//   marketHourlySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
//   marketHourlySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
//   marketHourlySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
//   marketHourlySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
//   marketHourlySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
//   marketHourlySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
//   marketHourlySnapshot.inputTokenBalance = market.inputTokenBalance;
//   marketHourlySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
//   marketHourlySnapshot.outputTokenSupply = market.outputTokenSupply;
//   marketHourlySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
//   marketHourlySnapshot.blockNumber = event.block.number;
//   marketHourlySnapshot.timestamp = event.block.timestamp;

//   marketDailySnapshot.protocol = protocol.id;
//   marketDailySnapshot.market = market.id;
//   marketDailySnapshot.rates = market.rates;
//   marketDailySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
//   marketDailySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
//   marketDailySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
//   marketDailySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
//   marketDailySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
//   marketDailySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
//   marketDailySnapshot.inputTokenBalance = market.inputTokenBalance;
//   marketDailySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
//   marketDailySnapshot.outputTokenSupply = market.outputTokenSupply;
//   marketDailySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
//   marketDailySnapshot.blockNumber = event.block.number;
//   marketDailySnapshot.timestamp = event.block.timestamp;

//   marketHourlySnapshot.save();
//   marketDailySnapshot.save();
// }
