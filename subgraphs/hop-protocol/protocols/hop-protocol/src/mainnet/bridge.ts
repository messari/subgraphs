import { SDK } from '../sdk/protocols/bridge'
import { TokenPricer } from '../sdk/protocols/config'
import { TokenInitializer, TokenParams } from '../sdk/protocols/bridge/tokens'
import { Pool } from '../sdk/protocols/bridge/pool'
import { BridgePermissionType } from '../sdk/protocols/bridge/enums'
import { BridgeConfig } from '../sdk/protocols/bridge/config'
import { _ERC20 } from 'wherever You have an ABI for it'
import { Versions } from './versions'

// Implement TokenPricer to pass it to the SDK constructor
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

// Implement TokenInitializer
class TokenInit implements TokenInitializer {
	getTokenParams(address: Address): TokenParams {
		const erc20 = _ERC20.bind(address)
		const name = erc20.name()
		const symbol = erc20.symbol()
		const decimals = erc20.decimals().toI32()
		return {
			name,
			symbol,
			decimals,
		}
	}
}

const conf = new BridgeConfig(
	'0x2796317b0fF8538F253012862c06787Adfb8cEb6',
	'Synapse',
	'synapse',
	BridgePermissionType.WHITELIST,
	Versions
)

export function handleTransferOut(event: TransferOut): void {
	const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

	const poolID = event.address
	const pool = sdk.Pools.loadPool(
		poolID,
		onCreatePool,
		BridgePoolType.LOCK_RELEASE
	)
	const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
		event.params.chainId,
		event.params.token,
		CrosschainTokenType.WRAPPED,
		event.params.token
	)
	pool.addDestinationToken(crossToken)

	const acc = sdk.Accounts.loadAccount(event.transaction.from)
	acc.transferOut(
		pool,
		pool.getDestinationTokenRoute(crossToken)!,
		event.params.to,
		event.params.amount,
		event.transaction.hash
	)
	pool.addRevenueNative(event.params.protocolFee, event.params.supplyFee)
}

function onCreatePool(
	event: PoolCreated,
	pool: Pool,
	sdk: SDK,
	type: BridgePoolType
): void {
	// ...
	pool.initialize(name, symbol, type, inputToken)
}
