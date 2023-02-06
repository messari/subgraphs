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
	Bytes,
	dataSource,
	ethereum,
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
import {
	MESSENGER_ADDRESSES,
	XDAI_L2_SIGNATURE,
	OPTIMISM_L2_SIGNATURE,
	MESSENGER_EVENT_SIGNATURES,
} from '../../config/constants/constant'
import { Network } from '../../../../src/sdk/util/constants'

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
		.concat(dataSource.network().toUpperCase().replace('-', '_'))
		.concat('-BRIDGE'),
	'hop-'.concat(dataSource.network().replace('-', '_')).concat('-bridge'),
	BridgePermissionType.PERMISSIONLESS,
	Versions
)

export function handleBonderAdded(event: BonderAdded): void {
	if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)
		sdk.Accounts.loadAccount(event.params.newBonder)
	}
}

export function handleTransferFromL1Completed(
	event: TransferFromL1Completed
): void {
	log.warning('TransferFromL1 - bridgeAddress: {},  hash: {}', [
		event.address.toHexString(),
		event.transaction.hash.toHexString(),
	])
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
				dataSource.network().toUpperCase().replace('-', '_')
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
		//MESSAGES
		let receipt = event.receipt

		if (receipt) {
			for (let index = 0; index < receipt.logs.length; index++) {
				const _topic0 = receipt.logs[index].topics[0].toHexString()
				if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue

				const _optimismData = receipt.logs[index].topics[1]
				const _address = receipt.logs[index].address
				const _data = receipt.logs[index].data

				const data = Bytes.fromUint8Array(_data.subarray(0))

				log.warning(
					'MessageINDT - emittingContractaddress: {}, topic0: {}, logAddress: {}, data: {}',
					[
						event.address.toHexString(),
						_topic0,
						_address.toHexString(),
						data.toHexString(),
					]
				)
				if (_topic0 == OPTIMISM_L2_SIGNATURE) {
					acc.messageIn(
						reverseChainIDs.get(Network.MAINNET)!,
						event.params.recipient,
						_optimismData
					)
				} else if (_topic0 == XDAI_L2_SIGNATURE) {
					acc.messageIn(
						reverseChainIDs.get(Network.MAINNET)!,
						event.params.recipient,
						data
					)
				}

				log.warning('MessageIN - TokenAddress: {}, data: {}', [
					event.address.toHexString(),
					data.toHexString(),
				])
			}
		}

		log.warning('TransferIN - TokenAddress: {},  txHash: {}', [
			event.address.toHexString(),
			event.transaction.hash.toHexString(),
		])
	}
}

export function handleTransferSent(event: TransferSent): void {
	log.warning(
		'TransferSent - bridgeAddress: {},  hash: {}, outgoingChainId: {}',
		[
			event.address.toHexString(),
			event.transaction.hash.toHexString(),
			event.params.chainId.toString(),
		]
	)
	if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
		const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
			event.address.toHexString()
		)
		const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
			event.address.toHexString()
		)

		const poolConfig = NetworkConfigs.getPoolDetails(poolAddress)
		log.warning('S1 - inputToken: {},  poolAddress: {}', [
			inputToken,
			poolAddress,
		])
		const poolName = poolConfig[0]
		const poolSymbol = poolConfig[1]

		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

		const acc = sdk.Accounts.loadAccount(event.params.recipient)
		const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress))
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}
		log.warning('S2 - inputToken: {},  poolAddress: {}', [
			inputToken,
			poolAddress,
		])
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
		log.warning('S3 - inputToken: {},  poolAddress: {}', [
			inputToken,
			poolAddress,
		])
		pool.addDestinationToken(crossToken)
		acc.transferOut(
			pool,
			pool.getDestinationTokenRoute(crossToken)!,
			event.params.recipient,
			event.params.amount,
			event.transaction.hash
		)
		pool.addRevenueNative(BigInt.zero(), event.params.bonderFee)

		//MESSAGES
		let receipt = event.receipt

		if (receipt) {
			for (let index = 0; index < receipt.logs.length; index++) {
				const _topic0 = receipt.logs[index].topics[0].toHexString()
				if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue

				const _address = receipt.logs[index].address
				const _data = receipt.logs[index].data

				const data = Bytes.fromUint8Array(_data.subarray(0))

				log.warning(
					'MessageOUTDT - emittingContractaddress: {}, topic0: {},  logAddress: {}, data: {}',
					[
						event.address.toHexString(),
						_topic0,
						_address.toHexString(),
						data.toHexString(),
					]
				)
				if (_topic0 == XDAI_L2_SIGNATURE || _topic0 == OPTIMISM_L2_SIGNATURE) {
					acc.messageOut(event.params.chainId, event.params.recipient, data)
				}
				log.warning('MessageOUTDT2 - TokenAddress: {},  data: {}', [
					event.address.toHexString(),
					data.toHexString(),
				])
			}
		}
		log.warning('TransferOUT - TokenAddress: {},  txHash: {},', [
			event.address.toHexString(),
			event.transaction.hash.toHexString(),
		])
	}
}
