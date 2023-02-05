import * as utils from "../common/utils";
import {
  RewardPaid,
  Gauge as GaugeContract,
} from "../../generated/templates/Gauge/Gauge";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { getOrCreateToken, getOrCreateVault } from "../common/initializers";

export function handleRewardPaid(event: RewardPaid): void {
  const gaugeAddress = event.address;
  const rewardTokenAmount = event.params.reward;
  const rewardTokenAddress = event.params.rewardsToken;

  const gaugeContract = GaugeContract.bind(gaugeAddress);
  const vaultAddress = utils.readValue<Address>(
    gaugeContract.try_stakingToken(),
    constants.NULL.TYPE_ADDRESS
  );

  const vault = getOrCreateVault(vaultAddress, event.block);

  const rewardToken = getOrCreateToken(rewardTokenAddress, event.block);
  const rewardTokenDecimals = constants.BIGINT_TEN.pow(
    rewardToken.decimals as u8
  ).toBigDecimal();

  const supplySideRevenue = rewardTokenAmount
    .divDecimal(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenue,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
}
