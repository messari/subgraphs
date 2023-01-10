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
import { BridgeConfig } from '../../../../src/sdk/protocols/bridge/config'
import { Versions } from '../../../../src/versions'
import { NetworkConfigs } from '../../../../configurations/configure'
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
	TransferSentToL2,
	BonderAdded,
} from '../../../../generated/HopL1Bridge/L1_Bridge'
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

export function handleTransferSentToL2(event: TransferSentToL2): void {
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

		sdk.Accounts.loadAccount(event.params.recipient)
		sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))
	}
}
