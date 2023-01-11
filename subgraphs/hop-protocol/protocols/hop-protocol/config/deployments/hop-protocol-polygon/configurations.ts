import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import { Network } from '../../../../../src/sdk/util/constants'

export class HopProtocolPolygonConfigurations implements Configurations {
	getNetwork(): string {
		return Network.MATIC
	}
	getPoolAddressFromTokenAddress(tokenAddress: string): string {
		if (
			tokenAddress == '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase()
		) {
			return '0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase() //USDC AMM
		} else if (
			tokenAddress == '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase()
		) {
			return '0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase() //DAI AMM
		} else if (
			tokenAddress == '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase()
		) {
			return '0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase() //MATIC AMM
		} else if (
			tokenAddress == '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase()
		) {
			return '0xB2f7d27B21a69a033f85C42d5EB079043BAadC81'.toLowerCase() //USDT AMM
		} else if (
			tokenAddress == '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase()
		) {
			return '0x266e2dc3C4c59E42AA07afeE5B09E964cFFe6778'.toLowerCase() //ETH AMM
		} else if (
			tokenAddress == '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase()
		) {
			return '0x4e9840f3C1ff368a10731D15c11516b9Fe7E1898'.toLowerCase() //WBTC AMM
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (
			tokenAddress == '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase()
		) {
			return ['USDC', 'USD Coin', '18']
		} else if (
			tokenAddress == '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase()
		) {
			return ['DAI', 'DAI Stablecoin', '18']
		} else if (
			tokenAddress == '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase()
		) {
			return ['USDT', 'Tether USD', '6']
		} else if (
			tokenAddress == '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase()
		) {
			return ['ETH', 'ETH', '18']
		} else if (
			tokenAddress == '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase()
		) {
			return ['MATIC', 'MATIC', '18']
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
			tokenAddress == '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase()
		) {
			return [
				'0x0e0E3d2C5c292161999474247956EF542caBF8dd'.toLowerCase(), //Token Bridge Address
				'POLYGON_USDC_BRIDGE',
				'polygon_usdc_bridge',
			]
		} else if (
			tokenAddress == '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase()
		) {
			return [
				'0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase(),
				'POLYGON_DAI_BRIDGE',
				'polygon_dai_bridge',
			]
		} else if (
			tokenAddress == '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase()
		) {
			return [
				'0x6c9a1ACF73bd85463A46B0AFc076FBdf602b690B'.toLowerCase(),
				'POLYGON_USDT_BRIDGE',
				'polygon_usdc_bridge',
			]
		} else if (
			tokenAddress == '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase()
		) {
			return [
				'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase(),
				'POLYGON_ETH_BRIDGE',
				'polygon_eth_bridge',
			]
		} else if (
			tokenAddress == '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase()
		) {
			return [
				'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase(),
				'POLYGON_MATIC_BRIDGE',
				'polygon_matic_bridge',
			]
		} else if (
			tokenAddress == '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase()
		) {
			return [
				'0x91Bd9Ccec64fC22475323a0E55d58F7786587905'.toLowerCase(),
				'POLYGON_WBTC_BRIDGE',
				'polygon_wbtc_bridge',
			]
		} else if (
			tokenAddress == '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase()
		) {
			return [
				'0x553bC791D746767166fA3888432038193cEED5E2'.toLowerCase(),
				'POLYGON_HOP_BRIDGE',
				'polygon_hop_bridge',
			]
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'.toLowerCase()
		) {
			//HOP/USDC
			return '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase() //USDC
		} else if (
			bridgeAddress ==
			'0xEcf268Be00308980B5b3fcd0975D47C4C8e1382a'.toLowerCase()
		) {
			//HOP/DAI
			return '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x6c9a1ACF73bd85463A46B0AFc076FBdf602b690B'.toLowerCase()
		) {
			//HOP/USDT
			return '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase()
		) {
			//HOP/ETH
			return '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0x91Bd9Ccec64fC22475323a0E55d58F7786587905'.toLowerCase()
		) {
			//HOP/WBTC
			return '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x553bC791D746767166fA3888432038193cEED5E2'.toLowerCase()
		) {
			//HOP/MATIC
			return '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase() //MATIC
		} else if (
			bridgeAddress ==
			'0x58c61AeE5eD3D748a1467085ED2650B697A66234'.toLowerCase()
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
			poolAddress == '0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase() //HOP/USDC
		) {
			return '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase() //USDC
		} else if (
			poolAddress == '0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase() //HOP/DAI
		) {
			return '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase() //DAI
		} else if (
			poolAddress == '0xB2f7d27B21a69a033f85C42d5EB079043BAadC81'.toLowerCase() //HOP/USDT
		) {
			return '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase() //USDT
		} else if (
			poolAddress == '0x266e2dc3C4c59E42AA07afeE5B09E964cFFe6778'.toLowerCase() //HOP/ETH
		) {
			return '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase() //ETH
		} else if (
			poolAddress == '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase() //HOP/MATIC
		) {
			return '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase() //MATIC
		} else if (
			poolAddress == '0x4e9840f3C1ff368a10731D15c11516b9Fe7E1898'.toLowerCase() //HOP/WBTC
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
			'0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'.toLowerCase() //USDC POOL
		) {
			return '0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase()
		} else if (
			bridgeAddress ==
			'0xEcf268Be00308980B5b3fcd0975D47C4C8e1382a'.toLowerCase() //HOP/DAI
		) {
			return '0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x6c9a1ACF73bd85463A46B0AFc076FBdf602b690B'.toLowerCase() //HOP/USDT
		) {
			return '0xB2f7d27B21a69a033f85C42d5EB079043BAadC81'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase() //HOP/ETH
		) {
			return '0x266e2dc3C4c59E42AA07afeE5B09E964cFFe6778'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0x553bC791D746767166fA3888432038193cEED5E2'.toLowerCase() //HOP/MATIC
		) {
			return '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase() //MATIC
		} else if (
			bridgeAddress ==
			'0x91Bd9Ccec64fC22475323a0E55d58F7786587905'.toLowerCase() //HOP/WBTC
		) {
			return '0x4e9840f3C1ff368a10731D15c11516b9Fe7E1898'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x58c61AeE5eD3D748a1467085ED2650B697A66234'.toLowerCase() //HOP BRIDGE
		) {
			return '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase() //HOP
		} else {
			log.critical('Address not found', [])
			return ''
		}
	}

	getPoolDetails(poolAddress: string): string[] {
		if (
			poolAddress == '0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase()
		) {
			return ['HOP-USDC', 'hUSDC/USDC']
		} else if (
			poolAddress == '0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase()
		) {
			return ['HOP-DAI', 'hDAI/DAI']
		} else if (
			poolAddress == '0xB2f7d27B21a69a033f85C42d5EB079043BAadC81'.toLowerCase()
		) {
			return ['HOP-USDT', 'hUSDT/USDT']
		} else if (
			poolAddress == '0x266e2dc3C4c59E42AA07afeE5B09E964cFFe6778'.toLowerCase()
		) {
			return ['HOP-ETH', 'hETH/ETH']
		} else if (
			poolAddress == '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase()
		) {
			return ['HOP-MATIC', 'hMATIC/MATIC']
		} else if (
			poolAddress == '0x4e9840f3C1ff368a10731D15c11516b9Fe7E1898'.toLowerCase()
		) {
			return ['HOP-WBTC', 'hWBTC/WBTC']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenList(): string[] {
		return [
			'0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase(), // USDC
			'0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase(), // DAI
			'0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase(), // USDT
			'0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase(), // MATIC
			'0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase(), // ETH
			'0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'.toLowerCase(), // WBTC
			'0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase(), // HOP
		]
	}
	getPoolsList(): string[] {
		return [
			'0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase(), // USDC
			'0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase(), // DAI
			'0xB2f7d27B21a69a033f85C42d5EB079043BAadC81'.toLowerCase(), // USDT
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase(), // MATIC
			'0x266e2dc3C4c59E42AA07afeE5B09E964cFFe6778'.toLowerCase(), // ETH
			'0x4e9840f3C1ff368a10731D15c11516b9Fe7E1898'.toLowerCase(), // WBTC
		]
	}
	getBridgeList(): string[] {
		return [
			'0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'.toLowerCase(), // USDC
			'0xEcf268Be00308980B5b3fcd0975D47C4C8e1382a'.toLowerCase(), // DAI
			'0x6c9a1ACF73bd85463A46B0AFc076FBdf602b690B'.toLowerCase(), // USDT
			'0x553bC791D746767166fA3888432038193cEED5E2'.toLowerCase(), // MATIC
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase(), // ETH
			'0x91Bd9Ccec64fC22475323a0E55d58F7786587905'.toLowerCase(), // WBTC
			'0x58c61AeE5eD3D748a1467085ED2650B697A66234'.toLowerCase(), // HOP
		]
	}
}
