import {
  describe,
  test,
  clearStore,
  afterEach,
  assert,
} from 'matchstick-as/assembly/index'
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { handleAddVaultAndStrategy } from '../src/controller'
import { constants } from '../src/utils/constants'
import { helpers } from './helpers'

describe('Controller', () => {
  afterEach(() => {
    clearStore()
  })

  describe('addVaultAndStrategy', () => {
    test('creates Vault, Tokens and RewardToken', () => {
      let vaultAddress = Address.fromString(
        '0x0000000000000000000000000000000000000002'
      )
      let strategyAddress = Address.fromString(
        '0x0000000000000000000000000000000000000003'
      )

      const inputTokenAddress = Address.fromString(
        '0x0000000000000000000000000000000000000004'
      )
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
})
