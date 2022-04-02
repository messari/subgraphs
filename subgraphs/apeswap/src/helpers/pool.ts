import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Bundle, LiquidityPool, Token } from "../../generated/schema";
import { getOrCreateProtocol } from "../utils/common";
import { BIGINT_ZERO, DEFAULT_DECIMALS, toDecimal } from "../utils/constant";
import { findBnbPerToken } from "../utils/pricing";
import { getOrCreateToken } from "../utils/token";

export function getOrCreatePool(
  event: ethereum.Event,
  poolAddress: Address,
  token0: Token,
  token1: Token
): LiquidityPool {
  let id = poolAddress.toHexString();
  let protocol = getOrCreateProtocol();
  // Check if pool already exist
  let pool = LiquidityPool.load(id);
  if (pool == null) {
    pool = new LiquidityPool(id);
    pool.protocol = protocol.id;

    // Internal fields
    pool._token0 = token0.id;
    pool._reserve0 = BIGINT_ZERO;
    pool._token1 = token1.id;
    pool._reserve1 = BIGINT_ZERO;
    pool._reserveBNB = BIGINT_ZERO;
    pool._token0Price = BIGINT_ZERO;
    pool._token1Price = BIGINT_ZERO;
    pool._volumeToken0 = BIGINT_ZERO;
    pool._volumeToken1 = BIGINT_ZERO;
    pool._trackedReserveBNB = BIGINT_ZERO;
    pool._untrackedVolumeUSD = BIGINT_ZERO;
    pool._txCount = BIGINT_ZERO;
    // Input tokens
    let inputTokens: Token[] = [];
    inputTokens.push(token0);
    inputTokens.push(token1);
    pool.inputTokens = inputTokens.map<string>((token) => token.id);

    // Output Tokens
    let outputToken = getOrCreateToken(poolAddress);
    pool.outputToken = outputToken.id;
    pool.rewardTokens = [];
    pool.totalValueLockedUSD = toDecimal(BIGINT_ZERO, DEFAULT_DECIMALS);
    pool.totalVolumeUSD = toDecimal(BIGINT_ZERO, DEFAULT_DECIMALS);
    let inputTokenbalances: BigInt[] = [];
    for (let i = 0; i < inputTokens.length; i++) {
      inputTokenbalances.push(BIGINT_ZERO);
    }
    pool.inputTokenBalances = inputTokenbalances.map<BigInt>(
      (tokenBalance) => tokenBalance
    );
    pool.outputTokenSupply = BIGINT_ZERO;
    // OutputToken Price
    let bundle = Bundle.load("1")!;
    let outputTokenPriceBNB = findBnbPerToken(outputToken);
    pool.outputTokenPriceUSD = toDecimal(
      outputTokenPriceBNB.times(bundle.bnbPrice),
      DEFAULT_DECIMALS
    );
    pool.rewardTokenEmissionsAmount = [];
    pool.rewardTokenEmissionsUSD = [];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
    pool.name = outputToken.name;
    pool.symbol = outputToken.symbol;
    pool.fees = [];

    pool.save();
    return pool as LiquidityPool;
  }

  return pool as LiquidityPool;
}

export function updatePool(pool: LiquidityPool): void {
    let inputTokenBalances: BigInt[] = []
    inputTokenBalances.push(pool._reserve0) 
    inputTokenBalances.push(pool._reserve1) 
    pool.inputTokenBalances = inputTokenBalances.map<BigInt>(tb => tb)
    pool.save()
}