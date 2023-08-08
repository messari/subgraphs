import { Address, ByteArray, crypto, TypedMap } from "@graphprotocol/graph-ts";

// Used when encountering the ZERO address.
export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";
export const ZERO_ADDRESS = Address.fromString(ZERO_ADDRESS_STRING);

export namespace RocketContractNames {
  export const ROCKET_VAULT = "rocketVault";
  export const ROCKET_TOKEN_RETH = "rocketTokenRETH";
  export const ROCKET_NETWORK_BALANCES = "rocketNetworkBalances";
  export const ROCKET_NETWORK_PRICES = "rocketNetworkPrices";
  export const ROCKET_NODE_MANAGER = "rocketNodeManager";
  export const ROCKET_NODE_STAKING = "rocketNodeStaking";
  export const ROCKET_REWARDS_POOL = "rocketRewardsPool";
  export const ROCKET_MINIPOOL_MANAGER = "rocketMinipoolManager";
  export const ROCKET_MINIPOOL_QUEUE = "rocketMinipoolQueue";
  export const ROCKET_MINIPOOL_DELEGATE = "rocketMinipoolDelegate";
  export const ROCKET_DAO_NODE_TRUSTED_ACTIONS = "rocketDAONodeTrustedActions";
  export const ROCKET_DEPOSIT_POOL = "rocketDepositPool";
  export const ROCKET_NODE_DEPOSIT = "rocketNodeDeposit";
  export const ROCKET_CLAIM_DAO = "rocketClaimDAO";
  export const ROCKET_CLAIM_NODE = "rocketClaimNode";
  export const ROCKET_CLAIM_TRUSTED_NODE = "rocketClaimTrustedNode";
  export const ROCKET_DAO_NODE_TRUSTED = "rocketDAONodeTrusted";
  export const ROCKET_NETWORK_FEES = "rocketNetworkFees";
  export const ROCKET_DAO_SETTINGS_MINIPOOL =
    "rocketDAOProtocolSettingsMinipool";
  export const ROCKET_DAO_SETTINGS_NODE = "rocketDAOProtocolSettingsNode";
  export const ROCKET_AUCTION_MANAGER = "rocketAuctionManager";
}

// https://docs.rocketpool.net/developers/usage/contracts/contracts.html#interacting-with-rocket-pool
export const KeyToContractName = new TypedMap<ByteArray, string>();

function setKeyToContractName(): void {
  const contractNames = [
    RocketContractNames.ROCKET_VAULT,
    RocketContractNames.ROCKET_TOKEN_RETH,
    RocketContractNames.ROCKET_NETWORK_BALANCES,
    RocketContractNames.ROCKET_NETWORK_PRICES,
    RocketContractNames.ROCKET_NODE_MANAGER,
    RocketContractNames.ROCKET_NODE_STAKING,
    RocketContractNames.ROCKET_REWARDS_POOL,
    RocketContractNames.ROCKET_MINIPOOL_MANAGER,
    RocketContractNames.ROCKET_MINIPOOL_QUEUE,
    RocketContractNames.ROCKET_MINIPOOL_DELEGATE,
    RocketContractNames.ROCKET_DAO_NODE_TRUSTED_ACTIONS,
    RocketContractNames.ROCKET_DEPOSIT_POOL,
    RocketContractNames.ROCKET_NODE_DEPOSIT,
    RocketContractNames.ROCKET_CLAIM_DAO,
    RocketContractNames.ROCKET_CLAIM_NODE,
    RocketContractNames.ROCKET_CLAIM_TRUSTED_NODE,
    RocketContractNames.ROCKET_DAO_NODE_TRUSTED,
    RocketContractNames.ROCKET_NETWORK_FEES,
    RocketContractNames.ROCKET_DAO_SETTINGS_MINIPOOL,
    RocketContractNames.ROCKET_DAO_SETTINGS_NODE,
    RocketContractNames.ROCKET_AUCTION_MANAGER,
  ];

  for (let i = 0; i < contractNames.length; i++) {
    KeyToContractName.set(
      crypto.keccak256(
        ByteArray.fromUTF8("contract.address".concat(contractNames[i]))
      ),
      contractNames[i]
    );
  }
}
setKeyToContractName();
