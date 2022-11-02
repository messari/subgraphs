import { Address, BigInt } from "@graphprotocol/graph-ts";

import {
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateYieldAggregator,
  getOrCreateRewardPool,
  getOrCreateFeeType,
  getFees,
  getOrCreateBalancerPoolToken,
} from "../common/getters";
import {
  BIGDECIMAL_ONE,
  BIGINT_ONE,
  BIGINT_ZERO,
  VaultFeeType,
  BAL_TOKEN_ADDR,
  BIGDECIMAL_1E18,
  BIGDECIMAL_ZERO,
} from "../common/constants";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { readValue } from "../common/utils/ethereum";
import { prefixID } from "../common/utils/strings";
import { addToArrayAtIndex } from "../common/utils/arrays";
import {
  updateUsageMetricsAfterDeposit,
  updateUsageMetricsAfterWithdraw,
  updateProtocolTotalValueLockedUSD,
  updateRevenue,
  updateRewards,
} from "../common/metrics";
import {
  createDepositTransaction,
  createWithdrawTransaction,
} from "../common/transactions";
import { CustomFeesType } from "../common/types";
import { NetworkConfigs } from "../../configurations/configure";

import {
  PoolAdded,
  Deposited,
  Withdrawn,
  FeesUpdated,
  PoolShutdown,
} from "../../generated/Booster/Booster";
import { ERC20 } from "../../generated/Booster/ERC20";
import { BaseRewardPool } from "../../generated/Booster/BaseRewardPool";
import { RewardAdded } from "../../generated/Booster/BaseRewardPool";

export function createPoolAdd(event: PoolAdded): void {
  const protocol = getOrCreateYieldAggregator();

  const poolId = event.params.pid;
  const vault = getOrCreateVault(poolId, event);
  if (!vault) return;

  protocol.totalPoolCount += 1;
  protocol._vaultIds = addToArrayAtIndex<string>(protocol._vaultIds, vault.id);
  protocol._activePoolCount = protocol._activePoolCount.plus(BIGINT_ONE);

  protocol.save();
}

export function createPoolShutdown(event: PoolShutdown): void {
  const protocol = getOrCreateYieldAggregator();

  const poolId = event.params.poolId;
  const vault = getOrCreateVault(poolId, event);
  if (!vault) return;

  vault._active = false;
  vault.save();

  protocol._activePoolCount = protocol._activePoolCount.minus(BIGINT_ONE);

  protocol.save();
}

export function createDeposit(poolId: BigInt, event: Deposited): void {
  const vault = getOrCreateVault(poolId, event);
  if (!vault) return;

  const inputToken = getOrCreateBalancerPoolToken(
    Address.fromString(vault.inputToken),
    event.block.number
  );

  const depositAmount = event.params.amount;
  const depositAmountUSD = bigIntToBigDecimal(
    depositAmount,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  vault.inputTokenBalance = vault.inputTokenBalance.plus(depositAmount);
  vault.totalValueLockedUSD = bigIntToBigDecimal(
    vault.inputTokenBalance,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  const outputToken = getOrCreateToken(
    Address.fromString(vault.outputToken!),
    event.block.number
  );
  const outputTokenContract = ERC20.bind(
    Address.fromString(vault.outputToken!)
  );

  vault.outputTokenSupply = readValue<BigInt>(
    outputTokenContract.try_totalSupply(),
    BIGINT_ZERO
  );
  vault.outputTokenPriceUSD =
    vault.outputTokenSupply != BIGINT_ZERO
      ? vault.totalValueLockedUSD.div(
          bigIntToBigDecimal(vault.outputTokenSupply!, outputToken.decimals)
        )
      : BIGDECIMAL_ZERO;

  const rewardPoolContract = BaseRewardPool.bind(
    Address.fromString(vault._balRewards)
  );

  vault.pricePerShare = readValue<BigInt>(
    rewardPoolContract.try_convertToAssets(BIGINT_ONE),
    BIGINT_ZERO
  )
    .toBigDecimal()
    .times(BIGDECIMAL_1E18);

  vault.save();

  createDepositTransaction(vault, depositAmount, depositAmountUSD, event);

  updateProtocolTotalValueLockedUSD();
  updateUsageMetricsAfterDeposit(event);
}

export function createWithdraw(poolId: BigInt, event: Withdrawn): void {
  const vault = getOrCreateVault(poolId, event);
  if (!vault) return;

  const inputToken = getOrCreateBalancerPoolToken(
    Address.fromString(vault.inputToken),
    event.block.number
  );

  const withdrawAmount = event.params.amount;
  const withdrawAmountUSD = bigIntToBigDecimal(
    withdrawAmount,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  vault.inputTokenBalance = vault.inputTokenBalance.minus(withdrawAmount);
  vault.totalValueLockedUSD = bigIntToBigDecimal(
    vault.inputTokenBalance,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  const outputToken = getOrCreateToken(
    Address.fromString(vault.outputToken!),
    event.block.number
  );
  const outputTokenContract = ERC20.bind(
    Address.fromString(vault.outputToken!)
  );

  vault.outputTokenSupply = readValue<BigInt>(
    outputTokenContract.try_totalSupply(),
    BIGINT_ZERO
  );
  vault.outputTokenPriceUSD =
    vault.outputTokenSupply != BIGINT_ZERO
      ? vault.totalValueLockedUSD.div(
          bigIntToBigDecimal(vault.outputTokenSupply!, outputToken.decimals)
        )
      : BIGDECIMAL_ZERO;

  const rewardPoolContract = BaseRewardPool.bind(
    Address.fromString(vault._balRewards)
  );

  vault.pricePerShare = readValue<BigInt>(
    rewardPoolContract.try_convertToAssets(BIGINT_ONE),
    BIGINT_ZERO
  )
    .toBigDecimal()
    .times(BIGDECIMAL_1E18);

  vault.save();

  createWithdrawTransaction(vault, withdrawAmount, withdrawAmountUSD, event);

  updateProtocolTotalValueLockedUSD();
  updateUsageMetricsAfterWithdraw(event);
}

export function createFeesUpdate(event: FeesUpdated): void {
  const newFees = new CustomFeesType(
    event.params.lockIncentive,
    event.params.earmarkIncentive,
    event.params.stakerIncentive,
    event.params.platformFee
  );

  const performanceFeeId = prefixID(
    VaultFeeType.PERFORMANCE_FEE,
    NetworkConfigs.getFactoryAddress()
  );

  getOrCreateFeeType(
    performanceFeeId,
    VaultFeeType.PERFORMANCE_FEE,
    newFees.totalFees()
  );
}

export function createRewardAdd(poolId: BigInt, event: RewardAdded): void {
  const rewardPoolAddr = event.address;
  const rewardPool = getOrCreateRewardPool(poolId, rewardPoolAddr, event.block);
  const rewardsEarned = rewardPool.lastAddedRewards;

  const fees = getFees();
  const totalFees = fees.totalFees();

  const totalRewardsEarned = rewardsEarned
    .toBigDecimal()
    .div(BIGDECIMAL_ONE.minus(totalFees));

  const balToken = getOrCreateToken(BAL_TOKEN_ADDR, event.block.number);

  const totalRevenueUSD = totalRewardsEarned.times(balToken.lastPriceUSD!).div(
    BigInt.fromI32(10)
      .pow(balToken.decimals as u8)
      .toBigDecimal()
  );

  updateRevenue(poolId, totalRevenueUSD, totalFees, event);
  updateRewards(poolId, rewardPoolAddr, event);
}
