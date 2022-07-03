// import { log } from "@graphprotocol/graph-ts"
import { Address, dataSource, ethereum, log } from "@graphprotocol/graph-ts";
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
  LiquidateProxy,
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
  DEGENBOX_ADDRESS_MAINNET,
  DEGENBOX_ADDRESS_AVALANCHE,
  DEGENBOX_ADDRESS_ARBITRUM,
  DEGENBOX_ADDRESS_FANTOM,
  DEGENBOX_ADDRESS_BSC,
  RiskType,
  schemaVersion,
  subgraphVersion,
  methodologyVersion,
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
    let protocol = getOrCreateLendingProtocol();
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateLendingProtocol().id;
    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyBorrowCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlyRepayCount = 0;
    usageMetrics.hourlyLiquidateCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
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
    let protocol = getOrCreateLendingProtocol();
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateLendingProtocol().id;
    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyBorrowCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailyRepayCount = 0;
    usageMetrics.dailyLiquidateCount = 0;
    usageMetrics.totalPoolCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.dailyActiveDepositors = 0;
    usageMetrics.dailyActiveBorrowers = 0;
    usageMetrics.dailyActiveLiquidators = 0;
    usageMetrics.dailyActiveLiquidatees = 0;
    usageMetrics.cumulativeUniqueDepositors = 0;
    usageMetrics.cumulativeUniqueBorrowers = 0;
    usageMetrics.cumulativeUniqueLiquidators = 0;
    usageMetrics.cumulativeUniqueLiquidatees = 0;

    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateMarketHourlySnapshot(
  event: ethereum.Event,
  marketAddress: string,
): MarketHourlySnapshot | null {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let marketMetrics = MarketHourlySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    let market = getMarket(marketAddress);
    if (!market) {
      return null;
    }

    marketMetrics = new MarketHourlySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = getOrCreateLendingProtocol().id;
    marketMetrics.market = marketAddress;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;

    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;
    marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

    marketMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyRepayUSD = BIGDECIMAL_ZERO;

    marketMetrics.rates = [];
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketDailySnapshot(
  event: ethereum.Event,
  marketAddress: string,
): MarketDailySnapshot | null {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    let market = getMarket(marketAddress);
    if (!market) {
      return null;
    }
    marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = getOrCreateLendingProtocol().id;
    marketMetrics.market = marketAddress;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketMetrics.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;

    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;
    marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

    marketMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;

    marketMetrics.rates = [];
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    let protocol = getOrCreateLendingProtocol();
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getOrCreateLendingProtocol().id;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.mintedTokenSupplies = protocol.mintedTokenSupplies;

    // Revenue //
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

    // Lending Activities //
    financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
    financialMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolControlledValueUSD = protocol.protocolControlledValueUSD;
    financialMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;

    financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
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
  LendingProtocolEntity.schemaVersion = schemaVersion;
  LendingProtocolEntity.subgraphVersion = subgraphVersion;
  LendingProtocolEntity.methodologyVersion = methodologyVersion;
  if (dataSource.network() == ARB_NETWORK) {
    LendingProtocolEntity.network = Network.ARBITRUM_ONE;
  } else {
    LendingProtocolEntity.network = getNetwork(dataSource.network());
  }
  LendingProtocolEntity.type = ProtocolType.LENDING;
  LendingProtocolEntity.riskType = RiskType.ISOLATED;
  LendingProtocolEntity.cumulativeUniqueUsers = 0;
  LendingProtocolEntity.totalValueLockedUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.lendingType = LendingType.CDP;
  LendingProtocolEntity.mintedTokens = [getMIMAddress(dataSource.network())];
  LendingProtocolEntity.totalPoolCount = 0;

  LendingProtocolEntity.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.cumulativeDepositUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.protocolControlledValueUSD = BIGDECIMAL_ZERO;
  LendingProtocolEntity.marketIDList = [];
  LendingProtocolEntity.depositors = [];
  LendingProtocolEntity.borrowers = [];
  LendingProtocolEntity.liquidators = [];
  LendingProtocolEntity.liquidatees = [];
  LendingProtocolEntity.cumulativeUniqueDepositors = 0;
  LendingProtocolEntity.cumulativeUniqueBorrowers = 0;
  LendingProtocolEntity.cumulativeUniqueLiquidators = 0;
  LendingProtocolEntity.cumulativeUniqueLiquidatees = 0;
  LendingProtocolEntity.openPositionCount = 0;
  LendingProtocolEntity.cumulativePositionCount = 0;

  LendingProtocolEntity.save();
  return LendingProtocolEntity;
}

export function getMarket(marketId: string): Market | null {
  let market = Market.load(marketId);
  if (market) {
    return market;
  }
  log.error("Cannot find market: {}", [marketId]);
  return null;
}

///////////////////////////
///////// Helpers /////////
///////////////////////////

export function getLiquidateEvent(event: LogRepay): LiquidateProxy | null {
  let liquidateEvent = LiquidateProxy.load(
    "liquidate-" + event.transaction.hash.toHexString() + "-" + event.transactionLogIndex.minus(BIGINT_ONE).toString(),
  );
  if (liquidateEvent) {
    return liquidateEvent;
  }
  return null;
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

export function getDegenBoxAddress(network: string): string {
  if (network == ETH_NETWORK) {
    return DEGENBOX_ADDRESS_MAINNET;
  } else if (network == AVALANCHE_NETWORK) {
    return DEGENBOX_ADDRESS_AVALANCHE;
  } else if (network == ARB_NETWORK) {
    return DEGENBOX_ADDRESS_ARBITRUM;
  } else if (network == FTM_NETWORK) {
    return DEGENBOX_ADDRESS_FANTOM;
  } else if (network == BSC_NETWORK) {
    return DEGENBOX_ADDRESS_BSC;
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
