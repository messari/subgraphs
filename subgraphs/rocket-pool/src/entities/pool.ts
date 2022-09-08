import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Pool } from "../../generated/schema";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreateToken } from "./token";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  RPL_ADDRESS,
} from "../utils/constants";

export function getOrCreatePool(
  blockNumber: BigInt,
  blockTimestamp: BigInt
): Pool {
  let protocol = getOrCreateProtocol();
  let pool = Pool.load(protocol.id);

  if (!pool) {
    pool = new Pool(protocol.id);

    // Metadata
    pool.name = protocol.id;
    pool.symbol = "RETH";
    pool.protocol = protocol.id;
    pool.createdTimestamp = blockTimestamp;
    pool.createdBlockNumber = blockNumber;

    // Tokens
    pool.inputTokens = [
      getOrCreateToken(Address.fromString(ETH_ADDRESS), blockNumber).id,
      getOrCreateToken(Address.fromString(RPL_ADDRESS), blockNumber).id,
    ];
    pool.outputToken = getOrCreateToken(
      Address.fromString(protocol.id),
      blockNumber
    ).id;
    pool.rewardTokens = [
      getOrCreateToken(Address.fromString(RPL_ADDRESS), blockNumber).id,
    ];

    // Quantitative Revenue Data
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    // Quantitative Token Data
    pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.stakedOutputTokenAmount = null;
    pool.rewardTokenEmissionsAmount = null;
    pool.rewardTokenEmissionsUSD = null;
    pool.miniPools = [];

    pool.save();

    // Update Protocol
    protocol.totalPoolCount += 1;
    protocol.save();
  }

  return pool;
}
