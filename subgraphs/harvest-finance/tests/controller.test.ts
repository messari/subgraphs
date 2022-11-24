import {
  describe,
  test,
  clearStore,
  afterEach,
  assert,
} from 'matchstick-as/assembly/index'
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  handleAddVaultAndStrategy,
  handleSharePriceChangeLog,
} from '../src/controller'
import { constants } from '../src/utils/constants'
import { helpers } from './helpers'
import { tokens } from '../src/utils/tokens'
import { decimals } from '../src/utils'
import { protocols } from '../src/utils/protocols'
import { vaults } from '../src/utils/vaults'

const vaultAddress = Address.fromString(
  '0x0000000000000000000000000000000000000002'
)
const strategyAddress = Address.fromString(
  '0x0000000000000000000000000000000000000003'
)

const inputTokenAddress = Address.fromString(
  '0x0000000000000000000000000000000000000004'
)

describe('Controller', () => {
  afterEach(() => {
    clearStore()
  })

  describe('addVaultAndStrategy', () => {
    test('creates Vault, Tokens and RewardToken', () => {
      helpers.mocking.chainLink.chainLink(
        constants.CHAIN_LINK_CONTRACT_ADDRESS,
        inputTokenAddress,
        constants.CHAIN_LINK_USD_ADDRESS,
        BigInt.fromString('99975399'),
        8
      )

      helpers.mocking.vault.underlying(vaultAddress, inputTokenAddress)

      helpers.mocking.erc20.erc20(inputTokenAddress, 'USD Coin', 'USDC', 6)
      helpers.mocking.erc20.erc20(vaultAddress, 'FARM_USDC', 'fUSDC', 6)

      const call = helpers.mockAddVaultAndStrategyCall(
        vaultAddress,
        strategyAddress
      )

      handleAddVaultAndStrategy(call)

      helpers.asserting.protocol.protocol(
        constants.CONTROLLER_ADDRESS.toHexString(),
        {
          name: 'Harvest Finance',
          slug: 'harvest-finance',
          schemaVersion: '1.3.0',
          subgraphVersion: '0.1.0',
          methodologyVersion: '1.0.0',
          network: 'MAINNET',
          type: 'YIELD',
          totalValueLockedUSD: BigDecimal.fromString('0'),
          protocolControlledValueUSD: BigDecimal.fromString('0'),
          cumulativeSupplySideRevenueUSD: BigDecimal.fromString('0'),
          cumulativeProtocolSideRevenueUSD: BigDecimal.fromString('0'),
          cumulativeTotalRevenueUSD: BigDecimal.fromString('0'),
          cumulativeUniqueUsers: BigInt.fromString('0'),
          totalPoolCount: BigInt.fromString('1'),
        }
      )

      // Vault Assertions

      helpers.asserting.vaults.vault(vaultAddress.toHexString(), {
        name: 'FARM_USDC',
        symbol: 'fUSDC',
        inputToken: inputTokenAddress,
        outputToken: vaultAddress,
        depositLimit: BigInt.fromI32(0),
        createdTimestamp: call.block.timestamp,
        createdBlockNumber: call.block.number,
        totalValueLockedUSD: BigDecimal.fromString('0'),
        inputTokenBalance: BigInt.fromI32(0),
        outputTokenSupply: BigInt.fromI32(0),
        protocol: constants.CONTROLLER_ADDRESS.toHexString(),
        fees: [
          constants.FEE_TYPE_PERFORMANCE.concat('-').concat(
            vaultAddress.toHexString()
          ),
        ],
      })

      // assert protocol._vaults (workaround)

      assert.fieldEquals(
        'YieldAggregator',
        constants.CONTROLLER_ADDRESS.toHexString(),
        '_vaults',
        `[${vaultAddress.toHexString()}]`
      )

      // Input Token Assertions

      helpers.asserting.tokens.token(inputTokenAddress.toHexString(), {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: BigInt.fromI32(6),
      })

      assert.fieldEquals(
        'Token',
        inputTokenAddress.toHexString(),
        'lastPriceUSD',
        '0.99975399'
      )

      assert.fieldEquals(
        'Token',
        inputTokenAddress.toHexString(),
        'lastPriceBlockNumber',
        call.block.number.toString()
      )

      // Output Token Assertions

      helpers.asserting.tokens.token(vaultAddress.toHexString(), {
        name: 'FARM_USDC',
        symbol: 'fUSDC',
        decimals: BigInt.fromI32(6),
      })
    })
  })

  describe('handleSharePriceChangeLog', () => {
    test('updates inputTokenBalance, pricePerShare, inputToken.lastPriceUSD, inputToken.lastPriceBlockNumber, vault.totalValueLockedUSD, protocol.totalValueLockedUSD', () => {
      const oldSharePrice = BigInt.fromI32(0)
      const newSharePrice = BigInt.fromI32(0)
      const timestamp = BigInt.fromI32(0)
      const protocolId = '0x0000000000000000000000000000000000000006'
      const vaultAddress1 = Address.fromString(
        '0x0000000000000000000000000000000000000001'
      )
      const vaultAddress2 = Address.fromString(
        '0x0000000000000000000000000000000000000002'
      )

      const inputToken = tokens.initialize(inputTokenAddress.toHexString())
      inputToken.decimals = 6
      inputToken.save()

      const protocol = protocols.initialize(protocolId)

      const vault1 = vaults.initialize(vaultAddress1.toHexString())
      vault1.protocol = protocolId
      vault1.inputToken = inputTokenAddress.toHexString()
      vault1.save()

      const vault2 = vaults.initialize(vaultAddress2.toHexString())
      vault2.protocol = protocolId
      vault2.totalValueLockedUSD = BigDecimal.fromString('999.55')
      vault2.save()

      protocol._vaults = [vault1.id, vault2.id]

      protocol.save()

      helpers.mocking.chainLink.chainLink(
        constants.CHAIN_LINK_CONTRACT_ADDRESS,
        inputTokenAddress,
        constants.CHAIN_LINK_USD_ADDRESS,
        BigInt.fromString('99975399'),
        8
      )

      const underlyingBalanceWithInvestment = BigInt.fromString('100000000') // 100
      helpers.mocking.vault.underlyingBalanceWithInvestment(
        vaultAddress1,
        underlyingBalanceWithInvestment
      )

      const blockNumber = BigInt.fromI32(1000)

      const event = helpers.mocking.controller.createSharePriceChangeLogEvent(
        vaultAddress1,
        strategyAddress,
        oldSharePrice,
        newSharePrice,
        timestamp
      )

      event.block.number = blockNumber

      handleSharePriceChangeLog(event)

      helpers.asserting.vaults.inputTokenBalance(
        vaultAddress1.toHexString(),
        underlyingBalanceWithInvestment
      )

      helpers.asserting.vaults.pricePerShare(
        vaultAddress1.toHexString(),
        decimals.fromBigInt(newSharePrice, inputToken.decimals as u8)
      )

      const lastPriceUSD = BigDecimal.fromString('0.99975399')

      helpers.asserting.tokens.lastPriceUSD(
        inputTokenAddress.toHexString(),
        lastPriceUSD
      )

      const expectedVaultTotalValueLockedUSD = decimals
        .fromBigInt(underlyingBalanceWithInvestment, inputToken.decimals as u8)
        .times(lastPriceUSD)

      helpers.asserting.vaults.totalValueLockedUSD(
        vaultAddress1.toHexString(),
        expectedVaultTotalValueLockedUSD
      )

      helpers.asserting.tokens.lastPriceBlockNumber(
        inputTokenAddress.toHexString(),
        blockNumber
      )

      const expectedProtocolTotalValueLockedUSD =
        expectedVaultTotalValueLockedUSD.plus(vault2.totalValueLockedUSD)

      helpers.asserting.protocol.totalValueLockedUSD(
        protocolId,
        expectedProtocolTotalValueLockedUSD
      )
    })
  })
})
