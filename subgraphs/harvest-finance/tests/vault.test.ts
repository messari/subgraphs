import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  afterEach,
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as'
import {
  assertDeposit,
  assertVaultDailySnapshot,
  assertUsageMetricsDailySnapshot,
  assertWithdraw,
  createDepositEvent,
  createTransferEvent,
  createWithdrawEvent,
} from './vault-utils'
import { handleDeposit, handleTransfer, handleWithdraw } from '../src/vault'
import { Token, Vault } from '../generated/schema'
import { assertProtocol, mockChainLink } from './controller-utils'
import { vaults } from '../src/utils/vaults'
import { deposits } from '../src/utils/deposits'
import { withdraws } from '../src/utils/withdraws'
import { tokens } from '../src/utils/tokens'
import { constants } from '../src/utils/constants'
import { protocols } from '../src/utils/protocols'

const vaultAddress = Address.fromString(
  '0x0000000000000000000000000000000000000001'
)

const inputTokenAddress = Address.fromString(
  '0x0000000000000000000000000000000000000002'
)

const protocolAddressString = '0x222412af183bceadefd72e4cb1b71f1889953b1c'

export function createVault(): Vault {
  const outputTokenAddress = Address.fromString(
    '0x0000000000000000000000000000000000000003'
  )

  const vault = vaults.initialize(vaultAddress.toHexString())
  const protocol = protocols.initialize(protocolAddressString)
  protocol.totalPoolCount = protocol.totalPoolCount + 1

  vault.name = 'FARM_USDC'
  vault.symbol = 'fUSDC'
  vault.inputToken = inputTokenAddress.toHexString()
  vault.outputToken = outputTokenAddress.toHexString()
  vault.protocol = protocolAddressString

  const feeId = 'DEPOSIT-'.concat(vaultAddress.toHexString())

  vault.fees = [feeId]

  vault.save()
  protocol.save()

  return vault
}

let token: Token

describe('Vault', () => {
  afterEach(() => {
    clearStore()
  })

  beforeEach(() => {
    mockChainLink(
      constants.CHAIN_LINK_CONTRACT_ADDRESS,
      inputTokenAddress,
      constants.CHAIN_LINK_USD_ADDRESS,
      BigInt.fromString('99975399'),
      8
    )
  })

  beforeEach(() => {
    token = tokens.initialize(inputTokenAddress.toHexString())
    token.symbol = 'tk1'
    token.name = 'token 1'
    token.decimals = 6
    token.lastPriceUSD = BigDecimal.fromString('1')
    token.save()
  })

  describe('handleDeposit', () => {
    test('increments inputTokenBalance', () => {
      const vault = createVault()

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromString('100000000') // 100
      const event = createDepositEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)

      handleDeposit(event)

      assert.fieldEquals(
        'Vault',
        vault.id,
        'inputTokenBalance',
        amount.toString()
      )
    })

    test('creates Deposit', () => {
      const vault = createVault()

      const fromAddress = Address.fromString(
        '0x0000000000000000000000000000000000000010'
      )

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromString('100000000') // 100
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
        amountUSD: BigDecimal.fromString('99.975399'),
      })
    })

    test('updates Token.lastPriceUSD and Vault.totalValueLockedUSD ', () => {
      const vault = createVault()

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromString('100000000') // 100
      const event = createDepositEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)

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
      const amount = BigInt.fromString('100000000') // 100

      // 1st deposit
      const event0 = createDepositEvent(amount, beneficiaryAddress)
      event0.address = Address.fromString(vault.id)
      event0.transaction.from = fromAddress
      handleDeposit(event0)

      const vaultStore0 = Vault.load(vault.id)!

      // 1st Deposit Snapshot
      const vaultDailySnapshotId0 = vaultAddress
        .toHexString()
        .concat('-')
        .concat(
          (
            event0.block.timestamp.toI64() / constants.SECONDS_PER_DAY
          ).toString()
        )

      assertVaultDailySnapshot(vaultDailySnapshotId0, {
        protocol: constants.PROTOCOL_ID.toHexString(),
        vault: vaultAddress,
        totalValueLockedUSD: vaultStore0.totalValueLockedUSD,
        inputTokenBalance: vaultStore0.inputTokenBalance,
        outputTokenSupply: vaultStore0.outputTokenSupply!,
        outputTokenPriceUSD: vaultStore0.outputTokenPriceUSD!,
        pricePerShare: vaultStore0.pricePerShare!,
        stakedOutputTokenAmount: vaultStore0.stakedOutputTokenAmount!,
        rewardTokenEmissionsAmount: vaultStore0.rewardTokenEmissionsAmount,
        rewardTokenEmissionsUSD: vaultStore0.rewardTokenEmissionsUSD,
        blockNumber: event0.block.number,
        timestamp: event0.block.timestamp,
      })

      // 2nd deposit on different day. Should create new snapshot
      const event1 = createDepositEvent(amount, beneficiaryAddress)
      event1.address = Address.fromString(vault.id)
      event1.transaction.from = fromAddress
      event1.block.timestamp = event1.block.timestamp.plus(
        BigInt.fromI32(constants.SECONDS_PER_DAY + constants.SECONDS_PER_HOUR) // 1 day + 1 hour
      )
      handleDeposit(event1)

      const vaultStore1 = Vault.load(vault.id)!

      // 2nd Deposit Snapshot
      const vaultDailySnapshotId1 = vaultAddress
        .toHexString()
        .concat('-')
        .concat(
          (
            event1.block.timestamp.toI64() / constants.SECONDS_PER_DAY
          ).toString()
        )

      assertVaultDailySnapshot(vaultDailySnapshotId1, {
        protocol: constants.PROTOCOL_ID.toHexString(),
        vault: vaultAddress,
        totalValueLockedUSD: vaultStore1.totalValueLockedUSD,
        inputTokenBalance: vaultStore1.inputTokenBalance,
        outputTokenSupply: vaultStore1.outputTokenSupply!,
        outputTokenPriceUSD: vaultStore1.outputTokenPriceUSD!,
        pricePerShare: vaultStore1.pricePerShare!,
        stakedOutputTokenAmount: vaultStore1.stakedOutputTokenAmount!,
        rewardTokenEmissionsAmount: vaultStore1.rewardTokenEmissionsAmount,
        rewardTokenEmissionsUSD: vaultStore1.rewardTokenEmissionsUSD,
        blockNumber: event1.block.number,
        timestamp: event1.block.timestamp,
      })
    })
  })

  describe('handleWithdraw', () => {
    test('decrements inputTokenBalance', () => {
      const vault = createVault()
      vault.inputTokenBalance = BigInt.fromString('1000000000') // 1000
      vault.save()

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromString('100000000') // 100
      const event = createWithdrawEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)

      handleWithdraw(event)

      assert.fieldEquals('Vault', vault.id, 'inputTokenBalance', '900000000') // 900
    })

    test('creates Withdraw', () => {
      const vault = createVault()

      const fromAddress = Address.fromString(
        '0x0000000000000000000000000000000000000010'
      )

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromString('100000000') // 100
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
        amountUSD: BigDecimal.fromString('99.975399'),
      })
    })

    test('updates Token.lastPriceUSD and Vault.totalValueLockedUSD', () => {
      const vault = createVault()
      vault.inputTokenBalance = BigInt.fromString('1000000000') // 1000
      vault.save()

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromString('400000000') // 400
      const event = createWithdrawEvent(amount, beneficiaryAddress)
      event.address = Address.fromString(vault.id)

      handleWithdraw(event)

      assert.fieldEquals('Token', token.id, 'lastPriceUSD', '0.99975399')
      assert.fieldEquals('Vault', vault.id, 'totalValueLockedUSD', '599.852394')
    })

    test('updates VaultSnapshots', () => {
      // Vault is created with 1000 inputTokenBalance
      const vault = createVault()
      vault.inputTokenBalance = BigInt.fromI32(1000)
      vault.save()

      const fromAddress = Address.fromString(
        '0x0000000000000000000000000000000000000010'
      )

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromString('100000000') // 100

      // 1st withdraw
      const event0 = createWithdrawEvent(amount, beneficiaryAddress)
      event0.address = Address.fromString(vault.id)
      event0.transaction.from = fromAddress
      handleWithdraw(event0)

      const vaultStore0 = Vault.load(vault.id)!

      // 1st Deposit Snapshot
      const vaultDailySnapshotId0 = vaultAddress
        .toHexString()
        .concat('-')
        .concat(
          (
            event0.block.timestamp.toI64() / constants.SECONDS_PER_DAY
          ).toString()
        )

      assertVaultDailySnapshot(vaultDailySnapshotId0, {
        protocol: constants.PROTOCOL_ID.toHexString(),
        vault: vaultAddress,
        totalValueLockedUSD: vaultStore0.totalValueLockedUSD,
        inputTokenBalance: vaultStore0.inputTokenBalance,
        outputTokenSupply: vaultStore0.outputTokenSupply!,
        outputTokenPriceUSD: vaultStore0.outputTokenPriceUSD!,
        pricePerShare: vaultStore0.pricePerShare!,
        stakedOutputTokenAmount: vaultStore0.stakedOutputTokenAmount!,
        rewardTokenEmissionsAmount: vaultStore0.rewardTokenEmissionsAmount,
        rewardTokenEmissionsUSD: vaultStore0.rewardTokenEmissionsUSD,
        blockNumber: event0.block.number,
        timestamp: event0.block.timestamp,
      })

      // 2nd withdraw on different day. Should create new snapshot
      const event1 = createWithdrawEvent(amount, beneficiaryAddress)
      event1.address = Address.fromString(vault.id)
      event1.transaction.from = fromAddress
      event1.block.timestamp = event1.block.timestamp.plus(
        BigInt.fromI32(constants.SECONDS_PER_DAY + constants.SECONDS_PER_HOUR) // 1 day + 1 hour
      )
      handleWithdraw(event1)

      const vaultStore1 = Vault.load(vault.id)!

      // 2nd Withdraw Snapshot
      const vaultDailySnapshotId1 = vaultAddress
        .toHexString()
        .concat('-')
        .concat(
          (
            event1.block.timestamp.toI64() / constants.SECONDS_PER_DAY
          ).toString()
        )

      assertVaultDailySnapshot(vaultDailySnapshotId1, {
        protocol: constants.PROTOCOL_ID.toHexString(),
        vault: vaultAddress,
        totalValueLockedUSD: vaultStore1.totalValueLockedUSD,
        inputTokenBalance: vaultStore1.inputTokenBalance,
        outputTokenSupply: vaultStore1.outputTokenSupply!,
        outputTokenPriceUSD: vaultStore1.outputTokenPriceUSD!,
        pricePerShare: vaultStore1.pricePerShare!,
        stakedOutputTokenAmount: vaultStore1.stakedOutputTokenAmount!,
        rewardTokenEmissionsAmount: vaultStore1.rewardTokenEmissionsAmount,
        rewardTokenEmissionsUSD: vaultStore1.rewardTokenEmissionsUSD,
        blockNumber: event1.block.number,
        timestamp: event1.block.timestamp,
      })
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

        const amount = BigInt.fromString('200000000') // 200

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

  describe('usageMetrics', () => {
    test('update usage metrics', () => {
      const vault = createVault()

      const fromAddress = Address.fromString(
        '0x0000000000000000000000000000000000000010'
      )

      const fromAddress1 = Address.fromString(
        '0x0000000000000000000000000000000000000110'
      )

      const beneficiaryAddress = Address.fromString(
        '0x0000000000000000000000000000000000000009'
      )
      const amount = BigInt.fromString('100000000') // 100

      let dailyTxCount = 0
      let depositCount = 0
      let withdrawCount = 0

      // 1st deposit
      const event0 = createDepositEvent(amount, beneficiaryAddress)
      dailyTxCount++
      depositCount++
      event0.address = Address.fromString(vault.id)
      event0.transaction.from = fromAddress
      handleDeposit(event0)

      const usageMetricDailySnapshotId0 = (
        event0.block.timestamp.toI64() / constants.SECONDS_PER_DAY
      ).toString()

      assertUsageMetricsDailySnapshot(usageMetricDailySnapshotId0, {
        protocol: protocolAddressString,
        activeUsers: 1,
        cumulativeUniqueUsers: 1,
        transactionCount: dailyTxCount,
        depositCount: depositCount,
        withdrawCount: 0,
        totalPoolCount: 1,
        blockNumber: event0.block.number,
        timestamp: event0.block.timestamp,
      })

      // 1st withdraw
      const event1 = createWithdrawEvent(amount, beneficiaryAddress)
      dailyTxCount++
      withdrawCount++
      event1.address = Address.fromString(vault.id)
      event1.transaction.from = fromAddress
      handleWithdraw(event1)

      assertUsageMetricsDailySnapshot(usageMetricDailySnapshotId0, {
        protocol: protocolAddressString,
        activeUsers: 1,
        cumulativeUniqueUsers: 1,
        transactionCount: dailyTxCount,
        depositCount: depositCount,
        withdrawCount: withdrawCount,
        totalPoolCount: 1,
        blockNumber: event1.block.number,
        timestamp: event1.block.timestamp,
      })

      //Reset daily counters
      dailyTxCount = 0
      depositCount = 0
      withdrawCount = 0

      // New Day
      // 2nd deposit. Should create new snapshot
      const event2 = createDepositEvent(amount, beneficiaryAddress)
      dailyTxCount++
      depositCount++
      event2.address = Address.fromString(vault.id)
      event2.transaction.from = fromAddress
      event2.block.timestamp = event2.block.timestamp.plus(
        BigInt.fromI32(constants.SECONDS_PER_DAY + constants.SECONDS_PER_HOUR) // 1 day + 1 hour
      )
      handleDeposit(event2)

      const usageMetricDailySnapshotId1 = (
        event2.block.timestamp.toI64() / constants.SECONDS_PER_DAY
      ).toString()

      assertUsageMetricsDailySnapshot(usageMetricDailySnapshotId1, {
        protocol: protocolAddressString,
        activeUsers: 1,
        cumulativeUniqueUsers: 1,
        transactionCount: dailyTxCount,
        depositCount: depositCount,
        withdrawCount: withdrawCount,
        totalPoolCount: 1,
        blockNumber: event2.block.number,
        timestamp: event2.block.timestamp,
      })

      // 3rd deposit. Different user. Should increment active users
      const event3 = createDepositEvent(amount, beneficiaryAddress)
      dailyTxCount++
      depositCount++
      event3.address = Address.fromString(vault.id)
      event3.transaction.from = fromAddress1
      event3.block.timestamp = event3.block.timestamp.plus(
        BigInt.fromI32(constants.SECONDS_PER_DAY + constants.SECONDS_PER_HOUR) // 1 day + 1 hour
      )
      handleDeposit(event3)

      assertUsageMetricsDailySnapshot(usageMetricDailySnapshotId1, {
        protocol: protocolAddressString,
        activeUsers: 2,
        cumulativeUniqueUsers: 2,
        transactionCount: dailyTxCount,
        depositCount: depositCount,
        withdrawCount: withdrawCount,
        totalPoolCount: 1,
        blockNumber: event3.block.number,
        timestamp: event3.block.timestamp,
      })

      // Check derived fields are correct for yieldAggregator
      assertProtocol(
        constants.CONTROLLER_ADDRESS,
        'Harvest Finance',
        'harvest-finance',
        '1.3.0',
        '0.1.0',
        '1.0.0',
        'MAINNET',
        'YIELD',
        BigDecimal.fromString('0'),
        BigDecimal.fromString('0'),
        BigDecimal.fromString('0'),
        BigDecimal.fromString('0'),
        BigDecimal.fromString('0'),
        2,
        1
      )
    })
  })
})
