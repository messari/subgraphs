import { BigInt } from "@graphprotocol/graph-ts";
import { LendingProtocol } from "../../generated/schema";
import * as constants from "../common/constants";

export function getOrCreateLendingProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(constants.PROTOCOL_ID);

  if (!protocol) {
    protocol = new LendingProtocol(constants.PROTOCOL_ID);

    protocol.name = constants.PROTOCOL_NAME;
    protocol.slug = constants.PROTOCOL_SLUG;
    protocol.schemaVersion = constants.PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = constants.PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = constants.PROTOCOL_METHODOLOGY_VERSION;
    protocol.network = constants.PROTOCOL_NETWORK;
    protocol.type = constants.PROTOCOL_TYPE;
    protocol.lendingType = constants.PROTOCOL_LENDING_TYPE;
    protocol.riskType = constants.PROTOCOL_RISK_TYPE;
    protocol.mintedTokens = new Array<string>();
    protocol.cumulativeUniqueUsers = constants.INT_ZERO;
    protocol.cumulativeUniqueBorrowers = constants.INT_ZERO;
    protocol.cumulativeUniqueDepositors = constants.INT_ZERO;
    protocol.cumulativeUniqueLiquidators = constants.INT_ZERO;
    protocol.cumulativeUniqueLiquidatees = constants.INT_ZERO;
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.totalDepositBalanceUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeDepositUSD = constants.BIGDECIMAL_ZERO;
    protocol.totalBorrowBalanceUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeBorrowUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeLiquidateUSD = constants.BIGDECIMAL_ZERO;
    protocol.mintedTokenSupplies = new Array<BigInt>();
    protocol.totalPoolCount = constants.INT_ZERO;
    protocol.openPositionCount = constants.INT_ZERO;
    protocol.cumulativePositionCount = constants.INT_ZERO;
    // TODO: typed array?
    protocol.depositors = [];
    protocol.borrowers = [];
    protocol.liquidatees = [];
    protocol.liquidators = [];

    // protocol._treasuryFee = constants.PROTOCOL_INITIAL_TREASURY_FEE;

    protocol.save();
  }

  return protocol;
}
