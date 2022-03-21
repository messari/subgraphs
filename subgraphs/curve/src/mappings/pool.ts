import {
  BigInt,
  Address,
  BigDecimal,
  store,
  DataSourceContext,
  ethereum,
  dataSource,
} from "@graphprotocol/graph-ts";

import {
  StableSwap,
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenExchange,
  TokenExchangeUnderlying,
} from "../../generated/MainRegistry/StableSwap";

import {
  LiquidityPool,
  Deposit,
  PoolDailySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  Token,
  Account,
  DailyActiveAccount,
  Withdraw,
} from "../../generated/schema";
import { Registry } from "../../generated/MainRegistry/Registry";
import { ERC20 } from "../../generated/MainRegistry/ERC20";
import {
  createPoolDailySnapshot,
  getCurrentTokenSupply,
  getInputBalances,
  getOutTokenPriceUSD,
  getTotalVolumeUSD,
  getTVLUSD,
  updatePool,
} from "../utils/pool";
import { getOrCreateToken } from "../utils/tokens";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  SECONDS_PER_DAY,
  toDecimal,
  ZERO_ADDRESS,
} from "../utils/constant";
import { getOrCreateProtocol } from "./registry";
import {
  normalizedUsdcPrice,
  usdcPrice,
  usdcPricePerToken,
} from "../utils/pricing";

export function handleAddLiquidity(event: AddLiquidity): void {
  let fees = event.params.fees;
  let invariant = event.params.invariant;
  let provider = event.params.provider;
  let token_amount = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  // Check if pool exist
  let pool = LiquidityPool.load(event.address.toHexString());

  if (pool != null && pool.id != ZERO_ADDRESS) {
    // Update pool entity balances and totalSupply of LP tokens
    let oldTotalSupply = pool.outputTokenSupply;

    // Get new pool coins balance
    let newPoolBalances = getInputBalances(pool);

    // Current Token Supply
    let currentTokenSupply = getCurrentTokenSupply(pool, token_supply);

    // Update totalValueLockedUSD
    let totalValueLockedUSD = getTVLUSD(pool);

    // Update totalVolumeUSD
    let totalVolumeUSD = getTotalVolumeUSD(pool, token_amount);

    // Get output token price per unit
    let outTokenPriceUSD = getOutTokenPriceUSD(pool);

    // Update pool
    pool = updatePool(
      event,
      pool,
      newPoolBalances,
      currentTokenSupply,
      outTokenPriceUSD,
      totalVolumeUSD,
      totalValueLockedUSD
    );

    // Update Deposit
    createDeposit(
      event,
      pool,
      currentTokenSupply.minus(oldTotalSupply),
      token_amount,
      provider
    );

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);

    // Take FinancialsDailySnapshot
    updateFinancials(event, fees, pool);

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, provider);
  }
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amount = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  // Check if pool exist
  let pool = LiquidityPool.load(event.address.toHexString());

  // If liquidity pool exist, update the pool
  if (pool != null && pool.id != ZERO_ADDRESS) {
    // Update pool entity balances and totalSupply of LP tokens
    let oldTotalSupply = pool.outputTokenSupply;

    // Get new pool coins balance
    let newPoolBalances = getInputBalances(pool);

    // Current Token Supply
    let currentTokenSupply = getCurrentTokenSupply(pool, token_supply);

    // Update totalValueLockedUSD
    let totalValueLockedUSD = getTVLUSD(pool);

    // Update totalVolumeUSD
    let totalVolumeUSD = getTotalVolumeUSD(pool, token_amount);

    // Get output token price per unit
    let outTokenPriceUSD = getOutTokenPriceUSD(pool);

    // Update pool
    pool = updatePool(
      event,
      pool,
      newPoolBalances,
      currentTokenSupply,
      outTokenPriceUSD,
      totalVolumeUSD,
      totalValueLockedUSD
    );

    // Update Deposit
    createWithdrawal(
      event,
      pool,
      oldTotalSupply.minus(currentTokenSupply),
      token_amount,
      provider
    );

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);

    // Take FinancialsDailySnapshot
    updateFinancials(event, fees, pool);

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, provider);
  }
}

export function handleRemoveLiquidityImbalance(
  event: RemoveLiquidityImbalance
): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amount = event.params.token_amounts;
  let token_supply = event.params.token_supply;
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  let coin_amount = event.params.coin_amount;
  let provider = event.params.provider;
  let token_amount = event.params.token_amount;
}

export function handleTokenExchange(event: TokenExchange): void {
  let bought_id = event.params.bought_id;
  let buyer = event.params.buyer;
  let sold_id = event.params.sold_id;
  let token_bought = event.params.tokens_bought;
  let token_sold = event.params.tokens_sold;
}

export function handleTokenExchangeUnderlying(
  event: TokenExchangeUnderlying
): void {
  let bought_id = event.params.bought_id;
  let buyer = event.params.buyer;
  let sold_id = event.params.sold_id;
  let token_bought = event.params.tokens_bought;
  let token_sold = event.params.tokens_sold;
}

function createDeposit(
  event: ethereum.Event,
  pool: LiquidityPool,
  token_supply: BigDecimal,
  token_amount: BigInt[],
  provider: Address
): void {
  let deposit_id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toHexString());
  let deposit = Deposit.load(deposit_id);
  if (deposit == null) {
    deposit = new Deposit(deposit_id);
    deposit.hash = event.transaction.hash.toString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.to = event.address.toString();
    deposit.from = provider.toString();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.inputTokens = pool.inputTokens;

    // Output Token and Output Token Amount
    let outputTokens: Token[] = [];
    outputTokens.push(
      getOrCreateToken(Address.fromBytes(pool._lpTokenAddress))
    );
    deposit.outputTokens = outputTokens.map<string>((t) => t.id);
    let outputTokenAmounts: BigDecimal[] = [];
    outputTokenAmounts.push(token_supply);
    deposit.outputTokenAmounts = outputTokenAmounts.map<BigDecimal>((tm) => tm);

    // Input Token and Input Token Amount
    let tokenAmount = token_amount.map<BigInt>((ta) => ta);

    let amountUSD = BIGDECIMAL_ZERO;
    for (let i = 0; i < tokenAmount.length; i++) {
      if (deposit.inputTokens.length == tokenAmount.length) {
        let inputToken = getOrCreateToken(
          Address.fromString(deposit.inputTokens[i])
        );
        let inputTokenAmounts = tokenAmount[i];

        // Get the price of 1 input token in usd
        // and multiple with the input token amount
        let inputTokenUSD = normalizedUsdcPrice(
          usdcPrice(inputToken, inputTokenAmounts)
        );
        // Add the price of the total input to amountUSD
        amountUSD = amountUSD.plus(inputTokenUSD);
      }
    }
    deposit.inputTokenAmounts = tokenAmount.map<BigDecimal>((ta) =>
      toDecimal(ta, DEFAULT_DECIMALS)
    );
    deposit.amountUSD = amountUSD;
    deposit.pool = pool.id;

    deposit.save();
  }
}

function createWithdrawal(
  event: ethereum.Event,
  pool: LiquidityPool,
  token_supply: BigDecimal,
  token_amount: BigInt[],
  provider: Address
): void {
  let withdraw_id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toHexString());
  let withdraw = Withdraw.load(withdraw_id);
  if (withdraw == null) {
    withdraw = new Withdraw(withdraw_id);
    withdraw.hash = event.transaction.hash.toString();
    withdraw.logIndex = event.logIndex.toI32();
    withdraw.to = provider.toString();
    withdraw.from = event.address.toString();
    withdraw.blockNumber = event.block.number;
    withdraw.timestamp = event.block.timestamp;
    withdraw.inputTokens = pool.inputTokens;

    // Output Token && Output Token Amount
    let outputTokens: Token[] = [];
    outputTokens.push(
      getOrCreateToken(Address.fromBytes(pool._lpTokenAddress))
    );
    withdraw.outputTokens = outputTokens.map<string>((t) => t.id);
    let outputTokenAmounts: BigDecimal[] = [];
    outputTokenAmounts.push(token_supply);
    withdraw.outputTokenAmounts = outputTokenAmounts.map<BigDecimal>(
      (tm) => tm
    );

    // Input Token && Input Token Amount
    let tokenAmount = token_amount.map<BigInt>((ta) => ta);

    let amountUSD = BIGDECIMAL_ZERO;
    for (let i = 0; i < tokenAmount.length; i++) {
      if (withdraw.inputTokens.length == tokenAmount.length) {
        let inputToken = getOrCreateToken(
          Address.fromString(withdraw.inputTokens[i])
        );
        let inputTokenAmounts = tokenAmount[i];

        // Get the price of 1 input token in usd
        // and multiple with the input token amount
        let inputTokenUSD = normalizedUsdcPrice(
          usdcPrice(inputToken, inputTokenAmounts)
        );
        // Add the price of the total input to amountUSD
        amountUSD = amountUSD.plus(inputTokenUSD);
      }
    }
    withdraw.inputTokenAmounts = tokenAmount.map<BigDecimal>((ta) =>
      toDecimal(ta, DEFAULT_DECIMALS)
    );
    withdraw.amountUSD = amountUSD;
    withdraw.pool = pool.id;

    withdraw.save();
  }
}

function updateFinancials(
  event: ethereum.Event,
  fees: BigInt[],
  pool: LiquidityPool
): void {
  let timestamp = event.block.timestamp;
  let blockNumber = event.block.number;

  // Number of days since Unix epoch
  let id = timestamp.toI64() / SECONDS_PER_DAY;

  let protocol = getOrCreateProtocol();
  let poolContract = StableSwap.bind(event.address);
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (financialMetrics == null) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = protocol.id;

    financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = blockNumber;
    financialMetrics.timestamp = timestamp;

    financialMetrics.save();
  }
  let totalFee = BIGDECIMAL_ZERO;
  for (let i = 0; i < pool.inputTokens.length; i++) {
    if (fees.length == pool.inputTokens.length) {
      let feeToken = getOrCreateToken(Address.fromString(pool.inputTokens[i]));
      let feeAmount = fees[i];

      // Get the price of 1 fee token in usd
      // Multiply the price of 1 fee token with fees[j]
      let tokenFeeUSD = normalizedUsdcPrice(usdcPrice(feeToken, feeAmount));
      totalFee = totalFee.plus(tokenFeeUSD);
    }
  }
  financialMetrics.feesUSD = financialMetrics.feesUSD.plus(totalFee);

  let getAdminFee = poolContract.try_admin_fee();
  let adminFee = getAdminFee.reverted ? BIGINT_ZERO : getAdminFee.value;
  financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(
    toDecimal(adminFee, DEFAULT_DECIMALS).times(financialMetrics.feesUSD)
  );

  financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(
    financialMetrics.feesUSD.minus(financialMetrics.supplySideRevenueUSD)
  );
  financialMetrics.totalVolumeUSD = pool.totalVolumeUSD;
  financialMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = blockNumber;
  financialMetrics.timestamp = timestamp;

  financialMetrics.save();
}

function updateUsageMetrics(event: ethereum.Event, provider: Address): void {
  // Number of days since Unix epoch
  let timestamp = event.block.timestamp;
  let blockNumber = event.block.number;
  let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let protocol = getOrCreateProtocol();
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = protocol.id;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.blockNumber = blockNumber;
    usageMetrics.timestamp = timestamp;

    usageMetrics.save();
  }

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = blockNumber;
  usageMetrics.timestamp = timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = provider.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();
    usageMetrics.totalUniqueUsers += 1;
  }

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + provider.toHexString();
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}
