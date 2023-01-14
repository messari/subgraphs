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

export function handleBonderAdded(event: BonderAdded): void {
	if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
		const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
			event.address.toHexString()
		)
		const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)

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
		const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)

		log.warning('inputToken: {}, bridgeAddress: {}', [
			inputToken,
			event.address.toHexString(),
		])
		const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
			event.address.toHexString()
		)
		const poolConfig = NetworkConfigs.getPoolDetails(poolAddress)

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

		const acc = sdk.Accounts.loadAccount(event.params.recipient)
		const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress))
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.BURN_MINT, token)
		}
		const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
			reverseChainIDs.get(
				dataSource
					.network()
					.toUpperCase()
					.replace('-', '_')
			)!,
			Address.fromString(inputToken),
			CrosschainTokenType.CANONICAL,
			Address.fromString(inputToken)
		)

		pool.addDestinationToken(crossToken)

		acc.transferIn(
			pool,
			pool.getDestinationTokenRoute(crossToken)!,
			event.params.recipient,
			event.params.amount
		)
	}
}

export function handleTransferSent(event: TransferSent): void {
	if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
		const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
			event.address.toHexString()
		)
		const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
		const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
			event.address.toHexString()
		)

		const poolConfig = NetworkConfigs.getPoolDetails(poolAddress)

		const fee = bigIntToBigDecimal(event.params.bonderFee)

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

		const acc = sdk.Accounts.loadAccount(event.params.recipient)
		const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress))
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.BURN_MINT, token)
		}
		const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
			event.params.chainId,
			Address.fromString(inputToken),
			CrosschainTokenType.CANONICAL,
			Address.fromString(inputToken)
		)
		pool.addDestinationToken(crossToken)
		acc.transferOut(
			pool,
			pool.getDestinationTokenRoute(crossToken)!,
			event.params.recipient,
			event.params.amount
		)

		pool.addSupplySideRevenueUSD(fee)
	}
}
