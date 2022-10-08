import * as utils from "../common/utils";
import {
  RewardAdded,
  RewardDataUpdate,
  Gauge as GaugeContract,
} from "../../generated/templates/Gauge/Gauge";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { updateRewardToken } from "../modules/Reward";

export function handleRewardAdded(event: RewardAdded): void {
  const gaugeAddress = event.address;

  const gaugeContract = GaugeContract.bind(gaugeAddress);
  const vaultAddress = utils.readValue<Address>(
    gaugeContract.try_stakingToken(),
    constants.NULL.TYPE_ADDRESS
  );

  updateRewardToken(vaultAddress, gaugeAddress, event.block);
}

export function handleRewardDataUpdate(event: RewardDataUpdate): void {
  const gaugeAddress = event.address;
  const vaultAddress = utils.getVaultFromGauge(gaugeAddress)

  updateRewardToken(vaultAddress, gaugeAddress, event.block);
}