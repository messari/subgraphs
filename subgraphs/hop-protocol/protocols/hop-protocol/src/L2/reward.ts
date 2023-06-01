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
	log,
	dataSource,
} from '@graphprotocol/graph-ts'
import {
	RewardPaid,
	Staked,
	Withdrawn,
} from '../../../../generated/HopL2Rewards/L2_Reward'
import { Token } from '../../../../generated/schema'
import { getUsdPricePerToken, getUsdPrice } from '../../../../src/prices/index'
import { bigIntToBigDecimal } from '../../../../src/sdk/util/numbers'

import {
	updateRewardsPaid,
	updateStaked,
	updateWithdrawn,
} from '../../../../src/common/rewards'

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
		.concat(dataSource.network().toUpperCase().replace('-', '_'))
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

export function handleRewardsPaid(event: RewardPaid): void {
	if (
		NetworkConfigs.getRewardTokenList().includes(event.address.toHexString())
	) {
		let amount = event.params.reward
		const poolAddress = NetworkConfigs.getPoolAddressFromRewardTokenAddress(
			event.address.toHexString()
		)

		const poolConfig = NetworkConfigs.getPoolDetails(poolAddress)
		log.warning('GNO RewardsPaid 1 --> poolAddress: {},', [poolAddress])

		const poolName = poolConfig[1]

		const poolSymbol = poolConfig[0]
		const hPoolName = poolConfig[2]

		const sdk = SDK.initializeFromEvent(
			conf,
			new Pricer(),
			new TokenInit(),
			event
		)
		updateRewardsPaid(
			sdk.Pools,
			sdk.Pools,
			sdk.Tokens,
			poolName,
			poolSymbol,
			hPoolName,
			poolAddress,
			event,
			amount
		)
	}
}
export function handleStaked(event: Staked): void {
	if (
		NetworkConfigs.getRewardTokenList().includes(event.address.toHexString())
	) {
		let amount = event.params.amount

		const poolAddress = NetworkConfigs.getPoolAddressFromRewardTokenAddress(
			event.address.toHexString()
		)
		log.warning('Staked --> emitter: {}, poolAddress: {}, amount: {}', [
			event.address.toHexString(),
			poolAddress,
			amount.toString(),
		])

		const poolConfig = NetworkConfigs.getPoolDetails(poolAddress)
		log.warning('Staked 1 --> poolAddress: {},', [poolAddress])

		const poolName = poolConfig[1]
		const hPoolName = poolConfig[2]

		const poolSymbol = poolConfig[0]

		const sdk = SDK.initializeFromEvent(
			conf,
			new Pricer(),
			new TokenInit(),
			event
		)
		updateStaked(
			sdk.Pools,
			sdk.Pools,
			sdk.Tokens,
			poolName,
			poolSymbol,
			hPoolName,
			poolAddress,
			event.address.toHexString(),
			amount
		)

		sdk.Accounts.loadAccount(event.params.user)
	}
}

export function handleWithdrawn(event: Withdrawn): void {
	if (
		NetworkConfigs.getRewardTokenList().includes(event.address.toHexString())
	) {
		let amount = event.params.amount

		const poolAddress = NetworkConfigs.getPoolAddressFromRewardTokenAddress(
			event.address.toHexString()
		)
		log.warning('UnStaked --> emitter: {}, poolAddress: {}, amount: {}', [
			event.address.toHexString(),
			poolAddress,
			amount.toString(),
		])

		const poolConfig = NetworkConfigs.getPoolDetails(poolAddress)
		log.warning('UnStaked 1 --> poolAddress: {},', [poolAddress])

		const poolName = poolConfig[1]
		const hPoolName = poolConfig[2]

		const poolSymbol = poolConfig[0]

		const sdk = SDK.initializeFromEvent(
			conf,
			new Pricer(),
			new TokenInit(),
			event
		)

		updateWithdrawn(
			sdk.Pools,
			sdk.Pools,
			sdk.Tokens,
			poolName,
			poolSymbol,
			hPoolName,
			poolAddress,
			event.address.toHexString(),
			amount
		)
		sdk.Accounts.loadAccount(event.params.user)
	}
}
