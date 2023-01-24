import { SDK } from '../../../../src/sdk/protocols/bridge'
import { TokenPricer } from '../../../../src/sdk/protocols/config'
import {
	TokenInitializer,
	TokenParams,
} from '../../../../src/sdk/protocols/bridge/tokens'
import {
	BridgePermissionType,
	BridgePoolType,
	CrosschainTokenType,
} from '../../../../src/sdk/protocols/bridge/enums'
import { reverseChainIDs } from '../../../../src/sdk/protocols/bridge/chainIds'
import { BridgeConfig } from '../../../../src/sdk/protocols/bridge/config'
import { Versions } from '../../../../src/versions'
import { NetworkConfigs } from '../../../../configurations/configure'
import {
	Address,
	BigDecimal,
	BigInt,
	dataSource,
	log,
} from '@graphprotocol/graph-ts'
import {
	TransferSent,
	TransferFromL1Completed,
	BonderAdded,
} from '../../../../generated/HopL2Bridge/L2_Bridge'
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

export function handleBonderAdded(event: BonderAdded): void {
	if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
		const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
			event.address.toHexString()
		)
		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)
		sdk.Accounts.loadAccount(event.params.newBonder)
	}
}

export function handleTransferFromL1Completed(
	event: TransferFromL1Completed
): void {
	if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
		const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
			event.address.toHexString()
		)

		log.warning('inputToken: {}, bridgeAddress: {}', [
			inputToken,
			event.address.toHexString(),
		])
		const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
			event.address.toHexString()
		)
		log.warning(
			'inputToken2: {}, bridgeAddress2: {}, poolAddress2: {}, txHash: {}',
			[
				inputToken,
				event.address.toHexString(),
				poolAddress,
				event.transaction.hash.toHexString(),
			]
		)
		const poolConfig = NetworkConfigs.getPoolDetails(poolAddress)

		const poolName = poolConfig[1]
		const poolSymbol = poolConfig[0]

		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

		const acc = sdk.Accounts.loadAccount(event.transaction.from)
		const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress))
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}

		const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
			reverseChainIDs.get(
				dataSource
					.network()
					.toUpperCase()
					.replace('-', '_')
			)!,
			Address.fromString(
				NetworkConfigs.getMainnetCrossTokenFromTokenAddress(inputToken)
			),
			CrosschainTokenType.CANONICAL,
			Address.fromString(inputToken)
		)
		pool.addDestinationToken(crossToken)

		acc.transferIn(
			pool,
			pool.getDestinationTokenRoute(crossToken)!,
			event.transaction.from,
			event.params.amount,
			event.transaction.hash
		)
		pool.addInputTokenBalance(event.params.amount)
	}
}

export function handleTransferSent(event: TransferSent): void {
	if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
		const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
			event.address.toHexString()
		)
		const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
			event.address.toHexString()
		)

		const poolConfig = NetworkConfigs.getPoolDetails(poolAddress)

		const poolName = poolConfig[0]
		const poolSymbol = poolConfig[1]

		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

		const acc = sdk.Accounts.loadAccount(event.params.recipient)
		const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress))
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}
		const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
			event.params.chainId,
			Address.fromString(
				NetworkConfigs.getCrossTokenAddress(
					event.params.chainId.toString(),
					inputToken
				)
			),
			CrosschainTokenType.CANONICAL,
			Address.fromString(inputToken)
		)
		pool.addDestinationToken(crossToken)
		acc.transferOut(
			pool,
			pool.getDestinationTokenRoute(crossToken)!,
			event.params.recipient,
			event.params.amount,
			event.transaction.hash
		)
		pool.addRevenueNative(BigInt.zero(), event.params.bonderFee)

		pool.addInputTokenBalance(event.params.amount.times(BigInt.fromI32(-1)))
	}
}
