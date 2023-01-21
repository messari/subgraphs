import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import { Network } from '../../../../../src/sdk/util/constants'

export class HopProtocolOptimismConfigurations implements Configurations {
	getNetwork(): string {
		return Network.OPTIMISM
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

	getPoolAddressFromTokenAddress(tokenAddress: string): string {
		if (
			tokenAddress == '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'.toLowerCase()
		) {
			return '0x3c0FFAca566fCcfD9Cc95139FEF6CBA143795963'.toLowerCase() //USDC AMM
		} else if (
			tokenAddress == '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase()
		) {
			return '0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'.toLowerCase() //DAI AMM
		} else if (
			tokenAddress == '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'.toLowerCase()
		) {
			return '0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'.toLowerCase() //USDT AMM
		} else if (
			tokenAddress == '0x4200000000000000000000000000000000000006'.toLowerCase()
		) {
			return '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase() //ETH AMM
		} else if (
			tokenAddress == '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4'.toLowerCase()
		) {
			return '0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73'.toLowerCase() //SNX AMM
		} else if (
			tokenAddress == '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9'.toLowerCase()
		) {
			return '0x8d4063E82A4Db8CdAed46932E1c71e03CA69Bede'.toLowerCase() //sUSD AMM
		} else if (
			tokenAddress == '0x68f180fcCe6836688e9084f035309E29Bf0A2095'.toLowerCase()
		) {
			return '0x46fc3Af3A47792cA3ED06fdF3D657145A675a8D8'.toLowerCase() //WBTC AMM
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (
			tokenAddress == '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'.toLowerCase()
		) {
			return ['USDC', 'USDC', '18']
		} else if (
			tokenAddress == '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase()
		) {
			return ['DAI', 'DAI', '18']
		} else if (
			tokenAddress == '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'.toLowerCase()
		) {
			return ['USDT', 'USDT', '6']
		} else if (
			tokenAddress == '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4'.toLowerCase()
		) {
			return ['SNX', 'SNX', '18']
		} else if (
			tokenAddress == '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9'.toLowerCase()
		) {
			return ['sUSD', 'sUSD', '18']
		} else if (
			tokenAddress == '0x4200000000000000000000000000000000000006'.toLowerCase()
		) {
			return ['ETH', 'ETH', '18']
		} else if (
			tokenAddress == '0x68f180fcCe6836688e9084f035309E29Bf0A2095'.toLowerCase()
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
			tokenAddress == '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'.toLowerCase()
		) {
			return [
				'0xa81D244A1814468C734E5b4101F7b9c0c577a8fC'.toLowerCase(), //Token Bridge Address
				'OPTIMISM_USDC_BRIDGE',
				'optimism_usdc_bridge',
			]
		} else if (
			tokenAddress == '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase()
		) {
			return [
				'0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase(),
				'OPTIMISM_DAI_BRIDGE',
				'optimism_dai_bridge',
			]
		} else if (
			tokenAddress == '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'.toLowerCase()
		) {
			return [
				'0x46ae9BaB8CEA96610807a275EBD36f8e916b5C61'.toLowerCase(),
				'OPTIMISM_USDT_BRIDGE',
				'optimism_usdc_bridge',
			]
		} else if (
			tokenAddress == '0x4200000000000000000000000000000000000006'.toLowerCase()
		) {
			return [
				'0x83f6244Bd87662118d96D9a6D44f09dffF14b30E'.toLowerCase(),
				'OPTIMISM_ETH_BRIDGE',
				'optimism_eth_bridge',
			]
		} else if (
			tokenAddress == '0x68f180fcCe6836688e9084f035309E29Bf0A2095'.toLowerCase()
		) {
			return [
				'0xB1ea9FeD58a317F81eEEFC18715Dd323FDEf45c4'.toLowerCase(),
				'OPTIMISM_WBTC_BRIDGE',
				'optimism_wbtc_bridge',
			]
		} else if (
			tokenAddress == '0x68f180fcCe6836688e9084f035309E29Bf0A2095'.toLowerCase()
		) {
			return [
				'0x33Fe5bB8DA466dA55a8A32D6ADE2BB104E2C5201'.toLowerCase(),
				'OPTIMISM_sUSD_BRIDGE',
				'optimism_susd_bridge',
			]
		} else if (
			tokenAddress == '0x68f180fcCe6836688e9084f035309E29Bf0A2095'.toLowerCase()
		) {
			return [
				'0x16284c7323c35F4960540583998C98B1CfC581a7'.toLowerCase(),
				'OPTIMISM_SNX_BRIDGE',
				'optimism_snx_bridge',
			]
		} else if (
			tokenAddress == '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase()
		) {
			return [
				'0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase(),
				'OPTIMISM_HOP_BRIDGE',
				'optimism_hop_bridge',
			]
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0xa81D244A1814468C734E5b4101F7b9c0c577a8fC'.toLowerCase()
		) {
			//HOP/USDC
			return '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'.toLowerCase() //USDC
		} else if (
			bridgeAddress ==
			'0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase()
		) {
			//HOP/DAI
			return '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x46ae9BaB8CEA96610807a275EBD36f8e916b5C61'.toLowerCase()
		) {
			//HOP/USDT
			return '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0x83f6244Bd87662118d96D9a6D44f09dffF14b30E'.toLowerCase()
		) {
			//HOP/ETH
			return '0x4200000000000000000000000000000000000006'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0xB1ea9FeD58a317F81eEEFC18715Dd323FDEf45c4'.toLowerCase()
		) {
			//HOP/WBTC
			return '0x68f180fcCe6836688e9084f035309E29Bf0A2095'.toLowerCase() //WBTC
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
			poolAddress == '0x3c0FFAca566fCcfD9Cc95139FEF6CBA143795963'.toLowerCase() //HOP/USDC
		) {
			return '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'.toLowerCase() //USDC
		} else if (
			poolAddress == '0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'.toLowerCase() //HOP/DAI
		) {
			return '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase() //DAI
		} else if (
			poolAddress == '0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'.toLowerCase() //HOP/USDT
		) {
			return '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'.toLowerCase() //USDT
		} else if (
			poolAddress == '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase() //HOP/ETH
		) {
			return '0x4200000000000000000000000000000000000006'.toLowerCase() //ETH
		} else if (
			poolAddress == '0x46fc3Af3A47792cA3ED06fdF3D657145A675a8D8'.toLowerCase() //HOP/WBTC
		) {
			return '0x68f180fcCe6836688e9084f035309E29Bf0A2095'.toLowerCase() //WBTC
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (
			bridgeAddress ==
			'0xa81D244A1814468C734E5b4101F7b9c0c577a8fC'.toLowerCase() //USDC POOL
		) {
			return '0x3c0FFAca566fCcfD9Cc95139FEF6CBA143795963'.toLowerCase()
		} else if (
			bridgeAddress ==
			'0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase() //HOP/DAI
		) {
			return '0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0x46ae9BaB8CEA96610807a275EBD36f8e916b5C61'.toLowerCase() //HOP/USDT
		) {
			return '0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0x83f6244Bd87662118d96D9a6D44f09dffF14b30E'.toLowerCase() //HOP/ETH
		) {
			return '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0xB1ea9FeD58a317F81eEEFC18715Dd323FDEf45c4'.toLowerCase() //HOP/WBTC
		) {
			return '0x46fc3Af3A47792cA3ED06fdF3D657145A675a8D8'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x16284c7323c35F4960540583998C98B1CfC581a7'.toLowerCase() //HOP/SNX
		) {
			return '0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73'.toLowerCase() //SNX
		} else if (
			bridgeAddress ==
			'0x33Fe5bB8DA466dA55a8A32D6ADE2BB104E2C5201'.toLowerCase() //HOP/sUSD
		) {
			return '0x8d4063E82A4Db8CdAed46932E1c71e03CA69Bede'.toLowerCase() //sUSD
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
			poolAddress == '0x3c0FFAca566fCcfD9Cc95139FEF6CBA143795963'.toLowerCase()
		) {
			return ['HOP-USDC', 'hUSDC/USDC']
		} else if (
			poolAddress == '0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'.toLowerCase()
		) {
			return ['HOP-DAI', 'hDAI/DAI']
		} else if (
			poolAddress == '0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'.toLowerCase()
		) {
			return ['HOP-USDT', 'hUSDT/USDT']
		} else if (
			poolAddress == '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase()
		) {
			return ['HOP-ETH', 'hETH/ETH']
		} else if (
			poolAddress == '0x8d4063E82A4Db8CdAed46932E1c71e03CA69Bede'.toLowerCase()
		) {
			return ['HOP-sUSD', 'hsUSD/sUSD']
		} else if (
			poolAddress == '0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73'.toLowerCase()
		) {
			return ['HOP-SNX', 'hSNX/SNX']
		} else if (
			poolAddress == '0x46fc3Af3A47792cA3ED06fdF3D657145A675a8D8'.toLowerCase()
		) {
			return ['HOP-WBTC', 'hWBTC/WBTC']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenList(): string[] {
		return [
			'0x7F5c764cBc14f9669B88837ca1490cCa17c31607'.toLowerCase(), // USDC
			'0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase(), // DAI
			'0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'.toLowerCase(), // USDT
			'0x4200000000000000000000000000000000000006'.toLowerCase(), // ETH
			'0x68f180fcCe6836688e9084f035309E29Bf0A2095'.toLowerCase(), // WBTC
			'0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4'.toLowerCase(), // SNX
			'0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9'.toLowerCase(), // sUSD
			'0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase(), // HOP
		]
	}
	getPoolsList(): string[] {
		return [
			'0x3c0FFAca566fCcfD9Cc95139FEF6CBA143795963'.toLowerCase(), // USDC
			'0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'.toLowerCase(), // DAI
			'0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'.toLowerCase(), // USDT
			'0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73'.toLowerCase(), // SNX
			'0x8d4063E82A4Db8CdAed46932E1c71e03CA69Bede'.toLowerCase(), // sUSD
			'0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase(), // ETH
			'0x46fc3Af3A47792cA3ED06fdF3D657145A675a8D8'.toLowerCase(), // WBTC
		]
	}
	getBridgeList(): string[] {
		return [
			'0xa81D244A1814468C734E5b4101F7b9c0c577a8fC'.toLowerCase(), // USDC
			'0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase(), // DAI
			'0x46ae9BaB8CEA96610807a275EBD36f8e916b5C61'.toLowerCase(), // USDT
			'0x16284c7323c35F4960540583998C98B1CfC581a7'.toLowerCase(), // SNX
			'0x33Fe5bB8DA466dA55a8A32D6ADE2BB104E2C5201'.toLowerCase(), // sUSD
			'0x83f6244Bd87662118d96D9a6D44f09dffF14b30E'.toLowerCase(), // ETH
			'0xB1ea9FeD58a317F81eEEFC18715Dd323FDEf45c4'.toLowerCase(), // WBTC
			'0x03D7f750777eC48d39D080b020D83Eb2CB4e3547'.toLowerCase(), // HOP
		]
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
