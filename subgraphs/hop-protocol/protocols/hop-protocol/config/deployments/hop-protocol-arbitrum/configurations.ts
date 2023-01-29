import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import {
	ArbitrumToken,
	MainnetToken,
	ArbitrumAmm,
	ArbitrumBridge,
	XdaiToken,
	PolygonToken,
	OptimismToken,
} from '../../constants/constant'
import { Network } from '../../../../../src/sdk/util/constants'
export class HopProtocolArbitrumConfigurations implements Configurations {
	getNetwork(): string {
		return Network.ARBITRUM_ONE
	}

	getPoolAddressFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == ArbitrumToken.USDC) return ArbitrumAmm.USDC
		else if (tokenAddress == ArbitrumToken.DAI) return ArbitrumAmm.DAI
		else if (tokenAddress == ArbitrumToken.USDT) return ArbitrumAmm.USDT
		else if (tokenAddress == ArbitrumToken.ETH) return ArbitrumAmm.ETH
		else if (tokenAddress == ArbitrumToken.WBTC) return ArbitrumAmm.WBTC
		else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (tokenAddress == ArbitrumToken.USDC) {
			return ['USDC', 'USDC', '6', ArbitrumBridge.USDC]
		} else if (tokenAddress == ArbitrumToken.DAI) {
			return ['DAI', 'DAI', '18', ArbitrumBridge.DAI]
		} else if (tokenAddress == ArbitrumToken.USDT) {
			return ['USDT', 'USDT', '6', ArbitrumBridge.USDT]
		} else if (tokenAddress == ArbitrumToken.ETH) {
			return ['ETH', 'ETH', '18', ArbitrumBridge.ETH]
		} else if (tokenAddress == ArbitrumToken.WBTC) {
			return ['WBTC', 'WBTC', '18', ArbitrumBridge.WBTC]
		} else if (tokenAddress == ArbitrumToken.HOP) {
			return ['HOP', 'HOP', '18', ArbitrumBridge.HOP]
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
		return ''
	}

	getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == ArbitrumToken.USDC) return PolygonToken.USDC
		else if (tokenAddress == ArbitrumToken.DAI) return PolygonToken.DAI
		else if (tokenAddress == ArbitrumToken.USDT) return PolygonToken.USDT
		else if (tokenAddress == ArbitrumToken.ETH) return PolygonToken.ETH
		else if (tokenAddress == ArbitrumToken.WBTC) return PolygonToken.WBTC
		else if (tokenAddress == ArbitrumToken.HOP) return PolygonToken.HOP
		else {
			log.critical('Token not found', [])
		}
		return ''
	}
	getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == ArbitrumToken.USDC) return XdaiToken.USDC
		else if (tokenAddress == ArbitrumToken.DAI) return XdaiToken.DAI
		else if (tokenAddress == ArbitrumToken.USDT) return XdaiToken.USDT
		else if (tokenAddress == ArbitrumToken.ETH) return XdaiToken.ETH
		else if (tokenAddress == ArbitrumToken.WBTC) return XdaiToken.WBTC
		else if (tokenAddress == ArbitrumToken.HOP) return XdaiToken.HOP
		else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == ArbitrumToken.USDC) {
			return OptimismToken.USDC
		} else if (tokenAddress == ArbitrumToken.DAI) {
			return OptimismToken.DAI
		} else if (tokenAddress == ArbitrumToken.USDT) {
			return OptimismToken.USDT
		} else if (tokenAddress == ArbitrumToken.ETH) {
			return OptimismToken.ETH
		} else if (tokenAddress == ArbitrumToken.WBTC) {
			return OptimismToken.WBTC
		} else if (tokenAddress == ArbitrumToken.HOP) {
			return OptimismToken.HOP
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == ArbitrumToken.USDC) return MainnetToken.USDC
		else if (tokenAddress == ArbitrumToken.DAI) return MainnetToken.DAI
		else if (tokenAddress == ArbitrumToken.USDT) return MainnetToken.USDT
		else if (tokenAddress == ArbitrumToken.ETH) return MainnetToken.ETH
		else if (tokenAddress == ArbitrumToken.WBTC) return MainnetToken.WBTC
		else if (tokenAddress == ArbitrumToken.HOP) return MainnetToken.HOP
		else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getTokenAddressFromBridgeAddress(bridgeAddress: string): string {
		if (bridgeAddress == ArbitrumBridge.USDC) {
			return ArbitrumToken.USDC
		} else if (bridgeAddress == ArbitrumBridge.DAI) {
			return ArbitrumToken.DAI
		} else if (bridgeAddress == ArbitrumBridge.USDT) {
			return ArbitrumToken.USDT
		} else if (bridgeAddress == ArbitrumBridge.ETH) {
			return ArbitrumToken.ETH
		} else if (bridgeAddress == ArbitrumBridge.WBTC) {
			return ArbitrumToken.WBTC
		} else if (bridgeAddress == ArbitrumBridge.HOP) {
			return ArbitrumToken.HOP
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getTokenAddressFromPoolAddress(poolAddress: string): string {
		if (poolAddress == ArbitrumAmm.USDC) return ArbitrumToken.USDC
		else if (poolAddress == ArbitrumAmm.DAI) return ArbitrumToken.DAI
		else if (poolAddress == ArbitrumAmm.USDT) return ArbitrumToken.USDT
		else if (poolAddress == ArbitrumAmm.ETH) return ArbitrumToken.ETH
		else if (poolAddress == ArbitrumAmm.WBTC) return ArbitrumToken.WBTC
		else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (bridgeAddress == ArbitrumBridge.USDC) return ArbitrumAmm.USDC
		else if (bridgeAddress == ArbitrumBridge.DAI) return ArbitrumAmm.DAI
		else if (bridgeAddress == ArbitrumBridge.USDT) return ArbitrumAmm.USDT
		else if (bridgeAddress == ArbitrumBridge.ETH) return ArbitrumAmm.ETH
		else if (bridgeAddress == ArbitrumBridge.WBTC) return ArbitrumAmm.WBTC
		else if (bridgeAddress == ArbitrumBridge.HOP) return ArbitrumToken.HOP
		else {
			log.critical('Address not found', [])
			return ''
		}
	}

	getPoolDetails(poolAddress: string): string[] {
		if (poolAddress == ArbitrumAmm.USDC) {
			return ['HOP-USDC', 'hUSDC/USDC']
		} else if (poolAddress == ArbitrumAmm.DAI) {
			return ['HOP-DAI', 'hDAI/DAI']
		} else if (poolAddress == ArbitrumAmm.USDT) {
			return ['HOP-USDT', 'hUSDT/USDT']
		} else if (poolAddress == ArbitrumAmm.ETH) {
			return ['HOP-ETH', 'hETH/ETH']
		} else if (poolAddress == ArbitrumAmm.WBTC) {
			return ['HOP-WBTC', 'hWBTC/WBTC']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenList(): string[] {
		return [
			ArbitrumToken.USDC,
			ArbitrumToken.DAI,
			ArbitrumToken.USDT,
			ArbitrumToken.ETH,
			ArbitrumToken.WBTC,
			ArbitrumToken.HOP,
		]
	}
	getPoolsList(): string[] {
		return [
			ArbitrumAmm.USDC,
			ArbitrumAmm.DAI,
			ArbitrumAmm.USDT,
			ArbitrumAmm.ETH,
			ArbitrumAmm.WBTC,
		]
	}
	getBridgeList(): string[] {
		return [
			ArbitrumBridge.USDC,
			ArbitrumBridge.DAI,
			ArbitrumBridge.USDT,
			ArbitrumBridge.ETH,
			ArbitrumBridge.WBTC,
			ArbitrumBridge.HOP,
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
