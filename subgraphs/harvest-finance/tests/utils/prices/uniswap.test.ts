import { Address, BigInt } from '@graphprotocol/graph-ts'
import { assert, describe, test } from 'matchstick-as'
import { constants } from '../../../src/utils/constants'
import { uniswap } from '../../../src/utils/prices/uniswap'
import { helpers } from '../../helpers'

const tokenAddress = Address.fromString(
  '0x6b175474e89094c44da98b954eedeac495271d0f'
)

const wethAddress = constants.WETH_ADDRESS

describe('prices', () => {
  describe('uniswap', () => {
    describe('isLpToken', () => {
      describe('when tokenAddress is lpToken', () => {
        test('returns true', () => {
          helpers.mocking.uniswapRouter.factory(tokenAddress)

          const result = !!uniswap.isLpToken(tokenAddress)

          assert.assertTrue(result)
        })
      })
      describe('when tokenAddress is not lpToken', () => {
        test('returns false', () => {
          helpers.mocking.uniswapRouter.factory(
            tokenAddress,
            Address.zero(),
            true
          )

          const result = !!uniswap.isLpToken(tokenAddress)

          assert.booleanEquals(result, false)
        })
      })
    })

    describe('getPricePerToken', () => {
      describe('when tokenAddress is WETH', () => {
        test('returns token price', () => {
          helpers.mocking.erc20.erc20(wethAddress, 'WETH', 'WETH', 18)
          helpers.mocking.erc20.erc20(constants.USDC_ADDRESS, 'USDC', 'USDC', 6)
          helpers.mocking.uniswapRouter.getAmountsOut(
            constants.UNISWAP_ROUTER_CONTRACT_ADDRESS,
            BigInt.fromString('1000000000000000000'), // 1 weth
            [wethAddress, constants.USDC_ADDRESS],
            BigInt.fromString('1351000000') // 1351 USDC
          )

          const result = uniswap.getPricePerToken(wethAddress)

          assert.stringEquals('1351', result!.toString())
        })
      })

      describe('when tokenAddress is Token', () => {
        test('returns token price', () => {
          helpers.mocking.erc20.erc20(tokenAddress, 'DAI', 'DAI', 18)
          helpers.mocking.erc20.erc20(constants.USDC_ADDRESS, 'USDC', 'USDC', 6)
          helpers.mocking.uniswapRouter.getAmountsOut(
            constants.UNISWAP_ROUTER_CONTRACT_ADDRESS,
            BigInt.fromString('1000000000000000000'), // 1 dai
            [tokenAddress, constants.WETH_ADDRESS, constants.USDC_ADDRESS],
            BigInt.fromString('991234')
          )

          const result = uniswap.getPricePerToken(tokenAddress)

          assert.stringEquals('0.991234', result!.toString())
        })
      })
    })

    describe('getPricePerLpToken', () => {
      test('returns lp token price', () => {
        const token0 = Address.fromString(
          '0x0000000000000000000000000000000000000001'
        )
        const token0Decimals: u8 = 6

        helpers.mocking.erc20.decimals(token0, token0Decimals)

        const token1 = Address.fromString(
          '0x0000000000000000000000000000000000000002'
        )

        const token1Decimals: u8 = 8

        helpers.mocking.erc20.decimals(token1, token1Decimals)

        const reserve0 = BigInt.fromString('1000000000') // 1000
        const reserve1 = BigInt.fromString('100000000000') // 1000
        const reserve2 = BigInt.fromString('1000000000') // 1000
        const totalSupply = BigInt.fromString('500000000') // 500

        helpers.mocking.uniswapPair.uniswapPair(
          tokenAddress,
          token0,
          token1,
          reserve0,
          reserve1,
          reserve2,
          6,
          totalSupply
        )

        const amountIn0 = BigInt.fromI32(10).pow(token0Decimals)
        const amountIn1 = BigInt.fromI32(10).pow(token1Decimals)

        helpers.mocking.uniswapRouter.getAmountsOut(
          constants.UNISWAP_ROUTER_CONTRACT_ADDRESS,
          amountIn0,
          [token0, constants.WETH_ADDRESS, constants.USDC_ADDRESS],
          BigInt.fromString('1000000') // 1
        )

        helpers.mocking.uniswapRouter.getAmountsOut(
          constants.UNISWAP_ROUTER_CONTRACT_ADDRESS,
          amountIn1,
          [token1, constants.WETH_ADDRESS, constants.USDC_ADDRESS],
          BigInt.fromString('1500000') // 1.5
        )

        const price = uniswap.getPricePerLpToken(tokenAddress)

        assert.stringEquals(price!.toString(), '5')
      })
    })
  })
})
