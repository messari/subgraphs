import { SDK } from '../../../../src/sdk/protocols/bridge'
import { TokenPricer } from '../../../../src/sdk/protocols/config'
import {
	TokenInitializer,
	TokenParams,
} from '../../../../src/sdk/protocols/bridge/tokens'
import { Pool } from '../../../../src/sdk/protocols/bridge/pool'
import { Account } from '../../../../src/sdk/protocols/bridge/account'
import {
	BridgePermissionType,
	CrosschainTokenType,
	BridgePoolType,
} from '../../../../src/sdk/protocols/bridge/enums'
import { BridgeConfig } from '../../../../src/sdk/protocols/bridge/config'
import { _ERC20 } from '../../../../abis/Prices/ERC20.json'
import { Versions } from '../../../../src/versions'
import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { Token } from '../../../../generated/schema'
import { bigIntToBigDecimal } from '../../../../src/sdk/util/numbers'
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
		event.address.toHexString(),
		'Synapse',
		'synapse',
		BridgePermissionType.WHITELIST,
		Versions
	)
	const sdk = new SDK(conf, new Pricer(), new TokenInit(), event)

	sdk.Accounts.loadAccount(event.params.newBonder)
}
export function handleWithdrawalBonded(event: WithdrawalBonded): void {}
