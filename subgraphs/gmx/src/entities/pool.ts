import { BigInt } from "@graphprotocol/graph-ts";
import { Pool } from "../../generated/schema";
import { getOrCreateProtocol } from "./protocol";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../utils/constants";

// No POOL ADDRESS passed as argument because there is only one pool
export function getOrCreatePool(
  blockNumber: BigInt,
  blockTimestamp: BigInt
): Pool {
  const protocol = getOrCreateProtocol();
  let pool = Pool.load(protocol.id);

  if (!pool) {
    pool = new Pool(protocol.id);

    // Metadata
    pool.name = "GMXVault";
    pool.symbol = "VAULT";
    pool.protocol = protocol.id;
    pool.createdTimestamp = blockTimestamp;
    pool.createdBlockNumber = blockNumber;

    // Tokens
    pool.inputTokens = [];
    pool.outputToken = null;
    pool.rewardTokens = [];

    // Quantitative Revenue Data
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    // Quantitative Token Data
    pool.inputTokenBalances = [];
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.stakedOutputTokenAmount = null;
    pool.rewardTokenEmissionsAmount = [];
    pool.rewardTokenEmissionsUSD = [];

    pool.save();

    // Update Protocol
    protocol.totalPoolCount += 1;
    protocol.save();
  }

  return pool;
}
