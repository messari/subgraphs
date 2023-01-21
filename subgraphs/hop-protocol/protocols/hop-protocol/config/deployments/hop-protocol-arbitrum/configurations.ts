import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import { Network } from '../../../../../src/sdk/util/constants'

export class HopProtocolArbitrumConfigurations implements Configurations {
	getNetwork(): string {
		return Network.ARBITRUM_ONE
	}

	getPoolAddressFromTokenAddress(tokenAddress: string): string {
		if (
			tokenAddress == '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase()
		) {
			return '0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'.toLowerCase() //USDC AMM
		} else if (
			tokenAddress == '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase()
		) {
			return '0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'.toLowerCase() //DAI AMM
		} else if (
			tokenAddress == '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase()
		) {
			return '0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'.toLowerCase() //USDT AMM
		} else if (
			tokenAddress == '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase()
		) {
			return '0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'.toLowerCase() //ETH AMM
		} else if (
			tokenAddress == '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase()
		) {
			return '0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase() //WBTC AMM
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (
			tokenAddress == '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase()
		) {
			return ['USDC', 'USDC', '18']
		} else if (
			tokenAddress == '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase()
		) {
			return ['DAI', 'DAI', '18']
		} else if (
			tokenAddress == '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase()
		) {
			return ['USDT', 'USDT', '6']
		} else if (
			tokenAddress == '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase()
		) {
			return ['ETH', 'ETH', '18']
		} else if (
			tokenAddress == '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase()
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
				'0x0e0E3d2C5c292161999474247956EF542caBF8dd'.toLowerCase(), //Token Bridge Address
				'ARBITRUM_USDC_BRIDGE',
				'arbitrum_usdc_bridge',
			]
		} else if (
			tokenAddress == '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase()
		) {
			return [
				'0x7aC115536FE3A185100B2c4DE4cb328bf3A58Ba6'.toLowerCase(),
				'ARBITRUM_DAI_BRIDGE',
				'arbitrum_dai_bridge',
			]
		} else if (
			tokenAddress == '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase()
		) {
			return [
				'0x72209Fe68386b37A40d6bCA04f78356fd342491f'.toLowerCase(),
				'ARBITRUM_USDT_BRIDGE',
				'arbitrum_usdc_bridge',
			]
		} else if (
			tokenAddress == '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase()
		) {
			return [
				'0x3749C4f034022c39ecafFaBA182555d4508caCCC'.toLowerCase(),
				'ARBITRUM_ETH_BRIDGE',
				'arbitrum_eth_bridge',
			]
		} else if (
			tokenAddress == '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase()
		) {
			return [
				'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase(),
				'ARBITRUM_WBTC_BRIDGE',
				'arbitrum_wbtc_bridge',
			]
		} else if (
			tokenAddress == '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase()
		) {
			return [
				'0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase(),
				'ARBITRUM_HOP_BRIDGE',
				'arbitrum_hop_bridge',
			]
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0x0e0E3d2C5c292161999474247956EF542caBF8dd'.toLowerCase()
		) {
			//HOP/USDC
			return '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase() //USDC
		} else if (
			bridgeAddress ==
			'0x7aC115536FE3A185100B2c4DE4cb328bf3A58Ba6'.toLowerCase()
		) {
			//HOP/DAI
			return '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x72209Fe68386b37A40d6bCA04f78356fd342491f'.toLowerCase()
		) {
			//HOP/USDT
			return '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0x3749C4f034022c39ecafFaBA182555d4508caCCC'.toLowerCase()
		) {
			//HOP/ETH
			return '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase()
		) {
			//HOP/WBTC
			return '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase()
		) {
			//HOP BRIDGE
			return '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase() //HOP
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getTokenAddressFromPoolAddress(poolAddress: string): string {
		if (
			poolAddress == '0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'.toLowerCase() //HOP/USDC
		) {
			return '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase() //USDC
		} else if (
			poolAddress == '0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'.toLowerCase() //HOP/DAI
		) {
			return '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase() //DAI
		} else if (
			poolAddress == '0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'.toLowerCase() //HOP/USDT
		) {
			return '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase() //USDT
		} else if (
			poolAddress == '0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'.toLowerCase() //HOP/ETH
		) {
			return '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase() //ETH
		} else if (
			poolAddress == '0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase() //HOP/WBTC
		) {
			return '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase() //WBTC
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0x0e0E3d2C5c292161999474247956EF542caBF8dd'.toLowerCase() //USDC POOL
		) {
			return '0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'.toLowerCase()
		} else if (
			bridgeAddress ==
			'0x7aC115536FE3A185100B2c4DE4cb328bf3A58Ba6'.toLowerCase() //HOP/DAI
		) {
			return '0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x72209Fe68386b37A40d6bCA04f78356fd342491f'.toLowerCase() //HOP/USDT
		) {
			return '0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0x3749C4f034022c39ecafFaBA182555d4508caCCC'.toLowerCase() //HOP/ETH
		) {
			return '0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase() //HOP/WBTC
		) {
			return '0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase() //HOP BRIDGE
		) {
			return '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase() //HOP
		} else {
			log.critical('Address not found', [])
			return ''
		}
	}

	getPoolDetails(poolAddress: string): string[] {
		if (
			poolAddress == '0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'.toLowerCase()
		) {
			return ['HOP-USDC', 'hUSDC/USDC']
		} else if (
			poolAddress == '0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'.toLowerCase()
		) {
			return ['HOP-DAI', 'hDAI/DAI']
		} else if (
			poolAddress == '0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'.toLowerCase()
		) {
			return ['HOP-USDT', 'hUSDT/USDT']
		} else if (
			poolAddress == '0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'.toLowerCase()
		) {
			return ['HOP-ETH', 'hETH/ETH']
		} else if (
			poolAddress == '0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase()
		) {
			return ['HOP-WBTC', 'hWBTC/WBTC']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenList(): string[] {
		return [
			'0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase(), // USDC
			'0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase(), // DAI
			'0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase(), // USDT
			'0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase(), // ETH
			'0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase(), // WBTC
			'0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase(), // HOP
		]
	}
	getPoolsList(): string[] {
		return [
			'0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'.toLowerCase(), // USDC
			'0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'.toLowerCase(), // DAI
			'0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'.toLowerCase(), // USDT
			'0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'.toLowerCase(), // ETH
			'0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase(), // WBTC
		]
	}
	getBridgeList(): string[] {
		return [
			'0x0e0E3d2C5c292161999474247956EF542caBF8dd'.toLowerCase(), // USDC
			'0x7aC115536FE3A185100B2c4DE4cb328bf3A58Ba6'.toLowerCase(), // DAI
			'0x72209Fe68386b37A40d6bCA04f78356fd342491f'.toLowerCase(), // USDT
			'0x3749C4f034022c39ecafFaBA182555d4508caCCC'.toLowerCase(), // ETH
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase(), // WBTC
			'0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase(), // HOP
		]
	}
	getArbitrumPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		return ''
	}
	getPolygonPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		return ''
	}
	getXdaiPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		return ''
	}
	getOptimismPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		return ''
	}

	getPoolAddressFromChainId(chainId: string, bridgeAddress: string): string {
		return ''
	}
	getUsdcPools(): string[] {
		return []
	}
	getUsdcTokens(): string[] {
		return []
	}
	getDaiPools(): string[] {
		return []
	}
	getDaiTokens(): string[] {
		return []
	}
	getUsdtPools(): string[] {
		return []
	}
	getUsdtTokens(): string[] {
		return []
	}
	getEthPools(): string[] {
		return []
	}
	getEthTokens(): string[] {
		return []
	}
	getSnxPools(): string[] {
		return []
	}
	getSnxTokens(): string[] {
		return []
	}
	getsUSDPools(): string[] {
		return []
	}
	getsUSDTokens(): string[] {
		return []
	}
	getWbtcPools(): string[] {
		return []
	}
	getWbtcTokens(): string[] {
		return []
	}
	getMaticPools(): string[] {
		return []
	}
	getMaticTokens(): string[] {
		return []
	}
}
