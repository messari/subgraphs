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
	Stake,
	TransferFromL1Completed,
	TransferSent,
	BonderAdded,
	Withdrew,
	Unstake,
} from '../../../../generated/HopL2Bridge/L2_Bridge'
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

export function handleTransferFromL1Completed(
	event: TransferFromL1Completed
): void {
	const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
		event.address.toHexString()
	)
	const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
		event.address.toHexString()
	)
	const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
	const poolConfig = NetworkConfigs.getPoolDetails(inputToken)

	const fee = bigIntToBigDecimal(event.params.relayerFee)

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
		pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token)
	}
	const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
		BigInt.fromString('0'),
		Address.fromString(inputToken),
		CrosschainTokenType.CANONICAL,
		Address.fromString(inputToken)
	)

	pool.addDestinationToken(crossToken)
	pool.addProtocolSideRevenueUSD(fee)

	acc.transferOut(
		pool,
		pool.getDestinationTokenRoute(crossToken)!,
		event.params.recipient,
		event.params.amount
	)
}

export function handleUnstake(event: Unstake): void {}

export function handleBonderAdded(event: BonderAdded): void {
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

export function handleTransferSent(event: TransferSent): void {
	const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
		event.address.toHexString()
	)
	const bridgeConfig = NetworkConfigs.getBridgeConfig(inputToken)
	const poolConfig = NetworkConfigs.getPoolDetails(inputToken)

	const fee = bigIntToBigDecimal(event.params.bonderFee)

	const poolName = poolConfig[0]
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
	const pool = sdk.Pools.loadPool<string>(event.address)
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
	pool.addProtocolSideRevenueUSD(fee)

	acc.transferOut(
		pool,
		pool.getDestinationTokenRoute(crossToken)!,
		event.params.recipient,
		event.params.amount
	)
}
export function handleStake(event: Stake): void {}
export function handleWithdrew(event: Withdrew): void {}
