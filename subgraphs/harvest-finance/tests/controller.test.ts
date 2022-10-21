import {
  describe,
  test,
  clearStore,
  createMockedFunction,
  afterEach,
  assert,
} from 'matchstick-as/assembly/index'
import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { handleAddVaultAndStrategy } from '../src/controller'
import {
  mockCall,
  mockERC20,
  assertToken,
  assertVault,
  assertProtocol,
  mockChainLink,
} from './controller-utils'
import { constants } from '../src/utils/constants'

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

      mockChainLink(
        constants.CHAIN_LINK_CONTRACT_ADDRESS,
        inputTokenAddress,
        constants.CHAIN_LINK_USD_ADDRESS,
        BigInt.fromString('99975399'),
        8
      )

      createMockedFunction(
        vaultAddress,
        'underlying',
        'underlying():(address)'
      ).returns([ethereum.Value.fromAddress(inputTokenAddress)])

      mockERC20(inputTokenAddress, 'USD Coin', 'USDC', 6)
      mockERC20(vaultAddress, 'FARM_USDC', 'fUSDC', 6)

      const call = mockCall(vaultAddress, strategyAddress)

      handleAddVaultAndStrategy(call)

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
        0
      )

      // Vault Assertions

      assertVault(
        vaultAddress,
        'FARM_USDC',
        'fUSDC',
        inputTokenAddress,
        vaultAddress,
        BigInt.fromI32(0),
        call.block.timestamp,
        call.block.number,
        BigDecimal.fromString('0'),
        BigInt.fromI32(0),
        constants.CONTROLLER_ADDRESS.toHexString(),
        constants.FEE_TYPE_PERFORMANCE.concat('-').concat(
          vaultAddress.toHexString()
        )
      )

      // Input Token Assertions

      assertToken(inputTokenAddress, 'USD Coin', 'USDC', BigInt.fromI32(6))

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

      assertToken(vaultAddress, 'FARM_USDC', 'fUSDC', BigInt.fromI32(6))
    })
  })
})
