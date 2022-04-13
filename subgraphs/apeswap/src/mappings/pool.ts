import { BigDecimal, log, store } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Factory/ERC20";
import {
  _HelperStore,
  LiquidityPool,
  Token,
  _Transfer,
} from "../../generated/schema";
import {
  Burn,
  Mint,
  Swap as SwapEvent,
  Sync,
  Transfer,
} from "../../generated/templates/Pool/Pair";
import { getOrCreateDeposit } from "../helpers/deposit";
import { getOrCreateFinancials } from "../helpers/financials";
import {
  handleTransferBurn,
  handleTransferMint,
  handleTransferToPoolBurn,
  updatePool,
} from "../helpers/pool";
import { createPoolDailySnapshot } from "../helpers/poolDailySnapshot";
import { getOrCreateSwap } from "../helpers/swap";
import { updateUsageMetrics } from "../helpers/updateUsageMetrics";
import { getOrCreateWithdraw } from "../helpers/withdraw";
import {
  getOrCreateProtocol,
  getOrCreateProtocolFeeShare,
  getOrCreateSupplyFeeShare,
  getOrCreateTradingFees,
  getOrCreateTransfer,
} from "../utils/common";
import {
  BIGDECIMAL_ZERO,
  BIGINT_THOUSAND,
  BIGINT_ZERO,
  HELPER_STORE_ID,
  toBigInt,
  toDecimal,
  ZERO_ADDRESS,
} from "../utils/constant";
import { deployedNetwork } from "../utils/networkConfig";
import {
  findNativeTokenPricePerToken,
  getTrackedLiquidityUSD,
  getTrackedVolumeUSD,
} from "../utils/pricing";

export function handleTransfer(event: Transfer): void {
  log.info("Transfer mapping on pool {}", [event.address.toHexString()]);
  let from = event.params.from;
  let to = event.params.to;
  let value = event.params.value;
  let id = event.address.toHexString();
  let fromHex = from.toHexString();
  let toHex = to.toHexString();

  // get pool
  let pool = LiquidityPool.load(id);
  if (pool !== null) {
    // ignore initial transfers for first adds
    if (to.toHexString() == ZERO_ADDRESS && value.equals(BIGINT_THOUSAND)) {
      return;
    }

    // mint
    if (fromHex == ZERO_ADDRESS) {
      handleTransferMint(event, value, to);
    }

    // case where direct send first on Token withdrawls
    if (toHex == pool.id) {
      handleTransferToPoolBurn(event, value, from);
    }

    // burn
    if (fromHex == pool.id && toHex == ZERO_ADDRESS) {
      handleTransferBurn(event, value, from);
    }
  }
}

export function handleMint(event: Mint): void {
  log.info("Mint mapping on pool {}", [event.address.toHexString()]);
  let id = event.address.toHexString();
  let blockNumber = event.block.number;
  let timestamp = event.block.timestamp;
  let poolAddress = event.address;
  let sender = event.params.sender;
  let protocol = getOrCreateProtocol();

  let pool = LiquidityPool.load(id);
  if (pool !== null) {
    let transfer = getOrCreateTransfer(event);
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;
    let amount0 = toDecimal(event.params.amount0, token0.decimals);
    let amount1 = toDecimal(event.params.amount1, token1.decimals);

    // get new amounts of USD and Native Token for tracking
    let helperStore = _HelperStore.load(HELPER_STORE_ID)!;
    let amountTotalUSD = token1._derivedNativeToken
      .times(amount1)
      .plus(token0._derivedNativeToken.times(amount0))
      .times(helperStore._value);

    token0.save();
    token1.save();
    pool.save();

    // Deposit
    let deposit = getOrCreateDeposit(event, pool);
    deposit.from = transfer._sender!;
    deposit.to = pool.id;
    deposit.inputTokenAmounts = [
      toBigInt(amount0, token0.decimals),
      toBigInt(amount1, token1.decimals),
    ];
    deposit.outputTokenAmount = transfer._liquidity!;
    deposit.amountUSD = amountTotalUSD;

    store.remove("_Transfer", transfer.id);

    deposit.save();

    // Update pool
    updatePool(pool);

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(poolAddress, blockNumber, timestamp, pool);

    // Take FinancialsDailySnapshot
    let financials = getOrCreateFinancials(protocol, timestamp, blockNumber);
    financials.totalValueLockedUSD = pool.totalValueLockedUSD;
    financials.totalVolumeUSD = pool.totalVolumeUSD;

    financials.save();

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(sender, protocol, timestamp, blockNumber);
  }
}

export function handleBurn(event: Burn): void {
  log.info("Burn mapping on pool {}", [event.address.toHexString()]);
  let id = event.address.toHexString();
  let blockNumber = event.block.number;
  let timestamp = event.block.timestamp;
  let poolAddress = event.address;
  let sender = event.params.sender;
  let protocol = getOrCreateProtocol();

  let pool = LiquidityPool.load(id);
  if (pool !== null) {
    let transfer = getOrCreateTransfer(event);
    if (transfer !== null) {
      let token0 = Token.load(pool._token0)!;
      let token1 = Token.load(pool._token1)!;
      let amount0 = toDecimal(event.params.amount0, token0.decimals);
      let amount1 = toDecimal(event.params.amount1, token1.decimals);

      // get new amounts of USD and Native Token for tracking
      let helperStore = _HelperStore.load(HELPER_STORE_ID)!;
      let amountTotalUSD = token1._derivedNativeToken
        .times(amount1)
        .plus(token0._derivedNativeToken.times(amount0))
        .times(helperStore._value);

      token0.save();
      token1.save();

      let withdraw = getOrCreateWithdraw(event, pool);
      withdraw.from = pool.id;
      withdraw.to = transfer._sender!;
      withdraw.inputTokenAmounts = [
        toBigInt(amount0, token0.decimals),
        toBigInt(amount1, token1.decimals),
      ];
      withdraw.outputTokenAmount = transfer._liquidity!;
      withdraw.amountUSD = amountTotalUSD;

      store.remove("_Transfer", transfer.id);

      withdraw.save();

      // Update pool
      updatePool(pool);

      // Take a PoolDailySnapshot
      createPoolDailySnapshot(poolAddress, blockNumber, timestamp, pool);

      // Take FinancialsDailySnapshot
      let financials = getOrCreateFinancials(protocol, timestamp, blockNumber);
      financials.totalValueLockedUSD = pool.totalValueLockedUSD;
      financials.totalVolumeUSD = pool.totalVolumeUSD;
      financials.save();

      // Take UsageMetricsDailySnapshot
      updateUsageMetrics(sender, protocol, timestamp, blockNumber);
    }
  }
}

export function handleSwap(event: SwapEvent): void {
  log.info("Swap mapping on pool {}", [event.address.toHexString()]);
  let blockNumber = event.block.number;
  let timestamp = event.block.timestamp;
  let poolAddress = event.address;
  let sender = event.params.sender;
  let pool = LiquidityPool.load(event.address.toHexString());
  let protocol = getOrCreateProtocol();

  if (pool !== null) {
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;
    let amount0In = toDecimal(event.params.amount0In, token0.decimals);
    let amount0Out = toDecimal(event.params.amount0Out, token0.decimals);
    let amount1In = toDecimal(event.params.amount1In, token1.decimals);
    let amount1Out = toDecimal(event.params.amount1Out, token1.decimals);

    // totals for volume updates
    let amount0Total = amount0Out.plus(amount0In);
    let amount1Total = amount1Out.plus(amount1In);

    // USD price of Native Token
    let helperStore = _HelperStore.load(HELPER_STORE_ID)!;

    // Only accounts for volume through white listed tokens
    let trackedAmountUSD = getTrackedVolumeUSD(
      amount0Total,
      token0,
      amount1Total,
      token1,
    );

    // update pair volume data, use tracked amount if we have it as its probably more accurate
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD);
    pool._volumeToken0 = pool._volumeToken0.plus(amount0Total);
    pool._volumeToken1 = pool._volumeToken1.plus(amount1Total);

    pool.save();
    token0.save();
    token1.save();

    // update swap
    let swap = getOrCreateSwap(event, pool);
    swap.from = event.params.sender.toHexString();
    swap.to = event.params.to.toHexString();
    swap.tokenIn = token0.id;
    swap.tokenOut = token1.id;
    swap.amountIn = toBigInt(amount0Total, token0.decimals);
    let amountInNativeToken = token0._derivedNativeToken.times(amount0Total);
    swap.amountInUSD = amountInNativeToken.times(helperStore._value);
    swap.amountOut = toBigInt(amount1Total, token0.decimals);
    let amountOutInNativeToken = token1._derivedNativeToken.times(amount1Total);
    swap.amountOutUSD = amountOutInNativeToken.times(helperStore._value);
    swap.save();

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(poolAddress, blockNumber, timestamp, pool);

    // Take FinancialsDailySnapshot
    let financials = getOrCreateFinancials(protocol, timestamp, blockNumber);
    let tradingFee = getOrCreateTradingFees(event.address);
    let protocolFee = getOrCreateProtocolFeeShare(event.address);
    let supplyFee = getOrCreateSupplyFeeShare(event.address);

    let tradingFeeAmount = amount0Total.times(tradingFee.feePercentage);

    let tradingFeeAmountUSD: BigDecimal = tradingFeeAmount
      .times(token0._derivedNativeToken)
      .times(helperStore._value);
    let protocolFeeAmountUSD: BigDecimal = tradingFeeAmountUSD.times(
      protocolFee.feePercentage,
    );
    let supplyFeeAmountUSD = tradingFeeAmountUSD.times(supplyFee.feePercentage);

    financials.totalValueLockedUSD = pool.totalValueLockedUSD;
    financials.totalVolumeUSD = pool.totalVolumeUSD;
    financials.feesUSD = financials.feesUSD.plus(tradingFeeAmountUSD);
    financials.supplySideRevenueUSD = financials.supplySideRevenueUSD.plus(
      supplyFeeAmountUSD,
    );
    financials.protocolSideRevenueUSD = financials.protocolSideRevenueUSD.plus(
      protocolFeeAmountUSD,
    );
    financials.save();

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(sender, protocol, timestamp, blockNumber);
  }
}

export function handleSync(event: Sync): void {
  log.info("Sync mapping on pool {}", [event.address.toHexString()]);
  let reserve0 = event.params.reserve0;
  let reserve1 = event.params.reserve1;
  let id = event.address.toHexString();

  let protocol = getOrCreateProtocol();
  let pool = LiquidityPool.load(id);
  if (pool !== null && reserve0 !== BIGINT_ZERO && reserve1 !== BIGINT_ZERO) {
    // reset factory liquidity by subtracting only tracked liquidity
    protocol._totalValueLockedInNativeToken = protocol._totalValueLockedInNativeToken.minus(
      pool._trackedNativeTokenReserve,
    );

    // reset token total liquidity amounts
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;

    pool._reserve0 = toDecimal(reserve0, token0.decimals);
    pool._reserve1 = toDecimal(reserve1, token1.decimals);

    if (pool._reserve1.equals(BIGDECIMAL_ZERO)) {
      pool._token0Price = BIGDECIMAL_ZERO;
    } else {
      pool._token0Price = pool._reserve0.div(pool._reserve1);
    }

    if (pool._reserve0.equals(BIGDECIMAL_ZERO)){
      pool._token1Price = BIGDECIMAL_ZERO;
    } else {
      pool._token1Price = pool._reserve1.div(pool._reserve0);
    }
    pool.save();

    // update Native Token price now that reserves could have changed
    let helperStore = _HelperStore.load(HELPER_STORE_ID)!;
    helperStore._value = deployedNetwork.nativeTokenPriceInUSD;
    helperStore.save();

    token0._derivedNativeToken = findNativeTokenPricePerToken(token0 as Token);
    token1._derivedNativeToken = findNativeTokenPricePerToken(token1 as Token);
    token0.save();
    token1.save();

    // get tracked liquidity - will be 0 if neither is in whitelist
    let trackedLiquidityInNativeToken: BigDecimal;
    if (helperStore._value.equals(BIGDECIMAL_ZERO))
      trackedLiquidityInNativeToken = BIGDECIMAL_ZERO;
    else {
      let TrackedLiquidityUSD = getTrackedLiquidityUSD(
        pool._reserve0,
        token0 as Token,
        pool._reserve1,
        token1 as Token,
      );
      trackedLiquidityInNativeToken = TrackedLiquidityUSD.div(
        helperStore._value,
      );
    }

    // use derived amounts within pair
    pool._trackedNativeTokenReserve = trackedLiquidityInNativeToken;
    pool._nativeTokenReserve = pool._reserve0
      .times(token0._derivedNativeToken)
      .plus(pool._reserve1.times(token1._derivedNativeToken));

    pool.totalValueLockedUSD = pool._nativeTokenReserve.times(
      helperStore._value,
    );

    // Update pool OutputTokenSupply
    let poolContract = ERC20.bind(event.address);
    let getTotalSupply = poolContract.try_totalSupply();
    if (!getTotalSupply.reverted) {
      pool.outputTokenSupply = getTotalSupply.value;
      pool.outputTokenPriceUSD = pool.totalValueLockedUSD.div(
        toDecimal(pool.outputTokenSupply),
      );
    }

    // use tracked amounts globally
    protocol._totalValueLockedInNativeToken = protocol._totalValueLockedInNativeToken.plus(
      trackedLiquidityInNativeToken,
    );
    protocol.totalValueLockedUSD = protocol._totalValueLockedInNativeToken.times(
      helperStore._value,
    );

    // save entities
    pool.save();
    protocol.save();
    token0.save();
    token1.save();
  }
}
