import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { LiquidityPool } from "../../../generated/schema";
import { getCoins, getLpToken, getOrCreateProtocol } from "../../utils/common";
import { BIGINT_ZERO } from "../../utils/constant";
import { getOrCreateDeposit } from "../deposit";
import { getOrCreateFinancials } from "../financials";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { updateUsageMetrics } from "../updateUsageMetrics";
import { getOrCreatePool } from "./createPool";

export function addLiquidity(
  event: ethereum.Event,
  poolAddress: Address,
  token_supply: BigInt,
  token_amounts: BigInt[],
  provider: Address,
  fees: BigInt[],
): void {
  let protocol = getOrCreateProtocol();
  let pool = LiquidityPool.load(poolAddress.toHexString());
  if (pool == null) {
    let lpToken: Address = getLpToken(poolAddress);
    let coins: Address[] = getCoins(poolAddress);
    pool = getOrCreatePool(event, coins, lpToken, poolAddress);
  }

  // update input token balances
  let inputTokenBalances: BigInt[] = [];
  for (let i = 0; i < pool.inputTokens.length; i++) {
    inputTokenBalances.push(pool.inputTokenBalances[i].plus(token_amounts[i]));
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
  let outputTokenAmount = pool.outputTokenSupply.minus(oldOutputTokenSupply);
  pool.save();

  // Update Deposit
  let deposit = getOrCreateDeposit(event, pool);
  deposit.from = provider.toHexString();
  deposit.to = event.address.toHexString();
  deposit.outputTokenAmount = outputTokenAmount;
  let inputTokenAmounts: BigInt[] = [];
  for (let i = 0; i < pool.inputTokens.length; i++) {
    inputTokenAmounts.push(token_amounts[i]);
  }
  deposit.inputTokenAmounts = inputTokenBalances.map<BigInt>(tb => tb);
  // @TODO: Update deposit.amountUSD
  deposit.save();

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
