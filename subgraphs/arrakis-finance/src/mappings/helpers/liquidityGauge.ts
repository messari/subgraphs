import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { _LiquidityGauge, Vault } from "../../../generated/schema";
import { LiquidityGaugeV4 as GaugeContract } from "../../../generated/templates/LiquidityGauge/LiquidityGaugeV4";
import {
  RewardTokenType,
  SECONDS_PER_DAY,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
} from "../../common/constants";
import { getOrCreateRewardToken } from "../../common/getters";
import { bigIntToBigDecimal } from "../../common/utils/numbers";
import { updateTokenPrice } from "./pricing";
import { getOrCreateVault } from "./vaults";

export function getOrCreateLiquidityGauge(
  gaugeAddress: Address
): _LiquidityGauge {
  let gauge = _LiquidityGauge.load(gaugeAddress.toHex());

  if (!gauge) {
    gauge = new _LiquidityGauge(gaugeAddress.toHex());
    gauge.vault = "";
    gauge.save();
  }
  return gauge;
}

export function updateRewardTokens(
  rewardTokenAddress: Address,
  vault: Vault
): void {
  const rewardToken = getOrCreateRewardToken(
    rewardTokenAddress,
    RewardTokenType.DEPOSIT
  );

  let rewardTokens = vault.rewardTokens;
  let rewardEmission = vault.rewardTokenEmissionsAmount;
  let rewardEmissionUSD = vault.rewardTokenEmissionsUSD;
  if (!rewardTokens) {
    rewardTokens = [];
    rewardEmission = [];
    rewardEmissionUSD = [];
  }
  const index = rewardTokens.indexOf(rewardToken.id);
  if (index == -1) {
    rewardTokens.push(rewardToken.id);
    rewardEmission!.push(BIGINT_ZERO);
    rewardEmissionUSD!.push(BIGDECIMAL_ZERO);
  }
  vault.rewardTokens = rewardTokens;
  vault.rewardTokenEmissionsAmount = rewardEmission;
  vault.rewardTokenEmissionsUSD = rewardEmissionUSD;
  vault.save();
}

export function updateRewardEmission(
  gaugeAddress: Address,
  vaultAddress: Address,
  rewardTokenAddress: Address,
  event: ethereum.Event
): void {
  const block = event.block;
  const rewardTokenId = `${
    RewardTokenType.DEPOSIT
  }-${rewardTokenAddress.toHexString()}`;

  // Update emissions
  const vault = getOrCreateVault(vaultAddress, block);
  // Calculate new rates
  const gaugeContract = GaugeContract.bind(gaugeAddress);
  const rewardDataResult = gaugeContract.try_reward_data(rewardTokenAddress);
  if (rewardDataResult.reverted) {
    log.error(
      "[updateRewardEmission]gauge.reward_data() call for gauge {} and token {} reverted tx {}-{}",
      [
        gaugeAddress.toHexString(),
        rewardTokenAddress.toHexString(),
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return;
  }
  // TODO: Remove periodFinish
  const periodFinish = rewardDataResult.value.getPeriod_finish();
  const rate = rewardDataResult.value.getRate(); // rate is tokens per second

  const rewardTokens = vault.rewardTokens!;
  const emissionsAmount = vault.rewardTokenEmissionsAmount!;
  const emissionsUSD = vault.rewardTokenEmissionsUSD!;
  // TODO: Remove
  log.info(
    "[updateRewardEmission]vault={},vault.emissionsAmount={},vault.emissionsUSD={}",
    [
      vaultAddress.toHexString(),
      emissionsAmount.toString(),
      emissionsUSD.toString(),
    ]
  );
  const rewardTokenIndex = rewardTokens.indexOf(rewardTokenId);
  if (rewardTokenIndex == -1) {
    log.error(
      "[updateRewardEmission]rewardTokenId {} not found in vault.rewardTokens [{}] for vault {} tx {}-{}",
      [
        rewardTokenId,
        rewardTokens.toString(),
        vault.id,
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return;
  }

  // rate is valid no matter Period_finish has ended or not
  // https://github.com/ArrakisFinance/polygon-staking/blob/85dc3f4abc579d861205353a3a0141cc73df3baa/vyper/contracts/LiquidityGaugeV4.vy#L600-L605
  emissionsAmount[rewardTokenIndex] = rate.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  const rewardToken = updateTokenPrice(rewardTokenAddress, block.number);
  emissionsUSD[rewardTokenIndex] = rewardToken.lastPriceUSD!.times(
    bigIntToBigDecimal(emissionsAmount[rewardTokenIndex], rewardToken.decimals)
  );
  // TODO: Remove
  log.info(
    "[updateRewardEmission]vault={},gauge={},rewardToken={},periodFinish={},rate={},emissionsAmount={},emissionsUSD={},tx={}-{}",
    [
      vaultAddress.toHexString(),
      gaugeAddress.toHexString(),
      rewardTokenAddress.toHexString(),
      periodFinish.toString(),
      rate.toString(),
      emissionsAmount[rewardTokenIndex].toString(),
      emissionsUSD[rewardTokenIndex].toString(),
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toString(),
    ]
  );

  vault.rewardTokenEmissionsAmount = emissionsAmount;
  vault.rewardTokenEmissionsUSD = emissionsUSD;
  vault.save();

  // TODO: Remove
  log.info(
    "[updateRewardEmission]vault={},vault.emissionsAmount={},vault.emissionsUSD={}",
    [
      vaultAddress.toHexString(),
      vault.rewardTokenEmissionsAmount!.toString(),
      vault.rewardTokenEmissionsUSD!.toString(),
    ]
  );
}
