import { SDK } from '../../../../src/sdk/protocols/bridge'
import { TokenPricer } from '../../../../src/sdk/protocols/config'
import {
	TokenInitializer,
	TokenParams,
} from '../../../../src/sdk/protocols/bridge/tokens'
import {
	BridgePermissionType,
	BridgePoolType,
} from '../../../../src/sdk/protocols/bridge/enums'
import { BridgeConfig } from '../../../../src/sdk/protocols/bridge/config'
import { Versions } from '../../../../src/versions'
import { NetworkConfigs } from '../../../../configurations/configure'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import {
	TokenSwap,
	AddLiquidity,
	RemoveLiquidity,
	RemoveLiquidityOne,
} from '../../../../generated/HopL2Amm/L2_Amm'
import { Token } from '../../../../generated/schema'
import { getUsdPricePerToken, getUsdPrice } from '../../../../src/prices/index'
import { bigIntToBigDecimal } from '../../../../src/sdk/util/numbers'

class Pricer implements TokenPricer {
	getTokenPrice(token: Token): BigDecimal {
		const price = getUsdPricePerToken(Address.fromBytes(token.id))
		return price.usdPrice
	}

	getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
		const _amount = bigIntToBigDecimal(amount, token.decimals)
		return getUsdPrice(Address.fromBytes(token.id), _amount)
	}
}

class TokenInit implements TokenInitializer {
	getTokenParams(address: Address): TokenParams {
		const tokenConfig = NetworkConfigs.getTokenDetails(address.toHex())
		const name = tokenConfig[1]
		const symbol = tokenConfig[0]
		const decimals = BigInt.fromString(tokenConfig[2]).toI32()
		return { name, symbol, decimals }
	}
}

export function handleTokenSwap(event: TokenSwap): void {
	const amount = event.params.tokensSold

	const bp = BigInt.fromString('4').div(BigInt.fromString('10000'))
	const fees = amount.times(bp)

	const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
		event.address.toHexString()
	)
	const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
	const poolConfig = NetworkConfigs.getPoolDetails(event.address.toHexString())

	const poolName = poolConfig[1]
	const poolSymbol = poolConfig[0]

	const bridgeAddress = bridgeConfig[0]
	const bridgeName = bridgeConfig[1]
	const bridgeSlug = bridgeConfig[2]

	const conf = new BridgeConfig(
		bridgeAddress,
		bridgeName,
		bridgeSlug,
		BridgePermissionType.PERMISSIONLESS,
		Versions
	)

	const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

	const pool = sdk.Pools.loadPool<string>(event.address)
	const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))
	sdk.Accounts.loadAccount(event.params.buyer)

	if (!pool.isInitialized) {
		pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
	}

	const amountUsd = sdk.Pricer.getAmountValueUSD(token, fees)
	pool.addSupplySideRevenueUSD(amountUsd)
}

export function handleAddLiquidity(event: AddLiquidity): void {
	if (NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
		let amount = event.params.tokenAmounts
		if (amount.length == 0) {
			return
		}

		const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)
		const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
		const poolConfig = NetworkConfigs.getPoolDetails(
			event.address.toHexString()
		)

		const poolName = poolConfig[1]
		const poolSymbol = poolConfig[0]

		const bridgeAddress = bridgeConfig[0]
		const bridgeName = bridgeConfig[1]
		const bridgeSlug = bridgeConfig[2]

		const conf = new BridgeConfig(
			bridgeAddress,
			bridgeName,
			bridgeSlug,
			BridgePermissionType.PERMISSIONLESS,
			Versions
		)

		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

		const pool = sdk.Pools.loadPool<string>(event.address)
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))
		const acc = sdk.Accounts.loadAccount(event.params.provider)

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}

		acc.liquidityDeposit(pool, amount[0])

		const feeUsd = sdk.Pricer.getAmountValueUSD(token, event.params.fees[0])

		pool.setTotalValueLocked(bigIntToBigDecimal(event.params.lpTokenSupply))
		pool.addSupplySideRevenueUSD(feeUsd)

		log.warning('LA - lpTokenSupply: {}, amount: {},  feeUsd: {}', [
			bigIntToBigDecimal(event.params.lpTokenSupply).toString(),
			amount[0].toString(),
			feeUsd.toString(),
		])
	}
}
export function handleRemoveLiquidity(event: RemoveLiquidity): void {
	if (NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
		let amount = event.params.tokenAmounts
		if (amount.length == 0) {
			return
		}

		const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)
		const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
		const poolConfig = NetworkConfigs.getPoolDetails(
			event.address.toHexString()
		)

		const poolName = poolConfig[1]
		const poolSymbol = poolConfig[0]

		const bridgeAddress = bridgeConfig[0]
		const bridgeName = bridgeConfig[1]
		const bridgeSlug = bridgeConfig[2]

		const conf = new BridgeConfig(
			bridgeAddress,
			bridgeName,
			bridgeSlug,
			BridgePermissionType.PERMISSIONLESS,
			Versions
		)

		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

		const pool = sdk.Pools.loadPool<string>(event.address)
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))
		const acc = sdk.Accounts.loadAccount(event.params.provider)

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}

		acc.liquidityWithdraw(pool, amount[0])
		pool.setTotalValueLocked(bigIntToBigDecimal(event.params.lpTokenSupply))

		log.warning('LWITH lpTokenSupply: {}, amount: {}', [
			event.params.lpTokenSupply.toString(),
			amount[0].toString(),
		])
	}
}
export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
	if (NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
		let tokenIndex = event.params.boughtId
		if (!tokenIndex.equals(BigInt.zero())) {
			return
		}

		const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)
		const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
		const poolConfig = NetworkConfigs.getPoolDetails(
			event.address.toHexString()
		)

		const poolName = poolConfig[0]
		const poolSymbol = poolConfig[1]

		const bridgeAddress = bridgeConfig[0]
		const bridgeName = bridgeConfig[1]
		const bridgeSlug = bridgeConfig[2]

		const conf = new BridgeConfig(
			bridgeAddress,
			bridgeName,
			bridgeSlug,
			BridgePermissionType.PERMISSIONLESS,
			Versions
		)

		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

		const pool = sdk.Pools.loadPool<string>(event.address)
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))
		const acc = sdk.Accounts.loadAccount(event.params.provider)

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}

		acc.liquidityWithdraw(pool, event.params.lpTokenAmount)
		pool.setTotalValueLocked(bigIntToBigDecimal(event.params.lpTokenSupply))

		log.warning('LWITHONE lpTokenSupply: {}, amount: {}', [
			event.params.lpTokenSupply.toString(),
			event.params.lpTokenAmount.toString(),
		])
	}
}
