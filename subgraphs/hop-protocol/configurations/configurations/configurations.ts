import { HopProtocolArbitrumConfigurations } from '../../protocols/hop-protocol/config/deployments/hop-protocol-arbitrum/configurations'
import { HopProtocolEthereumConfigurations } from '../../protocols/hop-protocol/config/deployments/hop-protocol-ethereum/configurations'
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
		default: {
			log.critical(
				'No configurations found for deployment protocol/network',
				[]
			)
			return new HopProtocolArbitrumConfigurations()
		}
	}
}
