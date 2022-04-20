import { log } from "@graphprotocol/graph-ts";
import {
  BigInt,
  BigDecimal,
  Address,
  store,
  ethereum,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  Account,
  DailyActiveAccount,
  _HelperStore,
  _TokenTracker,
  _LiquidityPoolAmount,
  Token,
  DexAmmProtocol,
  LiquidityPool,
  LiquidityPoolFee,
  Deposit,
  Withdraw,
  Swap as SwapEvent,
} from "../../generated/schema";
import { Factory as FactoryContract } from "../../generated/templates/Pair/Factory";
import { Pair as PairTemplate } from "../../generated/templates";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  INT_ONE,
  BIGINT_ZERO,
  SECONDS_PER_DAY,
  LiquidityPoolFeeType,
  BIGDECIMAL_HUNDRED,
} from "./constants";
import { getTrackedVolumeUSD } from "./price/price";
import {
  getLiquidityPool,
  getOrCreateDex,
  getOrCreateTokenTracker,
  getLiquidityPoolAmounts,
  getOrCreateTransfer,
  getLiquidityPoolFee,
  getOrCreateToken,
} from "./getters";
import { convertTokenToDecimal } from "./utils/utils";
import { updateVolumeAndFees, updateDepositHelper } from "./updateMetrics";
import { savePoolId } from "./handlers";
import { NetworkConfigs } from "../../config/_networkConfig";

export let factoryContract = FactoryContract.bind(
  Address.fromBytes(NetworkConfigs.FACTORY_ADDRESS),
);

// rebass tokens, dont count in tracked volume

function createPoolFees(poolAddress: Bytes): Bytes[] {
  let poolLpFee = new LiquidityPoolFee(
    poolAddress.concat(Bytes.fromHexString("x-lp-fee")),
  );
  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolLpFee.feePercentage = NetworkConfigs.LP_FEE_TO_ON;

  let poolProtocolFee = new LiquidityPoolFee(
    poolAddress.concat(Bytes.fromHexString("x-protocol-fee")),
  );
  poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  poolProtocolFee.feePercentage = NetworkConfigs.PROTOCOL_FEE_TO_ON;

  let poolTradingFee = new LiquidityPoolFee(
    poolAddress.concat(Bytes.fromHexString("xtrading-fee")),
  );
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
  poolTradingFee.feePercentage = NetworkConfigs.TRADING_FEE;

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}

// Create a liquidity pool from PairCreated contract call
export function createLiquidityPool(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  poolAddress: Bytes,
  token0: Token,
  token1: Token,
  LPtoken: Token,
): void {
  let pool = new LiquidityPool(poolAddress);
  let poolAmounts = new _LiquidityPoolAmount(poolAddress);

  pool.protocol = protocol.id;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.currentTvlUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.fees = createPoolFees(poolAddress);
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;

  poolAmounts.inputTokens = [token0.id, token1.id];
  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  savePoolId(poolAddress);

  pool.save();
  poolAmounts.save();

  // Used to track the number of deposits in a liquidity pool
  let poolDeposits = new _HelperStore(poolAddress);
  poolDeposits.valueInt = INT_ZERO;
  poolDeposits.save();

  // create the tracked contract based on the template
  PairTemplate.create(Address.fromBytes(poolAddress));
}

// Create Account entity for participating account
export function createAndIncrementAccount(accountId: Bytes): i32 {
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();

    return INT_ONE;
  }
  return INT_ZERO;
}

// Create DailyActiveAccount entity for participating account
export function createAndIncrementDailyAccount(
  event: ethereum.Event,
  accountId: Bytes,
): i32 {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = Bytes.fromI32(dayID);

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.concat(accountId);
  let account = DailyActiveAccount.load(dailyActiveAccountId);
  if (!account) {
    account = new DailyActiveAccount(accountId);
    account.save();

    return INT_ONE;
  }
  return INT_ZERO;
}

// Generate the deposit entity and update deposit account for the according pool.
export function createDeposit(
  event: ethereum.Event,
  amount0: BigInt,
  amount1: BigInt,
): void {
  let transfer = getOrCreateTransfer(event);

  let pool = getLiquidityPool(event.address);

  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);
  let tokenTracker0 = getOrCreateTokenTracker(pool.inputTokens[0]);
  let tokenTracker1 = getOrCreateTokenTracker(pool.inputTokens[1]);

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(amount0, token0.decimals);
  let token1Amount = convertTokenToDecimal(amount1, token1.decimals);

  let logIndexI32 = event.logIndex.toI32();
  let deposit = new Deposit(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString()),
  );

  deposit.hash = event.transaction.hash;
  deposit.logIndex = logIndexI32;
  deposit.protocol = NetworkConfigs.FACTORY_ADDRESS;
  deposit.to = pool.id;
  deposit.from = transfer.sender;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  deposit.outputToken = pool.outputToken;
  deposit.inputTokenAmounts = [amount0, amount1];
  deposit.outputTokenAmount = transfer.liquidity;
  deposit.amountUSD = tokenTracker0.derivedUSD
    .times(token0Amount)
    .plus(tokenTracker1.derivedUSD.times(token1Amount));

  updateDepositHelper(event.address);

  store.remove("_Transfer", transfer.id.toHexString());

  deposit.save();
}

// Generate the withdraw entity
export function createWithdraw(
  event: ethereum.Event,
  amount0: BigInt,
  amount1: BigInt,
): void {
  let transfer = getOrCreateTransfer(event);

  let pool = getLiquidityPool(event.address);

  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);
  let tokenTracker0 = getOrCreateTokenTracker(pool.inputTokens[0]);
  let tokenTracker1 = getOrCreateTokenTracker(pool.inputTokens[1]);

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(amount0, token0.decimals);
  let token1Amount = convertTokenToDecimal(amount1, token1.decimals);

  let logIndexI32 = event.logIndex.toI32();
  let withdrawal = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString()),
  );

  withdrawal.hash = event.transaction.hash;
  withdrawal.logIndex = event.logIndex.toI32();
  withdrawal.protocol = NetworkConfigs.FACTORY_ADDRESS;
  withdrawal.to = transfer.sender;
  withdrawal.from = pool.id;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  withdrawal.outputToken = pool.outputToken;
  withdrawal.inputTokenAmounts = [amount0, amount1];
  withdrawal.outputTokenAmount = transfer.liquidity;
  withdrawal.amountUSD = tokenTracker0.derivedUSD
    .times(token0Amount)
    .plus(tokenTracker1.derivedUSD.times(token1Amount));

  store.remove("_Transfer", transfer.id.toHexString());

  withdrawal.save();
}

function percToDec(percentage: BigDecimal): BigDecimal {
  return percentage.div(BIGDECIMAL_HUNDRED);
}

// Handle swaps data and update entities volumes and fees
export function createSwapHandleVolumeAndFees(
  event: ethereum.Event,
  to: Bytes,
  sender: Bytes,
  amount0In: BigInt,
  amount1In: BigInt,
  amount0Out: BigInt,
  amount1Out: BigInt,
): void {
  let protocol = getOrCreateDex();
  let pool = getLiquidityPool(event.address);
  let poolAmounts = getLiquidityPoolAmounts(event.address);

  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);
  let tokenTracker0 = getOrCreateTokenTracker(pool.inputTokens[0]);
  let tokenTracker1 = getOrCreateTokenTracker(pool.inputTokens[1]);

  // totals for volume updates
  let amount0Total = amount0Out.plus(amount0In);
  let amount1Total = amount1Out.plus(amount1In);

  let amount0TotalConverted = convertTokenToDecimal(amount0Total, token0.decimals);
  let amount1TotalConverted = convertTokenToDecimal(amount1Total, token1.decimals);

  let token0USD = tokenTracker0.derivedUSD.times(amount0TotalConverted);
  let token1USD = tokenTracker1.derivedUSD.times(amount1TotalConverted);

  // /// get total amounts of derived USD for tracking
  // let derivedAmountUSD = token1USD.plus(token0USD).div(BIGDECIMAL_TWO)

  // only accounts for volume through white listed tokens
  let trackedAmountUSD = getTrackedVolumeUSD(
    amount0TotalConverted,
    tokenTracker0 as _TokenTracker,
    amount1TotalConverted,
    tokenTracker1 as _TokenTracker,
  );

  let tradingFee = getLiquidityPoolFee(pool.fees[0]);
  let protocolFee = getLiquidityPoolFee(pool.fees[1]);

  let tradingFeeAmountUSD: BigDecimal;
  let protocolFeeAmountUSD: BigDecimal;

  if (amount0In != BIGINT_ZERO) {
    let tradingFeeAmount = amount0TotalConverted.times(
      percToDec(tradingFee.feePercentage),
    );
    let protocolFeeAmount = amount0TotalConverted.times(
      percToDec(protocolFee.feePercentage),
    );
    tradingFeeAmountUSD = tradingFeeAmount.times(tokenTracker0.derivedUSD);
    protocolFeeAmountUSD = protocolFeeAmount.times(tokenTracker0.derivedUSD);
  } else {
    let tradingFeeAmount = amount1TotalConverted.times(
      percToDec(tradingFee.feePercentage),
    );
    let protocolFeeAmount = amount1TotalConverted.times(
      percToDec(protocolFee.feePercentage),
    );
    tradingFeeAmountUSD = tradingFeeAmount.times(tokenTracker1.derivedUSD);
    protocolFeeAmountUSD = protocolFeeAmount.times(tokenTracker1.derivedUSD);
  }

  let logIndexI32 = event.logIndex.toI32();
  let swap = new SwapEvent(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString()),
  );

  // update swap event
  swap.hash = event.transaction.hash;
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

  updateVolumeAndFees(event, trackedAmountUSD, tradingFeeAmountUSD, protocolFeeAmountUSD);
}
