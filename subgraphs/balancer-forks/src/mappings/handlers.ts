import { BigInt, BigDecimal, Address, log, Bytes, ByteArray, bigInt, bigDecimal } from "@graphprotocol/graph-ts";
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
import { updatePoolMetrics, updateUsageMetrics, updateFinancials } from "../common/metrics";
import { BIGINT_ZERO, UsageType, VAULT_ADDRESS } from "../common/constants";
import { updateWeight } from "../common/weight";
import { WeightedPool } from "../../generated/Vault/WeightedPool";
import { getLiquidityPool, getLiquidityPoolFee, getOrCreateToken } from "../common/getters";
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

function createPool(event: PoolRegistered): string {
  let poolAddress: Address = event.params.poolAddress;

  let poolContract = WeightedPool.bind(poolAddress);
  let poolIdCall = poolContract.try_getPoolId();
  if (poolIdCall.reverted) {
    return "";
  }
  let poolId = poolIdCall.value;

  let nameCall = poolContract.try_name();
  if (nameCall.reverted) {
    return "";
  }
  let name = nameCall.value;

  let symbolCall = poolContract.try_symbol();
  if (symbolCall.reverted) {
    return "";
  }
  let symbol = symbolCall.value;

  let vaultContract = Vault.bind(VAULT_ADDRESS);

  let tokensCall = vaultContract.try_getPoolTokens(poolId);
  let inputTokens: string[] = [];
  if (!tokensCall.reverted) {
    let tokens = tokensCall.value.value0;
    for (let i: i32 = 0; i < tokens.length; i++) {
      inputTokens.push(tokens[i].toHexString());
    }
  }

  let swapFeeCall = poolContract.try_getSwapFeePercentage();
  let swapFee = BIGINT_ZERO;
  if (!swapFeeCall.reverted) {
    swapFee = swapFeeCall.value;
  }

  createLiquidityPool(event, poolAddress.toHexString(), name, symbol, inputTokens, swapFee);
  // Load pool with initial weights
  return poolAddress.toHexString();
}

export function handlePoolRegister(event: PoolRegistered): void {
  let poolAddress = createPool(event);
  updateWeight(poolAddress);
}

export function handleTokensRegister(event: TokensRegistered): void {
  let poolId: string = event.params.poolId.toHexString();
  //get the contract address
  let poolAddress: string = poolId.substring(0, 42);
  let tokens: string[] = new Array<string>();
  let tokensAmount: BigInt[] = new Array<BigInt>();
  for (let i = 0; i < event.params.tokens.length; i++) {
    let token = getOrCreateToken(event.params.tokens[i].toHexString());
    tokens.push(token.id);
    tokensAmount.push(BIGINT_ZERO);
  }
  let pool = getLiquidityPool(poolAddress);
  pool.inputTokens = tokens;
  pool.inputTokenBalances = tokensAmount;
  pool.save();
  updateWeight(pool.id);
}

export function handleSwapFeePercentageChange(event: SwapFeePercentageChanged): void {
  let poolAddress = event.address;
  let pool = getLiquidityPool(poolAddress.toHexString());

  let poolLpFee = getLiquidityPoolFee(pool.fees[0]);
  let poolProtocolFee = getLiquidityPoolFee(pool.fees[1]);

  let poolTradingFee = getLiquidityPoolFee(pool.fees[2]);

  let protocolFeeProportion = scaleDown(event.params.swapFeePercentage, null);
  // Update protocol and trading fees for this pool
  poolTradingFee.feePercentage = protocolFeeProportion;
  poolLpFee.feePercentage = protocolFeeProportion.times(BigDecimal.fromString("0.5"));

  poolProtocolFee.feePercentage = protocolFeeProportion.times(BigDecimal.fromString("0.5"));

  poolTradingFee.save();
  poolLpFee.save();
  poolProtocolFee.save();
}
