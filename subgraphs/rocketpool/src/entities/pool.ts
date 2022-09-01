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

// No POOL ADDRESS passed as argument because Pool == Protocol
export function getOrCreatePool(
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  poolAddress: string
): Pool {
  let protocol = getOrCreateProtocol();
  let pool = Pool.load(poolAddress);

  if (!pool) {
    pool = new Pool(poolAddress);

    // Metadata
    pool.name = poolAddress;
    pool.symbol = "MINIPOOL";
    pool.protocol = protocol.id;
    pool.createdTimestamp = blockTimestamp;
    pool.createdBlockNumber = blockNumber;

    // Tokens
    pool.inputTokens = [
      getOrCreateToken(Address.fromString(ETH_ADDRESS), blockNumber).id,
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
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.stakedOutputTokenAmount = null;
    pool.rewardTokenEmissionsAmount = null;
    pool.rewardTokenEmissionsUSD = null;

    pool.save();

    // Update Protocol
    protocol.totalPoolCount += 1;
    protocol.save();
  }

  return pool;
}
