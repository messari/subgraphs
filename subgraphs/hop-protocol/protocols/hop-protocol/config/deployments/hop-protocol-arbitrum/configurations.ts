import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import { Network } from '../../../../../src/common/constants'

export class HopProtocolArbitrumConfigurations implements Configurations {
	getNetwork(): string {
		return Network.ARBITRUM_ONE
	}
	getAmmAddress(address: string): string {
		if (address == '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8') {
			return '0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'
		} else if (address == '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1') {
			return '0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'
		} else if (address == '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa') {
			return '0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'
		} else if (address == '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1') {
			return '0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'
		} else if (address == '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f') {
			return '0x7191061D5d4C60f598214cC6913502184BAddf18'
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(address: string): string[] {
		if (address == '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8') {
			return ['USDC', 'USDC', '18']
		} else if (address == '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1') {
			return ['DAI', 'DAI', '18']
		} else if (address == '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa') {
			return ['USDT', 'USDT', '6']
		} else if (address == '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1') {
			return ['ETH', 'ETH', '18']
		} else if (address == '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f') {
			return ['WBTC', 'WBTC', '18']
		} else if (address == '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC') {
			return ['HOP', 'HOP', '18']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getBridgeConfig(address: string): string[] {
		if (address == '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8') {
			return [
				'0x0e0E3d2C5c292161999474247956EF542caBF8dd',
				'ARBITRUM_USDC_BRIDGE',
				'arbitrum_usdc_bridge',
			]
		} else if (address == '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1') {
			return [
				'0x7aC115536FE3A185100B2c4DE4cb328bf3A58Ba6',
				'ARBITRUM_DAI_BRIDGE',
				'arbitrum_dai_bridge',
			]
		} else if (address == '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa') {
			return [
				'0x72209Fe68386b37A40d6bCA04f78356fd342491f',
				'ARBITRUM_USDT_BRIDGE',
				'arbitrum_usdc_bridge',
			]
		} else if (address == '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1') {
			return [
				'0x3749C4f034022c39ecafFaBA182555d4508caCCC',
				'ARBITRUM_ETH_BRIDGE',
				'arbitrum_eth_bridge',
			]
		} else if (address == '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f') {
			return [
				'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6',
				'ARBITRUM_WBTC_BRIDGE',
				'arbitrum_wbtc_bridge',
			]
		} else if (address == '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC') {
			return [
				'0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266',
				'ARBITRUM_HOP_BRIDGE',
				'arbitrum_hop_bridge',
			]
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenList(): string[] {
		return [
			'0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC
			'0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
			'0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', // USDT
			'0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // ETH
			'0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // WBTC
			'0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC', // HOP
		]
	}
}
