import { SDK } from '../../../../src/sdk/protocols/bridge'
import { TokenPricer } from '../../../../src/sdk/protocols/config'
import {
	TokenInitializer,
	TokenParams,
} from '../../../../src/sdk/protocols/bridge/tokens'
import {
	BridgePermissionType,
	CrosschainTokenType,
	BridgePoolType,
} from '../../../../src/sdk/protocols/bridge/enums'
import { BridgeConfig } from '../../../../src/sdk/protocols/bridge/config'
import { Versions } from '../../../../src/versions'
import { NetworkConfigs } from '../../../../configurations/configure'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { Transfer } from '../../../../generated/Token/Token'
import { _ERC20 } from '../../../../generated/Token/_ERC20'
import { Token } from '../../../../generated/schema'
import { getUsdPricePerToken, getUsdPrice } from '../../../../src/prices/index'
import { bigIntToBigDecimal } from '../../../../src/sdk/util/numbers'
import { reverseChainIDs } from '../../../../src/sdk/protocols/bridge/chainIds'
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
		const token = _ERC20.bind(address)

		const tokenConfig = NetworkConfigs.getTokenDetails(address.toHexString())
		const name = tokenConfig[0]
		const symbol = tokenConfig[1]
		const decimals = BigInt.fromString(tokenConfig[2]).toI32()
		return { name, symbol, decimals }
	}
}

export function handleTransfer(event: Transfer): void {
	if (NetworkConfigs.getTokenList().includes(event.address.toHexString())) {
		const bridgeConfig = NetworkConfigs.getBridgeConfig(
			event.address.toHexString()
		)

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

		if (
			event.params.to.toHexString() != bridgeAddress ||
			event.params.from.toHexString() != bridgeAddress
		) {
			return
		}

		log.warning(
			'bridgeAddress: {}, TokenAddress: {}, fromAddress: {}, toAddress: {}',
			[
				bridgeAddress,
				event.address.toHexString(),
				event.params.to.toHexString(),
				event.params.from.toHexString(),
			]
		)

		const poolConfig = NetworkConfigs.getPoolDetails(
			event.address.toHexString()
		)

		const poolName = poolConfig[0]
		const poolSymbol = poolConfig[0]

		let poolAddress = NetworkConfigs.getPoolAddressFromTokenAddress(
			event.address.toHexString()
		)
		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

		const token = sdk.Tokens.getOrCreateToken(event.address)
		const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress))

		const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
			reverseChainIDs.get(Network.MAINNET)!,
			event.address,
			CrosschainTokenType.CANONICAL,
			event.address
		)

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.BURN_MINT, token)
		}

		if (event.params.to.toHexString() == bridgeAddress) {
			sdk.Accounts.loadAccount(event.params.from)
		}
		if (event.params.from.toHexString() == bridgeAddress) {
			const acc = sdk.Accounts.loadAccount(event.params.to)
			acc.transferIn(
				pool,
				pool.getDestinationTokenRoute(crossToken)!,
				event.params.to,
				event.params.value
			)
		}
	}
}
