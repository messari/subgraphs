import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import {
	ArbitrumToken,
	MainnetToken,
	Network,
	OptimismToken,
	OptimismBridge,
	XdaiToken,
	PolygonToken,
	ZERO_ADDRESS,
	OptimismAmm,
} from '../../../../../src/sdk/util/constants'
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
		if (tokenAddress == OptimismToken.USDC) return OptimismAmm.USDC
		else if (tokenAddress == OptimismToken.DAI) return OptimismAmm.DAI
		else if (tokenAddress == OptimismToken.USDT) return OptimismAmm.USDT
		else if (tokenAddress == OptimismToken.ETH) return OptimismAmm.ETH
		else if (tokenAddress == OptimismToken.SNX) return OptimismAmm.SNX
		else if (tokenAddress == OptimismToken.sUSD) return OptimismAmm.sUSD
		else if (tokenAddress == OptimismToken.WBTC) return OptimismAmm.WBTC
		else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (tokenAddress == OptimismToken.USDC) {
			return ['USDC', 'USD Coin', '6', OptimismBridge.USDC]
		} else if (tokenAddress == OptimismToken.DAI) {
			return ['DAI', 'DAI Stablecoin', '18', OptimismBridge.DAI]
		} else if (tokenAddress == OptimismToken.USDT) {
			return ['USDT', 'Tether USD', '6', OptimismBridge.USDT]
		} else if (tokenAddress == OptimismToken.ETH) {
			return ['ETH', 'Ethereum', '18', OptimismBridge.USDC]
		} else if (tokenAddress == OptimismToken.WBTC) {
			return ['WBTC', 'Wrapped BTC', '18', OptimismBridge.WBTC]
		} else if (tokenAddress == OptimismToken.SNX) {
			return ['SNX', 'SNX', '18', OptimismBridge.SNX]
		} else if (tokenAddress == OptimismToken.sUSD) {
			return ['sUSD', 'sUSD', '18', OptimismBridge.sUSD]
		} else if (tokenAddress == OptimismToken.HOP) {
			return ['HOP', 'HOP', '18', OptimismBridge.HOP]
		} else {
			log.critical('Token not found', [])
			return []
		}
	}
	getCrossTokenAddress(chainId: string, tokenAddress: string): string {
		if (chainId == '42161')
			return this.getArbitrumCrossTokenFromTokenAddress(tokenAddress)
		else if (chainId == '10')
			return this.getOptimismCrossTokenFromTokenAddress(tokenAddress)
		else if (chainId == '100')
			return this.getXdaiCrossTokenFromTokenAddress(tokenAddress)
		else if (chainId == '137')
			return this.getPolygonCrossTokenFromTokenAddress(tokenAddress)
		else if (chainId == '1')
			return this.getMainnetCrossTokenFromTokenAddress(tokenAddress)
		else {
			log.critical('Chain not found', [])
			return ''
		}
	}

	getArbitrumCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == OptimismToken.USDC) return ArbitrumToken.USDC
		else if (tokenAddress == OptimismToken.DAI) return ArbitrumToken.DAI
		else if (tokenAddress == OptimismToken.USDT) return ArbitrumToken.USDT
		else if (tokenAddress == OptimismToken.ETH) return ArbitrumToken.ETH
		else if (tokenAddress == OptimismToken.WBTC) return ArbitrumToken.WBTC
		else if (tokenAddress == OptimismToken.HOP) return ArbitrumToken.HOP
		else {
			log.critical('Token not found', [])
		}
		return ''
	}
	getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == OptimismToken.USDC) return PolygonToken.USDC
		else if (tokenAddress == OptimismToken.DAI) return PolygonToken.DAI
		else if (tokenAddress == OptimismToken.USDT) return PolygonToken.USDT
		else if (tokenAddress == OptimismToken.ETH) return PolygonToken.ETH
		else if (tokenAddress == OptimismToken.WBTC) return PolygonToken.WBTC
		else if (tokenAddress == OptimismToken.HOP) return PolygonToken.HOP
		else {
			log.critical('Token not found', [])
		}
		return ''
	}
	getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == OptimismToken.USDC) return XdaiToken.USDC
		else if (tokenAddress == OptimismToken.DAI) return XdaiToken.DAI
		else if (tokenAddress == OptimismToken.USDT) return XdaiToken.USDT
		else if (tokenAddress == OptimismToken.ETH) return XdaiToken.ETH
		else if (tokenAddress == OptimismToken.WBTC) return XdaiToken.WBTC
		else if (tokenAddress == OptimismToken.HOP) return XdaiToken.HOP
		else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
		return ''
	}

	getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == OptimismToken.USDC) return MainnetToken.USDC
		else if (tokenAddress == OptimismToken.DAI) return MainnetToken.DAI
		else if (tokenAddress == OptimismToken.USDT) return MainnetToken.USDT
		else if (tokenAddress == OptimismToken.SNX) return MainnetToken.SNX
		else if (tokenAddress == OptimismToken.sUSD) return MainnetToken.sUSD
		else if (tokenAddress == OptimismToken.ETH) return MainnetToken.ETH
		else if (tokenAddress == OptimismToken.WBTC) return MainnetToken.WBTC
		else if (tokenAddress == OptimismToken.HOP) return MainnetToken.HOP
		else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getTokenAddressFromBridgeAddress(bridgeAddress: string): string {
		if (bridgeAddress == OptimismBridge.USDC) return OptimismToken.USDC
		else if (bridgeAddress == OptimismBridge.DAI) return OptimismToken.DAI
		else if (bridgeAddress == OptimismBridge.USDT) return OptimismToken.USDT
		else if (bridgeAddress == OptimismBridge.ETH) return OptimismToken.ETH
		else if (bridgeAddress == OptimismBridge.WBTC) return OptimismToken.WBTC
		else if (bridgeAddress == OptimismBridge.SNX) return OptimismToken.SNX
		else if (bridgeAddress == OptimismBridge.sUSD) return OptimismToken.sUSD
		else if (bridgeAddress == OptimismBridge.HOP) return OptimismToken.HOP
		else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getTokenAddressFromPoolAddress(poolAddress: string): string {
		if (poolAddress == OptimismAmm.USDC) return OptimismToken.USDC
		else if (poolAddress == OptimismAmm.DAI) return OptimismToken.DAI
		else if (poolAddress == OptimismAmm.USDT) return OptimismToken.USDT
		else if (poolAddress == OptimismAmm.ETH) return OptimismToken.ETH
		else if (poolAddress == OptimismAmm.WBTC) return OptimismToken.WBTC
		else if (poolAddress == OptimismAmm.SNX) return OptimismToken.SNX
		else if (poolAddress == OptimismAmm.sUSD) return OptimismToken.sUSD
		else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (bridgeAddress == OptimismBridge.USDC) return OptimismAmm.USDC
		else if (bridgeAddress == OptimismBridge.DAI) return OptimismAmm.DAI
		else if (bridgeAddress == OptimismBridge.USDT) return OptimismAmm.USDT
		else if (bridgeAddress == OptimismBridge.ETH) return OptimismAmm.ETH
		else if (bridgeAddress == OptimismBridge.WBTC) return OptimismAmm.WBTC
		else if (bridgeAddress == OptimismBridge.SNX) return OptimismAmm.SNX
		else if (bridgeAddress == OptimismBridge.sUSD) return OptimismAmm.sUSD
		else if (bridgeAddress == OptimismBridge.HOP) {
			return ZERO_ADDRESS
		} else {
			log.critical('Address not found', [])
			return ''
		}
	}

	getPoolDetails(poolAddress: string): string[] {
		if (poolAddress == OptimismAmm.USDC) {
			return ['HOP-USDC', 'hUSDC/USDC']
		} else if (poolAddress == OptimismAmm.DAI) {
			return ['HOP-DAI', 'hDAI/DAI']
		} else if (poolAddress == OptimismAmm.USDT) {
			return ['HOP-USDT', 'hUSDT/USDT']
		} else if (poolAddress == OptimismAmm.ETH) {
			return ['HOP-ETH', 'hETH/ETH']
		} else if (poolAddress == OptimismAmm.sUSD) {
			return ['HOP-sUSD', 'hsUSD/sUSD']
		} else if (poolAddress == OptimismAmm.SNX) {
			return ['HOP-SNX', 'hSNX/SNX']
		} else if (poolAddress == OptimismAmm.WBTC) {
			return ['HOP-WBTC', 'hWBTC/WBTC']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenList(): string[] {
		return [
			OptimismToken.USDC,
			OptimismToken.DAI,
			OptimismToken.USDT,
			OptimismToken.ETH,
			OptimismToken.WBTC,
			OptimismToken.SNX,
			OptimismToken.sUSD,
			OptimismToken.HOP,
		]
	}
	getPoolsList(): string[] {
		return [
			OptimismAmm.USDC,
			OptimismAmm.DAI,
			OptimismAmm.USDT,
			OptimismAmm.SNX,
			OptimismAmm.sUSD,
			OptimismAmm.ETH,
			OptimismAmm.WBTC,
		]
	}
	getBridgeList(): string[] {
		return [
			OptimismBridge.USDC,
			OptimismBridge.DAI,
			OptimismBridge.USDT,
			OptimismBridge.SNX,
			OptimismBridge.sUSD,
			OptimismBridge.ETH,
			OptimismBridge.WBTC,
			OptimismBridge.HOP,
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
