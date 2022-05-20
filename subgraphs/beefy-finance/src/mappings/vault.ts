import { Address } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import { Vault } from "../../generated/schema";
import {
  BeefyStrategy,
  Deposit,
  Withdraw,
} from "../../generated/ExampleVault/BeefyStrategy";
import { BeefyVault } from "../../generated/ExampleVault/BeefyVault";
import {
  getBeefyFinanceOrCreate,
  getVaultOrCreate,
  getTokenOrCreate,
} from "../utils/getters";
import { createDeposit, getOrCreateFirstDeposit } from "./deposit";
import { createWithdraw, getOrCreateFirstWithdraw } from "./withdraw";

const NETWORK_SUFFIX: string = "-137";

export function createVault(
  vaultAddress: Address,
  currentBlock: ethereum.Block
): Vault {
  const vault = new Vault(vaultAddress.toHexString() + NETWORK_SUFFIX);
  const strategyContract = BeefyStrategy.bind(vaultAddress);
  const vaultContract = BeefyVault.bind(strategyContract.vault());

  vault.protocol = getBeefyFinanceOrCreate(NETWORK_SUFFIX).id;
  vault.name = vaultContract.name();
  vault.symbol = vaultContract.symbol();
  vault.inputToken = getTokenOrCreate(
    strategyContract.want(),
    NETWORK_SUFFIX
  ).id;
  vault.outputToken = getTokenOrCreate(
    vaultContract._address,
    NETWORK_SUFFIX
  ).id;
  vault.createdTimestamp = currentBlock.timestamp;
  vault.createdBlockNumber = currentBlock.number;

  vault.inputTokenBalance = strategyContract.balanceOf();
  vault.outputTokenSupply = vaultContract.totalSupply();
  vault.pricePerShare = vaultContract.getPricePerFullShare();

  vault.deposits = [getOrCreateFirstDeposit(vault).id];
  vault.withdraws = [getOrCreateFirstWithdraw(vault).id];

  vault.save();
  return vault;
}

export function handleDeposit(event: Deposit): void {
  const vault = getVaultOrCreate(event.address, event.block, NETWORK_SUFFIX);
  const depositedAmount = event.params.tvl.minus(vault.inputTokenBalance);

  vault.inputTokenBalance = event.params.tvl;

  const deposit = createDeposit(event, depositedAmount, NETWORK_SUFFIX);

  if (vault.deposits[0] == "MockDeposit") {
    vault.deposits = [deposit.id];
  } else {
    vault.deposits = vault.deposits.concat([deposit.id]);
  }

  vault.save();
}

export function handleWithdraw(event: Withdraw): void {
  const vault = getVaultOrCreate(event.address, event.block, NETWORK_SUFFIX);
  const withdrawnAmount = vault.inputTokenBalance.minus(event.params.tvl);

  vault.inputTokenBalance = event.params.tvl;

  const withdraw = createWithdraw(event, withdrawnAmount, NETWORK_SUFFIX);

  if (vault.withdraws[0] == "MockWithdraw") {
    vault.withdraws = [withdraw.id];
  } else {
    vault.withdraws = vault.withdraws.concat([withdraw.id]);
  }

  vault.save();
}
