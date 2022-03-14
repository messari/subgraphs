import { BigInt, BigDecimal, Address, ethereum, log } from "@graphprotocol/graph-ts"
import {
  Registry as RegistryContract,
} from "../../generated/Registry/Registry"
import {
  Vault as VaultContract,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  DepositCall, Deposit1Call, Deposit2Call,
  WithdrawCall, Withdraw1Call, Withdraw2Call,
  UpdateManagementFee as UpdateManagementFeeEvent,
  UpdatePerformanceFee as UpdatePerformanceFeeEvent,
} from "../../generated/Registry/Vault"
import {
  Vault as VaultStore,
  VaultFee as VaultFeeStore,
  Deposit as DepositTransaction,
  Withdraw as WithdrawTransaction,
  UsageMetricsDailySnapshot,
  Account,
  DailyActiveAccount,
  FinancialsDailySnapshot,
  YieldAggregator,
} from "../../generated/schema"
import { BIGDECIMAL_ZERO, BIGINT_MAX, BIGINT_ZERO, ETH_MAINNET_REGISTRY_ADDRESS, MANAGEMENT_FEE, PERFORMANCE_FEE, PROTOCOL_ID, SECONDS_PER_DAY } from "../common/constants"
import { bigIntToPercentage, getTimestampInMillis } from "../common/utils"
import { getOrCreateToken } from "../common/tokens"
import { normalizedUsdcPrice, usdcPrice } from "../price/usdcOracle"

export function handleDepositEvent(event: DepositEvent): void {
  log.info('[Vault mappings] Handle deposit event', []);
  let vaultContract = VaultContract.bind(event.address)

  let vault = VaultStore.load(event.address.toHexString())
  if (!vault) {
    vault = new VaultStore(event.address.toHexString())
  }
  vault.save()
}

export function handleWithdrawalEvent(event: WithdrawEvent): void {
  log.info('[Vault mappings] Handle withdraw event', [])
  let vaultContract = VaultContract.bind(event.address)

  let vault = VaultStore.load(event.address.toHexString())
  if (!vault) {
    vault = new VaultStore(event.address.toHexString())
  }
  vault.save()
}

export function handleDeposit(call: DepositCall): void {
  log.info('[Vault mappings] Handle deposit', [])
  const vaultAddress = call.to
  let vault = VaultStore.load(vaultAddress.toString())
  if (vault) {
    let sharesMinted  = call.outputs.value0
    let depositAmount = BIGINT_MAX // Deposit amount has a default argument value of BIGINT_MAX
    deposit(call, vault, depositAmount, sharesMinted)
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from)
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}

export function handleDepositWithAmount(call: Deposit1Call): void {
  log.info('[Vault mappings] Handle deposit with amount {}, vault {}', [call.inputs._amount.toString(), call.to.toHexString()])
  const vaultAddress = call.to;
  let vault = VaultStore.load(vaultAddress.toHexString())
  if (vault) {
    let sharesMinted  = call.outputs.value0
    let depositAmount = call.inputs._amount
    deposit(call, vault, depositAmount, sharesMinted)
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from)
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}

export function handleDepositWithAmountAndRecipient(call: Deposit2Call): void {
  log.info('[Vault mappings] Handle deposit with amount {}, vault {}', [call.inputs._amount.toString(), call.to.toHexString()]);
  const vaultAddress = call.to;
  let vault = VaultStore.load(vaultAddress.toHexString());
  if (vault) {
    let sharesMinted  = call.outputs.value0
    let depositAmount = call.inputs._amount
    deposit(call, vault, depositAmount, sharesMinted)
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from)
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}

function deposit(call: ethereum.Call, vault: VaultStore, depositAmount: BigInt, sharesMinted: BigInt): void {
  const vaultAddress = Address.fromString(vault.id)

  // If _amount is uint256.max, the vault contract treats this like deposit()
  // https://github.com/yearn/yearn-vaults/blob/main/contracts/Vault.vy#L894-L897
  if (depositAmount == BIGINT_MAX) {
    depositAmount = calculateAmountDeposited(vaultAddress, sharesMinted)
  }

  const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]))
  const amountUSD = normalizedUsdcPrice(usdcPrice(token, depositAmount))
  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(amountUSD)

  const vaultContract = VaultContract.bind(call.to)
  const tvl = vaultContract.totalAssets()
  vault.totalValueLockedUSD = normalizedUsdcPrice(usdcPrice(token, tvl))

  vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(depositAmount.toBigDecimal())]
  vault.outputTokenSupply = vault.outputTokenSupply.plus(sharesMinted.toBigDecimal())
  vault.save();

  getOrCreateDepositTransactionFromCall(call, depositAmount.toBigDecimal(), amountUSD, 'vault.deposit()')
}

export function handleWithdraw(call: WithdrawCall): void {
  log.info('[Vault mappings] Handle withdraw. TX hash: {}', [
    call.transaction.hash.toHexString(),
  ]);
  const vaultAddress = call.to;
  let vault = VaultStore.load(vaultAddress.toHexString());
  if (vault) {
    let vaultContract = VaultContract.bind(call.to);
    let withdrawAmount = call.outputs.value0;
    let totalAssets = vaultContract.totalAssets();
    let totalSupply = vaultContract.totalSupply();
    let sharesBurnt = totalAssets.equals(BIGINT_ZERO)
      ? withdrawAmount
      : withdrawAmount.times(totalSupply).div(totalAssets);

      withdraw(call, vault, withdrawAmount, sharesBurnt)
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from)
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}

export function handleWithdrawWithShares(call: Withdraw1Call): void {
  log.info('[Vault mappings] Handle withdraw with shares. TX hash: {}', [
    call.transaction.hash.toHexString(),
  ]);
  const vaultAddress = call.to;
  let vault = VaultStore.load(vaultAddress.toHexString());
  if (vault) {
    const sharesBurnt    = call.inputs._shares
    const withdrawAmount = call.outputs.value0
    withdraw(call, vault, withdrawAmount, sharesBurnt)
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from)
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}

export function handleWithdrawWithSharesAndRecipient(
  call: Withdraw2Call
): void {
  log.info(
    '[Vault mappings] Handle withdraw with shares and recipient. TX hash: {}',
    [call.transaction.hash.toHexString()]
  );
  const vaultAddress = call.to;
  let vault = VaultStore.load(vaultAddress.toHexString());
  if (vault) {
    const sharesBurnt    = call.inputs._shares
    const withdrawAmount = call.outputs.value0
    withdraw(call, vault, withdrawAmount, sharesBurnt)
  }
  updateFinancials(call.block.number, call.block.timestamp, call.from)
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}

export function handleUpdatePerformanceFee(event: UpdatePerformanceFeeEvent): void {
  let vault = VaultStore.load(event.address.toHexString())
  if (vault) {
    for (let i = 0; i < vault.fees.length; i++) {
      let fee = VaultFeeStore.load(vault.fees[i])
      if (fee && fee.feeType == PERFORMANCE_FEE) {
        fee.feePercentage = bigIntToPercentage(event.params.performanceFee)
        fee.save()
      }
    }
  }
}

export function handleUpdateManagementFee(event: UpdateManagementFeeEvent): void {
  let vault = VaultStore.load(event.address.toHexString())
  if (vault) {
    for (let i = 0; i < vault.fees.length; i++) {
      let fee = VaultFeeStore.load(vault.fees[i])
      if (fee && fee.feeType == MANAGEMENT_FEE) {
        fee.feePercentage = bigIntToPercentage(event.params.managementFee)
        fee.save()
      }
    }
  }
}

function withdraw(call: ethereum.Call, vault: VaultStore, withdrawAmount: BigInt, sharesBurnt: BigInt): void {
  const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]))
  let amountUSD = normalizedUsdcPrice(usdcPrice(token, withdrawAmount))

  const vaultContract = VaultContract.bind(call.to)
  const tvl = vaultContract.totalAssets()
  vault.totalValueLockedUSD = normalizedUsdcPrice(usdcPrice(token, tvl))

  vault.outputTokenSupply = vault.outputTokenSupply.minus(sharesBurnt.toBigDecimal());
  vault.inputTokenBalances = [vault.inputTokenBalances[0].minus(withdrawAmount.toBigDecimal())];
  vault.save();

  getOrCreateWithdrawTransactionFromCall(call, withdrawAmount.toBigDecimal(), amountUSD, 'vault.withdraw()')
}

export function getOrCreateDepositTransactionFromCall(
  call: ethereum.Call,
  amount: BigDecimal,
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
  amount: BigDecimal,
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

/* Calculates the amount of tokens deposited via totalAssets/totalSupply arithmetic. */
function calculateAmountDeposited(
  vaultAddress: Address,
  sharesMinted: BigInt
): BigInt {
  let vaultContract = VaultContract.bind(vaultAddress);
  let totalAssets = vaultContract.totalAssets();
  let totalSupply = vaultContract.totalSupply();
  let amount = totalSupply.isZero()
    ? BIGINT_ZERO
    : sharesMinted.times(totalAssets).div(totalSupply);
  log.info(
    '[Vault] Indirectly calculating token qty deposited. shares minted: {} - total assets {} - total supply {} - calc deposited tokens: {}',
    [
      sharesMinted.toString(),
      totalAssets.toString(),
      totalSupply.toString(),
      amount.toString(),
    ]
  );
  return amount;
}

function updateFinancials(blockNumber: BigInt, timestamp: BigInt, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = PROTOCOL_ID;

    financialMetrics.feesUSD = BIGDECIMAL_ZERO
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO
  }

  let protocolTvlUsd = BIGDECIMAL_ZERO
  const protocol = YieldAggregator.load(PROTOCOL_ID)
  if (protocol) {
    for (let i = 0; i < protocol.vaultIds.length; i++) {
      const vaultId = protocol.vaultIds[i]
      const vaultContract = VaultContract.bind(Address.fromString(vaultId))
      const vaultTvl = vaultContract.totalAssets()
      const token = getOrCreateToken(vaultContract.token())
      const vaultTvlUsd = normalizedUsdcPrice(usdcPrice(token, vaultTvl))
      protocolTvlUsd = protocolTvlUsd.plus(vaultTvlUsd)
    }
    financialMetrics.totalValueLockedUSD = protocolTvlUsd
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
  let account = Account.load(accountId)
  if (!account) {
    account = new Account(accountId);
    account.save();
    usageMetrics.totalUniqueUsers += 1;
  }

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString()
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}
