import { Address, Bytes, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  LendingProtocol,
  Market,
  Oracle,
  Token,
  TokenData,
} from "../../generated/schema";
import { Versions } from "../versions";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  ProtocolType,
} from "./constants";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";

/**
 * This file contains schema type getter (or creator)
 * functions for schema-lending.graphql.
 *
 * Schema Version: 3.0.0
 * Last Updated: Nov 1, 2022
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
    public readonly permissionType: string,
    public readonly riskType: string
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
    protocol.permissionType = data.permissionType;
    protocol.riskType = data.riskType;

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
  marketID: Address,
  protocolID: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt
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

    market.createdTimestamp = timestamp;
    market.createdBlockNumber = blockNumber;

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
    tokenData.inputTokenPricesUSD = BIGDECIMAL_ZERO;
    tokenData.save();
  }

  return tokenData;
}

export function getOrCreateOracle(
  event: ethereum.Event,
  oracleAddress: Address,
  marketID: Address,
  isUSD: boolean,
  source?: string
): Oracle {
  const oracleID = marketID.concat(oracleAddress);
  let oracle = Oracle.load(oracleID);
  if (!oracle) {
    oracle = new Oracle(oracleID);
    oracle.market = marketID;
    oracle.blockCreated = event.block.number;
    oracle.timestampCreated = event.block.timestamp;
    oracle.isActive = true;
    oracle.isUSD = isUSD;
    if (source) {
      oracle.oracleSource = source;
    }
    oracle.save();
  }

  return oracle;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress);
  if (!token) {
    token = new Token(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.save();
  }

  return token;
}
