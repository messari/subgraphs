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
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
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
	const amount = bigIntToBigDecimal(event.params.tokensSold)
	const fees = amount.times(BigDecimal.fromString('0.0004'))

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
		pool.initialize(poolName, poolSymbol, BridgePoolType.BURN_MINT, token)
	}

	pool.addProtocolSideRevenueUSD(fees)
}

export function handleAddLiquidity(event: AddLiquidity): void {
	if (NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
		let amount = event.params.tokenAmounts
		let fees = bigIntToBigDecimal(event.params.fees[0])
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

		const poolName = poolConfig[0]
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
			pool.initialize(poolName, poolSymbol, BridgePoolType.BURN_MINT, token)
		}

		acc.liquidityDeposit(pool, amount[0])
		pool.addSupplySideRevenueUSD(fees)
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
			pool.initialize(poolName, poolSymbol, BridgePoolType.BURN_MINT, token)
		}

		acc.liquidityWithdraw(pool, amount[0])
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
			pool.initialize(poolName, poolSymbol, BridgePoolType.BURN_MINT, token)
		}

		acc.liquidityWithdraw(pool, event.params.lpTokenAmount)
	}
}
