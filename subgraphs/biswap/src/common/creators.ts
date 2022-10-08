import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Deposit,
  LiquidityPool,
  LiquidityPoolFee,
  RewardToken,
  Swap,
  Withdraw,
  _HelperStore,
  _LiquidityPoolAmount,
} from "../../generated/schema";
import {
  BIGDECIMAL_FIFTY,
  BIGDECIMAL_NEG_ONE,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ZERO,
  BIGINT_NEG_ONE,
  BIGINT_ZERO,
  BISWAP_LP_FEE,
  BISWAP_PROTOCOL_FEE,
  BISWAP_TRADING_FEE,
  INT_ONE,
  INT_ZERO,
  LiquidityPoolFeeType,
  RewardTokenType,
} from "./constants";
import {
  getLiquidityPool,
  getLiquidityPoolAmounts,
  getOrCreateDex,
  getOrCreateToken,
} from "./getters";
import { updateVolumeAndFees } from "./updateMetrics";
import { convertFeeToPercent, convertTokenToDecimal } from "./utils/utils";

export function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: string,
  token0Address: string,
  token1Address: string
): void {
  log.info(" -------> inside createLP", []);

  let protocol = getOrCreateDex();

  // create the tokens and tokentracker
  let token0 = getOrCreateToken(event, token0Address);
  let token1 = getOrCreateToken(event, token1Address);
  let poolToken = getOrCreateToken(event, poolAddress);
  let rewardToken = new RewardToken(
    RewardTokenType.DEPOSIT.concat("-").concat(poolToken.id)
  );
  rewardToken.token = poolToken.id;
  rewardToken.type = RewardTokenType.DEPOSIT;
  rewardToken.save();

  // updateTokenWhitelists(token0, token1, poolAddress);

  let pool = new LiquidityPool(poolAddress);
  let poolAmounts = new _LiquidityPoolAmount(poolAddress);

  pool.protocol = protocol.id;
  // TODO: should we use pool token name and symbol?
  pool.name = protocol.name
    .concat(" - ")
    .concat(token0.name)
    .concat(" - ")
    .concat(token1.name);
  pool.symbol = token0.name + " / " + token1.name;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = poolToken.id;
  pool.rewardTokens = [rewardToken.id];

  pool.fees = createPoolFees(poolAddress);
  pool.isSingleSided = false;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenWeights = [BIGDECIMAL_FIFTY, BIGDECIMAL_FIFTY];

  poolAmounts.inputTokens = [token0.id, token1.id];
  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  poolAmounts.tokenPrices = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // Used to track the number of deposits in a liquidity pool
  let poolDeposits = new _HelperStore(poolAddress);
  poolDeposits.valueInt = INT_ZERO;

  protocol.totalPoolCount = protocol.totalPoolCount + INT_ONE;
  protocol.save();

  // TODO: not required
  // Create and track the newly created pool contract based on the template specified in the subgraph.yaml file.
  //   PoolTemplate.create(Address.fromString(poolAddress));

  pool.save();
  token0.save();
  token1.save();
  poolAmounts.save();
  poolDeposits.save();
}

// create pool fee entities based on the fee structure received from pairCreated event.
export function createPoolFees(poolAddressString: string): string[] {
  // LP Fee
  let poolLpFee = new LiquidityPoolFee("lp-fee-" + poolAddressString);
  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolLpFee.feePercentage = BISWAP_LP_FEE;

  // Protocol Fee
  let poolProtocolFee = new LiquidityPoolFee(
    "protocol-fee-" + poolAddressString
  );
  poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  poolProtocolFee.feePercentage = BISWAP_PROTOCOL_FEE;

  // Trading Fee
  let poolTradingFee = new LiquidityPoolFee("trading-fee-" + poolAddressString);
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
  poolTradingFee.feePercentage = BISWAP_TRADING_FEE;

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}

// Update store that tracks the deposit count per pool
function incrementDepositHelper(poolAddress: string): void {
  let poolDeposits = _HelperStore.load(poolAddress)!;
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE;
  poolDeposits.save();
}

// Create a deposit from a Mint event from a particular pool contract.
// Also, updated token balances and total value locked.
export function createDeposit(
  event: ethereum.Event,
  owner: Address,
  amount0: BigInt,
  amount1: BigInt
): void {
  log.info(" -------> inside createDeposit", []);
  let poolAddress = event.address.toHexString();

  let pool = getLiquidityPool(poolAddress);
  let poolAmounts = getLiquidityPoolAmounts(poolAddress);

  let protocol = getOrCreateDex();

  let token0 = getOrCreateToken(event, pool.inputTokens[0]);
  let token1 = getOrCreateToken(event, pool.inputTokens[1]);

  // Convert tokens according to decimals
  let amount0Converted = convertTokenToDecimal(amount0, token0.decimals);
  let amount1Converted = convertTokenToDecimal(amount1, token1.decimals);

  // Get the value in USD of the deposit
  let amountUSD = amount0Converted
    .times(token0.lastPriceUSD!)
    .plus(amount1Converted.times(token1.lastPriceUSD!));

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    pool.totalValueLockedUSD
  );

  // Update pool balances adjusted for decimals and not adjusted
  let poolInputTokenBalances: BigInt[] = [
    pool.inputTokenBalances[0].plus(amount0),
    pool.inputTokenBalances[1].plus(amount1),
  ];
  pool.inputTokenBalances = poolInputTokenBalances;

  let poolAmountsInputTokenBalances: BigDecimal[] = [
    poolAmounts.inputTokenBalances[0].plus(amount0Converted),
    poolAmounts.inputTokenBalances[1].plus(amount1Converted),
  ];
  poolAmounts.inputTokenBalances = poolAmountsInputTokenBalances;

  //  TODO: pool output tokens missing

  // Get the total value locked in USD
  pool.totalValueLockedUSD = poolAmounts.inputTokenBalances[0]
    .times(token0.lastPriceUSD!)
    .plus(poolAmounts.inputTokenBalances[1].times(token1.lastPriceUSD!));

  // Add pool value back to protocol total value locked
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    pool.totalValueLockedUSD
  );

  let deposit = new Deposit(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.to = pool.id;
  deposit.from = owner.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  deposit.inputTokenAmounts = [amount0, amount1];
  deposit.pool = pool.id;
  deposit.amountUSD = amountUSD;

  // Increment the amount of deposits in the pool. Used by getTrackedVolumeUSD in price.ts.
  incrementDepositHelper(poolAddress);

  deposit.save();
  pool.save();
  poolAmounts.save();
  protocol.save();
}

// Create a deposit from a Burn event from a particular pool contract.
// Also, updated token balances and total value locked.
export function createWithdraw(
  event: ethereum.Event,
  owner: Address,
  amount0: BigInt,
  amount1: BigInt
): void {
  log.info(" -------> inside createWithdraw", []);

  let poolAddress = event.address.toHexString();

  let pool = getLiquidityPool(poolAddress);
  let poolAmounts = getLiquidityPoolAmounts(poolAddress);

  let protocol = getOrCreateDex();

  let token0 = getOrCreateToken(event, pool.inputTokens[0]);
  let token1 = getOrCreateToken(event, pool.inputTokens[1]);

  // Convert tokens according to decimals
  let amount0Converted = convertTokenToDecimal(amount0, token0.decimals);
  let amount1Converted = convertTokenToDecimal(amount1, token1.decimals);

  // Get the value in USD of the deposit
  let amountUSD = amount0Converted
    .times(token0.lastPriceUSD!)
    .plus(amount1Converted.times(token1.lastPriceUSD!));

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    pool.totalValueLockedUSD
  );

  // Update pool balances adjusted for decimals and not adjusted
  let poolInputTokenBalances: BigInt[] = [
    pool.inputTokenBalances[0].minus(amount0),
    pool.inputTokenBalances[1].minus(amount1),
  ];
  pool.inputTokenBalances = poolInputTokenBalances;

  let poolAmountsInputTokenBalances: BigDecimal[] = [
    poolAmounts.inputTokenBalances[0].minus(amount0Converted),
    poolAmounts.inputTokenBalances[1].minus(amount1Converted),
  ];
  poolAmounts.inputTokenBalances = poolAmountsInputTokenBalances;

  //  TODO: pool output tokens missing

  // Get the total value locked in USD
  pool.totalValueLockedUSD = poolAmounts.inputTokenBalances[0]
    .times(token0.lastPriceUSD!)
    .plus(poolAmounts.inputTokenBalances[1].times(token1.lastPriceUSD!));

  // reset aggregates with new amounts
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    pool.totalValueLockedUSD
  );

  let withdrawal = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  withdrawal.hash = event.transaction.hash.toHexString();
  withdrawal.logIndex = event.logIndex.toI32();
  withdrawal.protocol = protocol.id;
  withdrawal.to = owner.toHexString();
  withdrawal.from = pool.id;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  withdrawal.inputTokenAmounts = [amount0, amount1];
  withdrawal.pool = pool.id;
  withdrawal.amountUSD = amountUSD;

  withdrawal.save();
  pool.save();
  poolAmounts.save();
  protocol.save();
}

// Create a swap entity from a Swap event from a particular pool contract.
// Also, updated token prices, token balances, and total value locked.
export function createSwapHandleVolumeAndFees(
  event: ethereum.Event,
  amount0In: BigInt,
  amount0Out: BigInt,
  amount1In: BigInt,
  amount1Out: BigInt,
  recipient: Address,
  sender: Address
): void {
  log.info(" -------> inside createSwapHandleVolumeAndFees", []);

  log.info(
    "sender: {}, to: {}, amount0In: {}, amount0Out: {}, amount1In: {}, amount1Out: {}",
    [
      sender.toHexString(),
      recipient.toHexString(),
      amount0In.toString(),
      amount0Out.toString(),
      amount1In.toString(),
      amount1Out.toString(),
    ]
  );

  let amount0 =
    amount0In > BIGINT_ZERO ? amount0In : amount0Out.times(BIGINT_NEG_ONE);
  let amount1 =
    amount1In > BIGINT_ZERO ? amount1In : amount1Out.times(BIGINT_NEG_ONE);

  let poolAddress = event.address.toHexString();
  let protocol = getOrCreateDex();

  let pool = getLiquidityPool(poolAddress);
  let poolAmounts = getLiquidityPoolAmounts(poolAddress);

  let token0 = getOrCreateToken(event, pool.inputTokens[0]);
  let token1 = getOrCreateToken(event, pool.inputTokens[1]);

  // Convert tokens according to decimals
  let amount0Converted = convertTokenToDecimal(amount0, token0.decimals);
  let amount1Converted = convertTokenToDecimal(amount1, token1.decimals);

  // need absolute amounts for volume
  let amount0Abs = amount0Converted;
  if (amount0Converted.lt(BIGDECIMAL_ZERO)) {
    amount0Abs = amount0Converted.times(BIGDECIMAL_NEG_ONE);
  }
  let amount1Abs = amount1Converted;
  if (amount1Converted.lt(BIGDECIMAL_ZERO)) {
    amount1Abs = amount1Converted.times(BIGDECIMAL_NEG_ONE);
  }

  let amount0USD = amount0Abs.times(token0.lastPriceUSD!);
  let amount1USD = amount1Abs.times(token1.lastPriceUSD!);

  // Update the pool with the new active liquidity, price, and tick.
  let poolInputTokenBalances: BigInt[] = [
    pool.inputTokenBalances[0].plus(amount0),
    pool.inputTokenBalances[1].plus(amount1),
  ];
  pool.inputTokenBalances = poolInputTokenBalances;

  let poolAmountsInputTokenBalances: BigDecimal[] = [
    poolAmounts.inputTokenBalances[0].plus(amount0Converted),
    poolAmounts.inputTokenBalances[1].plus(amount1Converted),
  ];
  poolAmounts.inputTokenBalances = poolAmountsInputTokenBalances;

  token0.lastPriceBlockNumber = event.block.number;
  token1.lastPriceBlockNumber = event.block.number;

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    pool.totalValueLockedUSD
  );

  /**
   * Things afffected by new USD rates
   */
  // Get the total value locked in USD
  pool.totalValueLockedUSD = poolAmounts.inputTokenBalances[0]
    .times(token0.lastPriceUSD!)
    .plus(poolAmounts.inputTokenBalances[1].times(token1.lastPriceUSD!));

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    pool.totalValueLockedUSD
  );

  // create Swap event
  let swap = new Swap(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  swap.hash = event.transaction.hash.toHexString();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = protocol.id;
  swap.to = recipient.toHexString();
  swap.from = sender.toHexString();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = amount0 > BIGINT_ZERO ? token0.id : token1.id;
  swap.amountIn = amount0 > BIGINT_ZERO ? amount0 : amount1;
  swap.amountInUSD = amount0 > BIGINT_ZERO ? amount0USD : amount1USD;
  swap.tokenOut = amount1 > BIGINT_ZERO ? token0.id : token1.id;
  swap.amountOut =
    amount1 > BIGINT_ZERO
      ? amount0.times(BIGINT_NEG_ONE)
      : amount1.times(BIGINT_NEG_ONE);
  swap.amountOutUSD = amount1 > BIGINT_ZERO ? amount0USD : amount1USD;
  swap.pool = pool.id;

  // TODO: getTrackedVolume
  let trackedAmountUSD = [
    amount0USD,
    amount1USD,
    amount0USD.plus(amount0USD).div(BIGDECIMAL_TWO),
  ];

  updateVolumeAndFees(
    event,
    protocol,
    pool,
    trackedAmountUSD,
    amount0,
    amount1
  );

  swap.save();
  token0.save();
  token1.save();
}
