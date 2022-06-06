import { BigInt, BigDecimal, Address, log, Bytes, ByteArray, bigInt } from "@graphprotocol/graph-ts";
import {
  Swap as SwapEvent,
  PoolBalanceChanged,
  PoolBalanceManaged,
  InternalBalanceChanged,
  Vault,
  PoolRegistered,
  TokensRegistered,
} from "../../generated/Vault/Vault";
import {
  createWithdrawMulti,
  createDepositMulti,
  createSwapHandleVolume,
  createLiquidityPool,
} from "../common/creators";
import { updatePoolMetrics, updateUsageMetrics, updateFinancials } from "../common/updateMetrics";
import { BIGDECIMAL_ONE, BIGINT_ZERO, UsageType, VAULT_ADDRESS } from "../common/constants";
import { PoolCreated } from "../../generated/WeightedPoolFactory/WeightedPoolFactory";
import { updateWeight } from "../common/weight";
import { WeightedPool } from "../../generated/Vault/WeightedPool";
import { WeightedPool as WeightedPoolTemplate } from "../../generated/templates";
import { getLiquidityPoolFee, getOrCreateToken } from "../common/getters";
import { LiquidityPool } from "../../generated/schema";
import { SwapFeePercentageChanged } from "../../generated/Vault/LinearPool";
import { scaleDown } from "../common/tokens";

/************************************
 ****** DEPOSITS & WITHDRAWALS ******
 ************************************/

export function handlePoolBalanceChanged(event: PoolBalanceChanged): void {
  let amounts: BigInt[] = event.params.deltas;
  if (amounts.length === 0) {
    return;
  }
  let total: BigInt = amounts.reduce<BigInt>((sum, amount) => sum.plus(amount), new BigInt(0));
  if (total.gt(BIGINT_ZERO)) {
    handlePoolJoined(event);
  } else {
    handlePoolExited(event);
  }
}

function handlePoolJoined(event: PoolBalanceChanged): void {
  let poolId: string = event.params.poolId.toHexString();
  let amounts: BigInt[] = event.params.deltas;

  //get the contract address
  let poolAddress: string = poolId.substring(0, 42);
  createDepositMulti(event, poolAddress, amounts);
  updateUsageMetrics(event, event.params.liquidityProvider, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event, poolAddress);
}

function handlePoolExited(event: PoolBalanceChanged): void {
  let poolId: string = event.params.poolId.toHexString();
  let amounts: BigInt[] = event.params.deltas;

  //get the contract address
  let poolAddress: string = poolId.substring(0, 42);
  createWithdrawMulti(event, poolAddress, amounts);
  updateUsageMetrics(event, event.params.liquidityProvider, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event, poolAddress);
}

/************************************
 ************** SWAPS ***************
 ************************************/
export function handleSwap(event: SwapEvent): void {
  let poolId: string = event.params.poolId.toHexString();
  let tokenIn: string = event.params.tokenIn.toHexString();
  let tokenOut: string = event.params.tokenOut.toHexString();

  //get the contract address
  let poolAddress: string = poolId.substring(0, 42);
  createSwapHandleVolume(event, poolAddress, tokenIn, event.params.amountIn, tokenOut, event.params.amountOut);
  updateFinancials(event);
  updatePoolMetrics(event, poolAddress);
  updateUsageMetrics(event, event.transaction.from, UsageType.SWAP);
}
export function handleBalanceChange(event: PoolBalanceChanged): void {
  log.warning("handleBalanceChange = {}  transaction = {} poolId = {} ", [
    event.params.deltas.toString(),
    event.transaction.hash.toHexString(),
    event.params.poolId.toHexString(),
  ]);
  let amounts: BigInt[] = event.params.deltas;
  if (amounts.length === 0) {
    return;
  }
  let total: BigInt = amounts.reduce<BigInt>((sum, amount) => sum.plus(amount), new BigInt(0));
  if (total.gt(BIGINT_ZERO)) {
    handlePoolJoined(event);
  } else {
    handlePoolExited(event);
  }
}
