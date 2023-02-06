import { SDK } from '../../../../src/sdk/protocols/bridge'
import { TokenPricer } from '../../../../src/sdk/protocols/config'
import {
	TokenInitializer,
	TokenParams,
} from '../../../../src/sdk/protocols/bridge/tokens'
import {
	BridgePermissionType,
	BridgePoolType,
} from '../../../../src/sdk/protocols/bridge/enums'
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
	TokenSwap,
	L2_Amm,
	AddLiquidity,
	RemoveLiquidity,
	RemoveLiquidityOne,
} from '../../../../generated/HopL2Amm/L2_Amm'
import { Token } from '../../../../generated/schema'
import { getUsdPricePerToken, getUsdPrice } from '../../../../src/prices/index'
import { bigIntToBigDecimal } from '../../../../src/sdk/util/numbers'
import {
	BIGINT_TEN_TO_EIGHTEENTH,
	RewardTokenType,
} from '../../../../src/sdk/util/constants'
import { priceTokens } from '../../config/constants/constant'

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

export function handleRewardsPaid(event: RewardsPaid): void {
	if (
		NetworkConfigs.getRewardTokenList().includes(event.address.toHexString())
	) {
		let amount = event.params.tokenAmounts

		const poolAddress = NetworkConfigs.getPoolAddressFromRewardTokenAddress(
			event.address.toHexString()
		)
		log.warning('RewardsPaid--> emitter: {}, poolAddress: {}, inputToken: {}', [
			event.address.toHexString(),
			poolAddress,
			amount,
		])
		const inputToken = NetworkConfigs.getTokenAddressFromPoolAddress(
			event.address.toHexString()
		)
		log.warning('RewardsPaid--> poolAddress: {}, inputToken: {}', [
			poolAddress,
			inputToken,
		])
		const poolConfig = NetworkConfigs.getPoolDetails(poolAddress)

		const poolName = poolConfig[1]
		const poolSymbol = poolConfig[0]

		const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

		const pool = sdk.Pools.loadPool<string>(event.address)
		const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken))
		sdk.Accounts.loadAccount(event.params.provider)

		if (!pool.isInitialized) {
			pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
		}

		const Reward = L2_Reward.bind(event.address)
		const rewardRateCall = Rewards.try_rewardRate()
		if (!rewardRateCall.reverted) {
			const rewardRate = rewardRateCall.value
			const dailyEmission = BigInt.fromI32(2419200).div(rewardRate)
			pool.setRewardEmissions(RewardTokenType.DEPOSIT, token, dailyEmission)

			log.warning(
				'RewardsPaid--> txHash: {}, rewardRate: {}, dailyEmission: {}',
				[
					event.transaction.hash.toHexString(),
					rewardRate.toString(),
					dailyEmission.toString(),
				]
			)
		} else {
			log.warning('Contract call reverted', [])
		}
	}
}
