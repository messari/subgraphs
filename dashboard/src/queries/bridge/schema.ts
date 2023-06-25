import { Schema, Versions } from "../../constants";

export const versionsList = ["1.0.0", "1.1.0", "1.2.0"];

export const schema = (version: string): Schema => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema100:
      return schema100();
    case Versions.Schema110:
      return schema110();
    case Versions.Schema120:
      return schema120();
    default:
      return schema110();
  }
};

export const schema100 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "poolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "poolHourlySnapshots",
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "ID!",
      day: "BigInt!",
      totalValueLockedUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeInUSD: "BigDecimal!",
      cumulativeVolumeOutUSD: "BigDecimal!",
      dailyNetVolumeUSD: "BigDecimal!",
      dailyVolumeInUSD: "BigDecimal!",
      dailyVolumeOutUSD: "BigDecimal!",
      cumulativeNetVolumeUSD: "BigDecimal!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      day: "BigInt!",
      cumulativeUniqueUsers: "Int!",
      cumulativeUniqueTransferSenders: "Int!",
      cumulativeUniqueTransferReceivers: "Int!",
      cumulativeUniqueLiquidityProviders: "Int!",
      cumulativeUniqueMessageSenders: "Int!",
      dailyActiveUsers: "Int!",
      dailyActiveTransferSenders: "Int!",
      dailyActiveTransferReceivers: "Int!",
      dailyActiveLiquidityProviders: "Int!",
      dailyActiveMessageSenders: "Int!",
      cumulativeTransactionCount: "Int!",
      dailyTransactionCount: "Int!",
      timestamp: "BigInt!",
      totalPoolCount: "Int!",
      cumulativeTransferOutCount: "Int!",
      dailyTransferOutCount: "Int!",
      cumulativeTransferInCount: "Int!",
      dailyTransferInCount: "Int!",
      cumulativeLiquidityDepositCount: "Int!",
      dailyLiquidityDepositCount: "Int!",
      cumulativeLiquidityWithdrawCount: "Int!",
      dailyLiquidityWithdrawCount: "Int!",
      cumulativeMessageSentCount: "Int!",
      dailyMessageSentCount: "Int!",
      cumulativeMessageReceivedCount: "Int!",
      dailyMessageReceivedCount: "Int!",
      totalPoolRouteCount: "Int!",
      totalCanonicalRouteCount: "Int!",
      totalWrappedRouteCount: "Int!",
      totalSupportedTokenCount: "Int!",
      blockNumber: "BigInt!",
    },
    poolDailySnapshots: {
      id: "ID!",
      day: "BigInt!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeIn: "BigInt!",
      dailyVolumeIn: "BigInt!",
      cumulativeVolumeInUSD: "BigDecimal!",
      dailyVolumeInUSD: "BigDecimal!",
      cumulativeVolumeOut: "BigInt!",
      dailyVolumeOut: "BigInt!",
      cumulativeVolumeOutUSD: "BigDecimal!",
      dailyVolumeOutUSD: "BigDecimal!",
      netCumulativeVolume: "BigInt!",
      netCumulativeVolumeUSD: "BigDecimal!",
      netDailyVolume: "BigInt!",
      netDailyVolumeUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      mintSupply: "BigInt",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      hour: "BigInt!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      cumulativeUniqueTransferSenders: "Int!",
      cumulativeUniqueTransferReceivers: "Int!",
      cumulativeUniqueLiquidityProviders: "Int!",
      cumulativeUniqueMessageSenders: "Int!",
      hourlyActiveTransferSenders: "Int!",
      hourlyActiveTransferReceivers: "Int!",
      hourlyActiveLiquidityProviders: "Int!",
      hourlyActiveMessageSenders: "Int!",
      cumulativeTransactionCount: "Int!",
      hourlyTransactionCount: "Int!",
      cumulativeTransferOutCount: "Int!",
      hourlyTransferOutCount: "Int!",
      cumulativeTransferInCount: "Int!",
      hourlyTransferInCount: "Int!",
      cumulativeLiquidityDepositCount: "Int!",
      hourlyLiquidityDepositCount: "Int!",
      cumulativeLiquidityWithdrawCount: "Int!",
      hourlyLiquidityWithdrawCount: "Int!",
      cumulativeMessageSentCount: "Int!",
      hourlyMessageSentCount: "Int!",
      cumulativeMessageReceivedCount: "Int!",
      hourlyMessageReceivedCount: "Int!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    poolHourlySnapshots: {
      id: "ID!",
      hour: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeIn: "BigInt!",
      hourlyVolumeIn: "BigInt!",
      cumulativeVolumeInUSD: "BigDecimal!",
      hourlyVolumeInUSD: "BigDecimal!",
      cumulativeVolumeOut: "BigInt!",
      hourlyVolumeOut: "BigInt!",
      cumulativeVolumeOutUSD: "BigDecimal!",
      hourlyVolumeOutUSD: "BigDecimal!",
      netCumulativeVolume: "BigInt!",
      netCumulativeVolumeUSD: "BigDecimal!",
      netHourlyVolume: "BigInt!",
      netHourlyVolumeUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      mintSupply: "BigInt",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
  };

  const finanQuery =
    "financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.financialsDailySnapshots).join(",") +
    "}";
  const usageDailyQuery =
    "usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsDailySnapshots).join(",") +
    "}";
  const usageHourlyQuery =
    "usageMetricsHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsHourlySnapshots).join(",") +
    "}";

  const poolDailyQuery =
    "poolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolDailySnapshots).join(",") +
    "}";
  const poolHourlyQuery =
    "poolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolHourlySnapshots).join(",") +
    "}";

  const eventsFields = ["hash", "timestamp", "account{id}"];

  // Query pool(pool) entity and events entities
  const events: string[] = ["bridgeTransfers", "bridgeMessages", "liquidityDeposits", "liquidityWithdraws"];
  const eventsQuery: any[] = events.map((event) => {
    let options = "";
    let fields = eventsFields.join(", ");
    if (event !== "bridgeMessages") {
      fields += ", amount, amountUSD, pool{id}";
      options = ", where: {pool: $poolId}";
    }
    const baseStr = event + "(first: 1000, orderBy: timestamp, orderDirection: desc" + options + ") { ";
    if (event === "bridgeTransfers" || event === "bridgeMessages") {
      fields += ", fromChainID, toChainID, crossTransactionID";
    } else if (event === "liquidityDeposits" || event === "liquidityWithdraws") {
      fields += ", chainID, token{name}";
    }
    return baseStr + fields + " }";
  });

  const protocolFields = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalValueLockedUSD: "BigDecimal!",
    protocolControlledValueUSD: "BigDecimal",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeVolumeInUSD: "BigDecimal!",
    cumulativeVolumeOutUSD: "BigDecimal!",
    cumulativeTotalVolumeUSD: "BigDecimal!",
    netVolumeUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
    cumulativeUniqueTransferSenders: "Int!",
    cumulativeUniqueTransferReceivers: "Int!",
    cumulativeUniqueLiquidityProviders: "Int!",
    cumulativeUniqueMessageSenders: "Int!",
    cumulativeTransactionCount: "Int!",
    cumulativeTransferOutCount: "Int!",
    cumulativeTransferInCount: "Int!",
    cumulativeLiquidityDepositCount: "Int!",
    cumulativeLiquidityWithdrawCount: "Int!",
    cumulativeMessageSentCount: "Int!",
    cumulativeMessageReceivedCount: "Int!",
    supportedNetworks: "[Network!]!",
    totalPoolCount: "Int!",
    totalPoolRouteCount: "Int!",
    totalCanonicalRouteCount: "Int!",
    totalWrappedRouteCount: "Int!",
    totalSupportedTokenCount: "Int!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

  const financialsQuery = `
    query Data {
      ${finanQuery}
    }`;
  const hourlyUsageQuery = `
    query Data {
      ${usageHourlyQuery}
    }`;
  const dailyUsageQuery = `
    query Data {
      ${usageDailyQuery}
    }`;

  const protocolTableQuery = `
    query Data($protocolId: String) {
      bridgeProtocol(id: $protocolId) {
        ${protocolQueryFields}
      }
    }`;

  const poolsQuery = `
      query Data {
        pools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          name
        }
      }
    `;

  const poolTimeseriesQuery = `
      query Data($poolId: String) {
        ${poolDailyQuery}
        ${poolHourlyQuery}
      }
      `;

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    symbol: "String",
    relation: "Bytes",
    type: "BridgePoolType!",
    inputToken: "Token!",
    destinationTokens: "[CrosschainToken!]!",
    routes: "[PoolRoute!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    createdTimestamp: "BigInt!",
    createdBlockNumber: "BigInt!",
    mintSupply: "BigInt",
    inputTokenBalance: "BigInt!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeVolumeIn: "BigInt!",
    cumulativeVolumeOut: "BigInt!",
    netVolume: "BigInt!",
    cumulativeVolumeInUSD: "BigDecimal!",
    cumulativeVolumeOutUSD: "BigDecimal!",
    netVolumeUSD: "BigDecimal!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
  };

  let query = `
  query Data($poolId: String, $protocolId: String){
    _meta {
      block {
        number
      }
      deployment
    }
    protocols {
      id
      methodologyVersion
      network
      name
      type
      slug
      schemaVersion
      subgraphVersion
    }

    bridgeProtocols {
      ${protocolQueryFields}
    }
    ${eventsQuery}
    pool(id: $poolId){
      id
      name
      symbol

      inputToken {
        id
        decimals
        name
        symbol
      }
      outputToken {
        id
        decimals
        name
        symbol
      }
      mintSupply
      routes {
        id
        crossToken {
          network
        }
      }
      rewardTokens {
        id
        type
        token {
          id
          decimals
          name
          symbol
        }
      }
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      inputTokenBalance
      outputTokenSupply
      outputTokenPriceUSD
      stakedOutputTokenAmount
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
    }
  }`;

  return {
    entities,
    entitiesData,
    query,
    protocolTableQuery,
    poolData,
    events,
    protocolFields,
    poolsQuery,
    financialsQuery,
    hourlyUsageQuery,
    dailyUsageQuery,
    poolTimeseriesQuery,
  };
};

export const schema110 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "poolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "poolHourlySnapshots",
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "ID!",
      day: "BigInt!",
      totalValueLockedUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeInUSD: "BigDecimal!",
      cumulativeVolumeOutUSD: "BigDecimal!",
      dailyNetVolumeUSD: "BigDecimal!",
      dailyVolumeInUSD: "BigDecimal!",
      dailyVolumeOutUSD: "BigDecimal!",
      cumulativeNetVolumeUSD: "BigDecimal!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      day: "BigInt!",
      cumulativeUniqueUsers: "Int!",
      cumulativeUniqueTransferSenders: "Int!",
      cumulativeUniqueTransferReceivers: "Int!",
      cumulativeUniqueLiquidityProviders: "Int!",
      cumulativeUniqueMessageSenders: "Int!",
      dailyActiveUsers: "Int!",
      dailyActiveTransferSenders: "Int!",
      dailyActiveTransferReceivers: "Int!",
      dailyActiveLiquidityProviders: "Int!",
      dailyActiveMessageSenders: "Int!",
      cumulativeTransactionCount: "Int!",
      dailyTransactionCount: "Int!",
      timestamp: "BigInt!",
      totalPoolCount: "Int!",
      cumulativeTransferOutCount: "Int!",
      dailyTransferOutCount: "Int!",
      cumulativeTransferInCount: "Int!",
      dailyTransferInCount: "Int!",
      cumulativeLiquidityDepositCount: "Int!",
      dailyLiquidityDepositCount: "Int!",
      cumulativeLiquidityWithdrawCount: "Int!",
      dailyLiquidityWithdrawCount: "Int!",
      cumulativeMessageSentCount: "Int!",
      dailyMessageSentCount: "Int!",
      cumulativeMessageReceivedCount: "Int!",
      dailyMessageReceivedCount: "Int!",
      totalPoolRouteCount: "Int!",
      totalCanonicalRouteCount: "Int!",
      totalWrappedRouteCount: "Int!",
      totalSupportedTokenCount: "Int!",
      blockNumber: "BigInt!",
    },
    poolDailySnapshots: {
      id: "ID!",
      day: "BigInt!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeIn: "BigInt!",
      dailyVolumeIn: "BigInt!",
      cumulativeVolumeInUSD: "BigDecimal!",
      dailyVolumeInUSD: "BigDecimal!",
      cumulativeVolumeOut: "BigInt!",
      dailyVolumeOut: "BigInt!",
      cumulativeVolumeOutUSD: "BigDecimal!",
      dailyVolumeOutUSD: "BigDecimal!",
      netCumulativeVolume: "BigInt!",
      netCumulativeVolumeUSD: "BigDecimal!",
      netDailyVolume: "BigInt!",
      netDailyVolumeUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      mintSupply: "BigInt",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      hour: "BigInt!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      cumulativeUniqueTransferSenders: "Int!",
      cumulativeUniqueTransferReceivers: "Int!",
      cumulativeUniqueLiquidityProviders: "Int!",
      cumulativeUniqueMessageSenders: "Int!",
      hourlyActiveTransferSenders: "Int!",
      hourlyActiveTransferReceivers: "Int!",
      hourlyActiveLiquidityProviders: "Int!",
      hourlyActiveMessageSenders: "Int!",
      cumulativeTransactionCount: "Int!",
      hourlyTransactionCount: "Int!",
      cumulativeTransferOutCount: "Int!",
      hourlyTransferOutCount: "Int!",
      cumulativeTransferInCount: "Int!",
      hourlyTransferInCount: "Int!",
      cumulativeLiquidityDepositCount: "Int!",
      hourlyLiquidityDepositCount: "Int!",
      cumulativeLiquidityWithdrawCount: "Int!",
      hourlyLiquidityWithdrawCount: "Int!",
      cumulativeMessageSentCount: "Int!",
      hourlyMessageSentCount: "Int!",
      cumulativeMessageReceivedCount: "Int!",
      hourlyMessageReceivedCount: "Int!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    poolHourlySnapshots: {
      id: "ID!",
      hour: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeIn: "BigInt!",
      hourlyVolumeIn: "BigInt!",
      cumulativeVolumeInUSD: "BigDecimal!",
      hourlyVolumeInUSD: "BigDecimal!",
      cumulativeVolumeOut: "BigInt!",
      hourlyVolumeOut: "BigInt!",
      cumulativeVolumeOutUSD: "BigDecimal!",
      hourlyVolumeOutUSD: "BigDecimal!",
      netCumulativeVolume: "BigInt!",
      netCumulativeVolumeUSD: "BigDecimal!",
      netHourlyVolume: "BigInt!",
      netHourlyVolumeUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      mintSupply: "BigInt",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
  };

  const finanQuery =
    "financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.financialsDailySnapshots).join(",") +
    "}";
  const usageDailyQuery =
    "usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsDailySnapshots).join(",") +
    "}";
  const usageHourlyQuery =
    "usageMetricsHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsHourlySnapshots).join(",") +
    "}";

  const poolDailyQuery =
    "poolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolDailySnapshots).join(",") +
    "}";
  const poolHourlyQuery =
    "poolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolHourlySnapshots).join(",") +
    "}";

  const eventsFields = ["hash", "timestamp", "account{id}"];

  // Query pool(pool) entity and events entities
  const events: string[] = ["bridgeTransfers", "bridgeMessages", "liquidityDeposits", "liquidityWithdraws"];
  const eventsQuery: any[] = events.map((event) => {
    let options = "";
    let fields = eventsFields.join(", ");
    if (event !== "bridgeMessages") {
      fields += ", amount, amountUSD, pool{id}";
      options = ", where: {pool: $poolId}";
    }
    const baseStr = event + "(first: 1000, orderBy: timestamp, orderDirection: desc" + options + ") { ";
    if (event === "bridgeTransfers" || event === "bridgeMessages") {
      fields += ", fromChainID, toChainID, crossTransactionID";
    } else if (event === "liquidityDeposits" || event === "liquidityWithdraws") {
      fields += ", chainID, token{name}";
    }
    return baseStr + fields + " }";
  });

  const protocolFields = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalValueLockedUSD: "BigDecimal!",
    protocolControlledValueUSD: "BigDecimal",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeVolumeInUSD: "BigDecimal!",
    cumulativeVolumeOutUSD: "BigDecimal!",
    cumulativeTotalVolumeUSD: "BigDecimal!",
    netVolumeUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
    cumulativeUniqueTransferSenders: "Int!",
    cumulativeUniqueTransferReceivers: "Int!",
    cumulativeUniqueLiquidityProviders: "Int!",
    cumulativeUniqueMessageSenders: "Int!",
    cumulativeTransactionCount: "Int!",
    cumulativeTransferOutCount: "Int!",
    cumulativeTransferInCount: "Int!",
    cumulativeLiquidityDepositCount: "Int!",
    cumulativeLiquidityWithdrawCount: "Int!",
    cumulativeMessageSentCount: "Int!",
    cumulativeMessageReceivedCount: "Int!",
    supportedNetworks: "[Network!]!",
    totalPoolCount: "Int!",
    totalPoolRouteCount: "Int!",
    totalCanonicalRouteCount: "Int!",
    totalWrappedRouteCount: "Int!",
    totalSupportedTokenCount: "Int!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

  const financialsQuery = `
    query Data {
      ${finanQuery}
    }`;
  const hourlyUsageQuery = `
    query Data {
      ${usageHourlyQuery}
    }`;
  const dailyUsageQuery = `
    query Data {
      ${usageDailyQuery}
    }`;

  const protocolTableQuery = `
    query Data($protocolId: String) {
      bridgeProtocol(id: $protocolId) {
        ${protocolQueryFields}
      }
    }`;

  const poolsQuery = `
      query Data {
        pools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          name
        }
      }
    `;

  const poolTimeseriesQuery = `
      query Data($poolId: String) {
        ${poolDailyQuery}
        ${poolHourlyQuery}
      }
      `;

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    symbol: "String",
    relation: "Bytes",
    type: "BridgePoolType!",
    inputToken: "Token!",
    destinationTokens: "[CrosschainToken!]!",
    routes: "[PoolRoute!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    createdTimestamp: "BigInt!",
    createdBlockNumber: "BigInt!",
    mintSupply: "BigInt",
    inputTokenBalance: "BigInt!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeVolumeIn: "BigInt!",
    cumulativeVolumeOut: "BigInt!",
    netVolume: "BigInt!",
    cumulativeVolumeInUSD: "BigDecimal!",
    cumulativeVolumeOutUSD: "BigDecimal!",
    netVolumeUSD: "BigDecimal!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
  };

  let query = `
  query Data($poolId: String, $protocolId: String){
    _meta {
      block {
        number
      }
      deployment
    }
    protocols {
      id
      methodologyVersion
      network
      name
      type
      slug
      schemaVersion
      subgraphVersion
    }

    bridgeProtocols {
      ${protocolQueryFields}
    }
    ${eventsQuery}
    pool(id: $poolId){
      id
      name
      symbol
      type
      inputToken {
        id
        decimals
        name
        symbol
      }
      outputToken {
        id
        decimals
        name
        symbol
      }
      routes {
        id
        crossToken {
          network
        }
      }
      rewardTokens {
        id
        type
        token {
          id
          decimals
          name
          symbol
        }
      }
      destinationTokens {
        id
      }
      mintSupply
      inputTokenBalance
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      cumulativeVolumeIn
      cumulativeVolumeOut
      netVolume
      cumulativeVolumeInUSD
      cumulativeVolumeOutUSD
      netVolumeUSD
      outputTokenSupply
      outputTokenPriceUSD
      stakedOutputTokenAmount
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
    }
  }`;

  return {
    entities,
    entitiesData,
    query,
    protocolTableQuery,
    poolData,
    events,
    protocolFields,
    poolsQuery,
    financialsQuery,
    hourlyUsageQuery,
    dailyUsageQuery,
    poolTimeseriesQuery,
  };
};

export const schema120 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "poolDailySnapshots",
    "usageMetricsHourlySnapshots",
    "poolHourlySnapshots",
  ];

  const entitiesData = {
    financialsDailySnapshots: {
      id: "ID!",
      day: "BigInt!",
      totalValueLockedUSD: "BigDecimal!",
      totalValueExportedUSD: "BigDecimal!",
      totalValueImportedUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeInUSD: "BigDecimal!",
      cumulativeVolumeOutUSD: "BigDecimal!",
      dailyNetVolumeUSD: "BigDecimal!",
      dailyVolumeInUSD: "BigDecimal!",
      dailyVolumeOutUSD: "BigDecimal!",
      cumulativeNetVolumeUSD: "BigDecimal!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      day: "BigInt!",
      cumulativeUniqueUsers: "Int!",
      cumulativeUniqueTransferSenders: "Int!",
      cumulativeUniqueTransferReceivers: "Int!",
      cumulativeUniqueLiquidityProviders: "Int!",
      cumulativeUniqueMessageSenders: "Int!",
      dailyActiveUsers: "Int!",
      dailyActiveTransferSenders: "Int!",
      dailyActiveTransferReceivers: "Int!",
      dailyActiveLiquidityProviders: "Int!",
      dailyActiveMessageSenders: "Int!",
      cumulativeTransactionCount: "Int!",
      dailyTransactionCount: "Int!",
      timestamp: "BigInt!",
      totalPoolCount: "Int!",
      cumulativeTransferOutCount: "Int!",
      dailyTransferOutCount: "Int!",
      cumulativeTransferInCount: "Int!",
      dailyTransferInCount: "Int!",
      cumulativeLiquidityDepositCount: "Int!",
      dailyLiquidityDepositCount: "Int!",
      cumulativeLiquidityWithdrawCount: "Int!",
      dailyLiquidityWithdrawCount: "Int!",
      cumulativeMessageSentCount: "Int!",
      dailyMessageSentCount: "Int!",
      cumulativeMessageReceivedCount: "Int!",
      dailyMessageReceivedCount: "Int!",
      totalPoolRouteCount: "Int!",
      totalCanonicalRouteCount: "Int!",
      totalWrappedRouteCount: "Int!",
      totalSupportedTokenCount: "Int!",
      blockNumber: "BigInt!",
    },
    poolDailySnapshots: {
      id: "ID!",
      day: "BigInt!",
      totalValueLockedUSD: "BigDecimal!",
      netValueExportedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeIn: "BigInt!",
      dailyVolumeIn: "BigInt!",
      cumulativeVolumeInUSD: "BigDecimal!",
      dailyVolumeInUSD: "BigDecimal!",
      cumulativeVolumeOut: "BigInt!",
      dailyVolumeOut: "BigInt!",
      cumulativeVolumeOutUSD: "BigDecimal!",
      dailyVolumeOutUSD: "BigDecimal!",
      netCumulativeVolume: "BigInt!",
      netCumulativeVolumeUSD: "BigDecimal!",
      netDailyVolume: "BigInt!",
      netDailyVolumeUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      mintSupply: "BigInt",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      hour: "BigInt!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      cumulativeUniqueTransferSenders: "Int!",
      cumulativeUniqueTransferReceivers: "Int!",
      cumulativeUniqueLiquidityProviders: "Int!",
      cumulativeUniqueMessageSenders: "Int!",
      hourlyActiveTransferSenders: "Int!",
      hourlyActiveTransferReceivers: "Int!",
      hourlyActiveLiquidityProviders: "Int!",
      hourlyActiveMessageSenders: "Int!",
      cumulativeTransactionCount: "Int!",
      hourlyTransactionCount: "Int!",
      cumulativeTransferOutCount: "Int!",
      hourlyTransferOutCount: "Int!",
      cumulativeTransferInCount: "Int!",
      hourlyTransferInCount: "Int!",
      cumulativeLiquidityDepositCount: "Int!",
      hourlyLiquidityDepositCount: "Int!",
      cumulativeLiquidityWithdrawCount: "Int!",
      hourlyLiquidityWithdrawCount: "Int!",
      cumulativeMessageSentCount: "Int!",
      hourlyMessageSentCount: "Int!",
      cumulativeMessageReceivedCount: "Int!",
      hourlyMessageReceivedCount: "Int!",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
    poolHourlySnapshots: {
      id: "ID!",
      hour: "Int!",
      totalValueLockedUSD: "BigDecimal!",
      netValueExportedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      cumulativeVolumeIn: "BigInt!",
      hourlyVolumeIn: "BigInt!",
      cumulativeVolumeInUSD: "BigDecimal!",
      hourlyVolumeInUSD: "BigDecimal!",
      cumulativeVolumeOut: "BigInt!",
      hourlyVolumeOut: "BigInt!",
      cumulativeVolumeOutUSD: "BigDecimal!",
      hourlyVolumeOutUSD: "BigDecimal!",
      netCumulativeVolume: "BigInt!",
      netCumulativeVolumeUSD: "BigDecimal!",
      netHourlyVolume: "BigInt!",
      netHourlyVolumeUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      outputTokenSupply: "BigInt",
      outputTokenPriceUSD: "BigDecimal",
      stakedOutputTokenAmount: "BigInt",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      mintSupply: "BigInt",
      timestamp: "BigInt!",
      blockNumber: "BigInt!",
    },
  };

  const finanQuery =
    "financialsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.financialsDailySnapshots).join(",") +
    "}";
  const usageDailyQuery =
    "usageMetricsDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsDailySnapshots).join(",") +
    "}";
  const usageHourlyQuery =
    "usageMetricsHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc) {" +
    Object.keys(entitiesData.usageMetricsHourlySnapshots).join(",") +
    "}";

  const poolDailyQuery =
    "poolDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolDailySnapshots).join(",") +
    "}";
  const poolHourlyQuery =
    "poolHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {pool: $poolId}) {" +
    Object.keys(entitiesData.poolHourlySnapshots).join(",") +
    "}";

  const eventsFields = ["hash", "timestamp", "account{id}"];

  // Query pool(pool) entity and events entities
  const events: string[] = ["bridgeTransfers", "bridgeMessages", "liquidityDeposits", "liquidityWithdraws"];
  const eventsQuery: any[] = events.map((event) => {
    let options = "";
    let fields = eventsFields.join(", ");
    if (event !== "bridgeMessages") {
      fields += ", amount, amountUSD, pool{id}";
      options = ", where: {pool: $poolId}";
    }
    const baseStr = event + "(first: 1000, orderBy: timestamp, orderDirection: desc" + options + ") { ";
    if (event === "bridgeTransfers" || event === "bridgeMessages") {
      fields += ", fromChainID, toChainID, crossTransactionID";
    } else if (event === "liquidityDeposits" || event === "liquidityWithdraws") {
      fields += ", chainID, token{name}";
    }
    return baseStr + fields + " }";
  });

  const protocolFields = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    totalValueLockedUSD: "BigDecimal!",
    protocolControlledValueUSD: "BigDecimal",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeVolumeInUSD: "BigDecimal!",
    cumulativeVolumeOutUSD: "BigDecimal!",
    cumulativeTotalVolumeUSD: "BigDecimal!",
    netVolumeUSD: "BigDecimal!",
    cumulativeUniqueUsers: "Int!",
    cumulativeUniqueTransferSenders: "Int!",
    cumulativeUniqueTransferReceivers: "Int!",
    cumulativeUniqueLiquidityProviders: "Int!",
    cumulativeUniqueMessageSenders: "Int!",
    cumulativeTransactionCount: "Int!",
    cumulativeTransferOutCount: "Int!",
    cumulativeTransferInCount: "Int!",
    cumulativeLiquidityDepositCount: "Int!",
    cumulativeLiquidityWithdrawCount: "Int!",
    cumulativeMessageSentCount: "Int!",
    cumulativeMessageReceivedCount: "Int!",
    supportedNetworks: "[Network!]!",
    totalValueExportedUSD: "BigDecimal!",
    totalValueImportedUSD: "BigDecimal!",
    totalPoolCount: "Int!",
    totalPoolRouteCount: "Int!",
    totalCanonicalRouteCount: "Int!",
    totalWrappedRouteCount: "Int!",
    totalSupportedTokenCount: "Int!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map((x) => x + "\n");

  const financialsQuery = `
    query Data {
      ${finanQuery}
    }`;
  const hourlyUsageQuery = `
    query Data {
      ${usageHourlyQuery}
    }`;
  const dailyUsageQuery = `
    query Data {
      ${usageDailyQuery}
    }`;

  const protocolTableQuery = `
    query Data($protocolId: String) {
      bridgeProtocol(id: $protocolId) {
        ${protocolQueryFields}
      }
    }`;

  const poolsQuery = `
      query Data {
        pools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          name
        }
      }
    `;

  const poolTimeseriesQuery = `
      query Data($poolId: String) {
        ${poolDailyQuery}
        ${poolHourlyQuery}
      }
      `;

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    symbol: "String",
    relation: "Bytes",
    type: "BridgePoolType!",
    inputToken: "Token!",
    destinationTokens: "[CrosschainToken!]!",
    routes: "[PoolRoute!]!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    createdTimestamp: "BigInt!",
    createdBlockNumber: "BigInt!",
    mintSupply: "BigInt",
    inputTokenBalance: "BigInt!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    cumulativeVolumeIn: "BigInt!",
    cumulativeVolumeOut: "BigInt!",
    netValueExportedUSD: "BigDecimal!",
    netVolume: "BigInt!",
    cumulativeVolumeInUSD: "BigDecimal!",
    cumulativeVolumeOutUSD: "BigDecimal!",
    netVolumeUSD: "BigDecimal!",
    outputTokenSupply: "BigInt",
    outputTokenPriceUSD: "BigDecimal",
    stakedOutputTokenAmount: "BigInt",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
  };

  let query = `
  query Data($poolId: String, $protocolId: String){
    _meta {
      block {
        number
      }
      deployment
    }
    protocols {
      id
      methodologyVersion
      network
      name
      type
      slug
      schemaVersion
      subgraphVersion
    }

    bridgeProtocols {
      ${protocolQueryFields}
    }
    ${eventsQuery}
    pool(id: $poolId){
      id
      name
      symbol
      type
      inputToken {
        id
        decimals
        name
        symbol
      }
      outputToken {
        id
        decimals
        name
        symbol
      }
      routes {
        id
        crossToken {
          network
        }
      }
      rewardTokens {
        id
        type
        token {
          id
          decimals
          name
          symbol
        }
      }
      destinationTokens {
        id
      }
      mintSupply
      inputTokenBalance
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      cumulativeVolumeIn
      cumulativeVolumeOut
      netValueExportedUSD
      netVolume
      cumulativeVolumeInUSD
      cumulativeVolumeOutUSD
      netVolumeUSD
      outputTokenSupply
      outputTokenPriceUSD
      stakedOutputTokenAmount
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
    }
  }`;

  return {
    entities,
    entitiesData,
    query,
    protocolTableQuery,
    poolData,
    events,
    protocolFields,
    poolsQuery,
    financialsQuery,
    hourlyUsageQuery,
    dailyUsageQuery,
    poolTimeseriesQuery,
  };
};
