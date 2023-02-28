import { SDK } from '../../../../src/sdk/protocols/bridge'
import { TokenPricer } from '../../../../src/sdk/protocols/config'
import {
	TokenInitializer,
	TokenParams,
} from '../../../../src/sdk/protocols/bridge/tokens'
import { BridgePermissionType } from '../../../../src/sdk/protocols/bridge/enums'
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
import { Transfer } from '../../../../generated/Token/Token'
import { _ERC20 } from '../../../../generated/Token/_ERC20'
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
		const token = _ERC20.bind(address)

		const tokenConfig = NetworkConfigs.getTokenDetails(address.toHexString())
		const symbol = tokenConfig[0]
		const name = tokenConfig[1]
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

export function handleTransfer(event: Transfer): void {
	if (NetworkConfigs.getTokenList().includes(event.address.toHexString())) {
		const bridgeAddress = NetworkConfigs.getTokenDetails(
			event.address.toHexString()
		)[3]

		if (event.params.from.toHexString() != bridgeAddress) {
			return
		}

		log.warning(
			'bridgeAddress: {}, TokenAddress: {}, fromAddress: {}, toAddress: {}',
			[
				bridgeAddress,
				event.address.toHexString(),
				event.params.from.toHexString(),
				event.params.to.toHexString(),
			]
		)

		const sdk = SDK.initializeFromEvent(
			conf,
			new Pricer(),
			new TokenInit(),
			event
		)

		sdk.Tokens.getOrCreateToken(event.address)

		if (event.params.from.toHexString() == bridgeAddress) {
			const acc = sdk.Accounts.loadAccount(event.params.to)

			acc.countTransferIn()
		}
	}
}
