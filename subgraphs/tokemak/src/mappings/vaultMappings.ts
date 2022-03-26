import { BigInt, BigDecimal, Address, ethereum, log } from "@graphprotocol/graph-ts"

import {
  Vault as VaultContract,
  DepositCall, DepositForCall,
  WithdrawCall
} from "../../generated/Registry/Vault"

import {
  Vault as VaultStore,
  Deposit as DepositTransaction,
  Withdraw as WithdrawTransaction,
  UsageMetricsDailySnapshot,
  _Account,
  _DailyActiveAccount,
  FinancialsDailySnapshot,
  YieldAggregator,
} from "../../generated/schema"
import { BIGDECIMAL_ZERO, BIGINT_MAX, BIGINT_ONE, BIGINT_ZERO, ETH_MAINNET_REGISTRY_ADDRESS, PROTOCOL_ID, SECONDS_PER_DAY, VaultFeeType } from "../common/constants"
import { bigIntToPercentage, getTimestampInMillis } from "../common/utils"
import { getOrCreateToken } from "../common/tokens"
import { normalizedUsdcPrice, usdcPrice } from "../price/usdcOracle"

export function handleDeposit(call: DepositCall): void {
  log.info('[Vault mappings] Handle deposit with amount {}, vault {}', [call.inputs.amount.toString(), call.to.toHexString()])
  const vaultAddress = call.to;
  let vault = VaultStore.load(vaultAddress.toHexString())
  if (vault) {
    let depositAmount = call.inputs.amount
    let sharesMinted  = depositAmount
    deposit(call, vault, depositAmount, sharesMinted)
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from)
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}

export function handleDepositWithRecipient(call: DepositForCall): void {
  log.info('[Vault mappings] Handle deposit with amount {}, vault {}', [call.inputs.amount.toString(), call.to.toHexString()]);
  const vaultAddress = call.to;
  let vault = VaultStore.load(vaultAddress.toHexString());
  if (vault) {
    let depositAmount = call.inputs.amount
    let sharesMinted  = depositAmount
    deposit(call, vault, depositAmount, sharesMinted)
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from)
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}

function deposit(call: ethereum.Call, vault: VaultStore, depositAmount: BigInt, sharesMinted: BigInt): void {


  const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]))
  const amountUSD = normalizedUsdcPrice(usdcPrice(token, depositAmount))
  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(amountUSD)
  const tvl = vault.inputTokenBalances[0].plus(depositAmount)
  vault.totalValueLockedUSD = normalizedUsdcPrice(usdcPrice(token, tvl))

  vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(depositAmount)]
  vault.outputTokenSupply = vault.outputTokenSupply.plus(sharesMinted)
  vault.save();

  getOrCreateDepositTransactionFromCall(call, depositAmount, amountUSD, 'vault.deposit()')
}



export function handleWithdraw(call: WithdrawCall): void {
  log.info('[Vault mappings] Handle withdraw with shares. TX hash: {}', [
    call.transaction.hash.toHexString(),
  ]);
  const vaultAddress = call.to;
  let vault = VaultStore.load(vaultAddress.toHexString());
  if (vault) {
    const sharesBurnt    = call.inputs.requestedAmount
    const withdrawAmount = sharesBurnt
    withdraw(call, vault, withdrawAmount, sharesBurnt)
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from)
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}


function withdraw(call: ethereum.Call, vault: VaultStore, withdrawAmount: BigInt, sharesBurnt: BigInt): void {
  const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]))
  let amountUSD = normalizedUsdcPrice(usdcPrice(token, withdrawAmount))
  const tvl = vault.inputTokenBalances[0].minus(withdrawAmount)
  vault.totalValueLockedUSD = normalizedUsdcPrice(usdcPrice(token, tvl))
  vault.outputTokenSupply = vault.outputTokenSupply.minus(sharesBurnt);
  vault.inputTokenBalances = [tvl];
  vault.save();

  getOrCreateWithdrawTransactionFromCall(call, withdrawAmount, amountUSD, 'vault.withdraw()')
}

export function getOrCreateDepositTransactionFromCall(
  call: ethereum.Call,
  amount: BigInt,
  amountUSD: BigDecimal,
  action: string
): DepositTransaction {
  log.debug(
    '[Transaction] Get or create deposit transaction hash {} from call action {}, to {}',
    [call.transaction.hash.toHexString(), action, call.to.toHexString()]
  );

  let tx = call.transaction
  let id = "deposit-" + tx.hash.toHexString()
  let transaction = DepositTransaction.load(id);
  if (transaction == null) {
    transaction = new DepositTransaction(id);
    transaction.logIndex = tx.index.toI32();
    transaction.to = call.to.toHexString()
    transaction.from = tx.from.toHexString();
    transaction.hash = tx.hash.toHexString();
    transaction.timestamp = getTimestampInMillis(call.block);
    transaction.blockNumber = call.block.number;
    transaction.protocol = PROTOCOL_ID
    transaction.vault = call.to.toHexString()

    const vault = VaultStore.load(call.to.toHexString())
    if (vault) {
      transaction.asset = vault.inputTokens[0]
    }
    transaction.amount = amount
    transaction.amountUSD = amountUSD
    transaction.save()
  }
  return transaction;
}

export function getOrCreateWithdrawTransactionFromCall(
  call: ethereum.Call,
  amount: BigInt,
  amountUSD: BigDecimal,
  action: string
): WithdrawTransaction {
  log.debug(
    '[Transaction] Get or create withdraw transaction hash {} from call action {}, to {}',
    [call.transaction.hash.toHexString(), action, call.to.toHexString()]
  );

  let tx = call.transaction
  let id = "withdraw-" + tx.hash.toHexString()
  let transaction = WithdrawTransaction.load(id);
  if (transaction == null) {
    transaction = new WithdrawTransaction(id);
    transaction.logIndex = tx.index.toI32();
    transaction.to = call.to.toHexString()
    transaction.from = tx.from.toHexString();
    transaction.hash = tx.hash.toHexString();
    transaction.timestamp = getTimestampInMillis(call.block);
    transaction.blockNumber = call.block.number;
    transaction.protocol = PROTOCOL_ID
    transaction.vault = call.to.toHexString()

    const vault = VaultStore.load(call.to.toHexString())
    if (vault) {
      transaction.asset = vault.inputTokens[0]
    }
    transaction.amount = amount
    transaction.amountUSD = amountUSD
    transaction.save()
  }
  return transaction;
}


function updateFinancials(blockNumber: BigInt, timestamp: BigInt, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = PROTOCOL_ID;

    financialMetrics.feesUSD = BIGDECIMAL_ZERO
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO
  }

  let protocolTvlUsd = BIGDECIMAL_ZERO
  let protocolVolumeUsd = BIGDECIMAL_ZERO
  const protocol = YieldAggregator.load(PROTOCOL_ID)
  if (protocol) {
    for (let i = 0; i < protocol.vaultIds.length; i++) {
      const vaultId = protocol.vaultIds[i]

      let vault = VaultStore.load(vaultId);
      if(vault){
        const vaultTvlUsd = vault.totalValueLockedUSD;
        const vaultVolumeUsd = vault.totalVolumeUSD;
        protocolTvlUsd = protocolTvlUsd.plus(vaultTvlUsd );
        protocolVolumeUsd = protocolVolumeUsd.plus(vaultVolumeUsd)
      }
    }
    if(protocol.vaultIds.length < 1){
      financialMetrics.totalValueLockedUSD = new BigDecimal(BIGINT_ONE)
    }
    // financialMetrics.totalValueLockedUSD = protocolTvlUsd
    // financialMetrics.totalVolumeUSD = protocolVolumeUsd
  }
  
  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = blockNumber;
  financialMetrics.timestamp = timestamp;

  financialMetrics.save();
}


function updateUsageMetrics(blockNumber: BigInt, timestamp: BigInt, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = PROTOCOL_ID;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
  }
  
  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = blockNumber;
  usageMetrics.timestamp = timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString()
  let account = _Account.load(accountId)
  if (!account) {
    account = new _Account(accountId);
    account.save();
    usageMetrics.totalUniqueUsers += 1;
  }

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString()
  let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}
