import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { afterEach, assert, clearStore, describe, test } from 'matchstick-as'
import {
  assertDeposit,
  assertVaultDailySnapshot,
  assertWithdraw,
  createDepositEvent,
  createTransferEvent,
  createWithdrawEvent,
} from './vault-utils'
import { handleDeposit, handleTransfer, handleWithdraw } from '../src/vault'
import { Vault } from '../generated/schema'
import { mockChainLink } from './controller-utils'
import { vaults } from '../src/utils/vaults'
import { deposits } from '../src/utils/deposits'
import { withdraws } from '../src/utils/withdraws'
import { tokens } from '../src/utils/tokens'
import { constants } from '../src/utils/constants'

const vaultAddress = Address.fromString(
  '0x0000000000000000000000000000000000000001'
)

const inputTokenAddress = Address.fromString(
  '0x0000000000000000000000000000000000000002'
)

function createVault(): Vault {
  const outputTokenAddress = Address.fromString(
    '0x0000000000000000000000000000000000000003'
  )
  const protocolAddress = Address.fromString(
    '0x0000000000000000000000000000000000000004'
  )

  const vault = vaults.initialize(vaultAddress.toHexString())

  vault.name = 'FARM_USDC'
  vault.symbol = 'fUSDC'
  vault.inputToken = inputTokenAddress.toHexString()
  vault.outputToken = outputTokenAddress.toHexString()
  vault.protocol = protocolAddress.toHexString()

  const feeId = 'DEPOSIT-'.concat(vaultAddress.toHexString())

  vault.fees = [feeId]

  vault.save()

  return vault
}

describe('Vault', () => {
  afterEach(() => {
    clearStore()
  })

  describe('handleDeposit', () => {
    test('increments inputTokenBalance', () => {
      const vault = createVault()

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromI32(100)
      const event = createDepositEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)

      handleDeposit(event)

      assert.fieldEquals('Vault', vault.id, 'inputTokenBalance', '100')
    })

    test('creates Deposit', () => {
      const vault = createVault()

      const fromAddress = Address.fromString(
        '0x0000000000000000000000000000000000000010'
      )

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromI32(100)
      const event = createDepositEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)
      event.transaction.from = fromAddress
      handleDeposit(event)

      const depositId = deposits.generateId(
        event.transaction.hash,
        event.logIndex
      )

      assertDeposit(depositId, {
        hash: event.transaction.hash,
        to: beneficiaryAddress,
        from: fromAddress,
        asset: Address.fromString(vault.inputToken),
        amount: amount,
        vault: vaultAddress,
        logIndex: BigInt.fromI32(1),
        protocol: vault.protocol,
        blockNumber: BigInt.fromI32(1),
        timestamp: BigInt.fromI32(1),
        amountUSD: BigDecimal.fromString('0'),
      })
    })

    test('updates Token.lastPriceUSD and Vault.totalValueLockedUSD ', () => {
      const token = tokens.initialize(inputTokenAddress.toHexString())
      token.symbol = 'tk1'
      token.name = 'token 1'
      token.decimals = 6
      token.save()

      const vault = createVault()

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromI32(100).times(BigInt.fromI32(10).pow(6))
      const event = createDepositEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)

      mockChainLink(
        constants.CHAIN_LINK_CONTRACT_ADDRESS,
        inputTokenAddress,
        constants.CHAIN_LINK_USD_ADDRESS,
        BigInt.fromString('99975399'),
        8
      )

      handleDeposit(event)

      assert.fieldEquals('Token', token.id, 'lastPriceUSD', '0.99975399')
      assert.fieldEquals('Vault', vault.id, 'totalValueLockedUSD', '99.975399')
    })

    test('updates VaultSnapshots', () => {
      const vault = createVault()

      const fromAddress = Address.fromString(
        '0x0000000000000000000000000000000000000010'
      )

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromI32(100)
      const event = createDepositEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)
      event.transaction.from = fromAddress
      handleDeposit(event)

      const vaultStore = Vault.load(vault.id)!

      // Review
      const vaultDailySnapshotId = vaultAddress
        .toHexString()
        .concat('-')
        .concat(
          (event.block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString()
        )

      assertVaultDailySnapshot(vaultDailySnapshotId, {
        protocol: constants.PROTOCOL_ID.toHexString(),
        vault: vaultAddress,
        totalValueLockedUSD: vaultStore.totalValueLockedUSD,
        inputTokenBalance: vaultStore.inputTokenBalance,
        outputTokenSupply: vaultStore.outputTokenSupply!,
        outputTokenPriceUSD: vaultStore.outputTokenPriceUSD!,
        pricePerShare: vaultStore.pricePerShare!,
        stakedOutputTokenAmount: vaultStore.stakedOutputTokenAmount!,
        rewardTokenEmissionsAmount: vaultStore.rewardTokenEmissionsAmount,
        rewardTokenEmissionsUSD: vaultStore.rewardTokenEmissionsUSD,
        blockNumber: event.block.number,
        timestamp: event.block.timestamp,
      })
    })
  })

  describe('handleWithdraw', () => {
    test('decrements inputTokenBalance', () => {
      const vault = createVault()
      vault.inputTokenBalance = BigInt.fromI32(100)
      vault.save()

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromI32(40)
      const event = createWithdrawEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)

      handleWithdraw(event)

      assert.fieldEquals('Vault', vault.id, 'inputTokenBalance', '60')
    })

    test('creates Withdraw', () => {
      const vault = createVault()

      const fromAddress = Address.fromString(
        '0x0000000000000000000000000000000000000010'
      )

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromI32(100)
      const event = createWithdrawEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)
      event.transaction.from = fromAddress
      handleWithdraw(event)

      const withdrawId = withdraws.generateId(
        event.transaction.hash,
        event.logIndex
      )

      assertWithdraw(withdrawId, {
        hash: event.transaction.hash,
        to: beneficiaryAddress,
        from: fromAddress,
        asset: Address.fromString(vault.inputToken),
        amount: amount,
        vault: vaultAddress,
        logIndex: BigInt.fromI32(1),
        protocol: vault.protocol,
        blockNumber: BigInt.fromI32(1),
        timestamp: BigInt.fromI32(1),
        amountUSD: BigDecimal.fromString('0'),
      })
    })

    test('updates Token.lastPriceUSD and Vault.totalValueLockedUSD', () => {
      const token = tokens.initialize(inputTokenAddress.toHexString())
      token.symbol = 'tk1'
      token.name = 'token 1'
      token.decimals = 6
      token.save()

      const vault = createVault()
      vault.inputTokenBalance = BigInt.fromI32(100).times(
        BigInt.fromI32(10).pow(6)
      )
      vault.save()

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromI32(40).times(BigInt.fromI32(10).pow(6))
      const event = createWithdrawEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)

      mockChainLink(
        constants.CHAIN_LINK_CONTRACT_ADDRESS,
        inputTokenAddress,
        constants.CHAIN_LINK_USD_ADDRESS,
        BigInt.fromString('99975399'),
        8
      )

      handleWithdraw(event)

      assert.fieldEquals('Token', token.id, 'lastPriceUSD', '0.99975399')
      assert.fieldEquals('Vault', vault.id, 'totalValueLockedUSD', '59.9852394')
    })
  })

  describe('handleTransfer', () => {
    describe('when transfer comes from zero address (minting)', () => {
      test('increments outputTokenSupply', () => {
        const vault = createVault()

        const zeroAddress = Address.zero()
        const toAddress = Address.fromString(
          '0x0000000000000000000000000000000000000001'
        )

        const amount = BigInt.fromString('200')

        const event = createTransferEvent(zeroAddress, toAddress, amount)

        event.address = vaultAddress

        handleTransfer(event)

        assert.fieldEquals(
          'Vault',
          vault.id,
          'outputTokenSupply',
          amount.toString()
        )
      })
    })
  })
})
