// import { log } from "@graphprotocol/graph-ts"
import { Address, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  MarketDailySnapshot,
  LendingProtocol,
  Market,
  Liquidate,
  InterestRate,
  UsageMetricsHourlySnapshot,
  MarketHourlySnapshot,
} from "../../generated/schema";
import { LogRepay } from "../../generated/templates/Cauldron/Cauldron";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  ProtocolType,
  SECONDS_PER_DAY,
  LendingType,
  BIGINT_ONE,
  ETH_NETWORK,
  BENTOBOX_ADDRESS_MAINNET,
  AVALANCHE_NETWORK,
  BENTOBOX_ADDRESS_AVALANCHE,
  BSC_NETWORK,
  BENTOBOX_ADDRESS_BSC,
  ARB_NETWORK,
  BENTOBOX_ADDRESS_ARBITRUM,
  FTM_NETWORK,
  BENTOBOX_ADDRESS_FANTOM,
  MIM_MAINNET,
  MIM_AVALANCHE,
  MIM_ARBITRUM,
  MIM_FANTOM,
  MIM_BSC,
  STAKED_SPELL_MAINNET,
  STAKED_SPELL_AVALANCHE,
  STAKED_SPELL_FANTOM,
  STAKED_SPELL_ARBITRUM,
  InterestRateSide,
  InterestRateType,
  BIGDECIMAL_ONE,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
} from "../common/constants";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.lastPriceUSD =
      tokenAddress == Address.fromString(getMIMAddress(dataSource.network())) ? BIGDECIMAL_ONE : BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token;
}

///////////////////////////
///////// Metrics /////////
///////////////////////////

export function getOrCreateUsageMetricsHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
  // Number of hours since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the hour
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateLendingProtocol().id;
    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyBorrowCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlyRepayCount = 0;
    usageMetrics.hourlyLiquidateCount = 0;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateLendingProtocol().id;
    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyBorrowCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailyRepayCount = 0;
    usageMetrics.dailyLiquidateCount = 0;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateMarketHourlySnapshot(event: ethereum.Event, marketAddress: string): MarketHourlySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let marketMetrics = MarketHourlySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketHourlySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = getOrCreateLendingProtocol().id;
    marketMetrics.market = marketAddress;
    marketMetrics.inputTokenBalance = BIGINT_ZERO;
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event, marketAddress: string): MarketDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = getOrCreateLendingProtocol().id;
    marketMetrics.market = marketAddress;
    marketMetrics.inputTokenBalance = BIGINT_ZERO;
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getOrCreateLendingProtocol().id;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    financialMetrics.save();
  }
  return financialMetrics;
}

////////////////////////////
///// Lending Specific /////
///////////////////////////

export function getOrCreateLendingProtocol(): LendingProtocol {
  let LendingProtocolEntity = LendingProtocol.load(getBentoBoxAddress(dataSource.network()));
  if (LendingProtocolEntity) {
    return LendingProtocolEntity;
  }
  LendingProtocolEntity = new LendingProtocol(getBentoBoxAddress(dataSource.network()));
  LendingProtocolEntity.name = "Abracadabra Money";
  LendingProtocolEntity.slug = "abracadabra";
  LendingProtocolEntity.schemaVersion = "1.2.0";
  LendingProtocolEntity.subgraphVersion = "1.0.0";
  LendingProtocolEntity.methodologyVersion = "1.0.0";
  if (dataSource.network() == ARB_NETWORK) {
    LendingProtocolEntity.network = Network.ARBITRUM_ONE;
  } else {
    LendingProtocolEntity.network = getNetwork(dataSource.network());
  }
  LendingProtocolEntity.type = ProtocolType.LENDING;
  LendingProtocolEntity.cumulativeUniqueUsers = 0;
  LendingProtocolEntity.totalValueLockedUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.lendingType = LendingType.CDP;
  LendingProtocolEntity.save();
  return LendingProtocolEntity;
}

export function getMarket(marketId: string): Market {
  let market = Market.load(marketId);
  if (market) {
    return market;
  }
  return new Market("");
}

///////////////////////////
///////// Helpers /////////
///////////////////////////

export function getLiquidateEvent(event: LogRepay): Liquidate {
  let liquidateEvent = Liquidate.load(
    "liquidate-" + event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.minus(BIGINT_ONE).toString(),
  );
  if (liquidateEvent) {
    return liquidateEvent;
  }
  return new Liquidate("");
}

export function getBentoBoxAddress(network: string): string {
  if (network == ETH_NETWORK) {
    return BENTOBOX_ADDRESS_MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return BENTOBOX_ADDRESS_AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return BENTOBOX_ADDRESS_ARBITRUM;
  } else if (network == FTM_NETWORK) {
    return BENTOBOX_ADDRESS_FANTOM;
  } else if (network == BSC_NETWORK) {
    return BENTOBOX_ADDRESS_BSC;
  }
  return "";
}

export function getMIMAddress(network: string): string {
  if (network == ETH_NETWORK) {
    return MIM_MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return MIM_AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return MIM_ARBITRUM;
  } else if (network == FTM_NETWORK) {
    return MIM_FANTOM;
  } else if (network == BSC_NETWORK) {
    return MIM_BSC;
  }
  return "";
}

export function getStakedSpellAddress(network: string): string {
  if (network == ETH_NETWORK) {
    return STAKED_SPELL_MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return STAKED_SPELL_AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return STAKED_SPELL_ARBITRUM;
  } else if (network == FTM_NETWORK) {
    return STAKED_SPELL_FANTOM;
  }
  return "";
}

export function getNetwork(network: string): string {
  if (network == ETH_NETWORK) {
    return Network.MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return Network.AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return Network.ARBITRUM_ONE;
  } else if (network == FTM_NETWORK) {
    return Network.FANTOM;
  } else if (network == BSC_NETWORK) {
    return Network.BSC;
  }
  return "";
}

export function getOrCreateInterestRate(marketAddress: string): InterestRate {
  let interestRate = InterestRate.load("BORROWER-" + "STABLE-" + marketAddress);
  if (interestRate) {
    return interestRate;
  }
  interestRate = new InterestRate("BORROWER-" + "STABLE-" + marketAddress);
  interestRate.side = InterestRateSide.BORROW;
  interestRate.type = InterestRateType.STABLE;
  interestRate.rate = BIGDECIMAL_ONE;
  interestRate.save();
  return interestRate;
}
