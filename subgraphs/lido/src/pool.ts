import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Pool } from "../generated/schema";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreateToken, getOrCreateRewardToken } from "./token";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, ETH_ADDRESS, PROTOCOL_ID } from "./utils/constants";

export function getOrCreatePool(
    address: Address,
    blockNumber: BigInt,
    blockTimestamp: BigInt
): Pool {
    let pool = Pool.load(PROTOCOL_ID);

    if (!pool) {
        pool = new Pool(PROTOCOL_ID);

        // Metadata
        // TODO: make name and symbol dynamic
        pool.name = "Liquid staked Ether 2.0";   
        pool.symbol = "stETH";
        pool.protocol = getOrCreateProtocol().id;
        pool.inputTokens = [getOrCreateToken(Address.fromString(ETH_ADDRESS)).id]; 
        pool.outputToken = getOrCreateToken(Address.fromString(PROTOCOL_ID)).id;
        pool.rewardTokens = [];

        // Quantitative Revenue Data
        pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
        pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
        pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
        pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

        // Quantitative Token Data
        pool.inputTokenBalances = [BIGINT_ZERO];
        pool.outputTokenSupply = BIGINT_ZERO; 
        pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
        pool.stakedOutputTokenAmount = BIGINT_ZERO;
        pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
        pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

        pool.createdTimestamp = blockNumber;
        pool.createdBlockNumber = blockTimestamp;

        pool.save();
    }

    return pool;
}
