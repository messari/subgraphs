// import { log } from '@graphprotocol/graph-ts'
import { BigInt, Address, crypto, ethereum, BigDecimal, log, ByteArray, Bytes } from "@graphprotocol/graph-ts";
import { LiquidityPool, Deposit, Withdraw, Swap, LiquidityPoolFee, Account } from "../../generated/schema";

import {
  getLiquidityPool,
  getOrCreateDex,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "./getters";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  INT_ZERO,
  LiquidityPoolFeeType,
  REWARD_TOKEN,
  UsageType,
} from "./constants";
import { updateTokenPrice, updateVolumeAndFee } from "./metrics";
import { valueInUSD } from "./pricing";
import { convertTokenToDecimal } from "./utils/utils";
import { PoolBalanceChanged } from "../../generated/Vault/Vault";
import { scaleDown } from "./tokens";
import { updateWeight } from "./weight";
import { getOrCreatePosition, updatePositions } from "./position";

export function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: string,
  name: string,
  symbol: string,
  inputTokens: string[],
  fees: BigInt,
): void {
  let protocol = getOrCreateDex();
  let inputTokenBalances: BigInt[] = [];
  let inputTokenBalancesAmount: BigDecimal[] = [];
  for (let index = 0; index < inputTokens.length; index++) {
    //create token if null
    getOrCreateToken(inputTokens[index]);
    inputTokenBalances.push(BIGINT_ZERO);
    inputTokenBalancesAmount.push(BIGDECIMAL_ZERO);
  }

  let pool = new LiquidityPool(poolAddress);

  pool.protocol = protocol.id;
  pool.inputTokens = inputTokens;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = inputTokenBalances;
  pool.outputToken = getOrCreateToken(poolAddress).id;
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.stakedOutputTokenAmount = BIGINT_ZERO;
  pool.fees = createPoolFees(poolAddress, fees);
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.name = protocol.name + " " + name;
  pool.symbol = symbol;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  pool.isSingleSided = false;
  pool.rewardTokens = [];
  pool.rewardTokenEmissionsAmount = [];
  pool.rewardTokenEmissionsUSD = [];
  pool.inputTokenWeights = [];
  pool.allocPoint = BIGINT_ZERO;
  pool.positionCount = INT_ZERO;
  pool.openPositionCount = INT_ZERO;
  pool.closedPositionCount = INT_ZERO;

  if (REWARD_TOKEN != "") {
    let rewardToken = getOrCreateRewardToken(REWARD_TOKEN);
    pool.rewardTokens = [rewardToken.id];
    pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
  }
  pool.inputTokenWeights = [];
  pool.allocPoint = BIGINT_ZERO;

  pool.save();
  protocol.totalPoolCount += 1;
  protocol.save();
}

function createPoolFees(poolAddressString: string, fee: BigInt): string[] {
  let poolTradingFee = new LiquidityPoolFee("trading-fee-" + poolAddressString);
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
  poolTradingFee.feePercentage = scaleDown(fee, null);
  // LP Fee
  // These fees were activated by a governance vote and were later raised to 50% by a subsequent proposal.
  //https://vote.balancer.fi/#/proposal/0xf6238d70f45f4dacfc39dd6c2d15d2505339b487bbfe014457eba1d7e4d603e3
  let poolLpFee = new LiquidityPoolFee("lp-fee-" + poolAddressString);
  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolLpFee.feePercentage = BigDecimal.fromString("0.5").times(poolTradingFee.feePercentage!);

  // These fees were activated by a governance vote and were later raised to 50% by a subsequent proposal.
  //https://vote.balancer.fi/#/proposal/0xf6238d70f45f4dacfc39dd6c2d15d2505339b487bbfe014457eba1d7e4d603e3
  // Protocol Fee
  let poolProtocolFee = new LiquidityPoolFee("protocol-fee-" + poolAddressString);
  poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  poolProtocolFee.feePercentage = BigDecimal.fromString("0.5").times(poolTradingFee.feePercentage!);

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}

export function createSwapHandleVolume(
  event: ethereum.Event,
  poolAddress: string,
  tokenIn: string,
  amountIn: BigInt,
  tokenOut: string,
  amountOut: BigInt,
): void {
  let protocol = getOrCreateDex();
  let pool = getLiquidityPool(poolAddress);
  let _tokenIn = getOrCreateToken(tokenIn);
  let _tokenOut = getOrCreateToken(tokenOut);
  let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event, poolAddress);
  let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event, poolAddress);

  // Convert tokens according to decimals
  let amountInConverted = convertTokenToDecimal(amountIn, _tokenIn.decimals);
  let amountOutConverted = convertTokenToDecimal(amountOut, _tokenOut.decimals);

  let tokenInIndex: i32 = 0;
  let tokenOutIndex: i32 = 0;

  let inputTokenBalances: BigInt[] = pool.inputTokenBalances;
  let dailyVolumeByTokenAmount: BigInt[] = poolMetricsDaily.dailyVolumeByTokenAmount;
  let dailyVolumeByTokenUSD: BigDecimal[] = poolMetricsDaily.dailyVolumeByTokenUSD;
  let hourlyVolumeByTokenAmount: BigInt[] = poolMetricsHourly.hourlyVolumeByTokenAmount;
  let hourlyVolumeByTokenUSD: BigDecimal[] = poolMetricsHourly.hourlyVolumeByTokenUSD;
  for (let i: i32 = 0; i < pool.inputTokens.length; i++) {
    if (tokenIn == pool.inputTokens[i]) {
      inputTokenBalances[i] = pool.inputTokenBalances[i].plus(amountIn);
      dailyVolumeByTokenAmount[i] = poolMetricsDaily.dailyVolumeByTokenAmount[i].plus(amountIn);
      hourlyVolumeByTokenAmount[i] = poolMetricsHourly.hourlyVolumeByTokenAmount[i].plus(amountIn);
      dailyVolumeByTokenUSD[i] = poolMetricsDaily.dailyVolumeByTokenUSD[i].plus(amountInConverted);
      hourlyVolumeByTokenUSD[i] = poolMetricsHourly.hourlyVolumeByTokenUSD[i].plus(amountInConverted);
      tokenInIndex = i;
    }

    if (tokenOut == pool.inputTokens[i]) {
      inputTokenBalances[i] = pool.inputTokenBalances[i].minus(amountOut);
      poolMetricsDaily.dailyVolumeByTokenAmount[i] = dailyVolumeByTokenAmount[i].plus(amountOut);
      hourlyVolumeByTokenAmount[i] = hourlyVolumeByTokenAmount[i].plus(amountOut);
      dailyVolumeByTokenUSD[i] = dailyVolumeByTokenUSD[i].plus(amountOutConverted);
      hourlyVolumeByTokenUSD[i] = hourlyVolumeByTokenUSD[i].plus(amountOutConverted);
      tokenOutIndex = i;
    }
  }
  poolMetricsDaily.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
  poolMetricsDaily.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
  poolMetricsHourly.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
  poolMetricsHourly.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
  pool.inputTokenBalances = inputTokenBalances;

  updateTokenPrice(
    pool,
    Address.fromString(tokenIn),
    amountIn,
    tokenInIndex,
    Address.fromString(tokenOut),
    amountOut,
    tokenOutIndex,
    event.block.number,
  );

  // create Swap event
  let swap = new Swap(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  swap.hash = event.transaction.hash.toHexString();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = protocol.id;
  swap.pool = poolAddress;
  swap.account = event.transaction.from.toHexString();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = tokenIn;
  swap.amountIn = amountIn;
  swap.amountInUSD = valueInUSD(amountInConverted, Address.fromString(tokenIn));
  swap.tokenOut = tokenOut;
  swap.amountOut = amountOut;
  swap.amountOutUSD = valueInUSD(amountOutConverted, Address.fromString(tokenOut));
  swap.pool = pool.id;
  swap.nonce = event.transaction.nonce;
  swap.gasLimit = event.transaction.gasLimit;
  swap.gasPrice = event.transaction.gasPrice;

  // get amount that should be tracked only - div 2 because cant count both input and output as volume
  let trackedAmountUSD = swap.amountInUSD;
  updateVolumeAndFee(event, protocol, pool, trackedAmountUSD);
  updateWeight(pool.id);

  poolMetricsDaily.dailyVolumeUSD = poolMetricsDaily.dailyVolumeUSD.plus(trackedAmountUSD);
  poolMetricsHourly.hourlyVolumeUSD = poolMetricsHourly.hourlyVolumeUSD.plus(trackedAmountUSD);
  poolMetricsHourly.save();
  poolMetricsDaily.save();
  swap.save();
}

export function createDepositMulti(event: PoolBalanceChanged, poolAddress: string, amounts: BigInt[]): void {
  let pool = getLiquidityPool(poolAddress);
  let protocol = getOrCreateDex();
  let amountUSD = BIGDECIMAL_ZERO;
  let inputTokenBalances = pool.inputTokenBalances;

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD);

  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  let withdrawBalances: BigInt[] = [];
  //recalculate pool tvl
  for (let i: i32 = 0; i < pool.inputTokens.length; i++) {
    let token = getOrCreateToken(pool.inputTokens[i]);
    if (token == null) {
      throw new Error("poolToken not found");
    }
    for (let j = 0; j < event.params.tokens.length; j++) {
      let tokenAddress = event.params.tokens[j].toHexString();
      if (tokenAddress == pool.inputTokens[i]) {
        inputTokenBalances[i] = inputTokenBalances[i].plus(amounts[j]);
        let amountConverted = convertTokenToDecimal(amounts[j], token.decimals);
        amountUSD = amountUSD.plus(amountConverted.times(token.lastPriceUSD!));
        withdrawBalances.push(amounts[j]);
      }
    }
    let totalConverted = convertTokenToDecimal(inputTokenBalances[i], token.decimals);
    pool.totalValueLockedUSD = pool.totalValueLockedUSD.plus(totalConverted.times(token.lastPriceUSD!));
  }
  pool.inputTokenBalances = inputTokenBalances;
  // Add pool value back to protocol total value locked
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(pool.totalValueLockedUSD);

  let deposit = new Deposit(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.pool = pool.id;
  deposit.account = event.transaction.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = pool.inputTokens;
  deposit.outputToken = pool.outputToken;
  deposit.inputTokenAmounts = withdrawBalances;
  deposit.amountUSD = amountUSD;
  deposit.nonce = event.transaction.nonce;
  deposit.gasLimit = event.transaction.gasLimit;
  deposit.gasPrice = event.transaction.gasPrice;

  // let newPositionBalance = getAccountBalance(deposit.pool, deposit.account);
  let position = getOrCreatePosition(deposit.pool, deposit.account, event);
  deposit.position = position.id;
  deposit.outputTokenAmount = getOutputTokenAmount(event, deposit.pool, deposit.account);
  deposit.save();
  pool.save();
  protocol.save();
  updatePositions(deposit.pool, UsageType.DEPOSIT, deposit.account, event, deposit.id);
}

export function createWithdrawMulti(event: PoolBalanceChanged, poolAddress: string, amounts: BigInt[]): void {
  let pool = getLiquidityPool(poolAddress);
  let protocol = getOrCreateDex();
  let amountUSD = BIGDECIMAL_ZERO;
  let inputTokenBalances = pool.inputTokenBalances;

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD);
  //recalculate pool tvl
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;

  for (let i: i32 = 0; i < pool.inputTokens.length; i++) {
    let token = getOrCreateToken(pool.inputTokens[i]);
    if (token == null) {
      throw new Error("poolToken not found");
    }
    for (let j = 0; j < event.params.tokens.length; j++) {
      let tokenAddress = event.params.tokens[j].toHexString();

      if (tokenAddress == pool.inputTokens[i]) {
        inputTokenBalances[i] = inputTokenBalances[i].plus(amounts[j]);
        let amountConverted = convertTokenToDecimal(amounts[j], token.decimals);
        amountUSD = amountUSD.plus(amountConverted.times(token.lastPriceUSD!));
      }
    }
    let totalConverted = convertTokenToDecimal(inputTokenBalances[i], token.decimals);
    pool.totalValueLockedUSD = pool.totalValueLockedUSD.plus(totalConverted.times(token.lastPriceUSD!));
  }
  pool.inputTokenBalances = inputTokenBalances;
  // Add pool value back to protocol total value locked
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(pool.totalValueLockedUSD);

  // Add pool value back to protocol total value locked

  let withdrawal = new Withdraw(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  withdrawal.hash = event.transaction.hash.toHexString();
  withdrawal.logIndex = event.logIndex.toI32();
  withdrawal.protocol = protocol.id;
  withdrawal.account = event.transaction.from.toHexString();
  withdrawal.pool = pool.id;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = pool.inputTokens;
  withdrawal.outputToken = pool.outputToken;
  withdrawal.inputTokenAmounts = amounts;
  withdrawal.pool = pool.id;
  withdrawal.amountUSD = amountUSD;
  withdrawal.nonce = event.transaction.nonce;
  withdrawal.gasLimit = event.transaction.gasLimit;
  withdrawal.gasPrice = event.transaction.gasPrice;

  // let newPositionBalance = getAccountBalance(withdrawal.pool, withdrawal.account);
  let position = getOrCreatePosition(withdrawal.pool, withdrawal.account, event);

  withdrawal.position = position.id;
  withdrawal.outputTokenAmount = getOutputTokenAmount(event, withdrawal.pool, withdrawal.account);
  withdrawal.save();
  pool.save();
  protocol.save();
  updatePositions(withdrawal.pool, UsageType.WITHDRAW, withdrawal.account, event, withdrawal.id);
}

function getOutputTokenAmount(event: PoolBalanceChanged, outputToken: string, account: string): BigInt | null {
  let receipt = event.receipt;
  if (!receipt) {
    log.debug("[getOutputTokenAmount][{}] no receipt", [event.transaction.hash.toHexString()]);
    return BIGINT_ONE;
  }
  let logs = event.receipt!.logs;
  if (!logs) {
    log.debug("[getOutputTokenAmount][{}] no logs", [event.transaction.hash.toHexString()]);
    return BIGINT_ONE;
  }

  for (let i = 0; i < logs.length; ++i) {
    let curr = logs.at(i);
    let topic_sig = curr.topics.at(0);
    if (crypto.keccak256(ByteArray.fromUTF8("Transfer(address,address,uint256)")).equals(topic_sig)) {
      if (curr.address.toHexString() == outputToken) {
        let from = ethereum.decode("address", curr.topics.at(1))!.toAddress().toHexString();
        let to = ethereum.decode("address", curr.topics.at(2))!.toAddress().toHexString();
        if (to == account || from == account) {
          let data_value = ethereum.decode("uint256", curr.data);
          if (!data_value) {
            return BIGINT_ONE;
          }
          return data_value!.toBigInt();
        }
      }
    }
  }
  return BIGINT_ONE;
}
