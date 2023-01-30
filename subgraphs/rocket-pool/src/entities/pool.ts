import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Pool } from "../../generated/schema";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreateToken, getOrCreateRewardToken } from "./token";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  RPL_ADDRESS,
  RewardTokenType,
  RETH_NAME,
} from "../utils/constants";

export function getOrCreatePool(
  blockNumber: BigInt,
  blockTimestamp: BigInt
): Pool {
  const protocol = getOrCreateProtocol();
  let pool = Pool.load(protocol.id);

  if (!pool) {
    pool = new Pool(protocol.id);

    // Metadata
    pool.name = protocol.id;
    pool.symbol = RETH_NAME;
    pool.protocol = protocol.id;
    pool.createdTimestamp = blockTimestamp;
    pool.createdBlockNumber = blockNumber;

    // Tokens
    pool.inputTokens = [
      getOrCreateToken(Address.fromString(RPL_ADDRESS), blockNumber).id,
      getOrCreateToken(Address.fromString(ETH_ADDRESS), blockNumber).id,
    ];
    pool.outputToken = getOrCreateToken(
      Address.fromString(protocol.id),
      blockNumber
    ).id;
    pool.rewardTokens = [
      getOrCreateRewardToken(
        Address.fromString(RPL_ADDRESS),
        RewardTokenType.DEPOSIT,
        blockNumber
      ).id,
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
    pool.stakedOutputTokenAmount = BIGINT_ZERO;
    pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    pool.save();

    // Update Protocol
    protocol.totalPoolCount += 1;
    protocol.save();
  }

  return pool;
}
