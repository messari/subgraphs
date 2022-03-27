import {
  RewardPaid,
  AddRewardCall,
  Gauge as GaugeContract,
  RewardAdded,
} from "../../generated/templates/Gauge/Gauge";

import * as constants from "../common/constants";
import { getUsdPriceOfToken } from "../modules/Price";
import { getOrCreateRewardToken } from "../common/utils";
import { RewardToken, Vault as VaultStore } from "../../generated/schema";
import { ethereum, BigInt, Address, log, BigDecimal } from "@graphprotocol/graph-ts";

export function handleRewardPaid(event: RewardPaid): void {
  const gaugeAddress = event.address;
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  let try_stakingToken = gaugeContract.try_stakingToken();

  const vaultAddress = try_stakingToken.reverted
    ? Address.fromString(constants.ZERO_ADDRESS)
    : try_stakingToken.value;

  const vault = VaultStore.load(vaultAddress.toHexString());
  if (vault) {

    let rewardTokenDecimals: BigInt, rewardTokenPrice: BigInt;
    let rewardTokenEmissionsAmount: Array<BigInt> = []
    let rewardTokenEmissionsUSD: Array<BigDecimal> = []

    for (let i = 0; i < vault._rewardTokensIds.length; i++) {
      
      let rewardToken = RewardToken.load(vault._rewardTokensIds[i])
      rewardTokenPrice = getUsdPriceOfToken(Address.fromString(vault._rewardTokensIds[i]));
      rewardTokenDecimals = BigInt.fromI32(10).pow(rewardToken!.decimals as u8);
      
      rewardTokenEmissionsAmount.push(event.params.reward);
      rewardTokenEmissionsUSD.push(
        rewardTokenPrice
          .times(event.params.reward)
          .div(rewardTokenDecimals)
          .toBigDecimal()
      );
    }
    vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
    vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

    vault.save();
  }
}

export function handleAddReward(call: AddRewardCall): void {
  const gaugeAddress = call.to;
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  const vaultAddress = gaugeContract.stakingToken();
  const vault = VaultStore.load(vaultAddress.toHexString());

  if (vault) {
    let rewardTokensIds: string[] = [];
    let rewardTokenAddress: Address;
    let try_rewardTokens: ethereum.CallResult<Address>;

    for (let i = 0; i <= 10; i++) {
      try_rewardTokens = gaugeContract.try_rewardTokens(BigInt.fromI32(i));

      if (try_rewardTokens.reverted) {
        break;
      }
      rewardTokenAddress = try_rewardTokens.value;
      const rewardToken = getOrCreateRewardToken(rewardTokenAddress);
      rewardTokensIds.push(rewardToken.id);
    }
    vault.rewardTokens = rewardTokensIds;
    vault._rewardTokensIds = rewardTokensIds;
    vault.save();

    log.warning(
      "[Gauge: AddReward] vaultId: {}, gaugeId: {}, rewardTokensIds: {}",
      [
        vaultAddress.toHexString(),
        gaugeAddress.toHexString(),
        rewardTokensIds.join(", "),
      ]
    );
  }
}


export function handleRewardAdded(event: RewardAdded): void {}