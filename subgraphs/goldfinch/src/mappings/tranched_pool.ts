import {TranchedPool} from "../../generated/schema"
import {GoldfinchConfig as GoldfinchConfigContract} from "../../generated/templates/TranchedPool/GoldfinchConfig"
import {
  TranchedPool as TranchedPoolContract,
  CreditLineMigrated,
  DepositMade,
  DrawdownsPaused,
  DrawdownsUnpaused,
  WithdrawalMade,
  TrancheLocked,
  SliceCreated,
  EmergencyShutdown,
  DrawdownMade,
  PaymentApplied,
} from "../../generated/templates/TranchedPool/TranchedPool"
import {CONFIG_KEYS_ADDRESSES} from "../constants"
import {createTransactionFromEvent} from "../entities/helpers"
import {
  handleDeposit,
  updatePoolCreditLine,
  initOrUpdateTranchedPool,
  updatePoolRewardsClaimable,
  updatePoolTokensRedeemable,
  getLeverageRatioFromConfig,
} from "../entities/tranched_pool"
import {getOrInitUser} from "../entities/user"
import {createZapMaybe, deleteZapAfterUnzapMaybe} from "../entities/zapper"
import {getAddressFromConfig} from "../utils"

export function handleCreditLineMigrated(event: CreditLineMigrated): void {
  initOrUpdateTranchedPool(event.address, event.block.timestamp)
  updatePoolCreditLine(event.address, event.block.timestamp)
}

export function handleDepositMade(event: DepositMade): void {
  handleDeposit(event)

  const transaction = createTransactionFromEvent(event, "TRANCHED_POOL_DEPOSIT", event.params.owner)
  transaction.tranchedPool = event.address.toHexString()
  transaction.amount = event.params.amount
  transaction.amountToken = "USDC"
  transaction.save()

  createZapMaybe(event)
}

export function handleDrawdownsPaused(event: DrawdownsPaused): void {
  initOrUpdateTranchedPool(event.address, event.block.timestamp)
}

export function handleDrawdownsUnpaused(event: DrawdownsUnpaused): void {
  initOrUpdateTranchedPool(event.address, event.block.timestamp)
}

export function handleWithdrawalMade(event: WithdrawalMade): void {
  initOrUpdateTranchedPool(event.address, event.block.timestamp)
  updatePoolCreditLine(event.address, event.block.timestamp)

  const tranchedPoolContract = TranchedPoolContract.bind(event.address)
  const seniorPoolAddress = getAddressFromConfig(tranchedPoolContract, CONFIG_KEYS_ADDRESSES.SeniorPool)

  const transaction = createTransactionFromEvent(
    event,
    event.params.owner.equals(seniorPoolAddress) ? "SENIOR_POOL_REDEMPTION" : "TRANCHED_POOL_WITHDRAWAL",
    event.params.owner
  )
  transaction.transactionHash = event.transaction.hash
  transaction.tranchedPool = event.address.toHexString()
  transaction.amount = event.params.interestWithdrawn.plus(event.params.principalWithdrawn)
  transaction.amountToken = "USDC"
  transaction.save()

  deleteZapAfterUnzapMaybe(event)
}

export function handleTrancheLocked(event: TrancheLocked): void {
  initOrUpdateTranchedPool(event.address, event.block.timestamp)
  updatePoolCreditLine(event.address, event.block.timestamp)

  const tranchedPoolContract = TranchedPoolContract.bind(event.address)
  const goldfinchConfigContract = GoldfinchConfigContract.bind(tranchedPoolContract.config())
  const tranchedPool = assert(TranchedPool.load(event.address.toHexString()))
  tranchedPool.estimatedLeverageRatio = getLeverageRatioFromConfig(goldfinchConfigContract)
  tranchedPool.save()
}

export function handleSliceCreated(event: SliceCreated): void {
  initOrUpdateTranchedPool(event.address, event.block.timestamp)
  updatePoolCreditLine(event.address, event.block.timestamp)
}

export function handleEmergencyShutdown(event: EmergencyShutdown): void {
  initOrUpdateTranchedPool(event.address, event.block.timestamp)
  updatePoolCreditLine(event.address, event.block.timestamp)
}

export function handleDrawdownMade(event: DrawdownMade): void {
  const tranchedPool = assert(TranchedPool.load(event.address.toHexString()))
  getOrInitUser(event.params.borrower) // ensures that a wallet making a drawdown is correctly considered a user
  initOrUpdateTranchedPool(event.address, event.block.timestamp)
  updatePoolCreditLine(event.address, event.block.timestamp)
  updatePoolTokensRedeemable(tranchedPool)

  const transaction = createTransactionFromEvent(event, "TRANCHED_POOL_DRAWDOWN", event.params.borrower)
  transaction.tranchedPool = event.address.toHexString()
  transaction.amount = event.params.amount
  transaction.amountToken = "USDC"
  transaction.save()
}

export function handlePaymentApplied(event: PaymentApplied): void {
  getOrInitUser(event.params.payer) // ensures that a wallet making a payment is correctly considered a user
  initOrUpdateTranchedPool(event.address, event.block.timestamp)
  updatePoolCreditLine(event.address, event.block.timestamp)

  const tranchedPool = assert(TranchedPool.load(event.address.toHexString()))
  tranchedPool.principalAmountRepaid = tranchedPool.principalAmountRepaid.plus(event.params.principalAmount)
  tranchedPool.interestAmountRepaid = tranchedPool.interestAmountRepaid.plus(event.params.interestAmount)
  tranchedPool.save()

  updatePoolTokensRedeemable(tranchedPool)
  updatePoolRewardsClaimable(tranchedPool, TranchedPoolContract.bind(event.address))

  const transaction = createTransactionFromEvent(event, "TRANCHED_POOL_REPAYMENT", event.params.payer)
  transaction.tranchedPool = event.address.toHexString()
  transaction.amount = event.params.principalAmount.plus(event.params.interestAmount)
  transaction.amountToken = "USDC"
  transaction.save()
}
