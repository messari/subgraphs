import { Address, Bytes, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  InterestRate,
  LendingProtocol,
  Market,
  Oracle,
  RewardToken,
  Token,
  TokenData,
} from "../../generated/schema";
import { Versions } from "../versions";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  ProtocolType,
  SECONDS_PER_DAY,
} from "./constants";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";

/**
 * This file contains schema type getter (or updator)
 * functions for schema-lending.graphql.
 *
 * Schema Version: 3.0.0
 * Last Updated: Nov 10, 2022
 * Author(s):
 *  - @dmelotik
 */

export class ProtocolData {
  constructor(
    public readonly protocolID: Bytes,
    public readonly protocol: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly network: string,
    public readonly lendingType: string,
    public readonly lenderPermissionType: string | null,
    public readonly borrowerPermissionType: string | null,
    public readonly collateralizationType: string | null,
    public readonly riskType: string | null
  ) {}
}

export function getOrCreateLendingProtocol(
  data: ProtocolData
): LendingProtocol {
  let protocol = LendingProtocol.load(data.protocolID);
  if (!protocol) {
    protocol = new LendingProtocol(data.protocolID);
    protocol.protocol = data.protocol;
    protocol.name = data.name;
    protocol.slug = data.slug;
    protocol.network = data.network;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = data.lendingType;
    protocol.lenderPermissionType = data.lenderPermissionType;
    protocol.borrowerPermissionType = data.borrowerPermissionType;
    protocol.riskType = data.riskType;
    protocol.collateralizationType = data.collateralizationType;

    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeUniqueDepositors = INT_ZERO;
    protocol.cumulativeUniqueBorrowers = INT_ZERO;
    protocol.cumulativeUniqueLiquidators = INT_ZERO;
    protocol.cumulativeUniqueLiquidatees = INT_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    protocol.totalPoolCount = INT_ZERO;
    protocol.openPositionCount = INT_ZERO;
    protocol.cumulativePositionCount = INT_ZERO;
    protocol.transactionCount = INT_ZERO;
    protocol.depositCount = INT_ZERO;
    protocol.withdrawalCount = INT_ZERO;
    protocol.borrowCount = INT_ZERO;
    protocol.repayCount = INT_ZERO;
    protocol.liquidationCount = INT_ZERO;
    protocol.transferCount = INT_ZERO;
    protocol.flashloanCount = INT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  protocol.save();

  return protocol;
}

export function getOrCreateMarket(
  event: ethereum.Event,
  marketID: Address,
  protocolID: Bytes
): Market {
  let market = Market.load(marketID);
  if (!market) {
    market = new Market(marketID);
    market.protocol = protocolID;
    market.isActive = true;
    market.canBorrowFrom = false; // default
    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.cumulativeTransferUSD = BIGDECIMAL_ZERO;
    market.cumulativeFlashloanUSD = BIGDECIMAL_ZERO;
    market.transactionCount = INT_ZERO;
    market.depositCount = INT_ZERO;
    market.withdrawalCount = INT_ZERO;
    market.borrowCount = INT_ZERO;
    market.repayCount = INT_ZERO;
    market.liquidationCount = INT_ZERO;
    market.transferCount = INT_ZERO;
    market.flashloanCount = INT_ZERO;

    market.cumulativeUniqueUsers = INT_ZERO;
    market.cumulativeUniqueDepositors = INT_ZERO;
    market.cumulativeUniqueBorrowers = INT_ZERO;
    market.cumulativeUniqueLiquidators = INT_ZERO;
    market.cumulativeUniqueLiquidatees = INT_ZERO;
    market.cumulativeUniqueTransferrers = INT_ZERO;
    market.cumulativeUniqueFlashloaners = INT_ZERO;

    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;

    market.positionCount = INT_ZERO;
    market.openPositionCount = INT_ZERO;
    market.closedPositionCount = INT_ZERO;
    market.lendingPositionCount = INT_ZERO;
    market.borrowingPositionCount = INT_ZERO;
    market.save();
  }

  return market;
}

export function getOrCreateTokenData(
  marketID: Address,
  inputTokenID: Address
): TokenData {
  const tokenDataID = marketID.concat(inputTokenID);
  let tokenData = TokenData.load(tokenDataID);
  if (!tokenData) {
    const token = getOrCreateToken(inputTokenID);
    tokenData = new TokenData(tokenDataID);

    // default values
    tokenData.canUseAsCollateral = false;
    tokenData.maximumLTV = BIGDECIMAL_ZERO;
    tokenData.liquidationThreshold = BIGDECIMAL_ZERO;
    tokenData.liquidationPenalty = BIGDECIMAL_ZERO;
    tokenData.canIsolate = false;
    tokenData.inputToken = token.id;
    tokenData.inputTokenBalance = BIGINT_ZERO;
    tokenData.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    tokenData.save();
  }

  return tokenData;
}

export function getOrCreateOracle(
  event: ethereum.Event,
  oracleAddress: Address,
  tokenAddress: Address,
  marketID: Address,
  isUSD: boolean,
  source?: string
): Oracle {
  const oracleID = marketID.concat(tokenAddress);
  let oracle = Oracle.load(oracleID);
  if (!oracle) {
    oracle = new Oracle(oracleID);
    oracle.market = marketID;
    oracle.blockCreated = event.block.number;
    oracle.timestampCreated = event.block.timestamp;
    oracle.isActive = true;
  }
  oracle.oracleAddress = oracleAddress;
  oracle.isUSD = isUSD;
  if (source) {
    oracle.oracleSource = source;
  }
  oracle.save();

  return oracle;
}

export function getOrCreateToken(tokenAddress: Bytes): Token {
  let token = Token.load(tokenAddress);
  if (!token) {
    token = new Token(tokenAddress);
    token.name = fetchTokenName(Address.fromBytes(tokenAddress));
    token.symbol = fetchTokenSymbol(Address.fromBytes(tokenAddress));
    token.decimals = fetchTokenDecimals(Address.fromBytes(tokenAddress));
    token.save();
  }

  return token;
}

export function getOrCreateRewardToken(
  tokenAddress: Bytes,
  rewardTokenType: string
): RewardToken {
  const rewardTokenID = rewardTokenType.concat("-").concat(rewardTokenType);
  let rewardToken = RewardToken.load(rewardTokenID);
  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenID);
    rewardToken.type = rewardTokenType;
    rewardToken.token = tokenAddress;
    rewardToken.save();
  }

  return rewardToken;
}

export function getOrCreateInterestRate(
  rateSide: string,
  rateType: string,
  marketID: Address
): InterestRate {
  const interestRateID = rateSide
    .concat("-")
    .concat(rateType)
    .concat("-")
    .concat(marketID.toHexString());
  let rate = InterestRate.load(interestRateID);
  if (!rate) {
    rate = new InterestRate(interestRateID);
    rate.rate = BIGDECIMAL_ZERO;
    rate.side = rateSide;
    rate.type = rateType;
    rate.save();
  }

  return rate;
}

export function getOrUpdateFinancials(
  event: ethereum.Event,
  protocol: LendingProtocol
): FinancialsDailySnapshot {
  const days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let snapshot = FinancialsDailySnapshot.load(days.toString());
  if (!snapshot) {
    snapshot = new FinancialsDailySnapshot(days.toString());
    snapshot.days = days;
    snapshot.protocol = protocol.id;

    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    snapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    snapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTransferUSD = BIGDECIMAL_ZERO;
    snapshot.dailyFlashloanUSD = BIGDECIMAL_ZERO;
  }

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.protocolControlledValueUSD = protocol.protocolControlledValueUSD;
  snapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
  snapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  // TODO create new entity for revenueDetails??
  snapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  snapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  snapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  snapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  snapshot.save();

  return snapshot;
}
