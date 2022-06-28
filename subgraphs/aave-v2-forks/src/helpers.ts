// Helpers for the general mapping.ts file
import {
  Address,
  BigDecimal,
  DataSourceContext,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  bigIntToBigDecimal,
  BIGINT_ZERO,
  InterestRateSide,
  InterestRateType,
  INT_ZERO,
  LendingType,
  ProtocolType,
  rayToWad,
  RiskType,
  ZERO_ADDRESS,
} from "./constants";
import {
  InterestRate,
  LendingProtocol,
  Market,
  Token,
} from "../generated/schema";
import { ProtocolData } from "./mapping";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";
import { LendingPool } from "../generated/templates/LendingPool/LendingPool";

////////////////////////
///// Initializers /////
////////////////////////

export function getOrCreateLendingProtocol(
  protocolData: ProtocolData
): LendingProtocol {
  let lendingProtocol = LendingProtocol.load(protocolData.protocolAddress);

  if (!lendingProtocol) {
    lendingProtocol = new LendingProtocol(protocolData.protocolAddress);

    lendingProtocol.name = protocolData.name;
    lendingProtocol.slug = protocolData.slug;
    lendingProtocol.schemaVersion = protocolData.schemaVersion;
    lendingProtocol.subgraphVersion = protocolData.subgraphVersion;
    lendingProtocol.methodologyVersion = protocolData.methodologyVersion;
    lendingProtocol.network = protocolData.network;
    lendingProtocol.type = ProtocolType.LENDING;
    lendingProtocol.lendingType = LendingType.POOLED;
    lendingProtocol.riskType = RiskType.ISOLATED;
    lendingProtocol.totalPoolCount = INT_ZERO;
    lendingProtocol.cumulativeUniqueUsers = INT_ZERO;
    lendingProtocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    lendingProtocol._protocolPriceOracle = ZERO_ADDRESS;

    lendingProtocol.save();
  }

  return lendingProtocol;
}

export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    token.symbol = fetchTokenSymbol(address);
    token.name = fetchTokenName(address);
    token.decimals = fetchTokenDecimals(address);

    token.save();
  }

  return token;
}

////////////////////////////
///// Helper Functions /////
////////////////////////////
