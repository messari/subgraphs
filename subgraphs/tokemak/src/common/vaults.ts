import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, PROTOCOL_ID } from "./constants";
import { createRewardTokens, getOrCreateToken } from "./tokens";
import { Vault as VaultContract } from "../../generated/Manager/Vault";
import { YieldAggregator, Vault as VaultStore } from "../../generated/schema";
import { Vault as VaultTemplate } from "../../generated/templates";


export function createVault(vaultAddress: Address, timestamp: BigInt, blocknumber: BigInt): VaultStore {
    const vault = new VaultStore(vaultAddress.toHexString());
    const vaultContract = VaultContract.bind(Address.fromString(vault.id));
    vault.protocol = PROTOCOL_ID
    vault.name = vaultContract.name();
    vault.symbol = vaultContract.symbol();
    const inputToken = getOrCreateToken(vaultContract.underlyer());
    vault.inputTokens = [inputToken.id];
    vault.inputTokenBalances = [BIGINT_ZERO];
    const outputToken = getOrCreateToken(Address.fromString(vault.id));
  
    vault.outputToken = outputToken.id;
    vault.outputTokenSupply = BIGINT_ZERO;
    vault.totalVolumeUSD = BIGDECIMAL_ZERO;
    vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vault.createdBlockNumber = blocknumber;
    vault.createdTimestamp = timestamp;
  
    
    const rewardToken = createRewardTokens();
  
    vault.rewardTokens = [rewardToken.id];
  
    vault.fees = [];
    vault.save();
  
    let protocol = YieldAggregator.load(PROTOCOL_ID);
    if (protocol) {
      let vaultIds = protocol.vaultIds;
      vaultIds.push(vault.id);
      protocol.vaultIds = vaultIds;
      protocol.save();
    }
  
    VaultTemplate.create(vaultAddress);
    return vault;
  }
  
  export function getOrCreateVault(vaultAddress: Address, blockNumber: BigInt, timestamp: BigInt): VaultStore {
    // Note that the NewVault event are also emitted when endorseVault and newRelease
    // are called. So we only create it when necessary.
    let vault = VaultStore.load(vaultAddress.toHexString());
    if (!vault) {
      vault = createVault(vaultAddress, blockNumber, timestamp);
    }
  
    return vault;
  }
  