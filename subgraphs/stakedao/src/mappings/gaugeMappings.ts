import {
  RewardPaid,
  AddRewardCall,
  Gauge as GaugeContract,
} from "../../generated/templates/Gauge/Gauge";

import * as constants from "../common/constants";
import { getOrCreateRewardToken } from "../common/utils";
import { Vault as VaultStore } from "../../generated/schema";
import { ethereum, BigInt, Address, log } from "@graphprotocol/graph-ts";

export function handleRewardPaid(event: RewardPaid): void {
  const gaugeAddress = event.address;
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  let try_stakingToken = gaugeContract.try_stakingToken();

  const vaultAddress = try_stakingToken.reverted
    ? Address.fromString(constants.ZERO_ADDRESS)
    : try_stakingToken.value;

  const vault = VaultStore.load(vaultAddress.toHexString());
  if (vault) {
    vault.totalRewardTokenEmissions = event.params.reward;

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
