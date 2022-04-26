import { Address, ethereum, Bytes } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount } from "../../generated/schema";
import {
  SECONDS_PER_DAY,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  VAT_ADDRESS,
  RAD,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
} from "./constants";
import {
  getOrCreateMarketDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateFinancials,
  getOrCreateLendingProtocol,
  getMarket,
  getOrCreateMarketHourlySnapshot,
} from "./getters";
import { getMarketFromIlk } from "../common/getters";
import { Vat } from "../../generated/Vat/Vat";
import { bigIntToBigDecimal } from "./utils/numbers";

// usageDailySnapshot
export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  let hourlyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let dailyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  let usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);
  let protocol = getOrCreateLendingProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  usageHourlySnapshot.blockNumber = event.block.number;
  usageHourlySnapshot.timestamp = event.block.timestamp;
  usageHourlySnapshot.hourlyTransactionCount += 1;

  usageDailySnapshot.blockNumber = event.block.number;
  usageDailySnapshot.timestamp = event.block.timestamp;
  usageDailySnapshot.dailyTransactionCount += 1;

  let fromAccountId = from.toHexString();
  let fromAccount = Account.load(fromAccountId);

  if (!fromAccount) {
    fromAccount = new Account(fromAccountId);
    fromAccount.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  usageHourlySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageDailySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the hour/day
  let hourlyActiveAccountIdFrom = hourlyId.toString() + "-" + from.toHexString();
  let hourlyActiveAccountFrom = ActiveAccount.load(hourlyActiveAccountIdFrom);
  if (!hourlyActiveAccountFrom) {
    hourlyActiveAccountFrom = new ActiveAccount(hourlyActiveAccountIdFrom);
    hourlyActiveAccountFrom.save();
    usageHourlySnapshot.hourlyActiveUsers += 1;
  }

  let dailyActiveAccountIdFrom = dailyId.toString() + "-" + from.toHexString();
  let dailyActiveAccountFrom = ActiveAccount.load(dailyActiveAccountIdFrom);
  if (!dailyActiveAccountFrom) {
    dailyActiveAccountFrom = new ActiveAccount(dailyActiveAccountIdFrom);
    dailyActiveAccountFrom.save();
    usageDailySnapshot.dailyActiveUsers += 1;
  }

  usageHourlySnapshot.save();
  usageDailySnapshot.save();
}

// Update MarketDailySnapshot entity
export function updateMarketMetrics(ilk: Bytes, event: ethereum.Event): void {
  let market = getMarketFromIlk(ilk);
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market.id);
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market.id);
  let protocol = getOrCreateLendingProtocol();

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
  marketHourlySnapshot.outputTokenPriceUSD = BIGDECIMAL_ONE;

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
  marketDailySnapshot.outputTokenPriceUSD = BIGDECIMAL_ONE;

  marketHourlySnapshot.save();
  marketHourlySnapshot.save();
}

export function updateTVL(event: ethereum.Event): void {
  // new user count handled in updateUsageMetrics
  // totalBorrowUSD handled updateTotalBorrowUSD
  let protocol = getOrCreateLendingProtocol();
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let marketIDList = protocol.marketIDList;
  let protocolTotalValueLockedUSD = BIGDECIMAL_ZERO;
  let protocolMintedTokenSupply = BIGINT_ZERO;
  for (let i: i32 = 0; i < marketIDList.length; i++) {
    let marketAddress = marketIDList[i];
    let market = getMarket(marketAddress);
    protocolMintedTokenSupply = protocolMintedTokenSupply.plus(market.outputTokenSupply);
    protocolTotalValueLockedUSD = protocolTotalValueLockedUSD.plus(market.totalValueLockedUSD);
  }
  financialsDailySnapshot.mintedTokenSupplies = [protocolMintedTokenSupply];
  financialsDailySnapshot.totalValueLockedUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshot.totalDepositBalanceUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  protocol.mintedTokenSupplies = [protocolMintedTokenSupply];
  protocol.totalValueLockedUSD = protocolTotalValueLockedUSD;
  protocol.totalDepositBalanceUSD = protocolTotalValueLockedUSD;

  financialsDailySnapshot.save();
  protocol.save();
}

export function updateTotalBorrowUSD(event: ethereum.Event): void {
  // Called in handleFold, handleSuck, handleHeal, handleFrob
  let FinancialsDailySnapshot = getOrCreateFinancials(event);
  let protocol = getOrCreateLendingProtocol();
  let totalBorrowBalanceUSD = bigIntToBigDecimal(Vat.bind(Address.fromString(VAT_ADDRESS)).debt(), RAD);
  FinancialsDailySnapshot.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  FinancialsDailySnapshot.save();
  protocol.save();
}
