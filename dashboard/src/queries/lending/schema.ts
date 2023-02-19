import { Schema, Versions } from "../../constants";

export const versionsList = ["1.3.0", "2.0.1", "3.0.0"];

export const schema = (version: string): Schema => {
  // The version group uses the first two digits  of the schema version and defaults to that schema.
  const versionGroupArr = version.split(".");
  versionGroupArr.pop();
  const versionGroup = versionGroupArr.join(".") + ".0";
  switch (versionGroup) {
    case Versions.Schema130:
      return schema130();
    case Versions.Schema201:
      return schema201();
    case Versions.Schema300:
      return schema300();
    default:
      return schema201();
  }
};

export const schema130 = (): Schema => {
  const entities = [
    "financialsDailySnapshots",
    "usageMetricsDailySnapshots",
    "marketDailySnapshots",
    "usageMetricsHourlySnapshots",
    "marketHourlySnapshots",
  ];
  const entitiesData = {
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    financialsDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      totalBorrowBalanceUSD: "BigDecimal!",
      dailyBorrowUSD: "BigDecimal!",
      cumulativeBorrowUSD: "BigDecimal!",
      totalDepositBalanceUSD: "BigDecimal!",
      dailyDepositUSD: "BigDecimal!",
      cumulativeDepositUSD: "BigDecimal!",
      dailyLiquidateUSD: "BigDecimal!",
      cumulativeLiquidateUSD: "BigDecimal!",
      mintedTokenSupplies: "[BigInt!]",
      timestamp: "BigInt!",
    },
    usageMetricsDailySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      dailyActiveUsers: "Int!",
      dailyTransactionCount: "Int!",
      dailyDepositCount: "Int!",
      dailyWithdrawCount: "Int!",
      dailyBorrowCount: "Int!",
      dailyRepayCount: "Int!",
      dailyLiquidateCount: "Int!",
      totalPoolCount: "Int!",
      timestamp: "BigInt!",
    },
    marketDailySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      dailySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      dailyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      dailyTotalRevenueUSD: "BigDecimal!",
      totalDepositBalanceUSD: "BigDecimal!",
      dailyDepositUSD: "BigDecimal!",
      cumulativeDepositUSD: "BigDecimal!",
      totalBorrowBalanceUSD: "BigDecimal!",
      dailyBorrowUSD: "BigDecimal!",
      cumulativeBorrowUSD: "BigDecimal!",
      dailyLiquidateUSD: "BigDecimal!",
      cumulativeLiquidateUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      inputTokenPriceUSD: "BigDecimal!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      rates: "[InterestRate!]!",
      exchangeRate: "BigDecimal",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
    },
    usageMetricsHourlySnapshots: {
      id: "ID!",
      cumulativeUniqueUsers: "Int!",
      hourlyActiveUsers: "Int!",
      hourlyTransactionCount: "Int!",
      hourlyDepositCount: "Int!",
      hourlyWithdrawCount: "Int!",
      hourlyBorrowCount: "Int!",
      hourlyRepayCount: "Int!",
      hourlyLiquidateCount: "Int!",
      timestamp: "BigInt!",
    },
    marketHourlySnapshots: {
      id: "ID!",
      totalValueLockedUSD: "BigDecimal!",
      cumulativeSupplySideRevenueUSD: "BigDecimal!",
      hourlySupplySideRevenueUSD: "BigDecimal!",
      cumulativeProtocolSideRevenueUSD: "BigDecimal!",
      hourlyProtocolSideRevenueUSD: "BigDecimal!",
      cumulativeTotalRevenueUSD: "BigDecimal!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      totalDepositBalanceUSD: "BigDecimal!",
      hourlyDepositUSD: "BigDecimal!",
      cumulativeDepositUSD: "BigDecimal!",
      totalBorrowBalanceUSD: "BigDecimal!",
      hourlyBorrowUSD: "BigDecimal!",
      cumulativeBorrowUSD: "BigDecimal!",
      hourlyLiquidateUSD: "BigDecimal!",
      cumulativeLiquidateUSD: "BigDecimal!",
      inputTokenBalance: "BigInt!",
      inputTokenPriceUSD: "BigDecimal!",
      outputTokenSupply: "BigInt!",
      outputTokenPriceUSD: "BigDecimal!",
      exchangeRate: "BigDecimal",
      rates: "[InterestRate!]!",
      rewardTokenEmissionsAmount: "[BigInt!]",
      rewardTokenEmissionsUSD: "[BigDecimal!]",
      timestamp: "BigInt!",
    },
  };

  const adjustedMarketDailyFields = Object.keys(entitiesData.marketDailySnapshots);
  const adjustedMarketHourlyFields = Object.keys(entitiesData.marketHourlySnapshots);
  adjustedMarketDailyFields[adjustedMarketDailyFields.indexOf("rates")] = "rates{id,side,rate,type}";
  adjustedMarketHourlyFields[adjustedMarketHourlyFields.indexOf("rates")] = "rates{id,side,rate,type}";

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

  const marketDailyQuery =
    "marketDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {" +
    adjustedMarketDailyFields.join(",") +
    "}";
  const marketHourlyQuery =
    "marketHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {" +
    adjustedMarketHourlyFields.join(",") +
    "}";

  const eventsFields = ["hash", "to", "from", "timestamp", "amount", "amountUSD"];

  const events: string[] = ["deposits", "withdraws", "borrows", "repays", "liquidates"];
  const eventsQuery: any[] = events.map((event) => {
    let options = "";
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}" + options + ") { ";
    let fields = eventsFields.join(", ");
    if (event === "liquidates") {
      fields += ", profitUSD, liquidatee";
    }
    return baseStr + fields + " }";
  });

  const protocolFields: any = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    lendingType: "LendingType",
    riskType: "RiskType",
    cumulativeUniqueUsers: "Int!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    protocolControlledValueUSD: "BigDecimal",
    totalPoolCount: "Int!",
    totalDepositBalanceUSD: "BigDecimal!",
    cumulativeDepositUSD: "BigDecimal!",
    totalBorrowBalanceUSD: "BigDecimal!",
    cumulativeBorrowUSD: "BigDecimal!",
    cumulativeLiquidateUSD: "BigDecimal!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map(x => x + '\n');

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
      lendingProtocol(id:$protocolId) {
        ${protocolQueryFields}
        mintedTokens {
          id
          decimals
        }
        mintedTokenSupplies
      }
    }`;

  const poolsQuery = `
      query Data {
        markets(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          name
        }
      }
    `;

  const poolTimeseriesQuery = `
  query Data($poolId: String) {
    ${marketDailyQuery}
    ${marketHourlyQuery}
  }
  `;

  const poolData: { [x: string]: string } = {
    id: "ID!",
    name: "String",
    inputToken: "Token!",
    outputToken: "Token",
    rewardTokens: "[RewardToken!]",
    isActive: "Boolean!",
    canUseAsCollateral: "Boolean!",
    canBorrowFrom: "Boolean!",
    maximumLTV: "BigDecimal!",
    liquidationThreshold: "BigDecimal!",
    liquidationPenalty: "BigDecimal!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    totalDepositBalanceUSD: "BigDecimal!",
    cumulativeDepositUSD: "BigDecimal!",
    totalBorrowBalanceUSD: "BigDecimal!",
    cumulativeBorrowUSD: "BigDecimal!",
    cumulativeLiquidateUSD: "BigDecimal!",
    inputTokenBalance: "BigInt!",
    inputTokenPriceUSD: "BigDecimal!",
    outputTokenSupply: "BigInt!",
    outputTokenPriceUSD: "BigDecimal!",
    exchangeRate: "BigDecimal",
    rates: "[InterestRate!]!",
    rewardTokenEmissionsAmount: "[BigInt!]",
    rewardTokenEmissionsUSD: "[BigDecimal!]",
  };

  const query = `
  query Data($poolId: String, $protocolId: String){
    _meta {
      block {
        number
      }
      deployment
    }
    protocols {
      id
      name
      slug
      type
      schemaVersion
      subgraphVersion
      methodologyVersion
    }
    
    lendingProtocols {
      ${protocolQueryFields}
      mintedTokens {
        id
        decimals
      }
      mintedTokenSupplies
    }

    ${eventsQuery}
    market(id:$poolId){
      id
      name
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
      rates {
        id
        side
        rate
        type
      }
      isActive
      canUseAsCollateral
      canBorrowFrom
      maximumLTV
      liquidationThreshold
      liquidationPenalty
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      totalDepositBalanceUSD
      cumulativeDepositUSD
      totalBorrowBalanceUSD
      cumulativeBorrowUSD
      cumulativeLiquidateUSD
      inputTokenBalance
      inputTokenPriceUSD
      outputTokenSupply
      outputTokenPriceUSD
      exchangeRate
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
    }
  }`;

  protocolFields["mintedTokens"] = "[Token!]";
  protocolFields["mintedTokenSupplies"] = "[BigInt!]";

  return {
    entities,
    entitiesData,
    query,
    poolData,
    events,
    protocolFields,
    poolTimeseriesQuery,
    financialsQuery,
    hourlyUsageQuery,
    dailyUsageQuery,
    protocolTableQuery,
    poolsQuery,
  };
};

export const schema201 = (): Schema => {
  const prevSchema = schema130();
  const entities = [...prevSchema.entities, "positionSnapshot"];
  const entitiesData = {
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    financialsDailySnapshots: prevSchema.entitiesData.financialsDailySnapshots,
    usageMetricsDailySnapshots: {
      ...prevSchema.entitiesData.usageMetricsDailySnapshots,
      cumulativeUniqueDepositors: "Int!",
      cumulativeUniqueBorrowers: "Int!",
      cumulativeUniqueLiquidators: "Int!",
      cumulativeUniqueLiquidatees: "Int!",
      dailyActiveDepositors: "Int!",
      dailyActiveBorrowers: "Int!",
      dailyActiveLiquidators: "Int!",
      dailyActiveLiquidatees: "Int!",
    },
    marketDailySnapshots: prevSchema.entitiesData.marketDailySnapshots,
    usageMetricsHourlySnapshots: prevSchema.entitiesData.usageMetricsHourlySnapshots,
    marketHourlySnapshots: prevSchema.entitiesData.marketHourlySnapshots,
  };

  const adjustedMarketDailyFields = Object.keys(entitiesData.marketDailySnapshots);
  const adjustedMarketHourlyFields = Object.keys(entitiesData.marketHourlySnapshots);
  adjustedMarketDailyFields[adjustedMarketDailyFields.indexOf("rates")] = "rates{id,side,rate,type}";
  adjustedMarketHourlyFields[adjustedMarketHourlyFields.indexOf("rates")] = "rates{id,side,rate,type}";

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

  const marketDailyQuery =
    "marketDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {" +
    adjustedMarketDailyFields.join(",") +
    "}";
  const marketHourlyQuery =
    "marketHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {" +
    adjustedMarketHourlyFields.join(",") +
    "}";

  const eventsFields = ["hash", "nonce", "position", "timestamp", "amount", "amountUSD"];

  const events: string[] = ["deposits", "withdraws", "borrows", "repays", "liquidates"];
  const eventsQuery: any[] = events.map((event) => {
    let options = "";
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}" + options + ") { ";
    let fields = eventsFields.join(", ");
    if (event === "liquidates") {
      fields += ", profitUSD, liquidatee{id}, liquidator{id}";
    } else {
      fields += ", account{id}, position{id}";
    }
    return baseStr + fields + " }";
  });

  const protocolFields: any = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    lendingType: "LendingType",
    riskType: "RiskType",
    cumulativeUniqueUsers: "Int!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    protocolControlledValueUSD: "BigDecimal",
    totalPoolCount: "Int!",
    totalDepositBalanceUSD: "BigDecimal!",
    cumulativeDepositUSD: "BigDecimal!",
    totalBorrowBalanceUSD: "BigDecimal!",
    cumulativeBorrowUSD: "BigDecimal!",
    cumulativeLiquidateUSD: "BigDecimal!",
    cumulativeUniqueDepositors: "Int!",
    cumulativeUniqueBorrowers: "Int!",
    cumulativeUniqueLiquidators: "Int!",
    cumulativeUniqueLiquidatees: "Int!",
    openPositionCount: "Int!",
    cumulativePositionCount: "Int!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map(x => x + '\n');

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
    lendingProtocol(id:$protocolId) {
      ${protocolQueryFields}
      mintedTokens {
        id
          decimals
        }
        mintedTokenSupplies
      }
    }`;

  const poolsQuery = `
    query Data {
      markets(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
        name
      }
    }
    `;

  const poolTimeseriesQuery = `
    query Data($poolId: String) {
      ${marketDailyQuery}
      ${marketHourlyQuery}
    }
    `;

  const positionsQuery = `
    positions(first: 1000) {
      id
      account {
        id
      }
        hashOpened
        hashClosed
        timestampOpened
        timestampClosed
        blockNumberOpened
        blockNumberClosed
        side
        isCollateral
        balance
        depositCount
        withdrawCount
        borrowCount
        repayCount
        liquidationCount
        repays {
          hash
        }
        borrows {
          hash
        }
        withdraws {
          hash
        }
        deposits {
          hash
        }
        liquidations {
          hash
        }
      }
      `;

  const poolData: { [x: string]: string } = {
    ...prevSchema.poolData,
    positionCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    lendingPositionCount: "Int!",
    borrowingPositionCount: "Int!",
  };

  const query = `
      query Data($poolId: String, $protocolId: String){
        _meta {
          block {
            number
          }
          deployment
        }
        protocols {
          id
          name
          slug
          type
          schemaVersion
          subgraphVersion
          methodologyVersion
        }
    
    lendingProtocols {
      ${protocolQueryFields}
      mintedTokens {
        id
        decimals
      }
      mintedTokenSupplies
    }

    ${eventsQuery}
    market(id:$poolId){
      id
      name
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
      rates {
        id
        side
        rate
        type
      }
      isActive
      canUseAsCollateral
      canBorrowFrom
      maximumLTV
      liquidationThreshold
      liquidationPenalty
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      totalDepositBalanceUSD
      cumulativeDepositUSD
      totalBorrowBalanceUSD
      cumulativeBorrowUSD
      cumulativeLiquidateUSD
      inputTokenBalance
      inputTokenPriceUSD
      outputTokenSupply
      outputTokenPriceUSD
      exchangeRate
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
      positionCount
      openPositionCount
      closedPositionCount
      lendingPositionCount
      borrowingPositionCount
      ${positionsQuery}
    }
  }`;

  protocolFields["mintedTokens"] = "[Token!]";
  protocolFields["mintedTokenSupplies"] = "[BigInt!]";

  return {
    entities,
    entitiesData,
    query,
    poolData,
    events,
    protocolFields,
    poolTimeseriesQuery,
    financialsQuery,
    hourlyUsageQuery,
    dailyUsageQuery,
    protocolTableQuery,
    poolsQuery,
    positionsQuery,
  };
};

export const schema300 = (): Schema => {
  const prevSchema = schema201();
  const entities = [...prevSchema.entities, "positionSnapshot"];
  const entitiesData = {
    // Each Array within this array contains strings of the fields to pull for the entity type of the same index above
    financialsDailySnapshots: {
      ...prevSchema.entitiesData.financialsDailySnapshots,
      days: "BigInt!",
      dailyDepositUSD: "BigDecimal!",
      dailyBorrowUSD: "BigDecimal!",
      cumulativeBorrowUSD: "BigDecimal!",
      dailyLiquidateUSD: "BigDecimal!",
      cumulativeLiquidateUSD: "BigDecimal!",
      dailyWithdrawUSD: "BigDecimal!",
      dailyRepayUSD: "BigDecimal!",
      dailyTransferUSD: "BigDecimal!",
      dailyFlashloanUSD: "BigDecimal!",
    },
    usageMetricsDailySnapshots: {
      ...prevSchema.entitiesData.usageMetricsDailySnapshots,
      days: "BigInt!",
      dailyFlashloanCount: "Int!",
      dailyTransferCount: "Int!",
      cumulativePositionCount: "Int!",
      dailyActivePositions: "Int!",
    },
    marketDailySnapshots: {
      ...prevSchema.entitiesData.marketDailySnapshots,
      days: "BigInt!",
      reserves: "BigDecimal",
      reserveFactor: "BigDecimal",
      variableBorrowedTokenBalance: "BigInt",
      stableBorrowedTokenBalance: "BigInt",
      supplyCap: "BigInt",
      borrowCap: "BigInt",
      dailyNativeDeposit: "BigInt!",
      dailyNativeBorrow: "BigInt!",
      dailyNativeLiquidate: "BigInt!",
      dailyNativeWithdraw: "BigInt!",
      dailyNativeRepay: "BigInt!",
      dailyNativeTransfer: "BigInt!",
      dailyFlashloanUSD: "BigDecimal!",
      dailyNativeFlashloan: "BigInt!",
      cumulativeFlashloanUSD: "BigDecimal!",
      dailyActiveUsers: "Int!",
      dailyActiveDepositors: "Int!",
      dailyActiveBorrowers: "Int!",
      dailyActiveLiquidators: "Int!",
      dailyActiveLiquidatees: "Int!",
      dailyActiveTransferrers: "Int!",
      dailyActiveFlashloaners: "Int!",
      dailyFlashloanCount: "Int!",
      lendingPositionCount: "Int!",
      dailyActiveLendingPositionCount: "Int!",
      borrowingPositionCount: "Int!",
      dailyActiveBorrowingPositionCount: "Int!",
    },
    usageMetricsHourlySnapshots: {
      ...prevSchema.entitiesData.usageMetricsHourlySnapshots,
      hours: "BigInt!",
    },
    marketHourlySnapshots: {
      ...prevSchema.entitiesData.marketHourlySnapshots,
      hours: "BigInt!",
      hourlyTotalRevenueUSD: "BigDecimal!",
      hourlyDepositUSD: "BigDecimal!",
      hourlyBorrowUSD: "BigDecimal!",
      hourlyLiquidateUSD: "BigDecimal!",
      hourlyWithdrawUSD: "BigDecimal!",
      hourlyRepayUSD: "BigDecimal!",
      hourlyTransferUSD: "BigDecimal!",
      hourlyFlashloanUSD: "BigDecimal!",
    },
  };

  const adjustedMarketDailyFields = Object.keys(entitiesData.marketDailySnapshots);
  const adjustedMarketHourlyFields = Object.keys(entitiesData.marketHourlySnapshots);
  adjustedMarketDailyFields[adjustedMarketDailyFields.indexOf("rates")] = "rates{id,side,rate,type}";
  adjustedMarketHourlyFields[adjustedMarketHourlyFields.indexOf("rates")] = "rates{id,side,rate,type}";

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

  const marketDailyQuery =
    "marketDailySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {" +
    adjustedMarketDailyFields.join(",") +
    "}";
  const marketHourlyQuery =
    "marketHourlySnapshots(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}) {" +
    adjustedMarketHourlyFields.join(",") +
    "}";

  const eventsFields = ["hash", "nonce", "timestamp", "amount", "amountUSD"];

  const events: string[] = ["deposits", "withdraws", "borrows", "repays", "liquidates", "transfers", "flashloans"];
  const eventsQuery: any[] = events.map((event) => {
    let options = "";
    const baseStr =
      event + "(first: 1000, orderBy: timestamp, orderDirection: desc, where: {market: $poolId}" + options + ") { ";
    let fields = eventsFields.join(", ");
    if (event === "liquidates") {
      fields += ", positions, profitUSD, liquidatee{id}, liquidator{id}";
    } else if (event !== "transfers") {
      fields += ", account{id}";
      if (event !== "flashloans") {
        fields += ", position{id}";
      }
    }
    return baseStr + fields + " }";
  });

  const protocolFields: any = {
    id: "ID!",
    name: "String!",
    slug: "String!",
    schemaVersion: "String!",
    subgraphVersion: "String!",
    methodologyVersion: "String!",
    network: "Network!",
    type: "ProtocolType!",
    lendingType: "LendingType",
    riskType: "RiskType",
    cumulativeUniqueUsers: "Int!",
    totalValueLockedUSD: "BigDecimal!",
    cumulativeSupplySideRevenueUSD: "BigDecimal!",
    cumulativeProtocolSideRevenueUSD: "BigDecimal!",
    cumulativeTotalRevenueUSD: "BigDecimal!",
    protocolControlledValueUSD: "BigDecimal",
    totalPoolCount: "Int!",
    totalDepositBalanceUSD: "BigDecimal!",
    cumulativeDepositUSD: "BigDecimal!",
    totalBorrowBalanceUSD: "BigDecimal!",
    cumulativeBorrowUSD: "BigDecimal!",
    cumulativeLiquidateUSD: "BigDecimal!",
    cumulativeUniqueDepositors: "Int!",
    cumulativeUniqueBorrowers: "Int!",
    cumulativeUniqueLiquidators: "Int!",
    cumulativeUniqueLiquidatees: "Int!",
    openPositionCount: "Int!",
    cumulativePositionCount: "Int!",
    transactionCount: "Int!",
    depositCount: "Int!",
    withdrawCount: "Int!",
    borrowCount: "Int!",
    repayCount: "Int!",
    liquidationCount: "Int!",
    transferCount: "Int!",
    flashloanCount: "Int!",
  };

  const protocolQueryFields = Object.keys(protocolFields).map(x => x + '\n');

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
      lendingProtocol(id:$protocolId) {
        ${protocolQueryFields}
        mintedTokens {
          id
          decimals
        }
        mintedTokenSupplies
      }
    }`;

  const poolsQuery = `
    query Data {
      markets(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
          name
        }
      }
      `;

  const poolTimeseriesQuery = `
      query Data($poolId: String) {
        ${marketDailyQuery}
        ${marketHourlyQuery}
      }
      `;

  const positionsQuery = `
      positions(first: 1000) {
        id
        account {
          id
        }
        hashOpened
        hashClosed
        timestampOpened
        timestampClosed
        blockNumberOpened
        blockNumberClosed
        side
        isCollateral
        balance
        depositCount
        withdrawCount
        borrowCount
        repayCount
        liquidationCount
        repays {
          hash
        }
        borrows {
          hash
        }
        withdraws {
          hash
        }
        deposits {
          hash
        }
        liquidations {
          hash
        }
      }
      `;

  const poolData: { [x: string]: string } = {
    ...prevSchema.poolData,
    positionCount: "Int!",
    openPositionCount: "Int!",
    closedPositionCount: "Int!",
    lendingPositionCount: "Int!",
    borrowingPositionCount: "Int!",
    cumulativeTransferUSD: "BigDecimal!",
    cumulativeFlashloanUSD: "BigDecimal!",
    transactionCount: "Int!",
    depositCount: "Int!",
    withdrawCount: "Int!",
    borrowCount: "Int!",
    repayCount: "Int!",
    liquidationCount: "Int!",
    transferCount: "Int!",
    flashloanCount: "Int!",
    cumulativeUniqueDepositors: "Int!",
    cumulativeUniqueBorrowers: "Int!",
    cumulativeUniqueLiquidators: "Int!",
    cumulativeUniqueLiquidatees: "Int!",
    cumulativeUniqueTransferrers: "Int!",
    cumulativeUniqueFlashloaners: "Int!",
    oracle: "Oracle",
    canIsolate: "Boolean!",
    reserves: "BigDecimal",
    reserveFactor: "BigDecimal",
    borrowedToken: "Token",
    variableBorrowedTokenBalance: "BigInt",
    stableBorrowedTokenBalance: "BigInt",
    supplyCap: "BigInt",
    borrowCap: "BigInt",
    revenueDetail: "RevenueDetail",
  };

  const query = `
      query Data($poolId: String, $protocolId: String){
    _meta {
      block {
        number
      }
      deployment
    }
    protocols {
      id
      name
      slug
      type
      schemaVersion
      subgraphVersion
      methodologyVersion
    }
    
    lendingProtocols {
      ${protocolQueryFields}
      mintedTokens {
        id
        decimals
      }
      mintedTokenSupplies
    }

    ${eventsQuery}
    market(id:$poolId){
      id
      name
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
      rates {
        id
        side
        rate
        type
      }
      isActive
      canUseAsCollateral
      canBorrowFrom
      maximumLTV
      liquidationThreshold
      liquidationPenalty
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      cumulativeTotalRevenueUSD
      totalDepositBalanceUSD
      cumulativeDepositUSD
      totalBorrowBalanceUSD
      cumulativeBorrowUSD
      cumulativeLiquidateUSD
      inputTokenBalance
      inputTokenPriceUSD
      outputTokenSupply
      outputTokenPriceUSD
      exchangeRate
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
      positionCount
      openPositionCount
      closedPositionCount
      lendingPositionCount
      borrowingPositionCount
      cumulativeTransferUSD
      cumulativeFlashloanUSD
      transactionCount
      depositCount
      withdrawCount
      borrowCount
      repayCount
      liquidationCount
      transferCount
      flashloanCount
      cumulativeUniqueDepositors
      cumulativeUniqueBorrowers
      cumulativeUniqueLiquidators
      cumulativeUniqueLiquidatees
      cumulativeUniqueTransferrers
      cumulativeUniqueFlashloaners
      oracle
      canIsolate
      reserves
      reserveFactor
      borrowedToken
      variableBorrowedTokenBalance
      stableBorrowedTokenBalance
      supplyCap
      borrowCap
      revenueDetail
      ${positionsQuery}
    }
  }`;

  protocolFields["mintedTokens"] = "[Token!]";
  protocolFields["mintedTokenSupplies"] = "[BigInt!]";

  return {
    entities,
    entitiesData,
    query,
    poolData,
    events,
    protocolFields,
    poolTimeseriesQuery,
    financialsQuery,
    hourlyUsageQuery,
    dailyUsageQuery,
    protocolTableQuery,
    poolsQuery,
    positionsQuery,
  };
};