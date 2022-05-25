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
} from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_TEN,
  BIGINT_ZERO,
  CallType,
  PROTOCOL_ID,
  WETH_VAULT,
} from "../common/constants";
import { convertTokenDecimals, getTimestampInMillis } from "../common/utils";
import { getOrCreateToken } from "../common/tokens";
import { getOrCreateFinancialMetrics, updateFinancials } from "../common/financial";
import { updateUsageMetrics } from "../common/usage";
import { getOrCreateVault, updateVaultSnapshots } from "../common/vaults";
import { getUsdPrice } from "../prices";
import { getOrCreateProtocol } from "../common/protocol";

export function handleDeposit(call: DepositCall): void {
  log.info("[Vault mappings] Handle deposit with amount {}, vault {}", [
    call.inputs.amount.toString(),
    call.to.toHexString(),
  ]);
  const vaultAddress = call.to;
  // let vault = VaultStore.load(vaultAddress.toHexString());
  let vault = getOrCreateVault(vaultAddress, call.block.number, call.block.timestamp);
  if (vault) {
    let depositAmount = call.inputs.amount;
    let sharesMinted = depositAmount;
    deposit(call, vault, depositAmount, sharesMinted);
  }
  updateFinancials(call.block.number, call.block.timestamp);
  updateUsageMetrics(call.block, call.from, CallType.DEPOSIT);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositWithRecipient(call: DepositForCall): void {
  log.info("[Vault mappings] Handle deposit with amount {}, vault {}", [
    call.inputs.amount.toString(),
    call.to.toHexString(),
  ]);
  const vaultAddress = call.to;
  let vault = getOrCreateVault(vaultAddress, call.block.number, call.block.timestamp);
  if (vault) {
    let depositAmount = call.inputs.amount;
    let sharesMinted = depositAmount;
    deposit(call, vault, depositAmount, sharesMinted);
  }
  updateFinancials(call.block.number, call.block.timestamp);
  updateUsageMetrics(call.block, call.from, CallType.DEPOSIT);
  updateVaultSnapshots(vaultAddress, call.block);
}

function deposit(call: ethereum.Call, vault: VaultStore, depositAmount: BigInt, sharesMinted: BigInt): void {
  if (call.transaction.value > BIGINT_ZERO && WETH_VAULT.toLowerCase() === vault.id.toLowerCase()) {
    depositAmount = call.transaction.value;
  }
  const token = getOrCreateToken(Address.fromString(vault.inputToken));

  const outputToken = getOrCreateToken(Address.fromString(vault.outputToken));

  const protocol = getOrCreateProtocol();

  const tokenPrice = getUsdPrice(Address.fromString(token.id), BIGDECIMAL_ONE);

  const decimals = BIGINT_TEN.pow(u8(token.decimals));
  const amountUSD = tokenPrice.times(depositAmount.toBigDecimal()).div(decimals.toBigDecimal());

  const tvl = vault.inputTokenBalance.plus(depositAmount);
  vault.totalValueLockedUSD = tokenPrice.times(tvl.toBigDecimal()).div(decimals.toBigDecimal());

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);

  vault.inputTokenBalance = tvl;
  vault.outputTokenSupply = vault.outputTokenSupply.plus(
    convertTokenDecimals(sharesMinted, token.decimals, outputToken.decimals),
  );

  vault.outputTokenPriceUSD = tokenPrice.times(
    convertTokenDecimals(decimals, token.decimals, outputToken.decimals).toBigDecimal(),
  );

  vault.pricePerShare = decimals.toBigDecimal();
  vault.save();
  protocol.save();
  getOrCreateDepositTransactionFromCall(call, depositAmount, amountUSD, "vault.deposit()");
}

export function handleWithdraw(call: WithdrawCall): void {
  log.info("[Vault mappings] Handle withdraw with shares. TX hash: {}", [call.transaction.hash.toHexString()]);
  const vaultAddress = call.to;
  let vault = getOrCreateVault(vaultAddress, call.block.number, call.block.timestamp);
  if (vault) {
    const requestedAmount = call.inputs.requestedAmount;
    const withdrawAmount = requestedAmount;
    withdraw(call, vault, withdrawAmount, requestedAmount);
  }
  updateFinancials(call.block.number, call.block.timestamp);
  updateUsageMetrics(call.block, call.from, CallType.WITHDRAW);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdrawEthPool(call: Withdraw1Call): void {
  log.info("[Vault mappings] Handle withdraw with shares. TX hash: {}", [call.transaction.hash.toHexString()]);
  const vaultAddress = call.to;
  let vault = getOrCreateVault(vaultAddress, call.block.number, call.block.timestamp);
  if (vault) {
    const requestedAmount = call.inputs.requestedAmount;
    const withdrawAmount = requestedAmount;
    withdraw(call, vault, withdrawAmount, requestedAmount);
  }
  updateFinancials(call.block.number, call.block.timestamp);
  updateUsageMetrics(call.block, call.from, CallType.WITHDRAW);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdrawRequest(event: WithdrawalRequested): void {
  log.info("[Vault mappings] Handle withdraw request with shares. TX hash: {}", [event.transaction.hash.toHexString()]);

  updateUsageMetrics(event.block, event.params.requestor);
}
function withdraw(call: ethereum.Call, vault: VaultStore, withdrawAmount: BigInt, sharesBurnt: BigInt): void {
  const token = getOrCreateToken(Address.fromString(vault.inputToken));

  const outputToken = getOrCreateToken(Address.fromString(vault.outputToken));

  const protocol = getOrCreateProtocol();
  const tokenPrice = getUsdPrice(Address.fromString(token.id), BIGDECIMAL_ONE);

  const decimals = BIGINT_TEN.pow(u8(token.decimals));
  const amountUSD = tokenPrice.times(withdrawAmount.div(decimals).toBigDecimal());

  const tvl = vault.inputTokenBalance.minus(withdrawAmount);
  vault.totalValueLockedUSD = tokenPrice.times(tvl.div(decimals).toBigDecimal());

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(amountUSD);

  vault.outputTokenSupply = vault.outputTokenSupply.minus(
    convertTokenDecimals(sharesBurnt, token.decimals, outputToken.decimals),
  );

  vault.outputTokenPriceUSD = tokenPrice.times(
    convertTokenDecimals(decimals, token.decimals, outputToken.decimals).toBigDecimal(),
  );
  vault.inputTokenBalance = tvl;

  vault.pricePerShare = decimals.toBigDecimal();

  vault.save();
  protocol.save();

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
    transaction.timestamp = call.block.timestamp;
    transaction.blockNumber = call.block.number;
    transaction.protocol = PROTOCOL_ID;
    transaction.vault = call.to.toHexString();

    const vault = getOrCreateVault(call.to, call.block.number, call.block.timestamp);
    if (vault) {
      transaction.asset = vault.inputToken;
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
    transaction.timestamp = call.block.timestamp;
    transaction.blockNumber = call.block.number;
    transaction.protocol = PROTOCOL_ID;
    transaction.vault = call.to.toHexString();

    const vault = getOrCreateVault(call.to, call.block.number, call.block.timestamp);
    if (vault) {
      transaction.asset = vault.inputToken;
    }
    transaction.amount = amount;
    transaction.amountUSD = amountUSD;
    transaction.save();
  }
  return transaction;
}
