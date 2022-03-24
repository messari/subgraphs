import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Vault } from '../../generated/schema';

export function getOrCreateVault(id: Address, block: ethereum.Block): Vault {
  let vault = Vault.load(id.toHex());

  if (vault) {
    return vault;
  }

  vault = new Vault(id.toHex());

  vault.protocol = '';
  vault.inputTokens = [];
  vault.outputToken = '';
  vault.rewardTokens = [];
  vault.totalValueLockedUSD = BigDecimal.zero();
  vault.totalVolumeUSD = BigDecimal.zero();
  vault.inputTokenBalances = [];
  vault.outputTokenSupply = BigInt.zero();
  vault.outputTokenPriceUSD = BigDecimal.zero();
  vault.createdTimestamp = block.timestamp;
  vault.createdBlockNumber = block.number;
  vault.name = '';
  vault.symbol = '';
  vault.depositLimit = BigInt.zero();
  vault.fees = [];
  vault.save();

  return vault;
}
