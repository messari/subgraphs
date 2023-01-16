import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import { Network } from '../../../../../src/sdk/util/constants'

export class HopProtocolEthereumConfigurations implements Configurations {
	getNetwork(): string {
		return Network.MAINNET
	}
	getPoolsList(): string[] {
		return []
	}

	getPoolAddressFromTokenAddress(tokenAddress: string): string {
		return ''
	}
	getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		return ''
	}

	getTokenDetails(tokenAddress: string): string[] {
		if (this.getUsdcTokens().includes(tokenAddress)) {
			return ['USDC', 'USD Coin', '6']
		} else if (this.getMaticTokens().includes(tokenAddress)) {
			return ['MATIC', 'Matic', '18']
		} else if (this.getDaiTokens().includes(tokenAddress)) {
			return ['DAI', 'DAI Stablecoin', '18']
		} else if (this.getWbtcTokens().includes(tokenAddress)) {
			return ['WBTC', 'Wrapped BTC', '18']
		} else if (this.getUsdtTokens().includes(tokenAddress)) {
			return ['USDT', 'Tether USD', '6']
		} else if (this.getSnxTokens().includes(tokenAddress)) {
			return ['SNX', 'SNX', '18']
		} else if (this.getsUSDTokens().includes(tokenAddress)) {
			return ['sUSD', 'sUSD', '18']
		} else if (this.getEthTokens().includes(tokenAddress)) {
			return ['ETH', 'Ethereum', '18']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getPoolDetails(poolAddress: string): string[] {
		if (this.getUsdcPools().includes(poolAddress)) {
			return ['HOP-USDC', 'hUSDC/USDC']
		} else if (this.getMaticPools().includes(poolAddress)) {
			return ['HOP-MATIC', 'hMATIC/MATIC']
		} else if (this.getDaiPools().includes(poolAddress)) {
			return ['HOP-DAI', 'hDAI/DAI']
		} else if (this.getWbtcPools().includes(poolAddress)) {
			return ['HOP-WBTC', 'hWBTC/WBTC']
		} else if (this.getUsdtPools().includes(poolAddress)) {
			return ['HOP-USDT', 'hUSDT/USDT']
		} else if (this.getSnxPools().includes(poolAddress)) {
			return ['HOP-SNX', 'hSNX/SNX']
		} else if (this.getsUSDPools().includes(poolAddress)) {
			return ['HOP-sUSD', 'hsUSD/sUSD']
		} else if (this.getEthPools().includes(poolAddress)) {
			return ['HOP-ETH', 'hETH/ETH']
		} else {
			log.critical('Pool not found', [])
			return []
		}
	}

	getBridgeConfig(tokenAddress: string): string[] {
		if (
			tokenAddress == '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase()
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
				'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase(),
				'MAINNET_USDT_BRIDGE',
				'mainnet_usdt_bridge',
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
			tokenAddress == '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'.toLowerCase()
		) {
			return [
				'0x893246FACF345c99e4235E5A7bbEE7404c988b96'.toLowerCase(),
				'MAINNET_SNX_BRIDGE',
				'mainnet_snx_bridge',
			]
		} else if (
			tokenAddress == '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'.toLowerCase()
		) {
			return [
				'0x22B1Cbb8D98a01a3B71D034BB899775A76Eb1cc2'.toLowerCase(),
				'MAINNET_MATIC_BRIDGE',
				'mainnet_matic_bridge',
			]
		} else if (
			tokenAddress == '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'.toLowerCase()
		) {
			return [
				'0x36443fC70E073fe9D50425f82a3eE19feF697d62'.toLowerCase(),
				'MAINNET_sUSD_BRIDGE',
				'mainnet_sUsd_bridge',
			]
		} else if (
			tokenAddress == '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase()
		) {
			return [
				'0x914f986a44AcB623A277d6Bd17368171FCbe4273'.toLowerCase(),
				'MAINNET_HOP_BRIDGE',
				'mainnet_hop_bridge',
			]
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenAddressFromBridgeAddress(bridgeAddress: string): string {
		//HOP/USDC
		if (
			bridgeAddress ==
			'0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase()
		) {
			return '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase() //USDC
		}
		//HOP/DAI
		else if (
			bridgeAddress ==
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase()
		) {
			return '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase() //DAI
		}
		//HOP/USDT
		else if (
			bridgeAddress ==
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase()
		) {
			return '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase() //USDT
		}
		//HOP/ETH
		else if (
			bridgeAddress ==
			'0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase()
		) {
			return '0x0000000000000000000000000000000000000000'.toLowerCase() //ETH
		} //HOP/WBTC
		else if (
			bridgeAddress ==
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase()
		) {
			return '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase() //WBTC
		} //HOP/SNX
		else if (
			bridgeAddress ==
			'0x893246FACF345c99e4235E5A7bbEE7404c988b96'.toLowerCase()
		) {
			return '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'.toLowerCase() //SNX
		} //HOP/sUSD
		else if (
			bridgeAddress ==
			'0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'.toLowerCase()
		) {
			return '0x36443fC70E073fe9D50425f82a3eE19feF697d62'.toLowerCase() //sUSD
		} //HOP/MATIC
		else if (
			bridgeAddress ==
			'0x22B1Cbb8D98a01a3B71D034BB899775A76Eb1cc2'.toLowerCase()
		) {
			return '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'.toLowerCase() //MATIC
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

	getArbitrumPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase()
		) {
			//HOP/USDC
			return '0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'.toLowerCase() //USDC
		} else if (
			bridgeAddress ==
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase()
		) {
			//HOP/DAI
			return '0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase()
		) {
			//HOP/USDT
			return '0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase()
		) {
			//HOP/ETH
			return '0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase()
		) {
			//HOP/WBTC
			return '0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x914f986a44AcB623A277d6Bd17368171FCbe4273'.toLowerCase()
		) {
			//HOP BRIDGE
			return '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase() //HOP
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getPolygonPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase() //USDC POOL
		) {
			return '0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase()
		} else if (
			bridgeAddress ==
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase() //HOP/DAI
		) {
			return '0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase() //HOP/USDT
		) {
			return '0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase() //HOP/ETH
		) {
			return '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0x22b1cbb8d98a01a3b71d034bb899775a76eb1cc2'.toLowerCase() //HOP/MATIC
		) {
			return '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase() //MATIC
		} else if (
			bridgeAddress ==
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase() //HOP/WBTC
		) {
			return '0x46fc3Af3A47792cA3ED06fdF3D657145A675a8D8'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x914f986a44AcB623A277d6Bd17368171FCbe4273'.toLowerCase() //HOP BRIDGE
		) {
			return '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase() //HOP
		} else {
			log.critical('Address not found', [])
			return ''
		}
	}

	getXdaiPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase() //USDC POOL
		) {
			return '0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase()
		} else if (
			bridgeAddress ==
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase() //HOP/DAI
		) {
			return '0x24afDcA4653042C6D08fb1A754b2535dAcF6Eb24'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase() //HOP/USDT
		) {
			return '0x3Aa637D6853f1d9A9354FE4301Ab852A88b237e7'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase() //HOP/ETH
		) {
			return '0x4014DC015641c08788F15bD6eB20dA4c47D936d8'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0x22B1Cbb8D98a01a3B71D034BB899775A76Eb1cc2'.toLowerCase() //HOP/MATIC
		) {
			return '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase() //MATIC
		} else if (
			bridgeAddress ==
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase() //HOP/WBTC
		) {
			return '0xb07c6505e1E41112494123e40330c5Ac09817CFB'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x914f986a44AcB623A277d6Bd17368171FCbe4273'.toLowerCase() //HOP BRIDGE
		) {
			return '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase() //HOP
		} else {
			log.critical('Address not found', [])
			return ''
		}
	}

	getOptimismPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase() //USDC POOL
		) {
			return '0x3c0FFAca566fCcfD9Cc95139FEF6CBA143795963'.toLowerCase()
		} else if (
			bridgeAddress ==
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase() //HOP/DAI
		) {
			return '0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase() //HOP/USDT
		) {
			return '0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase() //HOP/ETH
		) {
			return '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase() //HOP/WBTC
		) {
			return '0x46fc3Af3A47792cA3ED06fdF3D657145A675a8D8'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x893246FACF345c99e4235E5A7bbEE7404c988b96'.toLowerCase() //HOP/SNX
		) {
			return '0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73'.toLowerCase() //SNX
		} else if (
			bridgeAddress ==
			'0x36443fC70E073fe9D50425f82a3eE19feF697d62'.toLowerCase() //HOP/sUSD
		) {
			return '0x8d4063E82A4Db8CdAed46932E1c71e03CA69Bede'.toLowerCase() //sUSD
		} else if (
			bridgeAddress ==
			'0x914f986a44AcB623A277d6Bd17368171FCbe4273'.toLowerCase() //HOP BRIDGE
		) {
			return '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase() //HOP
		} else {
			log.critical('Address not found', [])
			return ''
		}
	}

	getPoolAddressFromChainId(chainId: string, bridgeAddress: string): string {
		if (chainId == '42161') {
			return this.getArbitrumPoolAddressFromBridgeAddress(bridgeAddress) //Arbitrum
		} else if (chainId == '10') {
			return this.getOptimismPoolAddressFromBridgeAddress(bridgeAddress) //Optimism
		} else if (chainId == '100') {
			return this.getXdaiPoolAddressFromBridgeAddress(bridgeAddress) //Xdai
		} else if (chainId == '137') {
			return this.getPolygonPoolAddressFromBridgeAddress(bridgeAddress) //Polygon
		} else {
			log.critical('Chain not found', [])
			return ''
		}
	}

	getTokenList(): string[] {
		return [
			'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(), // USDC
			'0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase(), // DAI
			'0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(), // USDT
			'0x0000000000000000000000000000000000000000'.toLowerCase(), // ETH
			'0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase(), // WBTC
			'0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'.toLowerCase(), // MATIC
			'0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'.toLowerCase(), // SNX
			'0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'.toLowerCase(), // sUSD
			'0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase(), // HOP
		]
	}

	getUsdcPools(): string[] {
		return [
			'0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase(), // POLYGON USDC
			'0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase(), // XDAI USDC
			'0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'.toLowerCase(), // ARBITRUM USDC
			'0x3c0FFAca566fCcfD9Cc95139FEF6CBA143795963'.toLowerCase(), // OPTIMISM USDC
		]
	}

	getUsdcTokens(): string[] {
		return [
			'0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase(), // POLYGON USDC
			'0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase(), //XDAI USDC
			'0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase(), // ARBITRUM USDC
			'0x7F5c764cBc14f9669B88837ca1490cCa17c31607'.toLowerCase(), // OPTIMISM USDC
			'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(), // MAINNET USDC
		]
	}
	getDaiPools(): string[] {
		return [
			'0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase(), // POLYGON DAI
			'0x24afDcA4653042C6D08fb1A754b2535dAcF6Eb24'.toLowerCase(), // XDAI DAI
			'0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'.toLowerCase(), // ARBITRUM DAI
			'0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'.toLowerCase(), // OPTIMISM DAI
		]
	}
	getDaiTokens(): string[] {
		return [
			'0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase(), // POLYGON DAI
			'0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase(), // XDAI DAI
			'0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase(), // ARBITRUM DAI
			'0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase(), // MAINNET DAI
			'0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase(), // OPTIMISM DAI
		]
	}

	getUsdtPools(): string[] {
		return [
			'0xB2f7d27B21a69a033f85C42d5EB079043BAadC81'.toLowerCase(), // POLYGON USDT
			'0x3Aa637D6853f1d9A9354FE4301Ab852A88b237e7'.toLowerCase(), // XDAI USDT
			'0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'.toLowerCase(), // ARBITRUM USDT
			'0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'.toLowerCase(), // OPTIMISM USDT
		]
	}
	getUsdtTokens(): string[] {
		return [
			'0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase(), // POLYGON USDT
			'0x4ECaBa5870353805a9F068101A40E0f32ed605C6'.toLowerCase(), // XDAI USDT
			'0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase(), // ARBITRUM USDT
			'0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'.toLowerCase(), // OPTIMISM USDT
			'0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(), // MAINNET USDT
		]
	}

	getEthPools(): string[] {
		return [
			'0x266e2dc3C4c59E42AA07afeE5B09E964cFFe6778'.toLowerCase(), // POLYGON ETH
			'0x4014DC015641c08788F15bD6eB20dA4c47D936d8'.toLowerCase(), // XDAI ETH
			'0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'.toLowerCase(), // ARBITRUM ETH
			'0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase(), // OPTIMISM ETH
		]
	}
	getEthTokens(): string[] {
		return [
			'0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase(), // POLYGON ETH
			'0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase(), // XDAI ETH
			'0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase(), // ARBITRUM ETH
			'0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase(), // MAINNET ETH
			'0x0000000000000000000000000000000000000000'.toLowerCase(), // OPTIMISM ETH
		]
	}

	getSnxPools(): string[] {
		return [
			'0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73'.toLowerCase(), // OPTIMISM SNX
		]
	}
	getSnxTokens(): string[] {
		return [
			'0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'.toLowerCase(), // MAINNET SNX
			'0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4'.toLowerCase(), // OPTIMISM SNX
		]
	}
	getsUSDPools(): string[] {
		return [
			'0x8d4063E82A4Db8CdAed46932E1c71e03CA69Bede'.toLowerCase(), // OPTIMISM ETH
		]
	}
	getsUSDTokens(): string[] {
		return [
			'0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9'.toLowerCase(), // OPTIMISM ETH
			'0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'.toLowerCase(), // MAINNET ETH
		]
	}
	getWbtcPools(): string[] {
		return [
			'0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'.toLowerCase(), // POLYGON WBTC
			'0xb07c6505e1E41112494123e40330c5Ac09817CFB'.toLowerCase(), // XDAI WBTC
			'0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase(), // ARBITRUM WBTC
			'0x46fc3Af3A47792cA3ED06fdF3D657145A675a8D8'.toLowerCase(), // OPTIMISM WBTC
		]
	}
	getWbtcTokens(): string[] {
		return [
			'0x4e9840f3C1ff368a10731D15c11516b9Fe7E1898'.toLowerCase(), // POLYGON WBTC
			'0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'.toLowerCase(), // XDAI WBTC
			'0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase(), // ARBITRUM WBTC
			'0x68f180fcCe6836688e9084f035309E29Bf0A2095'.toLowerCase(), // OPTIMISM WBTC
			'0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase(), // MAINNET WBTC
		]
	}
	getMaticPools(): string[] {
		return [
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase(), // POLYGON MATIC
			'0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase(), // XDAI MATIC
		]
	}
	getMaticTokens(): string[] {
		return [
			'0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase(), // POLYGON MATIC
			'0x7122d7661c4564b7C6Cd4878B06766489a6028A2'.toLowerCase(), // XDAI MATIC
			'0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'.toLowerCase(), // MAINNET MATIC
		]
	}

	getBridgeList(): string[] {
		return [
			'0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase(), // USDC
			'0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase(), // DAI
			'0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase(), // USDT
			'0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase(), // ETH
			'0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase(), // WBTC
			'0x22B1Cbb8D98a01a3B71D034BB899775A76Eb1cc2'.toLowerCase(), // MATIC
			'0x893246FACF345c99e4235E5A7bbEE7404c988b96'.toLowerCase(), // SNX
			'0x36443fC70E073fe9D50425f82a3eE19feF697d62'.toLowerCase(), // sUSD
			'0x914f986a44AcB623A277d6Bd17368171FCbe4273'.toLowerCase(), // HOP
		]
	}
}
