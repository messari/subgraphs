import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { Deposit, Vault as VaultContract, Withdraw } from "../../generated/beltBTC/Vault";
import { Vault, _Strategy } from "../../generated/schema";
import { BIGINT_ZERO } from "../constant";
import { getOrCreateProtocol } from "../entities/Protocol";
import { createStrategy } from "../entities/Strategy";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateVault } from "../entities/Vault";
import { readValue } from "../utils/contracts";
import { deposit } from "./deposit";
import { withdraw } from "./withdraw";

export function handleDeposit(event: Deposit): void {
  const vaultAddress = event.address;
  const tokenAddress = event.params.tokenAddress;
  const strategyAddress = event.params.strategyAddress;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(vaultAddress, tokenAddress, event.block);
  }

  let strategy = _Strategy.load(strategyAddress.toHex());
  if (strategy == null) {
    createStrategy(vault, strategyAddress, tokenAddress);
  }

  let amount = event.params.depositAmount;
  let shares = event.params.sharesMinted;

  log.warning("[BELT] handleDeposit - vault {}, amount {}, shares {}", [
    vaultAddress.toHex(),
    amount.toString(),
    shares.toString(),
  ]);

  deposit(event, vault);
}

export function handleWithdraw(event: Withdraw): void {
  const vaultAddress = event.address;
  const tokenAddress = event.params.tokenAddress;
  const strategyAddress = event.params.strategyAddress;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(vaultAddress, tokenAddress, event.block);
  }

  let strategy = _Strategy.load(strategyAddress.toHex());
  if (strategy == null) {
    createStrategy(vault, strategyAddress, tokenAddress);
  }

  let amount = event.params.withdrawAmount;
  let shares = event.params.sharesBurnt;

  log.warning("[BELT] handleWithdraw - vault {}, amount {}, shares {}", [
    vaultAddress.toHex(),
    amount.toString(),
    shares.toString(),
  ]);

  withdraw(event, vault);
}

export function createVault(vaultAddress: Address, inputTokenAddress: Address, block: ethereum.Block): Vault {
  let vault = getOrCreateVault(vaultAddress, block);
  let vaultContract = VaultContract.bind(vaultAddress);

  let protocol = getOrCreateProtocol();
  vault.name = readValue<string>(vaultContract.try_name(), "");
  vault.symbol = readValue<string>(vaultContract.try_symbol(), "");
  vault.protocol = protocol.id;

  let inputToken = getOrCreateToken(inputTokenAddress);
  vault.inputToken = inputToken.id;
  vault.inputTokenBalance = BIGINT_ZERO;

  let outputToken = getOrCreateToken(vaultAddress);
  vault.outputToken = outputToken.id;
  vault.save();

  log.warning("[BELT] vault found : vault {}", [vaultAddress.toHex()]);

  return vault;
}
