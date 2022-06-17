// import { log } from "@graphprotocol/graph-ts";
import { BigInt, Address, store, ethereum } from "@graphprotocol/graph-ts";
import { Account, _HelperStore, _TokenWhitelist, _LiquidityPoolAmount, LiquidityPool, LiquidityPoolFee, Deposit, Withdraw, Swap as SwapEvent } from "../../generated/schema";
import { Pair as PairTemplate } from "../../generated/templates";
import { BIGDECIMAL_ZERO, INT_ZERO, INT_ONE, BIGINT_ZERO, LiquidityPoolFeeType, FeeSwitch, BIGDECIMAL_TWO, BIGDECIMAL_ONE } from "./constants";
import { getLiquidityPool, getOrCreateDex, getOrCreateTransfer, getOrCreateToken, getOrCreateLPToken, getLiquidityPoolAmounts } from "./getters";
import { convertTokenToDecimal } from "./utils/utils";
import { updateDepositHelper, updateTokenWhitelists, updateVolumeAndFees } from "./updateMetrics";
import { NetworkConfigs } from "../../configurations/configure";
import { getTrackedVolumeUSD } from "../price/price";

function createPoolFees(poolAddress: string): string[] {
  let poolLpFee = new LiquidityPoolFee(poolAddress.concat("-lp-fee"));
  let poolProtocolFee = new LiquidityPoolFee(poolAddress.concat("-protocol-fee"));
  let poolTradingFee = new LiquidityPoolFee(poolAddress.concat("-trading-fee"));

  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;

  if (NetworkConfigs.getFeeOnOff() == FeeSwitch.ON) {
    poolLpFee.feePercentage = NetworkConfigs.getLPFeeToOn();
    poolProtocolFee.feePercentage = NetworkConfigs.getProtocolFeeToOn();
  } else {
    poolLpFee.feePercentage = NetworkConfigs.getLPFeeToOff();
    poolProtocolFee.feePercentage = NetworkConfigs.getProtocolFeeToOff();
  }

  poolTradingFee.feePercentage = NetworkConfigs.getTradeFee();

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}

// Create a liquidity pool from PairCreated contract call
export function createLiquidityPool(event: ethereum.Event, poolAddress: string, token0Address: string, token1Address: string): void {
  let protocol = getOrCreateDex();

  // create the tokens and tokentracker
  let token0 = getOrCreateToken(token0Address);
  let token1 = getOrCreateToken(token1Address);
  let LPtoken = getOrCreateLPToken(poolAddress, token0, token1);

  updateTokenWhitelists(token0, token1, poolAddress);

  let pool = new LiquidityPool(poolAddress);
  let poolAmounts = new _LiquidityPoolAmount(poolAddress);

  pool.protocol = protocol.id;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenWeights = [BIGDECIMAL_ONE.div(BIGDECIMAL_TWO), BIGDECIMAL_ONE.div(BIGDECIMAL_TWO)];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.rewardTokens = [NetworkConfigs.getRewardToken()];
  pool.stakedOutputTokenAmount = BIGINT_ZERO;
  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  pool.fees = createPoolFees(poolAddress);
  pool.isSingleSided = false
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;

  poolAmounts.inputTokens = [token0.id, token1.id];
  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // Used to track the number of deposits in a liquidity pool
  let poolDeposits = new _HelperStore(poolAddress);
  poolDeposits.valueInt = INT_ZERO;

  // create the tracked contract based on the template
  PairTemplate.create(Address.fromString(poolAddress));

  pool.save();
  token0.save();
  token1.save();
  LPtoken.save();
  poolAmounts.save();
  poolDeposits.save();
}

// Create Account entity for participating account
export function createAndIncrementAccount(accountId: string): i32 {
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();

    return INT_ONE;
  }
  return INT_ZERO;
}

// Generate the deposit entity and update deposit account for the according pool.
export function createDeposit(event: ethereum.Event, amount0: BigInt, amount1: BigInt): void {
  let transfer = getOrCreateTransfer(event);

  let pool = getLiquidityPool(event.address.toHexString());

  let token0 = getOrCreateToken(pool.inputTokens[INT_ZERO]);
  let token1 = getOrCreateToken(pool.inputTokens[INT_ONE]);

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(amount0, token0.decimals);
  let token1Amount = convertTokenToDecimal(amount1, token1.decimals);

  let logIndexI32 = event.logIndex.toI32();
  let transactionHash = event.transaction.hash.toHexString();
  let deposit = new Deposit(transactionHash.concat("-").concat(event.logIndex.toString()));

  deposit.hash = transactionHash;
  deposit.logIndex = logIndexI32;
  deposit.protocol = NetworkConfigs.getFactoryAddress();
  deposit.to = pool.id;
  deposit.from = transfer.sender!;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [pool.inputTokens[INT_ZERO], pool.inputTokens[INT_ONE]];
  deposit.outputToken = pool.outputToken;
  deposit.inputTokenAmounts = [amount0, amount1];
  deposit.outputTokenAmount = transfer.liquidity;
  deposit.amountUSD = token0.lastPriceUSD!.times(token0Amount).plus(token1.lastPriceUSD!.times(token1Amount));
  deposit.pool = pool.id;

  updateDepositHelper(event.address);

  deposit.save();
}

// Generate the withdraw entity
export function createWithdraw(event: ethereum.Event, amount0: BigInt, amount1: BigInt): void {
  let transfer = getOrCreateTransfer(event);

  let pool = getLiquidityPool(event.address.toHexString());

  let token0 = getOrCreateToken(pool.inputTokens[INT_ZERO]);
  let token1 = getOrCreateToken(pool.inputTokens[INT_ONE]);

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(amount0, token0.decimals);
  let token1Amount = convertTokenToDecimal(amount1, token1.decimals);

  let logIndexI32 = event.logIndex.toI32();
  let transactionHash = event.transaction.hash.toHexString();
  let withdrawal = new Withdraw(transactionHash.concat("-").concat(event.logIndex.toString()));

  withdrawal.hash = transactionHash;
  withdrawal.logIndex = logIndexI32;
  withdrawal.protocol = NetworkConfigs.getFactoryAddress();
  withdrawal.to = transfer.sender!;
  withdrawal.from = pool.id;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = [pool.inputTokens[INT_ZERO], pool.inputTokens[INT_ONE]];
  withdrawal.outputToken = pool.outputToken;
  withdrawal.inputTokenAmounts = [amount0, amount1];
  withdrawal.outputTokenAmount = transfer.liquidity;
  withdrawal.amountUSD = token0.lastPriceUSD!.times(token0Amount).plus(token1.lastPriceUSD!.times(token1Amount));
  withdrawal.pool = pool.id;

  store.remove("_Transfer", transfer.id);

  withdrawal.save();
}

// Handle swaps data and update entities volumes and fees
export function createSwapHandleVolumeAndFees(
  event: ethereum.Event,
  to: string,
  sender: string,
  amount0In: BigInt,
  amount1In: BigInt,
  amount0Out: BigInt,
  amount1Out: BigInt
): void {
  let protocol = getOrCreateDex();
  let pool = getLiquidityPool(event.address.toHexString());
  let poolAmounts = getLiquidityPoolAmounts(event.address.toHexString());

  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);

  // totals for volume updates
  let amount0Total = amount0Out.plus(amount0In);
  let amount1Total = amount1Out.plus(amount1In);

  let amount0TotalConverted = convertTokenToDecimal(amount0Total, token0.decimals);
  let amount1TotalConverted = convertTokenToDecimal(amount1Total, token1.decimals);

  let token0USD = token0.lastPriceUSD!.times(amount0TotalConverted);
  let token1USD = token1.lastPriceUSD!.times(amount1TotalConverted);

  // /// get total amounts of derived USD for tracking
  // let derivedAmountUSD = token1USD.plus(token0USD).div(BIGDECIMAL_TWO)

  let logIndexI32 = event.logIndex.toI32();
  let transactionHash = event.transaction.hash.toHexString();
  let swap = new SwapEvent(transactionHash.concat("-").concat(event.logIndex.toString()));

  // update swap event
  swap.hash = transactionHash;
  swap.logIndex = logIndexI32;
  swap.protocol = protocol.id;
  swap.to = to;
  swap.from = sender;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = amount0In != BIGINT_ZERO ? token0.id : token1.id;
  swap.amountIn = amount0In != BIGINT_ZERO ? amount0Total : amount1Total;
  swap.amountInUSD = amount0In != BIGINT_ZERO ? token0USD : token1USD;
  swap.tokenOut = amount0Out != BIGINT_ZERO ? token0.id : token1.id;
  swap.amountOut = amount0Out != BIGINT_ZERO ? amount0Total : amount1Total;
  swap.amountOutUSD = amount0Out != BIGINT_ZERO ? token0USD : token1USD;
  swap.pool = pool.id;

  swap.save();

  // only accounts for volume through white listed tokens
  let trackedAmountUSD = getTrackedVolumeUSD(poolAmounts, amount0TotalConverted, token0, amount1TotalConverted, token1);
  updateVolumeAndFees(event, protocol, pool, trackedAmountUSD, amount0Total, amount1Total);
}
