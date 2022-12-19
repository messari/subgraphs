import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Deposit as DepositEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
} from "../generated/Controller/VaultContract";
import { Vault } from "../generated/schema";
import { Token } from "../generated/schema";
import { getPricePerToken } from "./utils/prices";
import { deposits } from "./utils/deposits";
import { withdraws } from "./utils/withdraws";
import { metrics } from "./utils/metrics";

export function handleWithdraw(event: WithdrawEvent): void {
  const beneficiary = event.params.beneficiary;
  const amount = event.params.amount;

  const vaultAddress = event.address;

  const vault = Vault.load(vaultAddress.toHexString());

  if (!vault) return;

  const id = withdraws.generateId(event.transaction.hash, event.logIndex);

  const withdraw = withdraws.initialize(id);

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = vault.protocol;
  withdraw.to = beneficiary.toHexString();
  withdraw.from = event.transaction.from.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.asset = vault.inputToken;
  withdraw.amount = amount;
  withdraw.vault = vault.id;

  withdraw.save();

  vault.inputTokenBalance = vault.inputTokenBalance.minus(amount);

  const token = Token.load(vault.inputToken);
  if (token) {
    const tokenPriceUSD = getPricePerToken(
      Address.fromString(vault.inputToken)
    );

    token.lastPriceUSD = tokenPriceUSD;
    token.lastPriceBlockNumber = event.block.number;

    const inputTokenBase10 = BigInt.fromI32(10).pow(token.decimals as u8);

    vault.totalValueLockedUSD = vault.inputTokenBalance
      .div(inputTokenBase10)
      .toBigDecimal()
      .times(tokenPriceUSD);

    token.save();
  }

  vault.save();

  metrics.updateFinancials(event.block);
  metrics.updateUsageMetrics(event.block, event.transaction.from);
  metrics.updateVaultSnapshots(vaultAddress, event.block);
}

export function handleDeposit(event: DepositEvent): void {
  const amount = event.params.amount;
  const beneficiary = event.params.beneficiary;
  const vaultAddress = event.address;

  const vault = Vault.load(vaultAddress.toHexString());

  if (!vault) return;

  const id = deposits.generateId(event.transaction.hash, event.logIndex);

  const deposit = deposits.initialize(id);
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = vault.protocol;
  deposit.to = beneficiary.toHexString();
  deposit.from = event.transaction.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.asset = vault.inputToken;
  deposit.amount = amount;
  deposit.vault = vault.id;

  deposit.save();

  vault.inputTokenBalance = vault.inputTokenBalance.plus(amount);

  // TODO: avoid duplicated code, move to a function or something
  const token = Token.load(vault.inputToken);
  if (token) {
    const tokenPriceUSD = getPricePerToken(
      Address.fromString(vault.inputToken)
    );

    token.lastPriceUSD = tokenPriceUSD;
    token.lastPriceBlockNumber = event.block.number;

    const inputTokenBase10 = BigInt.fromI32(10).pow(token.decimals as u8);

    vault.totalValueLockedUSD = vault.inputTokenBalance
      .div(inputTokenBase10)
      .toBigDecimal()
      .times(tokenPriceUSD);

    token.save();
  }

  vault.save();

  metrics.updateFinancials(event.block);
  metrics.updateUsageMetrics(event.block, event.transaction.from);
  metrics.updateVaultSnapshots(vaultAddress, event.block);
}

function handleMint(event: TransferEvent): void {
  // const from = event.params.from;
  // const to = event.params.to;
  const amount = event.params.value;
  const vaultAddress = event.address;

  const vault = Vault.load(vaultAddress.toHexString());

  if (!vault) return;

  if (!vault.outputTokenSupply) {
    vault.outputTokenSupply = BigInt.fromI32(0);
  }

  vault.outputTokenSupply = vault.outputTokenSupply!.plus(amount);

  vault.save();

  metrics.updateFinancials(event.block);
  metrics.updateUsageMetrics(event.block, event.transaction.from);
  metrics.updateVaultSnapshots(vaultAddress, event.block);
}

export function handleTransfer(event: TransferEvent): void {
  const from = event.params.from;

  if (from == Address.zero()) {
    handleMint(event);
    return;
  }
}
