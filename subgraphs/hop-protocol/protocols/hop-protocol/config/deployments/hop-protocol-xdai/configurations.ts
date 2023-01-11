import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import { Network } from '../../../../../src/sdk/util/constants'

export class HopProtocolxDaiConfigurations implements Configurations {
	getNetwork(): string {
		return Network.XDAI
	}
	getPoolAddressFromTokenAddress(tokenAddress: string): string {
		if (
			tokenAddress == '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase() //USDC
		) {
			return '0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase() //USDC AMM
		} else if (
			tokenAddress == '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase() //DAI
		) {
			return '0x24afDcA4653042C6D08fb1A754b2535dAcF6Eb24'.toLowerCase() //DAI AMM
		} else if (
			tokenAddress == '0x4ECaBa5870353805a9F068101A40E0f32ed605C6'.toLowerCase() //USDT
		) {
			return '0x3Aa637D6853f1d9A9354FE4301Ab852A88b237e7'.toLowerCase() //USDT AMM
		} else if (
			tokenAddress == '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase() //ETH
		) {
			return '0x4014DC015641c08788F15bD6eB20dA4c47D936d8'.toLowerCase() //ETH AMM
		} else if (
			tokenAddress == '0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'.toLowerCase() //WBTC
		) {
			return '0xb07c6505e1E41112494123e40330c5Ac09817CFB'.toLowerCase() //WBTC AMM
		} else if (
			tokenAddress == '0x7122d7661c4564b7C6Cd4878B06766489a6028A2'.toLowerCase() //MATIC
		) {
			return '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase() //MATIC AMM
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (
			tokenAddress == '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase()
		) {
			return ['USDC', 'USD Coin', '6']
		} else if (
			tokenAddress == '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase()
		) {
			return ['DAI', 'DAI Stablecoin', '18']
		} else if (
			tokenAddress == '0x4ECaBa5870353805a9F068101A40E0f32ed605C6'.toLowerCase()
		) {
			return ['USDT', 'Tether USD', '6']
		} else if (
			tokenAddress == '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase()
		) {
			return ['ETH', 'Ethereum', '18']
		} else if (
			tokenAddress == '0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'.toLowerCase()
		) {
			return ['WBTC', 'Wrapped BTC', '18']
		} else if (
			tokenAddress == '0x7122d7661c4564b7C6Cd4878B06766489a6028A2'.toLowerCase()
		) {
			return ['MATIC', 'MATIC', '18']
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
			tokenAddress == '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase()
		) {
			return [
				'0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'.toLowerCase(), //Token Bridge Address
				'XDAI_USDC_BRIDGE',
				'xdai_usdc_bridge',
			]
		} else if (
			tokenAddress == '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase()
		) {
			return [
				'0x0460352b91D7CF42B0E1C1c30f06B602D9ef2238'.toLowerCase(),
				'XDAI_DAI_BRIDGE',
				'xdai_dai_bridge',
			]
		} else if (
			tokenAddress == '0x4ECaBa5870353805a9F068101A40E0f32ed605C6'.toLowerCase()
		) {
			return [
				'0xFD5a186A7e8453Eb867A360526c5d987A00ACaC2'.toLowerCase(),
				'XDAI_USDT_BRIDGE',
				'xdai_usdt_bridge',
			]
		} else if (
			tokenAddress == '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase()
		) {
			return [
				'0xD8926c12C0B2E5Cd40cFdA49eCaFf40252Af491B'.toLowerCase(),
				'XDAI_ETH_BRIDGE',
				'xdai_eth_bridge',
			]
		} else if (
			tokenAddress == '0x7122d7661c4564b7C6Cd4878B06766489a6028A2'.toLowerCase()
		) {
			return [
				'0x7ac71c29fEdF94BAc5A5C9aB76E1Dd12Ea885CCC'.toLowerCase(),
				'XDAI_MATIC_BRIDGE',
				'xdai_matic_bridge',
			]
		} else if (
			tokenAddress == '0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'.toLowerCase()
		) {
			return [
				'0x07C592684Ee9f71D58853F9387579332d471b6Ca'.toLowerCase(),
				'XDAI_WBTC_BRIDGE',
				'xdai_wbtc_bridge',
			]
		} else if (
			tokenAddress == '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase()
		) {
			return [
				'0x6F03052743CD99ce1b29265E377e320CD24Eb632'.toLowerCase(),
				'XDAI_HOP_BRIDGE',
				'xdai_hop_bridge',
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
			return '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase() //USDC
		} else if (
			bridgeAddress ==
			'0x0460352b91D7CF42B0E1C1c30f06B602D9ef2238'.toLowerCase()
		) {
			//HOP/DAI
			return '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0xFD5a186A7e8453Eb867A360526c5d987A00ACaC2'.toLowerCase()
		) {
			//HOP/USDT
			return '0x4ECaBa5870353805a9F068101A40E0f32ed605C6'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0xD8926c12C0B2E5Cd40cFdA49eCaFf40252Af491B'.toLowerCase()
		) {
			//HOP/ETH
			return '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0x7ac71c29fEdF94BAc5A5C9aB76E1Dd12Ea885CCC'.toLowerCase()
		) {
			//HOP/MATIC
			return '0x7122d7661c4564b7C6Cd4878B06766489a6028A2'.toLowerCase() //MATIC
		} else if (
			bridgeAddress ==
			'0x07C592684Ee9f71D58853F9387579332d471b6Ca'.toLowerCase()
		) {
			//HOP/WBTC
			return '0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x6F03052743CD99ce1b29265E377e320CD24Eb632'.toLowerCase()
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
			return '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase() //USDC
		} else if (
			poolAddress == '0x24afDcA4653042C6D08fb1A754b2535dAcF6Eb24'.toLowerCase() //HOP/DAI
		) {
			return '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase() //DAI
		} else if (
			poolAddress == '0x3Aa637D6853f1d9A9354FE4301Ab852A88b237e7'.toLowerCase() //HOP/USDT
		) {
			return '0x4ECaBa5870353805a9F068101A40E0f32ed605C6'.toLowerCase() //USDT
		} else if (
			poolAddress == '0x4014DC015641c08788F15bD6eB20dA4c47D936d8'.toLowerCase() //HOP/ETH
		) {
			return '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase() //ETH
		} else if (
			poolAddress == '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase() //HOP/MATIC
		) {
			return '0x7122d7661c4564b7C6Cd4878B06766489a6028A2'.toLowerCase() //MATIC
		} else if (
			poolAddress == '0xb07c6505e1E41112494123e40330c5Ac09817CFB'.toLowerCase() //HOP/WBTC
		) {
			return '0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'.toLowerCase() //WBTC
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
			'0x0460352b91D7CF42B0E1C1c30f06B602D9ef2238'.toLowerCase() //HOP/DAI
		) {
			return '0x24afDcA4653042C6D08fb1A754b2535dAcF6Eb24'.toLowerCase() //DAI
		} else if (
			bridgeAddress ==
			'0xFD5a186A7e8453Eb867A360526c5d987A00ACaC2'.toLowerCase() //HOP/USDT
		) {
			return '0x3Aa637D6853f1d9A9354FE4301Ab852A88b237e7'.toLowerCase() //USDT
		} else if (
			bridgeAddress ==
			'0xD8926c12C0B2E5Cd40cFdA49eCaFf40252Af491B'.toLowerCase() //HOP/ETH
		) {
			return '0x4014DC015641c08788F15bD6eB20dA4c47D936d8'.toLowerCase() //ETH
		} else if (
			bridgeAddress ==
			'0x7ac71c29fEdF94BAc5A5C9aB76E1Dd12Ea885CCC'.toLowerCase() //HOP/MATIC
		) {
			return '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase() //MATIC
		} else if (
			bridgeAddress ==
			'0x07C592684Ee9f71D58853F9387579332d471b6Ca'.toLowerCase() //HOP/WBTC
		) {
			return '0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'.toLowerCase() //WBTC
		} else if (
			bridgeAddress ==
			'0x6F03052743CD99ce1b29265E377e320CD24Eb632'.toLowerCase() //HOP BRIDGE
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
			poolAddress == '0x24afDcA4653042C6D08fb1A754b2535dAcF6Eb24'.toLowerCase()
		) {
			return ['HOP-DAI', 'hDAI/DAI']
		} else if (
			poolAddress == '0x3Aa637D6853f1d9A9354FE4301Ab852A88b237e7'.toLowerCase()
		) {
			return ['HOP-USDT', 'hUSDT/USDT']
		} else if (
			poolAddress == '0x4014DC015641c08788F15bD6eB20dA4c47D936d8'.toLowerCase()
		) {
			return ['HOP-ETH', 'hETH/ETH']
		} else if (
			poolAddress == '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase()
		) {
			return ['HOP-MATIC', 'hMATIC/MATIC']
		} else if (
			poolAddress == '0xb07c6505e1E41112494123e40330c5Ac09817CFB'.toLowerCase()
		) {
			return ['HOP-WBTC', 'hWBTC/WBTC']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenList(): string[] {
		return [
			'0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase(), // USDC
			'0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase(), // DAI
			'0x4ECaBa5870353805a9F068101A40E0f32ed605C6'.toLowerCase(), // USDT
			'0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase(), // ETH
			'0x7122d7661c4564b7C6Cd4878B06766489a6028A2'.toLowerCase(), // MATIC
			'0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'.toLowerCase(), // WBTC
			'0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase(), // HOP
		]
	}
	getPoolsList(): string[] {
		return [
			'0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase(), // USDC
			'0x24afDcA4653042C6D08fb1A754b2535dAcF6Eb24'.toLowerCase(), // DAI
			'0x3Aa637D6853f1d9A9354FE4301Ab852A88b237e7'.toLowerCase(), // USDT
			'0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase(), // MATIC
			'0x4014DC015641c08788F15bD6eB20dA4c47D936d8'.toLowerCase(), // ETH
			'0xb07c6505e1E41112494123e40330c5Ac09817CFB'.toLowerCase(), // WBTC
		]
	}
	getBridgeList(): string[] {
		return [
			'0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'.toLowerCase(), // USDC
			'0x0460352b91D7CF42B0E1C1c30f06B602D9ef2238'.toLowerCase(), // DAI
			'0x7ac71c29fEdF94BAc5A5C9aB76E1Dd12Ea885CCC'.toLowerCase(), // MATIC
			'0xFD5a186A7e8453Eb867A360526c5d987A00ACaC2'.toLowerCase(), // USDT
			'0xD8926c12C0B2E5Cd40cFdA49eCaFf40252Af491B'.toLowerCase(), // ETH
			'0x07C592684Ee9f71D58853F9387579332d471b6Ca'.toLowerCase(), // WBTC
			'0x6F03052743CD99ce1b29265E377e320CD24Eb632'.toLowerCase(), // HOP
		]
	}
}
