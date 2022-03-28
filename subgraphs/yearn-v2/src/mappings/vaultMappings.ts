import { BigInt, BigDecimal, Address, ethereum, log } from "@graphprotocol/graph-ts"
import {
  Registry as RegistryContract,
} from "../../generated/Registry/Registry"
import {
  Vault as VaultContract,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Transfer as TransferEvent,
  DepositCall, Deposit1Call, Deposit2Call,
  WithdrawCall, Withdraw1Call, Withdraw2Call,
  UpdateManagementFee as UpdateManagementFeeEvent,
  UpdatePerformanceFee as UpdatePerformanceFeeEvent,
  UpdateRewards as UpdateRewardsEvent,
  StrategyAdded as StrategyAddedV1Event,
  StrategyAdded1 as StrategyAddedV2Event,
  StrategyReported as OldStrategyReportedEvent,
  StrategyReported1 as NewStrategyReportedEvent,
} from "../../generated/Registry/Vault"
import {
  Vault as VaultStore,
  VaultFee as VaultFeeStore,
  Deposit as DepositTransaction,
  Withdraw as WithdrawTransaction,
  UsageMetricsDailySnapshot,
  _Account,
  _DailyActiveAccount,
  _Strategy,
  FinancialsDailySnapshot,
  YieldAggregator,
  _Treasury,
} from "../../generated/schema"
import { BIGDECIMAL_ZERO, BIGINT_MAX, BIGINT_ZERO, ETH_MAINNET_REGISTRY_ADDRESS, PROTOCOL_ID, SECONDS_PER_DAY, VaultFeeType, ZERO_ADDRESS } from "../common/constants"
import { bigIntToPercentage, getTimestampInMillis } from "../common/utils"
import { getOrCreateToken } from "../common/tokens"
import { normalizedUsdcPrice, usdcPrice } from "../price/usdcOracle"
import * as tokenFeeLibrary from "../tokenFees"
import { getOrCreateAccount } from "../common/stores"

/* This version of the AddStrategy event was used in vaults from 0.1.0 up to and including 0.3.1 */
export function handleStrategyAddedV1(event: StrategyAddedV1Event): void {
  const strategyAddress = event.params.strategy
  let strategy = new _Strategy(strategyAddress.toHexString())
  strategy.save()
}

/* This version of the AddStrategy event is used in vaults 0.3.2 and up */
export function handleStrategyAddedV2(event: StrategyAddedV2Event): void {
  const strategyAddress = event.params.strategy
  let strategy = new _Strategy(strategyAddress.toHexString())
  strategy.save()
}

export function handleUpdateRewards(event: UpdateRewardsEvent): void {
  const rewardsAddress = event.params.rewards
  let treasury = new _Treasury(rewardsAddress.toHexString())
  treasury.save()
}

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
      if (fee && fee.feeType == VaultFeeType.PERFORMANCE_FEE) {
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
      if (fee && fee.feeType == VaultFeeType.MANAGEMENT_FEE) {
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

export function handleTransfer(event: TransferEvent): void {
  log.info('[Vault mappings] Handle transfer: From: {} - To: {}. TX hash: {}', [
    event.params.sender.toHexString(),
    event.params.receiver.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
  if (
    event.params.sender.toHexString() != ZERO_ADDRESS &&
    event.params.receiver.toHexString() != ZERO_ADDRESS
  ) {
    log.info(
      '[Vault mappings] Processing transfer: From: {} - To: {}. TX hash: {}',
      [
        event.params.sender.toHexString(),
        event.params.receiver.toHexString(),
        event.transaction.hash.toHexString(),
      ]
    );

    let vaultContract = VaultContract.bind(event.address);
    let totalAssets = vaultContract.totalAssets();
    let totalSupply = vaultContract.totalSupply();
    let sharesAmount = event.params.value;
    let amount = sharesAmount.times(totalAssets).div(totalSupply);
    // share  = (amount * totalSupply) / totalAssets
    // amount = (shares * totalAssets) / totalSupply

    let token = getOrCreateToken(vaultContract.token())
    let shareToken = getOrCreateToken(event.address)
    let fromAccount = getOrCreateAccount(event.params.sender);
    let toAccount = getOrCreateAccount(event.params.receiver);
    let vault = VaultStore.load(event.address.toHexString());
    if (vault) {
      let isFeeToStrategy = tokenFeeLibrary.isFeeToStrategy(
        vault,
        toAccount,
        amount
      );
      let isFeeToTreasury = tokenFeeLibrary.isFeeToTreasury(
        vault,
        toAccount,
        amount
      );
    }
  } else {
    log.info(
      '[Vault mappings] Not processing transfer: From: {} - To: {}. TX hash: {}',
      [
        event.params.sender.toHexString(),
        event.params.receiver.toHexString(),
        event.transaction.hash.toHexString(),
      ]
    );
  }
}

/**
 * We have two handlers to process the StrategyReported event due to incompatibility in both event structure.
 * This is for vault versions 0.3.0 and 0.3.1.
 * If you need 0.3.2 or superior, please see the 'handleStrategyReportedNew' handler.
 */
export function handleStrategyReportedOld(event: OldStrategyReportedEvent): void {
  log.info(
    '[Vault mappings] Updating price per share (strategy reported): {}',
    [event.transaction.hash.toHexString()]
  );
  let vaultContractAddress = event.address;
  let vaultContract = VaultContract.bind(vaultContractAddress);
  strategyReported(
    event.params.gain,
    event.params.loss,
    vaultContract,
    vaultContractAddress
  );
}

/**
 * We have two handlers to process the StrategyReported event due to incompatibility in both event structure.
 * This is for vault versions 0.3.2 or superior.
 *
 * This version includes the new field `debtPaid` introduced in the Vault version 0.3.2.
 *
 * In case a new structure is implemented, please create a new handler.
 * If you need 0.3.0 or 0.3.1, please see the 'handleStrategyReportedOld' handler.
 */
export function handleStrategyReportedNew(event: NewStrategyReportedEvent): void {
  log.info('[Vault mappings] Handle strategy reported (new)', []);
  log.info(
    '[Vault mappings] Updating price per share (strategy reported): {}',
    [event.transaction.hash.toHexString()]
  );
  let vaultContractAddress = event.address;
  let vaultContract = VaultContract.bind(vaultContractAddress);
  strategyReported(
    event.params.gain,
    event.params.loss,
    vaultContract,
    vaultContractAddress
  );
}

function strategyReported(
  gain: BigInt,
  loss: BigInt,
  vaultContract: VaultContract,
  vaultAddress: Address
): void {
  log.info('[Vault] Strategy reported for vault {} at TX ', [
    vaultAddress.toHexString(),
  ]);
  let vault = VaultStore.load(vaultAddress.toHexString())
  if (vault) {
    let balancePosition = getBalancePosition(vaultContract);
    let grossReturnsGenerated = gain.minus(loss);
  
    // Need to find netReturnsGenerated by subtracting out the fees
    let feeTokensToTreasury = tokenFeeLibrary.recognizeTreasuryFees(vault);
    let feeTokensToStrategist = tokenFeeLibrary.recognizeStrategyFees(vault);
    let pricePerShare = vaultContract.pricePerShare();
  
    let feesPaidDuringReport = feeTokensToTreasury.plus(feeTokensToStrategist);
  
    let netReturnsGenerated = grossReturnsGenerated.minus(feesPaidDuringReport);
    vault.inputTokenBalances = [vaultContract.totalAssets().toBigDecimal()]
    vault.save()
  }
}

function getBalancePosition(vaultContract: VaultContract): BigInt {
  let totalAssets = vaultContract.totalAssets();
  let tryPricePerShare = vaultContract.try_pricePerShare();
  let pricePerShare = tryPricePerShare.reverted
    ? BigInt.fromI32(0)
    : tryPricePerShare.value;
  // TODO Debugging Use pricePerShare directly
  if (tryPricePerShare.reverted) {
    log.warning('try_pricePerShare FAILED Vault {} - PricePerShare', [
      vaultContract._address.toHexString(),
      pricePerShare.toString(),
    ]);
  } else {
    log.warning('try_pricePerShare SUCCESS Vault {} - PricePerShare', [
      vaultContract._address.toHexString(),
      pricePerShare.toString(),
    ]);
  }
  // @ts-ignore
  let decimals = u8(vaultContract.decimals().toI32());
  return totalAssets.times(pricePerShare).div(BigInt.fromI32(10).pow(decimals));
}

function getTotalAssets(vaultContract: VaultContract): BigInt {
  return vaultContract.totalAssets();
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
