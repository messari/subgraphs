import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { _GaugeRewardToken, _LiquidityGauge } from "../../../generated/schema";
import { LiquidityGaugeV4 as GaugeContract } from "../../../generated/templates/LiquidityGauge/LiquidityGaugeV4";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  SECONDS_PER_DAY,
} from "../../common/constants";
import { getOrCreateRewardToken } from "../../common/getters";
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

function createGaugeRewardToken(
  gaugeAddress: Address,
  rewardTokenAddress: Address,
  rewardTokenIndex: i32
): _GaugeRewardToken {
  let id = gaugeAddress
    .toHex()
    .concat("-")
    .concat(rewardTokenAddress.toHex());

  let rewardToken = new _GaugeRewardToken(id);
  rewardToken.gauge = gaugeAddress.toHex();
  rewardToken.rewardToken = rewardTokenAddress.toHex();
  rewardToken.rewardTokenIndex = rewardTokenIndex;
  rewardToken.save();

  return rewardToken;
}

export function updateRewardToken(
  gaugeAddress: Address,
  vaultAddress: Address,
  rewardTokenAddress: Address,
  block: ethereum.Block
): void {
  getOrCreateRewardToken(rewardTokenAddress);

  let vault = getOrCreateVault(vaultAddress, block);

  let gaugeRewardToken = _GaugeRewardToken.load(
    gaugeAddress
      .toHex()
      .concat("-")
      .concat(rewardTokenAddress.toHex())
  );
  // Add gauge reward token if not found
  if (!gaugeRewardToken) {
    let rewardTokens = vault.rewardTokens!;
    let emissionsAmount = vault.rewardTokenEmissionsAmount!;
    let emissionsUSD = vault.rewardTokenEmissionsUSD!;

    // Check if reward token already exists on the vault
    // This might be the case if a new gauge replaced an old one
    let rewardTokenIndex = rewardTokens.length
    for (let i = 0; i < rewardTokens.length; i++) {
      if (Address.fromString(rewardTokens[i]) == rewardTokenAddress) {
        rewardTokenIndex = i
      }
    }
    
    // Create new _GaugeRewardToken entity for future index lookup
    gaugeRewardToken = createGaugeRewardToken(
      gaugeAddress,
      rewardTokenAddress,
      rewardTokenIndex
    );

    // update rewardTokens in vault
    rewardTokens[rewardTokenIndex] = rewardTokenAddress.toHex();
    emissionsAmount[rewardTokenIndex] = BIGINT_ZERO;
    emissionsUSD[rewardTokenIndex] = BIGDECIMAL_ZERO;
    vault.rewardTokens = rewardTokens;
    vault.rewardTokenEmissionsAmount = emissionsAmount;
    vault.rewardTokenEmissionsUSD = emissionsUSD;
    vault.save();
  }
}

export function updateRewardEmission(
  gaugeAddress: Address,
  vaultAddress: Address,
  rewardTokenAddress: Address,
  block: ethereum.Block
): void {
  // Get reward token index
  const gaugeRewardTokenId = gaugeAddress
    .toHex()
    .concat("-")
    .concat(rewardTokenAddress.toHex());
  let gaugeRewardToken = _GaugeRewardToken.load(gaugeRewardTokenId)!;
  const rewardTokenIndex = gaugeRewardToken.rewardTokenIndex;

  // Update emissions
  let vault = getOrCreateVault(vaultAddress, block);

  // Calculate new rates
  let gaugeContract = GaugeContract.bind(gaugeAddress);
  const rewardData = gaugeContract.reward_data(rewardTokenAddress);
  const periodFinish = rewardData.getPeriod_finish();

  let emissionsAmount = vault.rewardTokenEmissionsAmount!;
  let emissionsUSD = vault.rewardTokenEmissionsUSD!;
  if (block.timestamp < periodFinish) {
    // Calculate rate if reward period has not ended
    const rate = rewardData.getRate(); // rate is tokens per second
    emissionsAmount[rewardTokenIndex] = rate.times(
      BigInt.fromI32(SECONDS_PER_DAY)
    );
    let rewardToken = updateTokenPrice(rewardTokenAddress, block.number);
    emissionsUSD[rewardTokenIndex] = rewardToken.lastPriceUSD!.times(
      emissionsAmount[rewardTokenIndex].toBigDecimal()
    );
  } else {
    // Set emissions to 0 if reward period has ended
    emissionsAmount[rewardTokenIndex] = BIGINT_ZERO;
    emissionsUSD[rewardTokenIndex] = BIGDECIMAL_ZERO;
  }
  vault.rewardTokenEmissionsAmount = emissionsAmount;
  vault.rewardTokenEmissionsUSD = emissionsUSD;
  vault.save();
}
