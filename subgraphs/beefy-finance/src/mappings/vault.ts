import { BigDecimal, Address } from "@graphprotocol/graph-ts";
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
  getTokenOrCreate,
  getVaultFromStrategyOrCreate,
} from "../utils/getters";
import { getAddressFromId } from "../utils/helpers";
import { createDeposit, getOrCreateFirstDeposit } from "./deposit";
import { createWithdraw, getOrCreateFirstWithdraw } from "./withdraw";

const NETWORK_SUFFIX: string = "-137";

export function createVaultFromStrategy(
  strategyAddress: Address,
  currentBlock: ethereum.Block
): Vault {
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  const vaultAddress = strategyContract.vault();
  let vault = Vault.load(vaultAddress.toHexString() + NETWORK_SUFFIX);
  if (!vault) {
    vault = new Vault(vaultAddress.toHexString() + NETWORK_SUFFIX);
  }
  const vaultContract = BeefyVault.bind(vaultAddress);

  vault.protocol = getBeefyFinanceOrCreate().id;
  vault.name = vaultContract.name();
  vault.symbol = vaultContract.symbol();
  vault.strategy = strategyAddress.toHexString() + NETWORK_SUFFIX;

  vault.inputToken = getTokenOrCreate(
    strategyContract.want(),
    NETWORK_SUFFIX
  ).id;
  vault.outputToken = getTokenOrCreate(vaultAddress, NETWORK_SUFFIX).id;

  vault.createdTimestamp = currentBlock.timestamp;
  vault.createdBlockNumber = currentBlock.number;

  vault.inputTokenBalance = vaultContract.balance();
  vault.outputTokenSupply = vaultContract.totalSupply();

  vault.pricePerShare = vaultContract.getPricePerFullShare();

  vault.deposits = [getOrCreateFirstDeposit(vault).id];
  vault.withdraws = [getOrCreateFirstWithdraw(vault).id];

  vault.save();
  return vault;
}

export function handleDeposit(event: Deposit): void {
  const vault = getVaultFromStrategyOrCreate(
    event.address,
    event.block,
    NETWORK_SUFFIX
  );

  const depositedAmount = event.params.tvl.minus(vault.inputTokenBalance);
  //updateVault(vault);
  const deposit = createDeposit(event, depositedAmount, NETWORK_SUFFIX);

  if (vault.deposits[0] === "MockDeposit" + vault.id) {
    vault.deposits = [deposit.id];
  } else {
    vault.deposits = vault.deposits.concat([deposit.id]);
  }

  vault.save();
}

export function handleWithdraw(event: Withdraw): void {
  const vault = getVaultFromStrategyOrCreate(
    event.address,
    event.block,
    NETWORK_SUFFIX
  );
  const withdrawnAmount = vault.inputTokenBalance.minus(event.params.tvl);

  //updateVault(vault);
  const withdraw = createWithdraw(event, withdrawnAmount, NETWORK_SUFFIX);

  if (vault.withdraws[0] === "MockWithdraw" + vault.id) {
    vault.withdraws = [withdraw.id];
  } else {
    vault.withdraws = vault.withdraws.concat([withdraw.id]);
  }

  vault.save();
}

export function updateVault(vault: Vault): Vault {
  const vaultContract = BeefyVault.bind(getAddressFromId(vault.id));
  vault.inputTokenBalance = vaultContract.balance();
  vault.outputTokenSupply = vaultContract.totalSupply();
  vault.pricePerShare = vaultContract.getPricePerFullShare();
  return vault;
}
