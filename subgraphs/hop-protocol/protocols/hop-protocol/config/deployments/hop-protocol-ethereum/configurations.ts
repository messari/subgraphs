import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import { Network } from '../../../../../src/sdk/util/constants'

export class HopProtocolEthereumConfigurations implements Configurations {
	getNetwork(): string {
		return Network.MAINNET
	}
	getAmmList(): string[] {
		return []
	}
	getAmmAddress(tokenAddress: string): string {
		return ''
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (
			tokenAddress == '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase()
		) {
			return ['USDC', 'USDC', '18']
		} else if (
			tokenAddress == '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase()
		) {
			return ['DAI', 'DAI', '18']
		} else if (
			tokenAddress == '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase()
		) {
			return ['USDT', 'USDT', '6']
		} else if (
			tokenAddress == '0x0000000000000000000000000000000000000000'.toLowerCase()
		) {
			return ['ETH', 'ETH', '18']
		} else if (
			tokenAddress == '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase()
		) {
			return ['WBTC', 'WBTC', '18']
		} else if (
			tokenAddress == '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase()
		) {
			return ['HOP', 'HOP', '18']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getBridgeConfig(tokenAddress: string): string[] {
		if (
			tokenAddress == '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase()
		) {
			return [
				'0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase(), //Token Bridge Address
				'MAINNET_USDC_BRIDGE',
				'mainnet_usdc_bridge',
			]
		} else if (
			tokenAddress == '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase()
		) {
			return [
				'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase(),
				'MAINNET_DAI_BRIDGE',
				'mainnet_dai_bridge',
			]
		} else if (
			tokenAddress == '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase()
		) {
			return [
				'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase(),
				'MAINNET_USDT_BRIDGE',
				'mainnet_usdc_bridge',
			]
		} else if (
			tokenAddress == '0x0000000000000000000000000000000000000000'.toLowerCase()
		) {
			return [
				'0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase(),
				'MAINNET_ETH_BRIDGE',
				'mainnet_eth_bridge',
			]
		} else if (
			tokenAddress == '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase()
		) {
			return [
				'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase(),
				'MAINNET_WBTC_BRIDGE',
				'mainnet_wbtc_bridge',
			]
		} else if (
			tokenAddress == '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase()
		) {
			return [
				'0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase(),
				'MAINNET_HOP_BRIDGE',
				'mainnet_hop_bridge',
			]
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase()
		) {
			//HOP/USDC
			return '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase() //USDC
		} else if (
			bridgeAddress ==
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase()
		) {
			//HOP/DAI
			return '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase()
		) {
			//HOP/USDT
			return '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase()
		) {
			//HOP/ETH
			return '0x0000000000000000000000000000000000000000'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase()
		) {
			//HOP/WBTC
			return '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x914f986a44AcB623A277d6Bd17368171FCbe4273'.toLowerCase()
		) {
			//HOP BRIDGE
			return '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase() //HOP
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getTokenAddressFromPoolAddress(poolAddress: string): string {
		return ''
	}

	getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		return ''
	}

	getPoolDetails(poolAddress: string): string[] {
		return []
	}

	getTokenList(): string[] {
		return [
			'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(), // USDC
			'0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase(), // DAI
			'0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(), // USDT
			'0x0000000000000000000000000000000000000000'.toLowerCase(), // ETH
			'0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase(), // WBTC
			'0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase(), // HOP
		]
	}
	getBridgeList(): string[] {
		return [
			'0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase(), // USDC
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase(), // DAI
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase(), // USDT
			'0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase(), // ETH
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase(), // WBTC
			'0x914f986a44AcB623A277d6Bd17368171FCbe4273'.toLowerCase(), // HOP
		]
	}
}
