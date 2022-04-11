import { BigInt, BigDecimal, Address, ethereum, log } from "@graphprotocol/graph-ts";

import {
  DepositCall,
  DepositForCall,
  WithdrawCall,
  WithdrawalRequested,
  Withdraw1Call,
} from "../../generated/Manager/Vault";

import {
  Vault as VaultStore,
  Deposit as DepositTransaction,
  Withdraw as WithdrawTransaction,
  _Account,
  _DailyActiveAccount,
  YieldAggregator,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  BIGINT_ZERO,
  PROTOCOL_ID,
  WETH_VAULT,
} from "../common/constants";
import { getTimestampInMillis } from "../common/utils";
import { getOrCreateToken } from "../common/tokens";
import { normalizedUsdcPrice, usdcPrice } from "../price/usdcOracle";
import { getOrCreateFinancialMetrics } from "../common/financial";
import { updateUsageMetrics } from "../common/usage";
import { getOrCreateVault } from "../common/vaults";

export function handleDeposit(call: DepositCall): void {
  log.info("[Vault mappings] Handle deposit with amount {}, vault {}", [
    call.inputs.amount.toString(),
    call.to.toHexString(),
  ]);
  const vaultAddress = call.to;
  // let vault = VaultStore.load(vaultAddress.toHexString());
  let vault = getOrCreateVault(vaultAddress, call.block.number,call.block.timestamp)
  if (vault) {
    let depositAmount = call.inputs.amount;
    let sharesMinted = depositAmount;
    deposit(call, vault, depositAmount, sharesMinted);
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from);
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from);
}

export function handleDepositWithRecipient(call: DepositForCall): void {
  log.info("[Vault mappings] Handle deposit with amount {}, vault {}", [
    call.inputs.amount.toString(),
    call.to.toHexString(),
  ]);
  const vaultAddress = call.to;
  let vault = getOrCreateVault(vaultAddress, call.block.number,call.block.timestamp)
  if (vault) {
    let depositAmount = call.inputs.amount;
    let sharesMinted = depositAmount;
    deposit(call, vault, depositAmount, sharesMinted);
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from);
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from);
}

function deposit(call: ethereum.Call, vault: VaultStore, depositAmount: BigInt, sharesMinted: BigInt): void {
  if (call.transaction.value > BIGINT_ZERO && WETH_VAULT.toLowerCase() === vault.id.toLowerCase()) {
    depositAmount = call.transaction.value;
  }
  const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]));
  const amountUSD = normalizedUsdcPrice(usdcPrice(token, depositAmount));
  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(amountUSD);
  const tvl = vault.inputTokenBalances[0].plus(depositAmount);
  vault.totalValueLockedUSD = normalizedUsdcPrice(usdcPrice(token, tvl));

  vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(depositAmount)];
  vault.outputTokenSupply = vault.outputTokenSupply.plus(sharesMinted);

  vault.outputTokenPriceUSD = normalizedUsdcPrice(usdcPrice(token, BIGINT_TEN.pow(u8(token.decimals))));

  vault.save();

  getOrCreateDepositTransactionFromCall(call, depositAmount, amountUSD, "vault.deposit()");
}

export function handleWithdraw(call: WithdrawCall): void {
  log.info("[Vault mappings] Handle withdraw with shares. TX hash: {}", [call.transaction.hash.toHexString()]);
  const vaultAddress = call.to;
  let vault = getOrCreateVault(vaultAddress, call.block.number,call.block.timestamp)
  if (vault) {
    const requestedAmount = call.inputs.requestedAmount;
    const withdrawAmount = requestedAmount;
    withdraw(call, vault, withdrawAmount, requestedAmount);
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from);
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from);
}

export function handleWithdrawEthPool(call: Withdraw1Call): void {
  log.info("[Vault mappings] Handle withdraw with shares. TX hash: {}", [call.transaction.hash.toHexString()]);
  const vaultAddress = call.to;
  let vault = getOrCreateVault(vaultAddress, call.block.number,call.block.timestamp)
  if (vault) {
    const requestedAmount = call.inputs.requestedAmount;
    const withdrawAmount = requestedAmount;
    withdraw(call, vault, withdrawAmount, requestedAmount);
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from);
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from);
}

export function handleWithdrawRequest(event: WithdrawalRequested): void {
  log.info("[Vault mappings] Handle withdraw request with shares. TX hash: {}", [event.transaction.hash.toHexString()]);

  updateUsageMetrics(event.block.number, event.block.timestamp, event.params.requestor);
}
function withdraw(call: ethereum.Call, vault: VaultStore, withdrawAmount: BigInt, sharesBurnt: BigInt): void {
  const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]));
  let amountUSD = normalizedUsdcPrice(usdcPrice(token, withdrawAmount));
  const tvl = vault.inputTokenBalances[0].minus(withdrawAmount);
  vault.totalValueLockedUSD = normalizedUsdcPrice(usdcPrice(token, tvl));
  vault.outputTokenSupply = vault.outputTokenSupply.minus(sharesBurnt);

  vault.outputTokenPriceUSD = normalizedUsdcPrice(usdcPrice(token, BIGINT_TEN.pow(u8(token.decimals))));

  vault.inputTokenBalances = [tvl];
  vault.save();

  getOrCreateWithdrawTransactionFromCall(call, withdrawAmount, amountUSD, "vault.withdraw()");
}

export function getOrCreateDepositTransactionFromCall(
  call: ethereum.Call,
  amount: BigInt,
  amountUSD: BigDecimal,
  action: string,
): DepositTransaction {
  log.debug("[Transaction] Get or create deposit transaction hash {} from call action {}, to {}", [
    call.transaction.hash.toHexString(),
    action,
    call.to.toHexString(),
  ]);

  let tx = call.transaction;
  let id = "deposit-" + tx.hash.toHexString();
  let transaction = DepositTransaction.load(id);
  if (transaction == null) {
    transaction = new DepositTransaction(id);
    transaction.logIndex = tx.index.toI32();
    transaction.to = call.to.toHexString();
    transaction.from = tx.from.toHexString();
    transaction.hash = tx.hash.toHexString();
    transaction.timestamp = getTimestampInMillis(call.block);
    transaction.blockNumber = call.block.number;
    transaction.protocol = PROTOCOL_ID;
    transaction.vault = call.to.toHexString();

    const vault = getOrCreateVault(call.to, call.block.number,call.block.timestamp)
    if (vault) {
      transaction.asset = vault.inputTokens[0];
    }
    transaction.amount = amount;
    transaction.amountUSD = amountUSD;
    transaction.save();
  }
  return transaction;
}

export function getOrCreateWithdrawTransactionFromCall(
  call: ethereum.Call,
  amount: BigInt,
  amountUSD: BigDecimal,
  action: string,
): WithdrawTransaction {
  log.debug("[Transaction] Get or create withdraw transaction hash {} from call action {}, to {}", [
    call.transaction.hash.toHexString(),
    action,
    call.to.toHexString(),
  ]);

  let tx = call.transaction;
  let id = "withdraw-" + tx.hash.toHexString();
  let transaction = WithdrawTransaction.load(id);
  if (transaction == null) {
    transaction = new WithdrawTransaction(id);
    transaction.logIndex = tx.index.toI32();
    transaction.to = call.to.toHexString();
    transaction.from = tx.from.toHexString();
    transaction.hash = tx.hash.toHexString();
    transaction.timestamp = getTimestampInMillis(call.block);
    transaction.blockNumber = call.block.number;
    transaction.protocol = PROTOCOL_ID;
    transaction.vault = call.to.toHexString();

    const vault = getOrCreateVault(call.to, call.block.number,call.block.timestamp)
    if (vault) {
      transaction.asset = vault.inputTokens[0];
    }
    transaction.amount = amount;
    transaction.amountUSD = amountUSD;
    transaction.save();
  }
  return transaction;
}

function updateFinancials(blockNumber: BigInt, timestamp: BigInt, from: Address): void {
  let financialMetrics = getOrCreateFinancialMetrics(timestamp);

  let protocolTvlUsd = BIGDECIMAL_ZERO;
  let protocolVolumeUsd = BIGDECIMAL_ZERO;
  const protocol = YieldAggregator.load(PROTOCOL_ID);
  if (protocol) {
    for (let i = 0; i < protocol.vaultIds.length; i++) {
      const vaultId = protocol.vaultIds[i];

      let vault = getOrCreateVault(Address.fromString(vaultId), blockNumber,timestamp)
      if (vault) {
        const vaultTvlUsd = vault.totalValueLockedUSD;
        const vaultVolumeUsd = vault.totalVolumeUSD;
        protocolTvlUsd = protocolTvlUsd.plus(vaultTvlUsd);
        protocolVolumeUsd = protocolVolumeUsd.plus(vaultVolumeUsd);
      }
    }
    protocol.totalValueLockedUSD = protocolTvlUsd;
    protocol.save();
    financialMetrics.totalValueLockedUSD = protocolTvlUsd;
    financialMetrics.totalVolumeUSD = protocolVolumeUsd;
  }

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = blockNumber;
  financialMetrics.timestamp = timestamp;

  financialMetrics.save();
}
