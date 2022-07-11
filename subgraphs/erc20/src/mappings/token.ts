import { BigDecimal, Bytes, BigInt, ethereum, log } from '@graphprotocol/graph-ts'

import { ERC20, Transfer } from '../../generated/templates/StandardToken/ERC20'
import { Burn } from '../../generated/templates/BurnableToken/Burnable'
import { Mint } from '../../generated/templates/MintableToken/Mintable'

import { Token, TokenDailySnapshot, TokenHourlySnapshot, TransferEvent } from '../../generated/schema'

import { SECONDS_PER_HOUR, SECONDS_PER_DAY, GENESIS_ADDRESS, BIGINT_ZERO, BIGINT_ONE, BIGINT_TWO, BIGDECIMAL_ZERO} from '../common/constants'

import { toDecimal } from './registry'
import {
  decreaseAccountBalance,
  getOrCreateAccount,
  increaseAccountBalance,
  isNewAccount,
  updateAccountBalanceDailySnapshot,
} from './account'

export function handleTransfer(event: Transfer): void {
  let token = Token.load(event.address.toHex())

  if (token != null) {
    if (event.params.value == BIGINT_ZERO) {
      return
    }
    let amount = toDecimal(event.params.value, token.decimals)

    let isBurn = token.flags.includes('burnable-transfer') && event.params.to.toHex() == GENESIS_ADDRESS
    let isMint = token.flags.includes('mintable-transfer') && event.params.from.toHex() == GENESIS_ADDRESS
    let isTransfer = !isBurn && !isMint

    if (isBurn) {
      handleBurnEvent(token, amount, event.params.from, event)
    } else if (isMint) {
      handleMintEvent(token, amount, event.params.to, event)
    } else {
      // In this case, it will be transfer event.
      handleTransferEvent(token, amount, event.params.from, event.params.to, event)
    }

    // Updates balances of accounts
    if (isTransfer || isBurn) {
      let sourceAccount = getOrCreateAccount(event.params.from)

      let accountBalance = decreaseAccountBalance(sourceAccount, token as Token, amount)
      accountBalance.blockNumber = event.block.number
      accountBalance.timestamp = event.block.timestamp

      sourceAccount.save()
      accountBalance.save()

      // To provide information about evolution of account balances
      updateAccountBalanceDailySnapshot(accountBalance, event)
    }

    if (isTransfer || isMint) {
      let destinationAccount = getOrCreateAccount(event.params.to)

      let accountBalance = increaseAccountBalance(destinationAccount, token as Token, amount)
      accountBalance.blockNumber = event.block.number
      accountBalance.timestamp = event.block.timestamp

      destinationAccount.save()
      accountBalance.save()

      // To provide information about evolution of account balances
      updateAccountBalanceDailySnapshot(accountBalance, event)
    }
  }
}

export function handleBurn(event: Burn): void {
  let token = Token.load(event.address.toHex())

  if (token != null) {
    let amount = toDecimal(event.params.value, token.decimals)

    handleBurnEvent(token, amount, event.params.burner, event)

    // Update source account balance
    let account = getOrCreateAccount(event.params.burner)

    let accountBalance = decreaseAccountBalance(account, token as Token, amount)
    accountBalance.blockNumber = event.block.number
    accountBalance.timestamp = event.block.timestamp

    account.save()
    accountBalance.save()

    // To provide information about evolution of account balances
    updateAccountBalanceDailySnapshot(accountBalance, event)
  }
}

export function handleMint(event: Mint): void {
  let token = Token.load(event.address.toHex())

  if (token != null) {
    let amount = toDecimal(event.params.amount, token.decimals)

    handleMintEvent(token, amount, event.params.to, event)

    // Update destination account balance
    let account = getOrCreateAccount(event.params.to)

    let accountBalance = increaseAccountBalance(account, token as Token, amount)
    accountBalance.blockNumber = event.block.number
    accountBalance.timestamp = event.block.timestamp

    account.save()
    accountBalance.save()

    // To provide information about evolution of account balances
    updateAccountBalanceDailySnapshot(accountBalance, event)
  }
}

function handleBurnEvent(token: Token | null, amount: BigDecimal, burner: Bytes, event: ethereum.Event): void {
  // Track total supply/burned
  if (token != null) {
    token.burnCount = token.burnCount.plus(BIGINT_ONE)
    token.totalSupply = token.totalSupply.minus(amount)
    token.totalBurned = token.totalBurned.plus(amount)

    let dailySnapshot = getOrCreateTokenDailySnapshot(token, event.block)
    dailySnapshot.dailyTotalSupply =  token.totalSupply
    dailySnapshot.dailyEventCount += 1
    dailySnapshot.dailyBurnCount += 1
    dailySnapshot.dailyBurnAmount = dailySnapshot.dailyBurnAmount.plus(amount)
    dailySnapshot.blockNumber = event.block.number
    dailySnapshot.timestamp = event.block.timestamp

    let hourlySnapshot = getOrCreateTokenHourlySnapshot(token, event.block)
    hourlySnapshot.hourlyTotalSupply =  token.totalSupply
    hourlySnapshot.hourlyEventCount += 1
    hourlySnapshot.hourlyBurnCount += 1
    hourlySnapshot.hourlyBurnAmount = hourlySnapshot.hourlyBurnAmount.plus(amount)
    hourlySnapshot.blockNumber = event.block.number
    hourlySnapshot.timestamp = event.block.timestamp

    token.save()
    dailySnapshot.save()
    hourlySnapshot.save()
  }
}

function handleMintEvent(token: Token | null, amount: BigDecimal, destination: Bytes, event: ethereum.Event): void {
  // Track total token supply/minted
  if (token != null) {
    token.mintCount = token.mintCount.plus(BIGINT_ONE)
    token.totalSupply = token.totalSupply.plus(amount)
    token.totalMinted = token.totalMinted.plus(amount)

    let dailySnapshot = getOrCreateTokenDailySnapshot(token, event.block)
    dailySnapshot.dailyTotalSupply =  token.totalSupply
    dailySnapshot.dailyEventCount += 1
    dailySnapshot.dailyMintCount += 1
    dailySnapshot.dailyMintAmount = dailySnapshot.dailyMintAmount.plus(amount)
    dailySnapshot.blockNumber = event.block.number
    dailySnapshot.timestamp = event.block.timestamp

    let hourlySnapshot = getOrCreateTokenHourlySnapshot(token, event.block)
    hourlySnapshot.hourlyTotalSupply =  token.totalSupply
    hourlySnapshot.hourlyEventCount += 1
    hourlySnapshot.hourlyMintCount += 1
    hourlySnapshot.hourlyMintAmount = hourlySnapshot.hourlyMintAmount.plus(amount)
    hourlySnapshot.blockNumber = event.block.number
    hourlySnapshot.timestamp = event.block.timestamp

    token.save()
    dailySnapshot.save()
    hourlySnapshot.save()
  }
}

function handleTransferEvent(
  token: Token | null,
  amount: BigDecimal,
  source: Bytes,
  destination: Bytes,
  event: ethereum.Event
): TransferEvent {

  let transferEvent = new TransferEvent(event.address.toHex() + '-' + event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  transferEvent.hash = event.transaction.hash.toHex()
  transferEvent.logIndex = event.logIndex.toI32()
  transferEvent.token = event.address.toHex()
  transferEvent.nonce = event.transaction.nonce.toI32()
  transferEvent.amount = amount
  transferEvent.to = destination.toHex()
  transferEvent.from = source.toHex()
  transferEvent.blockNumber = event.block.number
  transferEvent.timestamp = event.block.timestamp

  transferEvent.save()

  // Track total token transferred
  if (token != null) {
    let newAccountNum = BIGINT_ZERO
    if (isNewAccount(destination)) {
      newAccountNum = BIGINT_ONE
    }

    token.holderCount = token.holderCount.plus(newAccountNum)
    token.transferCount = token.transferCount.plus(BIGINT_ONE)

    let dailySnapshot = getOrCreateTokenDailySnapshot(token, event.block)
    dailySnapshot.dailyHolderCount = dailySnapshot.dailyHolderCount.plus(BIGINT_ONE)
    dailySnapshot.dailyActiveUsers = dailySnapshot.dailyActiveUsers.plus(BIGINT_TWO)
    dailySnapshot.cumulativeUniqueUsers = dailySnapshot.cumulativeUniqueUsers.plus(newAccountNum)
    dailySnapshot.dailyEventCount += 1
    dailySnapshot.dailyTransferCount += 1
    dailySnapshot.dailyTransferAmount = dailySnapshot.dailyTransferAmount.plus(amount)
    dailySnapshot.blockNumber = event.block.number
    dailySnapshot.timestamp = event.block.timestamp

    let hourlySnapshot = getOrCreateTokenHourlySnapshot(token, event.block)
    hourlySnapshot.hourlyHolderCount = hourlySnapshot.hourlyHolderCount.plus(BIGINT_ONE)
    hourlySnapshot.hourlyActiveUsers = hourlySnapshot.hourlyActiveUsers.plus(BIGINT_TWO)
    hourlySnapshot.cumulativeUniqueUsers = hourlySnapshot.cumulativeUniqueUsers.plus(newAccountNum)
    hourlySnapshot.hourlyEventCount += 1
    hourlySnapshot.hourlyTransferCount += 1
    hourlySnapshot.hourlyTransferAmount = hourlySnapshot.hourlyTransferAmount.plus(amount)
    hourlySnapshot.blockNumber = event.block.number
    hourlySnapshot.timestamp = event.block.timestamp

    token.save()
    dailySnapshot.save()
    hourlySnapshot.save()
  }

  return transferEvent
}

function getOrCreateTokenDailySnapshot(token: Token, block: ethereum.Block): TokenDailySnapshot {
  let snapshotId = token.id + '-' + (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let previousSnapshot = TokenDailySnapshot.load(snapshotId)

  if (previousSnapshot != null) {
    return previousSnapshot as TokenDailySnapshot
  }

  let newSnapshot = new TokenDailySnapshot(snapshotId)
  newSnapshot.token = token.id
  newSnapshot.dailyTotalSupply = token.totalSupply
  newSnapshot.dailyHolderCount = token.holderCount
  newSnapshot.dailyActiveUsers = BIGINT_ZERO
  newSnapshot.cumulativeUniqueUsers = token.holderCount
  newSnapshot.dailyEventCount = 0
  newSnapshot.dailyTransferCount = 0
  newSnapshot.dailyTransferAmount = BIGDECIMAL_ZERO
  newSnapshot.dailyMintCount = 0
  newSnapshot.dailyMintAmount = BIGDECIMAL_ZERO
  newSnapshot.dailyBurnCount = 0
  newSnapshot.dailyBurnAmount = BIGDECIMAL_ZERO

  return newSnapshot
}

function getOrCreateTokenHourlySnapshot(token: Token, block: ethereum.Block): TokenHourlySnapshot {
  let snapshotId = token.id + '-' + (block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
  let previousSnapshot = TokenHourlySnapshot.load(snapshotId)

  if (previousSnapshot != null) {
    return previousSnapshot as TokenHourlySnapshot
  }

  let newSnapshot = new TokenHourlySnapshot(snapshotId)
  newSnapshot.token = token.id

  newSnapshot.hourlyTotalSupply = token.totalSupply
  newSnapshot.hourlyHolderCount = token.holderCount
  newSnapshot.hourlyActiveUsers = BIGINT_ZERO
  newSnapshot.cumulativeUniqueUsers = token.holderCount
  newSnapshot.hourlyEventCount = 0
  newSnapshot.hourlyTransferCount = 0
  newSnapshot.hourlyTransferAmount = BIGDECIMAL_ZERO
  newSnapshot.hourlyMintCount = 0
  newSnapshot.hourlyMintAmount = BIGDECIMAL_ZERO
  newSnapshot.hourlyBurnCount = 0
  newSnapshot.hourlyBurnAmount = BIGDECIMAL_ZERO

  return newSnapshot
}