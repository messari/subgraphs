import { BigInt, Address, BigDecimal, log, ethereum } from "@graphprotocol/graph-ts";
import { PoolRegistered } from "../../generated/Manager/Manager";
import { Vault as VaultContract } from "../../generated/Manager/Vault";
import { Vault as VaultTemplate } from "../../generated/templates";
import { YieldAggregator, Vault as VaultStore, VaultFee, RewardToken } from "../../generated/schema";
import { getOrCreateRewardToken, getOrCreateToken } from "../common/tokens";
import {
  BIGDECIMAL_ZERO,
  PROTOCOL_ID,
  Network,
  ProtocolType,
  VaultFeeType,
  TOKE_ADDRESS,
  RewardTokenType,
  BIGINT_ZERO,
} from "../common/constants";
import { getOrCreateProtocol } from "../common/protocol";

function createRewardTokens(): void {
  const address = Address.fromString(TOKE_ADDRESS);
  getOrCreateRewardToken(address);
 
}

export function handlePoolRegistered(event: PoolRegistered): void {
  getOrCreateProtocol();
  createRewardTokens();
  getOrCreateVault(event.params.pool, event);
}

function getOrCreateVault(vaultAddress: Address, event: ethereum.Event): VaultStore {
  // Note that the NewVault event are also emitted when endorseVault and newRelease
  // are called. So we only create it when necessary.
  let vault = VaultStore.load(vaultAddress.toHexString());
  if (!vault) {
    vault = new VaultStore(vaultAddress.toHexString());
    const vaultContract = VaultContract.bind(Address.fromString(vault.id));
    vault.protocol = PROTOCOL_ID;
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
    vault.createdBlockNumber = event.block.number;
    vault.createdTimestamp = event.block.timestamp;

    const rewardToken = getOrCreateRewardToken(Address.fromString(TOKE_ADDRESS));
   
    
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
  }

  return vault;
}
