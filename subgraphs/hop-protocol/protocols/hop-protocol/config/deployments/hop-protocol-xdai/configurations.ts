import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import {
	ArbitrumToken,
	MainnetToken,
	Network,
	OptimismToken,
	XdaiAmm,
	XdaiBridge,
	XdaiToken,
	PolygonToken,
	ZERO_ADDRESS,
} from '../../../../../src/sdk/util/constants'

export class HopProtocolxDaiConfigurations implements Configurations {
	getNetwork(): string {
		return Network.XDAI
	}

	getPoolAddressFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == XdaiToken.USDC) return XdaiAmm.USDC
		else if (tokenAddress == XdaiToken.DAI) return XdaiAmm.DAI
		else if (tokenAddress == XdaiToken.USDT) return XdaiAmm.USDT
		else if (tokenAddress == XdaiToken.ETH) return XdaiAmm.ETH
		else if (tokenAddress == XdaiToken.WBTC) return XdaiAmm.WBTC
		else if (tokenAddress == XdaiToken.MATIC) return XdaiAmm.MATIC
		else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (tokenAddress == XdaiToken.USDC) {
			return ['USDC', 'USD Coin', '6', XdaiBridge.USDC]
		} else if (tokenAddress == XdaiToken.DAI) {
			return ['DAI', 'DAI Stablecoin', '18', XdaiBridge.DAI]
		} else if (tokenAddress == XdaiToken.USDT) {
			return ['USDT', 'Tether USD', '6', XdaiBridge.USDT]
		} else if (tokenAddress == XdaiToken.ETH) {
			return ['ETH', 'Ethereum', '18', XdaiBridge.USDC]
		} else if (tokenAddress == XdaiToken.WBTC) {
			return ['WBTC', 'Wrapped BTC', '18', XdaiBridge.WBTC]
		} else if (tokenAddress == XdaiToken.MATIC) {
			return ['MATIC', 'MATIC', '18', XdaiBridge.MATIC]
		} else if (tokenAddress == XdaiToken.HOP) {
			return ['HOP', 'HOP', '18']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getCrossTokenAddress(chainId: string, tokenAddress: string): string {
		if (chainId == '42161') {
			return this.getArbitrumCrossTokenFromTokenAddress(tokenAddress) //Arbitrum
		} else if (chainId == '10') {
			return this.getOptimismCrossTokenFromTokenAddress(tokenAddress) //Optimism
		} else if (chainId == '100') {
			return this.getXdaiCrossTokenFromTokenAddress(tokenAddress) //Xdai
		} else if (chainId == '137') {
			return this.getPolygonCrossTokenFromTokenAddress(tokenAddress) //Polygon
		} else if (chainId == '1') {
			return this.getMainnetCrossTokenFromTokenAddress(tokenAddress) //Mainnet
		} else {
			log.critical('Chain not found', [])
			return ''
		}
	}

	getArbitrumCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == XdaiToken.USDC) {
			return ArbitrumToken.USDC
		} else if (tokenAddress == XdaiToken.DAI) {
			return ArbitrumToken.DAI
		} else if (tokenAddress == XdaiToken.USDT) {
			return ArbitrumToken.USDT
		} else if (tokenAddress == XdaiToken.ETH) {
			return ArbitrumToken.ETH
		} else if (tokenAddress == XdaiToken.WBTC) {
			return ArbitrumToken.WBTC
		} else if (tokenAddress == XdaiToken.HOP) {
			return ArbitrumToken.HOP
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == XdaiToken.USDC) {
			return PolygonToken.USDC
		} else if (tokenAddress == XdaiToken.DAI) {
			return PolygonToken.DAI
		} else if (tokenAddress == XdaiToken.USDT) {
			return PolygonToken.USDT
		} else if (tokenAddress == XdaiToken.MATIC) {
			return PolygonToken.MATIC
		} else if (tokenAddress == XdaiToken.ETH) {
			return PolygonToken.ETH
		} else if (tokenAddress == XdaiToken.WBTC) {
			return PolygonToken.WBTC
		} else if (tokenAddress == XdaiToken.HOP) {
			return PolygonToken.HOP
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == XdaiToken.USDC) {
			return OptimismToken.USDC
		} else if (tokenAddress == XdaiToken.DAI) {
			return OptimismToken.DAI
		} else if (tokenAddress == XdaiToken.USDT) {
			return OptimismToken.USDT
		} else if (tokenAddress == XdaiToken.ETH) {
			return OptimismToken.ETH
		} else if (tokenAddress == XdaiToken.WBTC) {
			return OptimismToken.WBTC
		} else if (tokenAddress == XdaiToken.HOP) {
			return OptimismToken.HOP
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == XdaiToken.USDC) {
			return MainnetToken.USDC
		} else if (tokenAddress == XdaiToken.DAI) {
			return MainnetToken.DAI
		} else if (tokenAddress == XdaiToken.USDT) {
			return MainnetToken.USDT
		} else if (tokenAddress == XdaiToken.MATIC) {
			return MainnetToken.MATIC
		} else if (tokenAddress == XdaiToken.ETH) {
			return MainnetToken.ETH
		} else if (tokenAddress == XdaiToken.WBTC) {
			return MainnetToken.WBTC
		} else if (tokenAddress == XdaiToken.HOP) {
			return MainnetToken.HOP
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getTokenAddressFromBridgeAddress(bridgeAddress: string): string {
		if (bridgeAddress == XdaiBridge.USDC) {
			return XdaiToken.USDC //USDC
		} else if (bridgeAddress == XdaiBridge.DAI) {
			return XdaiToken.DAI //DAI
		} else if (bridgeAddress == XdaiBridge.USDT) {
			return XdaiToken.USDT //USDT
		} else if (bridgeAddress == XdaiBridge.ETH) {
			return XdaiToken.ETH //ETH
		} else if (bridgeAddress == XdaiBridge.MATIC) {
			return XdaiToken.MATIC //MATIC
		} else if (bridgeAddress == XdaiBridge.WBTC) {
			return XdaiToken.WBTC //WBTC
		} else if (bridgeAddress == XdaiBridge.HOP) {
			return XdaiToken.HOP //HOP
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getTokenAddressFromPoolAddress(poolAddress: string): string {
		if (poolAddress == XdaiAmm.USDC) {
			return XdaiToken.USDC
		} else if (poolAddress == XdaiAmm.DAI) {
			return XdaiToken.DAI
		} else if (poolAddress == XdaiAmm.USDT) {
			return XdaiToken.USDT
		} else if (poolAddress == XdaiAmm.ETH) {
			return XdaiToken.ETH
		} else if (poolAddress == XdaiAmm.MATIC) {
			return XdaiToken.MATIC
		} else if (poolAddress == XdaiAmm.WBTC) {
			return XdaiToken.WBTC
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (bridgeAddress == XdaiBridge.USDC) {
			return XdaiAmm.USDC
		} else if (bridgeAddress == XdaiBridge.DAI) {
			return XdaiAmm.DAI
		} else if (bridgeAddress == XdaiBridge.USDT) {
			return XdaiAmm.USDT
		} else if (bridgeAddress == XdaiBridge.ETH) {
			return XdaiAmm.ETH
		} else if (bridgeAddress == XdaiBridge.MATIC) {
			return XdaiAmm.MATIC
		} else if (bridgeAddress == XdaiBridge.WBTC) {
			return XdaiAmm.WBTC
		} else if (bridgeAddress == XdaiBridge.HOP) {
			return ZERO_ADDRESS
		} else {
			log.critical('Address not found', [])
			return ''
		}
	}

	getPoolDetails(poolAddress: string): string[] {
		if (poolAddress == XdaiAmm.USDC) {
			return ['HOP-USDC', 'hUSDC/USDC']
		} else if (poolAddress == XdaiAmm.DAI) {
			return ['HOP-DAI', 'hDAI/DAI']
		} else if (poolAddress == XdaiAmm.USDT) {
			return ['HOP-USDT', 'hUSDT/USDT']
		} else if (poolAddress == XdaiAmm.ETH) {
			return ['HOP-ETH', 'hETH/ETH']
		} else if (poolAddress == XdaiAmm.MATIC) {
			return ['HOP-MATIC', 'hMATIC/MATIC']
		} else if (poolAddress == XdaiAmm.WBTC) {
			return ['HOP-WBTC', 'hWBTC/WBTC']
		} else if (poolAddress == ZERO_ADDRESS) {
			return ['HOP', 'HOP']
		} else {
			log.critical('Pool not found', [])
			return []
		}
	}

	getTokenList(): string[] {
		return [
			XdaiToken.USDC,
			XdaiToken.DAI,
			XdaiToken.USDT,
			XdaiToken.ETH,
			XdaiToken.MATIC,
			XdaiToken.WBTC,
			XdaiToken.HOP,
		]
	}
	getPoolsList(): string[] {
		return [
			XdaiAmm.USDC,
			XdaiAmm.DAI,
			XdaiAmm.USDT,
			XdaiAmm.MATIC,
			XdaiAmm.ETH,
			XdaiAmm.WBTC,
			ZERO_ADDRESS,
		]
	}
	getBridgeList(): string[] {
		return [
			XdaiBridge.USDC,
			XdaiBridge.DAI,
			XdaiBridge.MATIC,
			XdaiBridge.USDT,
			XdaiBridge.ETH,
			XdaiBridge.WBTC,
			XdaiBridge.HOP,
		]
	}

	getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
		return ''
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
