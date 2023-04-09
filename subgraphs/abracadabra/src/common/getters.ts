import { Address, dataSource, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Token,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  MarketDailySnapshot,
  LendingProtocol,
  Market,
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
  USD_BTC_ETH_ABRA_ADDRESS,
  DEFAULT_DECIMALS,
} from "./constants";
import { Versions } from "../versions";
import { getSnapshotRates } from "./utils/utils";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    if (tokenAddress == Address.fromString(USD_BTC_ETH_ABRA_ADDRESS)) {
      token.decimals = DEFAULT_DECIMALS;
    } else {
      token.decimals = fetchTokenDecimals(tokenAddress);
    }

    token.lastPriceUSD =
      tokenAddress == Address.fromString(getMIMAddress(dataSource.network()))
        ? BIGDECIMAL_ONE
        : BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token;
}

///////////////////////////
///////// Metrics /////////
///////////////////////////

export function getOrCreateUsageMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of hours since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the hour
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    const protocol = getOrCreateLendingProtocol();
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

export function getOrCreateUsageMetricsDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    const protocol = getOrCreateLendingProtocol();
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
    usageMetrics.cumulativeUniqueDepositors =
      protocol.cumulativeUniqueDepositors;
    usageMetrics.cumulativeUniqueBorrowers = protocol.cumulativeUniqueBorrowers;
    usageMetrics.cumulativeUniqueLiquidators =
      protocol.cumulativeUniqueLiquidators;
    usageMetrics.cumulativeUniqueLiquidatees =
      protocol.cumulativeUniqueLiquidatees;

    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateMarketHourlySnapshot(
  event: ethereum.Event,
  marketAddress: string
): MarketHourlySnapshot | null {
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let marketMetrics = MarketHourlySnapshot.load(
    marketAddress.concat("-").concat(id.toString())
  );

  if (!marketMetrics) {
    const market = getMarket(marketAddress);
    if (!market) {
      return null;
    }

    marketMetrics = new MarketHourlySnapshot(
      marketAddress.concat("-").concat(id.toString())
    );
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
    marketMetrics.cumulativeSupplySideRevenueUSD =
      market.cumulativeSupplySideRevenueUSD;
    marketMetrics.cumulativeProtocolSideRevenueUSD =
      market.cumulativeProtocolSideRevenueUSD;

    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;
    marketMetrics.rewardTokenEmissionsAmount =
      market.rewardTokenEmissionsAmount;
    marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

    marketMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyRepayUSD = BIGDECIMAL_ZERO;

    marketMetrics.rates = getSnapshotRates(
      market.rates,
      (event.block.timestamp.toI32() / SECONDS_PER_HOUR).toString()
    );
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketDailySnapshot(
  event: ethereum.Event,
  marketAddress: string
): MarketDailySnapshot | null {
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketMetrics = MarketDailySnapshot.load(
    marketAddress.concat("-").concat(id.toString())
  );

  if (!marketMetrics) {
    const market = getMarket(marketAddress);
    if (!market) {
      return null;
    }
    marketMetrics = new MarketDailySnapshot(
      marketAddress.concat("-").concat(id.toString())
    );
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
    marketMetrics.cumulativeSupplySideRevenueUSD =
      market.cumulativeSupplySideRevenueUSD;
    marketMetrics.cumulativeProtocolSideRevenueUSD =
      market.cumulativeProtocolSideRevenueUSD;

    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;
    marketMetrics.rewardTokenEmissionsAmount =
      market.rewardTokenEmissionsAmount;
    marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

    marketMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;

    marketMetrics.rates = getSnapshotRates(
      market.rates,
      (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString()
    );
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateFinancials(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    const protocol = getOrCreateLendingProtocol();
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = getOrCreateLendingProtocol().id;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.mintedTokenSupplies = protocol.mintedTokenSupplies;

    // Revenue //
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;

    // Lending Activities //
    financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
    financialMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolControlledValueUSD =
      protocol.protocolControlledValueUSD;
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
  let protocol = LendingProtocol.load(getBentoBoxAddress(dataSource.network()));
  if (protocol) {
    return protocol;
  }
  protocol = new LendingProtocol(getBentoBoxAddress(dataSource.network()));
  protocol.name = "Abracadabra Money";
  protocol.slug = "abracadabra";
  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  if (dataSource.network() == ARB_NETWORK) {
    protocol.network = Network.ARBITRUM_ONE;
  } else {
    protocol.network = getNetwork(dataSource.network());
  }
  protocol.type = ProtocolType.LENDING;
  protocol.riskType = RiskType.ISOLATED;
  protocol.cumulativeUniqueUsers = 0;
  protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
  protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  protocol.lendingType = LendingType.CDP;
  protocol.mintedTokens = [getMIMAddress(dataSource.network())];
  protocol.totalPoolCount = 0;

  protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
  protocol.protocolControlledValueUSD = BIGDECIMAL_ZERO;
  protocol.marketIDList = [];
  protocol.cumulativeUniqueDepositors = 0;
  protocol.cumulativeUniqueBorrowers = 0;
  protocol.cumulativeUniqueLiquidators = 0;
  protocol.cumulativeUniqueLiquidatees = 0;
  protocol.openPositionCount = 0;
  protocol.cumulativePositionCount = 0;

  protocol.save();
  return protocol;
}

export function getMarket(marketId: string): Market | null {
  const market = Market.load(marketId);
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
  const liquidateEvent = LiquidateProxy.load(
    "liquidate-" +
      event.transaction.hash.toHexString() +
      "-" +
      event.transactionLogIndex.minus(BIGINT_ONE).toString()
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
