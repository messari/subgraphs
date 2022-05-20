import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { LiquidityPool } from "../../../generated/schema";
import { getCoins, getLpToken, getOrCreateProtocol } from "../../utils/common";
import { BIGINT_ZERO } from "../../utils/constant";
import { getOrCreateFinancials } from "../financials";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { updateUsageMetrics } from "../updateUsageMetrics";
import { getOrCreateWithdraw } from "../withdraw";
import { getOrCreatePool } from "./createPool";

export function removeLiquidity(
  event: ethereum.Event,
  poolAddress: Address,
  token_supply: BigInt,
  token_amounts: BigInt[],
  provider: Address,
  fees: BigInt[],
): void {
  // create pool
  let protocol = getOrCreateProtocol();
  let pool = LiquidityPool.load(poolAddress.toHexString());
  if (pool == null) {
    // Get coins
    let coins: Address[] = getCoins(poolAddress);

    // Get lp_token
    let lpToken = getLpToken(poolAddress);
    pool = getOrCreatePool(event, coins, lpToken, poolAddress);
  }

  // update input token balances
  let inputTokenBalances: BigInt[] = [];
  for (let i = 0; i < pool.inputTokens.length; i++) {
    inputTokenBalances.push(pool.inputTokenBalances[i].minus(token_amounts[i]));
  }
  pool.inputTokenBalances = inputTokenBalances.map<BigInt>(tb => tb);

  // Update outputTokenSupply
  let oldOutputTokenSupply = pool.outputTokenSupply;
  pool.outputTokenSupply = token_supply;
  if (token_supply == BIGINT_ZERO) {
    let tokenContract = ERC20.bind(Address.fromString(pool.outputToken));
    let getSupply = tokenContract.try_totalSupply();
    let supply = getSupply.reverted ? BIGINT_ZERO : getSupply.value;
    pool.outputTokenSupply = supply;
  }
  let outputTokenAmount = oldOutputTokenSupply.minus(pool.outputTokenSupply);
  pool.save();

  // Update Withdraw
  let withdraw = getOrCreateWithdraw(event, pool);
  withdraw.from = event.address.toHexString();
  withdraw.to = provider.toHexString();
  withdraw.outputTokenAmount = outputTokenAmount;
  let inputTokenAmounts: BigInt[] = [];
  for (let i = 0; i < pool.inputTokens.length; i++) {
    inputTokenAmounts.push(token_amounts[i]);
  }
  withdraw.inputTokenAmounts = inputTokenBalances.map<BigInt>(tb => tb);
  // @TODO: Update withdraw.amountUSD
  withdraw.save();

  // Take a PoolDailySnapshot
  createPoolDailySnapshot(event.address, event.block.number, event.block.timestamp, pool);

  // Take FinancialsDailySnapshot
  let financials = getOrCreateFinancials(protocol, event.block.timestamp, event.block.number);
  financials.totalValueLockedUSD = pool.totalValueLockedUSD;
  financials.totalVolumeUSD = pool.totalVolumeUSD;
  // @TODO Update FeeUSD
  // @TODO Update supplySideRevenueUSD
  // @TODO Update protocolSideRevenueUSD
  financials.save();

  // Take UsageMetricsDailySnapshot
  updateUsageMetrics(provider, protocol, event.block.timestamp, event.block.number);
}
