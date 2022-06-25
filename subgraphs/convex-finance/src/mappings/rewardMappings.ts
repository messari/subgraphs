import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Vault as VaultStore } from "../../generated/schema";
import { getOrCreateRewardTokenInfo } from "../modules/Tokens";
import {
  AddExtraRewardCall,
  ClearExtraRewardsCall,
} from "../../generated/templates/PoolCrvRewards/BaseRewardPool";
import { BaseRewardPool } from "../../generated/Booster/BaseRewardPool";
import { Address, BigInt, dataSource, log } from "@graphprotocol/graph-ts";

export function handleAddExtraReward(call: AddExtraRewardCall): void {
  const context = dataSource.context();
  const poolId = context.getString("poolId");

  const vaultId = constants.CONVEX_BOOSTER_ADDRESS.toHexString()
    .concat("-")
    .concat(poolId.toString());

  const vault = VaultStore.load(vaultId);
  if (!vault) return;

  const newRewardPoolAddress = call.inputs._reward;
  const newRewardPoolContract = BaseRewardPool.bind(newRewardPoolAddress);

  const newRewardTokenAddress = utils.readValue<Address>(
    newRewardPoolContract.try_rewardToken(),
    constants.ZERO_ADDRESS
  );

  getOrCreateRewardTokenInfo(
    BigInt.fromString(poolId),
    call.block,
    newRewardTokenAddress,
    newRewardPoolAddress
  );

  let rewardTokens = vault.rewardTokens;
  if (rewardTokens) {
    rewardTokens.push(newRewardTokenAddress.toHexString());
    vault.rewardTokens = rewardTokens;
  } else vault.rewardTokens = [newRewardTokenAddress.toHexString()];

  let emissionAmount = vault.rewardTokenEmissionsAmount;
  if (emissionAmount) {
    emissionAmount.push(constants.BIGINT_ZERO);
    vault.rewardTokenEmissionsAmount = emissionAmount;
  } else vault.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];

  let emissionAmountUSD = vault.rewardTokenEmissionsUSD;
  if (emissionAmountUSD) {
    emissionAmountUSD.push(constants.BIGDECIMAL_ZERO);
    vault.rewardTokenEmissionsUSD = emissionAmountUSD;
  } else vault.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];

  vault.save();

  log.warning("[AddExtraRewards] PoolId: {}, rewardTokens: [{}], TxHash: {}", [
    poolId.toString(),
    vault.rewardTokens!.join(", "),
    call.transaction.hash.toHexString(),
  ]);
}

export function handleClearExtraRewards(call: ClearExtraRewardsCall): void {
  const context = dataSource.context();
  const poolId = context.getString("poolId");
  const vaultId = constants.CONVEX_BOOSTER_ADDRESS.toHexString()
    .concat("-")
    .concat(poolId.toString());

  const vault = VaultStore.load(vaultId);
  if (!vault) return;

  const crvRewardsAddress = dataSource.address();
  const rewardsContract = BaseRewardPool.bind(crvRewardsAddress);
  let rewardToken = utils.readValue<Address>(
    rewardsContract.try_rewardToken(),
    constants.ZERO_ADDRESS
  );

  vault.rewardTokens = [rewardToken.toHexString()];
  vault.save();

  log.warning("[ClearExtraRewards] PoolId: {}, TxHash: {}", [
    poolId.toString(),
    call.transaction.hash.toHexString(),
  ]);
}
