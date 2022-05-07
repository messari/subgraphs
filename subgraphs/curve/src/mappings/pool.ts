import { Address, ethereum, BigInt, log, BigDecimal, Bytes } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../generated/schema";
import {
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenExchange,
  TokenExchangeUnderlying,
  NewFee,
} from "../../generated/templates/Pool/StableSwap";
import { LiquidityPoolFeeType, ZERO_ADDRESS } from "../common/constants";
import { getPoolFee } from "../common/getters";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { getOrCreatePool } from "./registry";
import { CurveMetaPool } from "../../generated/MainRegistry/CurveMetaPool";

export function handleExchange(
  buyer: Address,
  sold_id: BigInt,
  bought_id: BigInt,
  tokens_sold: BigInt,
  tokens_bought: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt,
  address: Address,
  txhash: Bytes,
  exchangeUnderlying: boolean
): void {
  const pool = LiquidityPool.load(address.toHexString())
  if (!pool) {
    return
  }
  const soldId = sold_id.toI32()
  const boughtId = bought_id.toI32()
  let tokenSold: Bytes, tokenBought: Bytes
  let tokenSoldDecimals: BigInt, tokenBoughtDecimals: BigInt

  if (exchangeUnderlying) {
    let exchangePool = CurveMetaPool.bind(Address.fromString(pool.id)); // check if pool is lending pool
    let basePoolResult = exchangePool.try_base_pool();
    if (!basePoolResult.reverted) {
      // pool is a lending pool
      const underlyingSoldIndex = soldId - 1; // 
      const basePoolAddress = basePoolResult.value;
      const basePool = LiquidityPool.load(basePoolAddress.toHexString())
  }
}



export function handleAddLiquidity(event: AddLiquidity): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  if (LiquidityPool.load(event.params.provider.toHexString())){
    // provider is a metapool, not a user
  }

}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  //let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);

}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {
  //let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);

}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  //let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);

}

export function handleTokenExchange(event: TokenExchange): void {
  //let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);

}

export function handleNewFee(event: NewFee): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  let tradingFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_TRADING_FEE);
  let protocolFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_PROTOCOL_FEE);
  let lpFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_LP_FEE);
  let totalFee = bigIntToBigDecimal(event.params.fee,8); // divide by 10^8 to get fee rate in % terms
  let adminFee = bigIntToBigDecimal(event.params.admin_fee,8);
  tradingFee.feePercentage = totalFee;
  protocolFee.feePercentage = adminFee.times(totalFee);
  lpFee.feePercentage = totalFee.minus((adminFee.times(totalFee)));

  tradingFee.save();
  protocolFee.save();
  lpFee.save();
}
