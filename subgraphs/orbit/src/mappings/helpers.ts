// import { log } from "@graphprotocol/graph-ts"
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool, LiquidityPoolFee } from "../../generated/schema";
import { Pair as PairTemplate } from "../../generated/templates";
import { Factory as FactoryContract } from "../../generated/templates/Pair/Factory";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  FACTORY_ADDRESS,
  LiquidityPoolFeeType,
  LP_FEE_TO_ON,
  PROTOCOL_FEE_TO_ON,
  TRADING_FEE,
} from "../common/constants";
import { getOrCreateDex, getOrCreateToken } from "../common/getters";

export const factoryContract = FactoryContract.bind(
  Address.fromString(FACTORY_ADDRESS)
);

// Create a liquidity pool from PairCreated contract call
export function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: Address,
  token0Address: Address,
  token1Address: Address
): void {
  const protocol = getOrCreateDex();

  // create the tokens and tokentracker
  const token0 = getOrCreateToken(token0Address);
  const token1 = getOrCreateToken(token1Address);
  const LPtoken = getOrCreateToken(poolAddress);

  const pool = new LiquidityPool(poolAddress.toHexString());

  pool.protocol = protocol.id;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenWeights = [
    BIGDECIMAL_ONE.div(BIGDECIMAL_TWO),
    BIGDECIMAL_ONE.div(BIGDECIMAL_TWO),
  ];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.stakedOutputTokenAmount = BIGINT_ZERO;
  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  pool.fees = createPoolFees(poolAddress.toHexString());
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;

  // create the tracked contract based on the template
  PairTemplate.create(poolAddress);

  pool.save();
  token0.save();
  token1.save();
  LPtoken.save();
}

function createPoolFees(poolAddress: string): string[] {
  const poolLpFee = new LiquidityPoolFee(poolAddress.concat("-lp-fee"));
  const poolProtocolFee = new LiquidityPoolFee(
    poolAddress.concat("-protocol-fee")
  );
  const poolTradingFee = new LiquidityPoolFee(
    poolAddress.concat("-trading-fee")
  );

  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;

  poolLpFee.feePercentage = LP_FEE_TO_ON;
  poolProtocolFee.feePercentage = PROTOCOL_FEE_TO_ON;
  poolTradingFee.feePercentage = TRADING_FEE;

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}
