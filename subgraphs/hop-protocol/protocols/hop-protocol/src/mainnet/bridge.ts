import { SDK } from '../../../../src/sdk/protocols/bridge'
import { TokenPricer } from '../../../../src/sdk/protocols/config'
import {
	TokenInitializer,
	TokenParams,
} from '../../../../src/sdk/protocols/bridge/tokens'
import { Pool } from '../../../../src/sdk/protocols/bridge/pool'
import {
	BridgePermissionType,
	CrosschainTokenType,
	BridgePoolType,
} from '../../../../src/sdk/protocols/bridge/enums'
import { BridgeConfig } from '../../../../src/sdk/protocols/bridge/config'
import { _ERC20 } from 'wherever You have an ABI for it'
import { Versions } from '../../../../src/versions'
import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { Token } from '../../../../generated/schema'
import {
	BonderAdded,
	BonderRemoved,
	MultipleWithdrawalsSettled,
	Stake,
	TransferFromL1Completed,
	TransferRootSet,
	TransfersCommitted,
	Unstake,
	WithdrawalBondSettled,
	WithdrawalBonded,
	Withdrew,
} from '../../../../generated/HopL2Bridge/L2_Bridge'

// Implement TokenPricer to pass it to the SDK constructor

export function handleBonderAdded(event: BonderAdded): void {
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
export function handleBonderRemoved(event: BonderRemoved): void {}
export function handleTransferFromL1Completed(
	event: TransferFromL1Completed
): void {}
export function handleTransferRootSet(event: TransferRootSet): void {}
export function handleTransferSent(event: TransferRootSet): void {}
export function handleTransfersCommitted(event: TransfersCommitted): void {}
export function handleUnstake(event: Unstake): void {}
export function handleWithdrawalBondSettled(
	event: WithdrawalBondSettled
): void {}
export function handleWithdrawalBonded(event: WithdrawalBonded): void {}
export function handleWithdrew(event: Withdrew): void {}
