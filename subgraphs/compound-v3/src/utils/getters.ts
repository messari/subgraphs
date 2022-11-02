import { Address, Bytes } from "@graphprotocol/graph-ts";
import { LendingProtocol } from "../../generated/schema";
import { Versions } from "../versions";
import { BIGDECIMAL_ZERO, INT_ZERO, ProtocolType } from "./constants";

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

export function getOrCreateMarket(marketID: string): Market {}
