import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../constant";
import { getOrCreateProtocol } from "./Protocol";

export function getOrCreateVault(id: Address, block: ethereum.Block): Vault {
  let vault = Vault.load(id.toHex());

  if (vault) {
    return vault;
  }

  vault = new Vault(id.toHex());

  vault.protocol = getOrCreateProtocol().id;
  vault.inputTokens = [];
  vault.outputToken = "";
  vault.rewardTokens = [];
  vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
  vault.totalVolumeUSD = BIGDECIMAL_ZERO;
  vault.inputTokenBalances = [];
  vault.outputTokenSupply = BIGINT_ZERO;
  vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  vault.rewardTokenEmissionsAmount = [];
  vault.rewardTokenEmissionsUSD = [];
  vault.createdTimestamp = block.timestamp;
  vault.createdBlockNumber = block.number;
  vault.name = "";
  vault.symbol = "";
  vault.depositLimit = BIGINT_ZERO;
  vault.fees = [];
  vault.save();

  return vault;
}
