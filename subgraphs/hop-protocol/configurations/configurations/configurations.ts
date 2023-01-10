import { HopProtocolArbitrumConfigurations } from '../../protocols/hop-protocol/config/deployments/hop-protocol-arbitrum/configurations'
import { HopProtocolEthereumConfigurations } from '../../protocols/hop-protocol/config/deployments/hop-protocol-ethereum/configurations'
import { HopProtocolOptimismConfigurations } from '../../protocols/hop-protocol/config/deployments/hop-protocol-optimism/configurations'
import { HopProtocolxDaiConfigurations } from '../../protocols/hop-protocol/config/deployments/hop-protocol-xdai/configurations'
import { HopProtocolMaticConfigurations } from '../../protocols/hop-protocol/config/deployments/hop-protocol-matic/configurations'
import { Configurations } from './interface'
import { Deploy } from './deploy'
import { log } from '@graphprotocol/graph-ts'

export function getNetworkConfigurations(deploy: i32): Configurations {
	switch (deploy) {
		case Deploy.HOP_PROTOCOL_ARBITRUM: {
			return new HopProtocolArbitrumConfigurations()
		}
		case Deploy.HOP_PROTOCOL_ETHEREUM: {
			return new HopProtocolEthereumConfigurations()
		}
		case Deploy.HOP_PROTOCOL_OPTIMISM: {
			return new HopProtocolOptimismConfigurations()
		}
		case Deploy.HOP_PROTOCOL_XDAI: {
			return new HopProtocolxDaiConfigurations()
		}
		case Deploy.HOP_PROTOCOL_MATIC: {
			return new HopProtocolMaticConfigurations()
		}
		default: {
			log.critical(
				'No configurations found for deployment protocol/network',
				[]
			)
			return new HopProtocolEthereumConfigurations()
		}
	}
}
