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
		const name = tokenConfig[0]
		const symbol = tokenConfig[1]
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
	const poolConfig = NetworkConfigs.getPoolDetails(inputToken)

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
	sdk.Accounts.loadAccount(event.params.buyer)

	if (!pool.isInitialized) {
		pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
	}

	pool.addRevenueUSD(fees, amount)
}

export function handleAddLiquidity(event: AddLiquidity): void {
	let amount = event.params.tokenAmounts
	let fees = bigIntToBigDecimal(event.params.fees[0])
	if (amount.length == 0) {
		return
	}

	const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
		event.address.toHexString()
	)
	const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
	const poolConfig = NetworkConfigs.getPoolDetails(inputToken)

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
		pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
	}

	acc.liquidityDeposit(pool, amount[0])
	pool.addSupplySideRevenueUSD(fees)
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
	let amount = event.params.tokenAmounts
	if (amount.length == 0) {
		return
	}

	const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
		event.address.toHexString()
	)
	const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
	const poolConfig = NetworkConfigs.getPoolDetails(inputToken)

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
		pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
	}

	acc.liquidityWithdraw(pool, amount[0])
}
export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
	let tokenIndex = event.params.boughtId
	if (!tokenIndex.equals(BigInt.zero())) {
		return
	}

	const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
		event.address.toHexString()
	)
	const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
	const poolConfig = NetworkConfigs.getPoolDetails(inputToken)

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
		pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
	}

	acc.liquidityWithdraw(pool, event.params.lpTokenAmount)
}

// initialize(string, string, BridgePoolType, Token): void
// addDestinationToken(CrosschainToken): void
// getDestinationTokenRoute(CrosschainToken): PoolRoute

// addRevenueUSD(BigDecimal, BigDecimal): void
// addRevenueNative(BigInt, BigInt): void

// addStakedOutputTokenAmount(BigInt): void
// setStakedOutputTokenAmount(BigInt): void
// setRewardEmissions(RewardTokenType, Token, BigInt): void

// The most relevant methods here are transferIn(), transferOut(), liquidityDeposit() and liquidityWithdraw().
//  You won't need the rest unless you don't create events via these Account methods.

// When creating an event through these aforementioned methods,
//  all Account and Protocol counters about unique users,
//   user activity and transactions will be automatically updated.
//    If for some reason you don't use these methods, you have countDeposit|Withdraw|transferIn|transferOut available.
