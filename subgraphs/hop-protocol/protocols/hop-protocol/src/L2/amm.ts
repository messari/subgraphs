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
import {
	Address,
	BigDecimal,
	BigInt,
	log,
	dataSource,
	Bytes,
} from '@graphprotocol/graph-ts'
import {
	TokenSwap,
	L2_Amm,
	AddLiquidity,
	RemoveLiquidity,
	RemoveLiquidityOne,
} from '../../../../generated/HopL2Amm/L2_Amm'
import { Token } from '../../../../generated/schema'
import { getUsdPricePerToken, getUsdPrice } from '../../../../src/prices/index'
import { bigIntToBigDecimal } from '../../../../src/sdk/util/numbers'
import {
	BIGDECIMAL_ZERO,
	BIGINT_ONE,
	BIGINT_TEN_TO_EIGHTEENTH,
} from '../../../../src/sdk/util/constants'
import { BIGINT_TEN } from '../../../../src/prices/common/constants'
import {
	BIGINT_TEN_TO_EIGHTEENTH,
	BIGINT_TEN_TO_SIX,
	SIX_DECIMAL_TOKENS,
} from '../../../../src/common/constants'

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

const conf = new BridgeConfig(
	'0x03D7f750777eC48d39D080b020D83Eb2CB4e3547',
	'HOP-'
		.concat(
			dataSource
				.network()
				.toUpperCase()
				.replace('-', '_')
		)
		.concat('-BRIDGE'),
	'hop-'.concat(dataSource.network().replace('-', '_')).concat('-bridge'),
	BridgePermissionType.PERMISSIONLESS,
	Versions
)

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
	if (NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
		const amount = event.params.tokensSold

		const fees = amount
			.times(BigInt.fromString('4'))
			.div(BigInt.fromString('10000'))
		log.warning('FEES 2- fees: {}, fees: {}, amount: {}', [
			fees.toBigDecimal().toString(),
			fees.toString(),
			amount.toString(),
		])

		const inputTokenOne = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)[0]

		const inputTokenTwo = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)[1]
		const poolConfig = NetworkConfigs.getPoolDetails(
			event.address.toHexString()
		)

		const poolName = poolConfig[1]
		const poolSymbol = poolConfig[0]
		const hPoolName = poolConfig[2]

		const sdk = SDK.initializeFromEvent(
			conf,
			new Pricer(),
			new TokenInit(),
			event
		)

		const pool = sdk.Pools.loadPool<string>(event.address)
		const hPool = sdk.Pools.loadPool<string>(
			Bytes.fromHexString(
				event.address
					.toHexString()
					.concat('-')
					.concat('1')
			)
		)

		const tokenOne = sdk.Tokens.getOrCreateToken(
			Address.fromString(inputTokenOne)
		)
		const tokenTwo = sdk.Tokens.getOrCreateToken(
			Address.fromString(inputTokenTwo)
		)

		sdk.Accounts.loadAccount(event.params.buyer)

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, tokenOne)
		}
		if (!hPool.isInitialized) {
			hPool.initialize(
				hPoolName,
				poolSymbol,
				BridgePoolType.LIQUIDITY,
				tokenTwo
			)
		}

		const Amm = L2_Amm.bind(event.address)
		const inputBalanceCallA = Amm.try_getTokenBalance(BigInt.zero().toI32())
		const inputBalanceCallB = Amm.try_getTokenBalance(BIGINT_ONE.toI32())

		if (!inputBalanceCallA.reverted && !inputBalanceCallB.reverted) {
			pool.setInputTokenBalance(inputBalanceCallA.value)

			hPool.setInputTokenBalance(inputBalanceCallB.value)
			hPool.setNetValueExportedUSD(BIGDECIMAL_ZERO)

			if (SIX_DECIMAL_TOKENS.includes(tokenOne.id.toHexString())) {
				let poolTVE = inputBalanceCallA.value
					.plus(inputBalanceCallB.value)
					.minus(pool.pool._inputTokenLiquidityBalance!)
				pool.setNetValueExportedUSD(
					poolTVE.div(BIGINT_TEN_TO_SIX).toBigDecimal()
				)
				log.warning('TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}', [
					poolTVE.toString(),
					poolTVE
						.div(BIGINT_TEN_TO_SIX)
						.toBigDecimal()
						.toString(),
					inputBalanceCallA.value.toString(),
					inputBalanceCallB.value.toString(),
					pool.pool._inputTokenLiquidityBalance!.toString(),
				])
			} else {
				let poolTVE = inputBalanceCallA.value
					.plus(inputBalanceCallB.value)
					.minus(pool.pool._inputTokenLiquidityBalance!)
				pool.setNetValueExportedUSD(
					poolTVE.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal()
				)
				log.warning('TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}', [
					poolTVE.toString(),
					poolTVE
						.div(BIGINT_TEN_TO_EIGHTEENTH)
						.toBigDecimal()
						.toString(),
					inputBalanceCallA.value.toString(),
					inputBalanceCallB.value.toString(),
					pool.pool._inputTokenLiquidityBalance!.toString(),
				])
			}
		} else {
			log.warning('inputBalanceCallB reverted', [])
		}

		pool.pool.relation = hPool.getBytesID()
		hPool.pool.relation = hPool.getBytesID()

		pool.addRevenueNative(BigInt.zero(), fees)
	}
}

export function handleAddLiquidity(event: AddLiquidity): void {
	if (NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
		let amount = event.params.tokenAmounts
		if (amount.length == 0) {
			return
		}
		const liquidity = amount[0].plus(amount[1])

		const inputTokenOne = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)[0]

		const inputTokenTwo = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)[1]

		const poolConfig = NetworkConfigs.getPoolDetails(
			event.address.toHexString()
		)

		const poolName = poolConfig[1]
		const hPoolName = poolConfig[2]
		const poolSymbol = poolConfig[0]

		const sdk = SDK.initializeFromEvent(
			conf,
			new Pricer(),
			new TokenInit(),
			event
		)

		const pool = sdk.Pools.loadPool<string>(event.address)
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenOne))
		const hToken = sdk.Tokens.getOrCreateToken(
			Address.fromString(inputTokenTwo)
		)
		const acc = sdk.Accounts.loadAccount(event.params.provider)
		const hPool = sdk.Pools.loadPool<string>(
			Bytes.fromHexString(
				event.address
					.toHexString()
					.concat('-')
					.concat('1')
			)
		)

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}
		if (!hPool.isInitialized) {
			hPool.initialize(hPoolName, poolSymbol, BridgePoolType.LIQUIDITY, hToken)
		}

		if (
			event.transaction.hash.toHexString() ==
			'0xb164734917a3ab5987544d99f6a5875a95bbb30d57c30dfec8db8d13789490ee'
		) {
			pool.pool._inputTokenLiquidityBalance = event.params.lpTokenSupply.div(
				BIGINT_TEN_TO_EIGHTEENTH
			)
		}

		pool.setOutputTokenSupply(event.params.lpTokenSupply)
		hPool.setOutputTokenSupply(event.params.lpTokenSupply)

		acc.liquidityDeposit(pool, liquidity)

		pool.pool.relation = hPool.getBytesID()
		hPool.pool.relation = hPool.getBytesID()

		const Amm = L2_Amm.bind(event.address)
		const inputBalanceCallA = Amm.try_getTokenBalance(BigInt.zero().toI32())
		const inputBalanceCallB = Amm.try_getTokenBalance(BIGINT_ONE.toI32())

		if (!inputBalanceCallA.reverted && !inputBalanceCallB.reverted) {
			pool.setInputTokenBalance(inputBalanceCallA.value)

			hPool.setInputTokenBalance(inputBalanceCallB.value)
			hPool.setNetValueExportedUSD(BIGDECIMAL_ZERO)

			if (SIX_DECIMAL_TOKENS.includes(token.id.toHexString())) {
				let poolTVE = inputBalanceCallA.value
					.plus(inputBalanceCallB.value)
					.minus(pool.pool._inputTokenLiquidityBalance!)
				pool.setNetValueExportedUSD(
					poolTVE.div(BIGINT_TEN_TO_SIX).toBigDecimal()
				)
				log.warning('TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}', [
					poolTVE.toString(),
					poolTVE
						.div(BIGINT_TEN_TO_SIX)
						.toBigDecimal()
						.toString(),
					inputBalanceCallA.value.toString(),
					inputBalanceCallB.value.toString(),
					pool.pool._inputTokenLiquidityBalance!.toString(),
				])
			} else {
				let poolTVE = inputBalanceCallA.value
					.plus(inputBalanceCallB.value)
					.minus(pool.pool._inputTokenLiquidityBalance!)
				pool.setNetValueExportedUSD(
					poolTVE.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal()
				)
				log.warning('TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}', [
					poolTVE.toString(),
					poolTVE
						.div(BIGINT_TEN_TO_EIGHTEENTH)
						.toBigDecimal()
						.toString(),
					inputBalanceCallA.value.toString(),
					inputBalanceCallB.value.toString(),
					pool.pool._inputTokenLiquidityBalance!.toString(),
				])
			}
		} else {
			log.warning('inputBalanceCallB reverted', [])
		}

		log.warning(
			`LA ${token.id.toHexString()} - lpTokenSupply: {}, amount: {}, hash: {},  feeUsd: {}`,
			[
				bigIntToBigDecimal(event.params.lpTokenSupply).toString(),
				bigIntToBigDecimal(liquidity, 6).toString(),
				event.transaction.hash.toHexString(),
				bigIntToBigDecimal(event.params.fees[0], 6).toString(),
			]
		)
	}
}
export function handleRemoveLiquidity(event: RemoveLiquidity): void {
	if (NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
		let amount = event.params.tokenAmounts
		if (amount.length == 0) {
			return
		}

		const liquidity = amount[0].plus(amount[1])

		const inputTokenOne = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)[0]
		const inputTokenTwo = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)[1]
		const poolConfig = NetworkConfigs.getPoolDetails(
			event.address.toHexString()
		)

		const poolName = poolConfig[1]
		const poolSymbol = poolConfig[0]
		const hPoolName = poolConfig[2]

		const sdk = SDK.initializeFromEvent(
			conf,
			new Pricer(),
			new TokenInit(),
			event
		)

		const pool = sdk.Pools.loadPool<string>(event.address)
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenOne))
		const hToken = sdk.Tokens.getOrCreateToken(
			Address.fromString(inputTokenTwo)
		)
		const acc = sdk.Accounts.loadAccount(event.params.provider)
		const hPool = sdk.Pools.loadPool<string>(
			Bytes.fromHexString(
				event.address
					.toHexString()
					.toLowerCase()
					.concat('-')
					.concat('1')
			)
		)
		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}

		if (!hPool.isInitialized) {
			hPool.initialize(hPoolName, poolSymbol, BridgePoolType.LIQUIDITY, hToken)
		}

		pool.setOutputTokenSupply(event.params.lpTokenSupply)
		hPool.setOutputTokenSupply(event.params.lpTokenSupply)

		acc.liquidityWithdraw(pool, liquidity)

		const Amm = L2_Amm.bind(event.address)
		const inputBalanceCallA = Amm.try_getTokenBalance(BigInt.zero().toI32())
		const inputBalanceCallB = Amm.try_getTokenBalance(BIGINT_ONE.toI32())

		if (!inputBalanceCallA.reverted && !inputBalanceCallB.reverted) {
			pool.setInputTokenBalance(inputBalanceCallA.value)

			hPool.setInputTokenBalance(inputBalanceCallB.value)
			hPool.setNetValueExportedUSD(BIGDECIMAL_ZERO)

			if (SIX_DECIMAL_TOKENS.includes(token.id.toHexString())) {
				let poolTVE = inputBalanceCallA.value
					.plus(inputBalanceCallB.value)
					.minus(pool.pool._inputTokenLiquidityBalance!)
				pool.setNetValueExportedUSD(
					poolTVE.div(BIGINT_TEN_TO_SIX).toBigDecimal()
				)
				log.warning('TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}', [
					poolTVE.toString(),
					poolTVE
						.div(BIGINT_TEN_TO_SIX)
						.toBigDecimal()
						.toString(),
					inputBalanceCallA.value.toString(),
					inputBalanceCallB.value.toString(),
					pool.pool._inputTokenLiquidityBalance!.toString(),
				])
			} else {
				let poolTVE = inputBalanceCallA.value
					.plus(inputBalanceCallB.value)
					.minus(pool.pool._inputTokenLiquidityBalance!)
				pool.setNetValueExportedUSD(
					poolTVE.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal()
				)
				log.warning('TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}', [
					poolTVE.toString(),
					poolTVE
						.div(BIGINT_TEN_TO_EIGHTEENTH)
						.toBigDecimal()
						.toString(),
					inputBalanceCallA.value.toString(),
					inputBalanceCallB.value.toString(),
					pool.pool._inputTokenLiquidityBalance!.toString(),
				])
			}
		} else {
			log.warning('inputBalanceCallB reverted', [])
		}
		pool.pool.relation = hPool.getBytesID()
		hPool.pool.relation = hPool.getBytesID()

		log.warning(
			'LWITH lpTokenSupply: {}, amount6-0: {}, amount18-0: {}, amount6-1: {}, amount18-1: {}, hash: {}',
			[
				bigIntToBigDecimal(event.params.lpTokenSupply).toString(),
				bigIntToBigDecimal(amount[0], 6).toString(),
				bigIntToBigDecimal(amount[0]).toString(),
				bigIntToBigDecimal(amount[1], 6).toString(),
				bigIntToBigDecimal(amount[1]).toString(),
				event.transaction.hash.toHexString(),
			]
		)
	}
}
export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
	if (NetworkConfigs.getPoolsList().includes(event.address.toHexString())) {
		log.warning('LWITHONE lpTokenSupply: {}, amount: {}, txHash: {}', [
			event.params.lpTokenSupply.toString(),
			event.transaction.hash.toHexString(),
			bigIntToBigDecimal(event.params.lpTokenAmount).toString(),
		])

		const tokenIndex = event.params.boughtId
		if (!tokenIndex.equals(BigInt.zero())) {
			return
		}

		const inputTokenOne = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)[0]

		const amount = event.params.lpTokenAmount.div(BigInt.fromI32(2))

		const inputTokenTwo = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)[1]

		const poolConfig = NetworkConfigs.getPoolDetails(
			event.address.toHexString()
		)

		const poolName = poolConfig[1]
		const hPoolName = poolConfig[2]
		const poolSymbol = poolConfig[0]

		const sdk = SDK.initializeFromEvent(
			conf,
			new Pricer(),
			new TokenInit(),
			event
		)

		const pool = sdk.Pools.loadPool<string>(event.address)
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenOne))
		const hToken = sdk.Tokens.getOrCreateToken(
			Address.fromString(inputTokenTwo)
		)
		const acc = sdk.Accounts.loadAccount(event.params.provider)

		const hPool = sdk.Pools.loadPool<string>(
			Bytes.fromHexString(
				event.address
					.toHexString()
					.concat('-')
					.concat('1')
			)
		)
		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}

		if (!hPool.isInitialized) {
			hPool.initialize(hPoolName, poolSymbol, BridgePoolType.LIQUIDITY, hToken)
		}

		pool.setOutputTokenSupply(event.params.lpTokenSupply)
		hPool.setOutputTokenSupply(event.params.lpTokenSupply)

		acc.liquidityWithdraw(pool, amount.div(BIGINT_TEN_TO_EIGHTEENTH))

		const Amm = L2_Amm.bind(event.address)
		const inputBalanceCallA = Amm.try_getTokenBalance(BigInt.zero().toI32())
		const inputBalanceCallB = Amm.try_getTokenBalance(BIGINT_ONE.toI32())

		if (!inputBalanceCallA.reverted && !inputBalanceCallB.reverted) {
			pool.setInputTokenBalance(inputBalanceCallA.value)

			hPool.setInputTokenBalance(inputBalanceCallB.value)
			hPool.setNetValueExportedUSD(BIGDECIMAL_ZERO)

			if (SIX_DECIMAL_TOKENS.includes(token.id.toHexString())) {
				let poolTVE = inputBalanceCallA.value
					.plus(inputBalanceCallB.value)
					.minus(pool.pool._inputTokenLiquidityBalance!)
				pool.setNetValueExportedUSD(
					poolTVE.div(BIGINT_TEN_TO_SIX).toBigDecimal()
				)
				log.warning('TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}', [
					poolTVE.toString(),
					poolTVE
						.div(BIGINT_TEN_TO_SIX)
						.toBigDecimal()
						.toString(),
					inputBalanceCallA.value.toString(),
					inputBalanceCallB.value.toString(),
					pool.pool._inputTokenLiquidityBalance!.toString(),
				])
			} else {
				let poolTVE = inputBalanceCallA.value
					.plus(inputBalanceCallB.value)
					.minus(pool.pool._inputTokenLiquidityBalance!)
				pool.setNetValueExportedUSD(
					poolTVE.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal()
				)
				log.warning('TVE1: {}, TVE2: {}, iTB-A: {}, iTB-B: {}, iTLB: {}', [
					poolTVE.toString(),
					poolTVE
						.div(BIGINT_TEN_TO_EIGHTEENTH)
						.toBigDecimal()
						.toString(),
					inputBalanceCallA.value.toString(),
					inputBalanceCallB.value.toString(),
					pool.pool._inputTokenLiquidityBalance!.toString(),
				])
			}
		} else {
			log.warning('inputBalanceCallB reverted', [])
		}

		pool.pool.relation = hPool.getBytesID()
		hPool.pool.relation = hPool.getBytesID()

		log.warning('LWITHONE lpTokenSupply: {}, amount: {}, txHash: {}', [
			event.params.lpTokenSupply.toString(),
			bigIntToBigDecimal(event.params.lpTokenAmount).toString(),
			event.transaction.hash.toHexString(),
		])
	}
}
