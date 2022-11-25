import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  afterEach,
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as'
import { createVaultAndProtocol } from './helpers/mocking/vault'
import { tokens } from '../src/utils/tokens'
import { Token, Vault } from '../generated/schema'
import { helpers } from './helpers'
import { constants } from '../src/utils/constants'
import { handleProfitLogInReward } from '../src/strategy'
import { prices } from '../src/utils/prices'
import { decimals } from '../src/utils'

const vaultAddress = Address.fromString(
  '0x0000000000000000000000000000000000000001'
)
const inputTokenAddress = Address.fromString(
  '0x0000000000000000000000000000000000000002'
)
const outputTokenAddress = Address.fromString(
  '0x0000000000000000000000000000000000000003'
)
const strategyAddress = Address.fromString(
  '0x0000000000000000000000000000000000000004'
)
const protocolAddress = Address.fromString(
  '0x222412af183bceadefd72e4cb1b71f1889953b1c'
)
const tokenDecimals: i32 = 6

let token: Token

describe('Strategy', () => {
  afterEach(() => {
    clearStore()
  })

  beforeEach(() => {
    helpers.mocking.chainLink.chainLink(
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
    token.decimals = tokenDecimals
    token.lastPriceUSD = BigDecimal.fromString('1')
    token.save()
  })

  describe('handleProfitLogInReward', () => {
    test('updates revenue on Vault, Protocol and Snapshots ', () => {
      const vault = createVaultAndProtocol(
        vaultAddress,
        inputTokenAddress,
        outputTokenAddress,
        protocolAddress
      )

      helpers.mocking.strategy.createStrategy(strategyAddress, vaultAddress)

      const profitAmount = BigInt.fromString('1000000000000000000')
      const profitAmountUSD = prices.getPrice(
        inputTokenAddress,
        decimals.fromBigInt(profitAmount, tokenDecimals as u8)
      )

      const feeAmount = profitAmount
        .times(BigInt.fromString('30'))
        .div(BigInt.fromString('100'))
      const feeAmountUSD = prices.getPrice(
        inputTokenAddress,
        decimals.fromBigInt(feeAmount, tokenDecimals as u8)
      )

      const event = helpers.mocking.strategy.createProfitLogInRewardEvent(
        strategyAddress,
        profitAmount,
        feeAmount
      )

      handleProfitLogInReward(event)

      // Assert protocol
      assert.fieldEquals(
        'YieldAggregator',
        protocolAddress.toHexString(),
        'cumulativeTotalRevenueUSD',
        profitAmountUSD.toString()
      )
      assert.fieldEquals(
        'YieldAggregator',
        protocolAddress.toHexString(),
        'cumulativeProtocolSideRevenueUSD',
        feeAmountUSD.toString()
      )
      assert.fieldEquals(
        'YieldAggregator',
        protocolAddress.toHexString(),
        'cumulativeSupplySideRevenueUSD',
        profitAmountUSD.minus(feeAmountUSD).toString()
      )

      // Assert vault
      assert.fieldEquals(
        'Vault',
        vaultAddress.toHexString(),
        'cumulativeTotalRevenueUSD',
        profitAmountUSD.toString()
      )
      assert.fieldEquals(
        'Vault',
        vaultAddress.toHexString(),
        'cumulativeProtocolSideRevenueUSD',
        feeAmountUSD.toString()
      )
      assert.fieldEquals(
        'Vault',
        vaultAddress.toHexString(),
        'cumulativeSupplySideRevenueUSD',
        profitAmountUSD.minus(feeAmountUSD).toString()
      )

      // Assert vaultDailySnapshot
      const vaultDailySnapshotId = vaultAddress
        .toHexString()
        .concat('-')
        .concat(
          (event.block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString()
        )

      assert.fieldEquals(
        'VaultDailySnapshot',
        vaultDailySnapshotId,
        'dailyTotalRevenueUSD',
        profitAmountUSD.toString()
      )
      assert.fieldEquals(
        'VaultDailySnapshot',
        vaultDailySnapshotId,
        'dailyProtocolSideRevenueUSD',
        feeAmountUSD.toString()
      )
      assert.fieldEquals(
        'VaultDailySnapshot',
        vaultDailySnapshotId,
        'dailySupplySideRevenueUSD',
        profitAmountUSD.minus(feeAmountUSD).toString()
      )

      // Assert financialsDailySnapshot
      const financialsDailySnapshotId = (
        event.block.timestamp.toI64() / constants.SECONDS_PER_DAY
      ).toString()

      assert.fieldEquals(
        'FinancialsDailySnapshot',
        financialsDailySnapshotId,
        'dailyTotalRevenueUSD',
        profitAmountUSD.toString()
      )
      assert.fieldEquals(
        'FinancialsDailySnapshot',
        financialsDailySnapshotId,
        'dailyProtocolSideRevenueUSD',
        feeAmountUSD.toString()
      )
      assert.fieldEquals(
        'FinancialsDailySnapshot',
        financialsDailySnapshotId,
        'dailySupplySideRevenueUSD',
        profitAmountUSD.minus(feeAmountUSD).toString()
      )
    })
  })
})
