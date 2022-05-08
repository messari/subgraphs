import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../../generated/schema";
import {
  getOrCreateProtocol,
  getOrCreateStakersFeeShare,
  getOrCreateSupplyFeeShare,
  getOrCreateTradingFees,
} from "../../utils/common";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, INT_ZERO, ZERO_ADDRESS } from "../../utils/constant";
import { getOrCreateToken } from "../../utils/token";

export function getOrCreatePool(
  event: ethereum.Event,
  coins: Address[],
  lp_token: Address,
  pool: Address,
): LiquidityPool {
  let timestamp = event.block.timestamp;
  let blockNumber = event.block.number;
  let id = pool.toHexString();
  // Check if pool already exist
  let liquidityPool = LiquidityPool.load(id);
  if (liquidityPool == null && pool !== Address.fromString(ZERO_ADDRESS)) {
    liquidityPool = new LiquidityPool(id);
    // get protocol
    let protocol = getOrCreateProtocol();
    liquidityPool.protocol = protocol.id;
    // Input Tokens
    let inputTokens: string[] = [];
    let inputTokenBalances: BigInt[] = [];
    for (let i = INT_ZERO; i < coins.length; i++) {
      inputTokens.push(getOrCreateToken(coins[i]).id);
      inputTokenBalances.push(BIGINT_ZERO);
    }
    liquidityPool.inputTokens = inputTokens.map<string>(t => t);
    liquidityPool.inputTokenBalances = inputTokenBalances.map<BigInt>(tb => tb);
    let token = getOrCreateToken(lp_token);
    liquidityPool.outputToken = token.id;
    log.info("Output Token: {}", [liquidityPool.outputToken.toString()]);
    liquidityPool.rewardTokens = [];
    liquidityPool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    liquidityPool.totalVolumeUSD = BIGDECIMAL_ZERO;
    liquidityPool.outputTokenSupply = BIGINT_ZERO;
    liquidityPool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    liquidityPool.rewardTokenEmissionsAmount = [];
    liquidityPool.rewardTokenEmissionsUSD = [];
    liquidityPool.createdTimestamp = timestamp;
    liquidityPool.createdBlockNumber = blockNumber;
    liquidityPool.name = token.name;
    liquidityPool.symbol = token.symbol;
    let tradingFee = getOrCreateTradingFees(pool).id;
    let stakersFeeShare = getOrCreateStakersFeeShare(pool).id;
    let supplyFeeShare = getOrCreateSupplyFeeShare(pool).id;
    liquidityPool.fees = [tradingFee, stakersFeeShare, supplyFeeShare];
    liquidityPool.save();

    return liquidityPool as LiquidityPool;
  }
  return liquidityPool as LiquidityPool;
}
