import { BigInt, Address } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import { Vault } from "../../generated/schema";
import {
  UpgradeStrat,
  BeefyVault,
} from "../../generated/templates/BeefyVault/BeefyVault";
import {
  getTokenOrCreate,
  getStrategyOrCreate,
  getVaultOrCreate,
} from "../utils/getters";
import { createFirstDeposit } from "./deposit";
import { createFirstWithdraw } from "./withdraw";

const NETWORK_SUFFIX: string = "-137";

function handleUpgradeStrat(event: UpgradeStrat): void {
  const vault = getVaultOrCreate(event.address, event.block, NETWORK_SUFFIX);

  vault.strategy = getStrategyOrCreate(
    event.params.implementation,
    event.block,
    NETWORK_SUFFIX
  ).id;

  vault.save();
}

export function createVault(
  vaultAddress: Address,
  currentBlock: ethereum.Block
): Vault {
  const vault = new Vault(vaultAddress.toHexString() + NETWORK_SUFFIX);
  const vaultContract = BeefyVault.bind(vaultAddress);
  //add parameters to vault
  vault.protocol = "Assign BeefyFinance"; //type YieldAggregator
  vault.name = vaultContract.name();
  vault.symbol = vaultContract.symbol();

  vault.strategy = getStrategyOrCreate(
    vaultContract.strategy(),
    currentBlock,
    NETWORK_SUFFIX
  ).id;
  vault.inputToken = getTokenOrCreate(vaultContract.want(), NETWORK_SUFFIX).id;
  vault.outputToken = getTokenOrCreate(vaultAddress, NETWORK_SUFFIX).id;
  vault.depositLimit = new BigInt(0); //TODO: verify if there is a depositLimit
  //vault.fees = ["Assign Fee"]; //type [VaultFee] TODO: need to find contract where fees are stored
  vault.createdTimestamp = currentBlock.timestamp;
  vault.createdBlockNumber = currentBlock.number;
  vault.inputTokenBalance = vaultContract.balance();
  //vault.totalValueLockedUSD = new BigDecimal(new BigInt(0));

  vault.deposits = [createFirstDeposit(vault).id];
  vault.withdraws = [createFirstWithdraw(vault).id];

  vault.save();
  return vault;
}
