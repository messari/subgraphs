import {
  KeyToContractName,
  RocketContractNames,
} from "../constants/contractConstants";
import { createOrUpdateRocketContract } from "../entities/rocketContracts";

import { SetAddressCall } from "../../generated/rocketStorage/RocketStorage";
import {
  rocketDAONodeTrustedActions,
  rocketMinipoolManager,
  rocketMinipoolqueue,
  rocketNetworkBalances,
  rocketNetworkPrices,
  rocketNodeManager,
  rocketNodeStaking,
  rocketRewardsPool,
  rocketTokenRETH,
} from "../../generated/templates";

export function handleSetAddress(call: SetAddressCall): void {
  const contractName = KeyToContractName.get(call.inputs._key);
  if (contractName) {
    createOrUpdateRocketContract(
      contractName,
      call.inputs._key,
      call.inputs._value
    );

    if (contractName == RocketContractNames.ROCKET_DAO_NODE_TRUSTED_ACTIONS) {
      rocketDAONodeTrustedActions.create(call.inputs._value);
    }
    if (contractName == RocketContractNames.ROCKET_MINIPOOL_MANAGER) {
      rocketMinipoolManager.create(call.inputs._value);
    }
    if (contractName == RocketContractNames.ROCKET_MINIPOOL_QUEUE) {
      rocketMinipoolqueue.create(call.inputs._value);
    }
    if (contractName == RocketContractNames.ROCKET_NETWORK_BALANCES) {
      rocketNetworkBalances.create(call.inputs._value);
    }
    if (contractName == RocketContractNames.ROCKET_NETWORK_PRICES) {
      rocketNetworkPrices.create(call.inputs._value);
    }
    if (contractName == RocketContractNames.ROCKET_NODE_MANAGER) {
      rocketNodeManager.create(call.inputs._value);
    }
    if (contractName == RocketContractNames.ROCKET_NODE_STAKING) {
      rocketNodeStaking.create(call.inputs._value);
    }
    if (contractName == RocketContractNames.ROCKET_REWARDS_POOL) {
      rocketRewardsPool.create(call.inputs._value);
    }
    if (contractName == RocketContractNames.ROCKET_TOKEN_RETH) {
      rocketTokenRETH.create(call.inputs._value);
    }
  }
}
