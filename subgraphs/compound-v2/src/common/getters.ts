// get or create snapshots and metrics
import {
  FinancialsDailySnapshot,
  LendingProtocol,
  Market,
  MarketDailySnapshot,
  RewardToken,
  Token,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  CETH_ADDRESS,
  COMPTROLLER_ADDRESS,
  COMP_ADDRESS,
  DEFAULT_DECIMALS,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  INITIAL_EXCHANGE_RATE,
  LENDING_TYPE,
  METHODOLOGY_VERSION,
  NETWORK_ETHEREUM,
  PROTOCOL_NAME,
  PROTOCOL_RISK_TYPE,
  PROTOCOL_SLUG,
  PROTOCOL_TYPE,
  RewardTokenType,
  SAI_ADDRESS,
  SCHEMA_VERSION,
  SECONDS_PER_DAY,
  SUBGRAPH_VERSION,
  ZERO_ADDRESS,
} from "./utils/constants";
import { getAssetDecimals, getAssetName, getAssetSymbol } from "./utils/tokens";
import { CToken } from "../../generated/Comptroller/CToken";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { exponentToBigDecimal } from "./utils/utils";
import { Comptroller } from "../../generated/Comptroller/Comptroller";

///////////////////
//// Snapshots ////
///////////////////

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = COMPTROLLER_ADDRESS;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketAddress = event.address.toHexString();
  let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = COMPTROLLER_ADDRESS;
    marketMetrics.market = marketAddress;
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalances = [BIGINT_ZERO];
    marketMetrics.inputTokenPricesUSD = [BIGDECIMAL_ZERO];
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.depositRate = BIGDECIMAL_ZERO;
    marketMetrics.variableBorrowRate = BIGDECIMAL_ZERO;

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
    financialMetrics.protocol = COMPTROLLER_ADDRESS;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

////////////////////////////
///// Lending Specific /////
////////////////////////////

export function getOrCreateLendingProtcol(): LendingProtocol {
  let protocol = LendingProtocol.load(COMPTROLLER_ADDRESS);

  if (!protocol) {
    protocol = new LendingProtocol(COMPTROLLER_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = SCHEMA_VERSION;
    protocol.subgraphVersion = SUBGRAPH_VERSION;
    protocol.methodologyVersion = METHODOLOGY_VERSION;
    protocol.network = NETWORK_ETHEREUM;
    protocol.type = PROTOCOL_TYPE;
    protocol.totalUniqueUsers = 0 as i32;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.totalVolumeUSD = BIGDECIMAL_ZERO;
    protocol.totalDepositUSD = BIGDECIMAL_ONE;
    protocol.totalBorrowUSD = BIGDECIMAL_ZERO;
    protocol.lendingType = LENDING_TYPE;
    protocol.riskType = PROTOCOL_RISK_TYPE;
    protocol._marketIds = [];

    // get initial liquidation penalty
    let troller = Comptroller.bind(Address.fromString(COMPTROLLER_ADDRESS));
    let tryLiquidationPenalty = troller.try_liquidationIncentiveMantissa();
    protocol._liquidationPenalty = tryLiquidationPenalty.reverted
      ? BIGDECIMAL_ZERO
      : tryLiquidationPenalty.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)).minus(BIGDECIMAL_ONE);

    protocol.save();
  }
  return protocol;
}

export function getOrCreateMarket(event: ethereum.Event, marketAddress: Address): Market {
  let market = Market.load(marketAddress.toHexString());

  if (!market) {
    market = new Market(marketAddress.toHexString());
    let cTokenContract = CToken.bind(marketAddress);
    let underlyingAddress: string;
    let underlying = cTokenContract.try_underlying();
    if (marketAddress.toHexString().toLowerCase() == CETH_ADDRESS) {
      underlyingAddress = ETH_ADDRESS;
    } else if (underlying.reverted) {
      underlyingAddress = ZERO_ADDRESS;
    } else {
      underlyingAddress = underlying.value.toHexString();
    }

    // add market id to protocol
    let protocol = getOrCreateLendingProtcol();
    let marketIds = protocol._marketIds;
    marketIds.push(marketAddress.toHexString());
    protocol._marketIds = marketIds;
    protocol.save();
    market.protocol = protocol.id;

    // create/add Tokens
    let inputToken = getOrCreateToken(underlyingAddress);
    let outputToken = getOrCreateCToken(marketAddress, cTokenContract);
    // COMP was not created until block 9601359
    if (event.block.number.toI32() > 9601359) {
      let rewardTokenDeposit = getOrCreateRewardToken(
        marketAddress.toHexString(),
        Address.fromString(COMP_ADDRESS),
        RewardTokenType.DEPOSIT,
      );
      let rewardTokenBorrow = getOrCreateRewardToken(
        marketAddress.toHexString(),
        Address.fromString(COMP_ADDRESS),
        RewardTokenType.BORROW,
      );
      market.rewardTokens = [rewardTokenDeposit.id, rewardTokenBorrow.id];
    }
    market.inputTokens = [inputToken.id];
    market.outputToken = outputToken.id;

    // populate quantitative data
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.totalVolumeUSD = BIGDECIMAL_ZERO;
    market.totalDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowUSD = BIGDECIMAL_ZERO;
    market._totalBorrowNative = BIGINT_ZERO;
    market.inputTokenBalances = [BIGINT_ZERO];
    market.inputTokenPricesUSD = [BIGDECIMAL_ZERO];
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;
    market._currentBlockNumber = event.block.number;

    // lending-specific data
    if (underlyingAddress == SAI_ADDRESS) {
      market.name = "Dai Stablecoin v1.0 (DAI)";
    } else {
      market.name = inputToken.name;
    }
    market.isActive = true; // event MarketListed() makes a market active
    market.canUseAsCollateral = true; // initially true - if collateral factor = 0 -> false
    market.canBorrowFrom = true; // initially active until event ActionPaused()

    // calculations data
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.depositRate = BIGDECIMAL_ZERO;
    market.stableBorrowRate = BIGDECIMAL_ZERO;
    market.variableBorrowRate = BIGDECIMAL_ZERO;
    let tryReserveFactor = cTokenContract.try_reserveFactorMantissa();
    market._reserveFactor = tryReserveFactor.reverted
      ? BIGDECIMAL_ZERO
      : tryReserveFactor.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS));
    market._exchangeRate = INITIAL_EXCHANGE_RATE;
    market._supplySideRevenueUSD = BIGDECIMAL_ZERO;
    market._protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market._totalRevenueUSD = BIGDECIMAL_ZERO;
    market.liquidationPenalty = protocol._liquidationPenalty;

    market.save();
  }

  return market;
}

export function getOrCreateCToken(tokenAddress: Address, cTokenContract: CToken): Token {
  let cToken = Token.load(tokenAddress.toHexString());

  if (cToken == null) {
    cToken = new Token(tokenAddress.toHexString());
    cToken.name = cTokenContract.name();
    cToken.symbol = cTokenContract.symbol();
    cToken.decimals = cTokenContract.decimals();
    cToken.save();
  }
  return cToken;
}

export function getOrCreateToken(tokenAddress: string): Token {
  let token = Token.load(tokenAddress);

  if (token == null) {
    token = new Token(tokenAddress);

    // check for ETH token - unique
    if (tokenAddress == ETH_ADDRESS) {
      token.name = ETH_NAME;
      token.symbol = ETH_SYMBOL;
      token.decimals = DEFAULT_DECIMALS;
    } else {
      token.name = getAssetName(Address.fromString(tokenAddress));
      token.symbol = getAssetSymbol(Address.fromString(tokenAddress));
      token.decimals = getAssetDecimals(Address.fromString(tokenAddress));
    }
    token.save();
  }
  return token;
}

export function getOrCreateRewardToken(marketAddress: string, tokenAddress: Address, type: string): RewardToken {
  let id = type + "-" + marketAddress;
  let rewardToken = RewardToken.load(id);
  if (rewardToken == null) {
    rewardToken = new RewardToken(id);
    rewardToken.name = getAssetName(tokenAddress);
    rewardToken.symbol = getAssetSymbol(tokenAddress);
    rewardToken.decimals = getAssetDecimals(tokenAddress);
    rewardToken.type = type;
    rewardToken.save();
  }
  return rewardToken;
}
