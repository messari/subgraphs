import { BigInt, BigDecimal, Address, store, ethereum } from "@graphprotocol/graph-ts";
import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  Deposit,
  _Transfer,
  Withdraw,
  Swap as SwapEntity,
} from "../../generated/schema";
import { Transfer } from "../../generated/SushiV2Factory/ERC20";
import { SushiV2Pair as PairTemplate } from "../../generated/templates";
import { Burn, Mint, Swap } from "../../generated/templates/SushiV2Pair/Pair";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, SUSHISWAP_V2_FACTORY_ADDRESS, TransferType } from "../common/constants";
import { getOrCreateToken, getLiquidityPool, getTransfer } from "../common/getters";

// Create a liquidity pool entity from PairCreated contract call.
export function createLiquidityPool(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  poolAddress: Address,
  token0: Token,
  token1: Token,
  LPtoken: Token,
): void {
  let pool = new LiquidityPool(poolAddress.toHexString());

  pool.protocol = protocol.id;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.totalVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.name = token0.symbol + "-" + token1.symbol;
  pool.symbol = token0.symbol + "-" + token1.symbol;

  pool.save();

  // Create the tracked contract based on the template
  PairTemplate.create(poolAddress);
}

// Create a transfer entity from a transfer event.
export function createTransfer(event: Transfer, isMint: bool): void {
  let transfer = new _Transfer(event.transaction.hash.toHexString());

  transfer.blockNumber = event.block.number;
  transfer.from = event.params.from.toHexString();
  transfer.to = event.params.to.toHexString();
  transfer.liquidity = event.params.value;
  if (isMint) {
    transfer.type = TransferType.MINT;
  } else {
    transfer.type = TransferType.BURN;
  }

  transfer.save();
}

// Create a deposit entity from a mint event and its associated transfer entity.
export function createDeposit(event: Mint): Deposit {
  let txnHash = event.transaction.hash.toHexString();
  let pool = getLiquidityPool(event.address.toHexString());
  let transfer = getTransfer(txnHash);
  let deposit = new Deposit(txnHash.concat("-").concat(event.logIndex.toString()));

  deposit.hash = txnHash;
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = SUSHISWAP_V2_FACTORY_ADDRESS;
  deposit.to = pool.id;
  deposit.from = event.params.sender.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  deposit.outputToken = pool.outputToken;
  deposit.inputTokenAmounts = [event.params.amount0, event.params.amount1];
  deposit.outputTokenAmount = transfer.liquidity!;
  deposit.amountUSD = BIGDECIMAL_ZERO; // TODO: calculate this
  deposit.pool = pool.id;

  store.remove("_Transfer", transfer.id);
  deposit.save();
  return deposit;
}

// Create a withdraw entity from a burn event and its associated transfer entity.
export function createWithdraw(event: Burn): Withdraw {
  let txnHash = event.transaction.hash.toHexString();
  let pool = getLiquidityPool(event.address.toHexString());
  let withdrawal = new Withdraw(txnHash.concat("-").concat(event.logIndex.toString()));
  let transfer = getTransfer(txnHash);
  withdrawal.hash = event.transaction.hash.toHexString();

  withdrawal.hash = txnHash;
  withdrawal.logIndex = event.logIndex.toI32();
  withdrawal.protocol = SUSHISWAP_V2_FACTORY_ADDRESS;
  withdrawal.to = pool.id;
  withdrawal.from = event.params.sender.toHexString();
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  withdrawal.outputToken = pool.outputToken;
  withdrawal.inputTokenAmounts = [event.params.amount0, event.params.amount1];
  withdrawal.outputTokenAmount = transfer.liquidity!;
  withdrawal.amountUSD = BIGDECIMAL_ZERO; // TODO: calculate this
  withdrawal.pool = pool.id;

  store.remove("_Transfer", transfer.id);
  withdrawal.save();
  return withdrawal;
}

// Create a swap entity from a swap event.
export function createSwap(event: Swap): SwapEntity {
  let txnHash = event.transaction.hash.toHexString();
  let pool = getLiquidityPool(event.address.toHexString());
  let swap = new SwapEntity(txnHash.concat("-").concat(event.logIndex.toString()));

  swap.hash = txnHash;
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = SUSHISWAP_V2_FACTORY_ADDRESS;
  swap.to = pool.id;
  swap.from = event.params.sender.toHexString();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  if (event.params.amount0In > BIGINT_ZERO) {
    swap.tokenIn = pool.inputTokens[0];
    swap.amountIn = event.params.amount0In;
    swap.amountInUSD = BIGDECIMAL_ZERO; // TODO: calculate this
    swap.tokenOut = pool.inputTokens[1];
    swap.amountOut = event.params.amount1Out;
    swap.amountInUSD = BIGDECIMAL_ZERO; // TODO: calculate this
  } else {
    swap.tokenIn = pool.inputTokens[1];
    swap.amountIn = event.params.amount1In;
    swap.amountInUSD = BIGDECIMAL_ZERO; // TODO: calculate this
    swap.tokenOut = pool.inputTokens[0];
    swap.amountOut = event.params.amount0Out;
    swap.amountInUSD = BIGDECIMAL_ZERO; // TODO: calculate this
  }
  swap.pool = pool.id;

  swap.save();
  return swap;
}
