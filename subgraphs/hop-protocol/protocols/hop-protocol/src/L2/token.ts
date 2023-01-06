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
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Transfer } from '../../../../generated/Token/Token'
import { Token } from '../../../../generated/schema'
// import {
// 	getUsdPricePerToken,
// 	getUsdPrice,
// } from '../../../../generated/Token/Prices
import { bigIntToBigDecimal } from '../../../../src/sdk/util/numbers'

export function handleTransfer(event: Transfer): void {
	let address = event.address.toHexString()
	if (NetworkConfigs.getTokenList().includes(event.address.toHex())) {
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

		const bridgeConfig = NetworkConfigs.getBridgeConfig(address)
		const conf = new BridgeConfig(
			bridgeConfig[0],
			bridgeConfig[1],
			bridgeConfig[2],
			BridgePermissionType.PERMISSIONLESS,
			Versions
		)

		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)
		sdk.Accounts.loadAccount(event.params.from)
	}
}
