import { BigDecimal, Address, ethereum, Bytes } from "@graphprotocol/graph-ts";
import { Account, DailyActiveAccount } from "../../generated/schema";
import {
  INT_ZERO,
  SECONDS_PER_DAY,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  MCD_VAT_ADDRESS,
  RAD,
} from "./constants";
import {
  getOrCreateMarketDailySnapshot,
  getOrCreateUsageMetricSnapshot,
  getOrCreateFinancials,
  getOrCreateLendingProtocol,
  getMarket,
} from "./getters";
import { getOrCreateTokenPriceEntity } from "./prices/prices";
import { getMarketFromIlk } from "../common/getters";
import { Vat } from "../../generated/Vat/Vat";
import { bigIntToBigDecimal } from "./utils/numbers";

// usageDailySnapshot
export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageDailySnapshot = getOrCreateUsageMetricSnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  usageDailySnapshot.blockNumber = event.block.number;
  usageDailySnapshot.timestamp = event.block.timestamp;
  usageDailySnapshot.dailyTransactionCount += 1;

  let fromAccountId = from.toHexString();
  let fromAccount = Account.load(fromAccountId);

  let protocol = getOrCreateLendingProtocol();
  if (!fromAccount) {
    fromAccount = new Account(fromAccountId);
    fromAccount.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }

  usageDailySnapshot.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountIdFrom = id.toString() + "-" + from.toHexString();
  let dailyActiveAccountFrom = DailyActiveAccount.load(dailyActiveAccountIdFrom);
  if (!dailyActiveAccountFrom) {
    dailyActiveAccountFrom = new DailyActiveAccount(dailyActiveAccountIdFrom);
    dailyActiveAccountFrom.save();
    usageDailySnapshot.activeUsers += 1;
  }
  usageDailySnapshot.save();
}

// Update MarketDailySnapshot entity
export function updateMarketMetrics(ilk:Bytes,event: ethereum.Event): void {
  // get or create market metrics
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event);
  let market = getMarketFromIlk(ilk)
  let protocol = getOrCreateLendingProtocol();
  let inputTokenPricesUSD = [getOrCreateTokenPriceEntity(market.inputTokens[INT_ZERO]).priceUSD];

  // // Update the block number and timestamp to that of the last transaction of that day
  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;
  marketDailySnapshot.protocol = protocol.id;
  marketDailySnapshot.market = market.id;
  marketDailySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDailySnapshot.inputTokenBalances = market.inputTokenBalances;
  marketDailySnapshot.inputTokenPricesUSD = inputTokenPricesUSD;
  marketDailySnapshot.outputTokenSupply = market.outputTokenSupply;
  marketDailySnapshot.outputTokenPriceUSD = BIGDECIMAL_ONE;
  marketDailySnapshot.stableBorrowRate = market.stableBorrowRate;
  marketDailySnapshot.totalBorrowUSD = market.totalBorrowUSD;
  marketDailySnapshot.totalDepositUSD = market.totalDepositUSD;
  marketDailySnapshot.save();
}

export function updateTVL(event: ethereum.Event): void {
  // new user count handled in updateUsageMetrics
  let LendingProtocol = getOrCreateLendingProtocol();
  let financialsDailySnapshot = getOrCreateFinancials(event);
  let marketIdList = LendingProtocol.marketIdList;
  let protocolTotalValueLockedUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < marketIdList.length; i++) {
    let marketAddress = marketIdList[i];
    protocolTotalValueLockedUSD = protocolTotalValueLockedUSD.plus(getMarket(marketAddress).totalValueLockedUSD);
  }
  let totalBorrowUSD = bigIntToBigDecimal(Vat.bind(Address.fromString(MCD_VAT_ADDRESS)).debt(),RAD);
  LendingProtocol.totalValueLockedUSD = protocolTotalValueLockedUSD;
  LendingProtocol.totalDepositUSD = protocolTotalValueLockedUSD;
  LendingProtocol.totalBorrowUSD = totalBorrowUSD
  financialsDailySnapshot.totalValueLockedUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshot.totalDepositUSD = protocolTotalValueLockedUSD;
  financialsDailySnapshot.totalBorrowUSD = totalBorrowUSD; // current balance
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  LendingProtocol.save();
  financialsDailySnapshot.save();
}


