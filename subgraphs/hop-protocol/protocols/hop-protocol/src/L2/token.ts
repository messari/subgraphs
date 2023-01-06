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
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Transfer } from '../../../../generated/Token/Token'
import { Token } from '../../../../generated/schema'
import { getUsdPricePerToken, getUsdPrice } from '../../../../src/prices/index'
import { bigIntToBigDecimal } from '../../../../src/sdk/util/numbers'

export function handleTransfer(event: Transfer): void {
	if (NetworkConfigs.getTokenList().includes(event.address.toHex())) {
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
			!(
				event.params.to.equals(Address.fromHexString(bridgeAddress)) ||
				event.params.from.equals(Address.fromHexString(bridgeAddress))
			)
		) {
			return
		}
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

		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)
		sdk.Accounts.loadAccount(event.params.from)
		sdk.Accounts.loadAccount(event.params.to)
	}
}
