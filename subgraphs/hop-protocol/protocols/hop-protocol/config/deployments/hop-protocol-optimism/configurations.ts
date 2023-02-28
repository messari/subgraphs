import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import {
	ArbitrumToken,
	MainnetToken,
	OptimismToken,
	OptimismBridge,
	XdaiToken,
	PolygonToken,
	ZERO_ADDRESS,
	OptimismAmm,
	OptimismRewardToken,
} from '../../constants/constant'
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
		if (tokenAddress == OptimismToken.USDC) return OptimismAmm.USDC
		else if (tokenAddress == OptimismToken.DAI) return OptimismAmm.DAI
		else if (tokenAddress == OptimismToken.USDT) return OptimismAmm.USDT
		else if (tokenAddress == OptimismToken.ETH) return OptimismAmm.ETH
		else if (tokenAddress == OptimismToken.SNX) return OptimismAmm.SNX
		else if (tokenAddress == OptimismToken.sUSD) return OptimismAmm.sUSD
		else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getPoolAddressFromRewardTokenAddress(rewardToken: string): string {
		if (rewardToken == OptimismRewardToken.SNX_A) return OptimismAmm.USDC
		else if (rewardToken == OptimismRewardToken.SNX_B) return OptimismAmm.USDC
		else if (rewardToken == OptimismRewardToken.DAI) return OptimismAmm.USDT
		else if (rewardToken == OptimismRewardToken.ETH) return OptimismAmm.USDT
		else if (rewardToken == OptimismRewardToken.USDC) return OptimismAmm.ETH
		else if (rewardToken == OptimismRewardToken.USDT) return OptimismAmm.ETH
		else {
			log.critical('RewardToken not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (this.getUsdcTokens().includes(tokenAddress)) {
			return ['USDC', 'USD Coin', '6', OptimismBridge.USDC]
		} else if (this.getDaiTokens().includes(tokenAddress)) {
			return ['DAI', 'DAI Stablecoin', '18', OptimismBridge.DAI]
		} else if (this.getUsdtTokens().includes(tokenAddress)) {
			return ['USDT', 'Tether USD', '6', OptimismBridge.USDT]
		} else if (this.getEthTokens().includes(tokenAddress)) {
			return ['ETH', 'Ethereum', '18', OptimismBridge.ETH]
		} else if (this.getSnxTokens().includes(tokenAddress)) {
			return ['SNX', 'SNX', '18', OptimismBridge.SNX]
		} else if (tokenAddress == OptimismToken.sUSD) {
			return ['sUSD', 'sUSD', '18', OptimismBridge.sUSD]
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
		else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
		log.critical('CrossToken not found', [])
		return ''
	}

	getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == OptimismToken.USDC) return MainnetToken.USDC
		else if (tokenAddress == OptimismToken.DAI) return MainnetToken.DAI
		else if (tokenAddress == OptimismToken.USDT) return MainnetToken.USDT
		else if (tokenAddress == OptimismToken.SNX) return MainnetToken.SNX
		else if (tokenAddress == OptimismToken.sUSD) return MainnetToken.sUSD
		else if (tokenAddress == OptimismToken.ETH) return MainnetToken.ETH
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
		else if (bridgeAddress == OptimismBridge.SNX) return OptimismToken.SNX
		else if (bridgeAddress == OptimismBridge.sUSD) return OptimismToken.sUSD
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
		else if (bridgeAddress == OptimismBridge.SNX) return OptimismAmm.SNX
		else if (bridgeAddress == OptimismBridge.sUSD) return OptimismAmm.sUSD
		else {
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
		} else if (poolAddress == ZERO_ADDRESS) {
			return ['HOP-POOL', 'HOP/HOP']
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
			OptimismToken.SNX,
			OptimismToken.sUSD,
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
		]
	}
	getRewardTokenList(): string[] {
		return [
			OptimismRewardToken.SNX_A,
			OptimismRewardToken.SNX_B,
			OptimismRewardToken.DAI,
			OptimismRewardToken.ETH,
			OptimismRewardToken.USDC,
			OptimismRewardToken.USDT,
		]
	}

	getUsdcPools(): string[] {
		return []
	}
	getUsdcTokens(): string[] {
		return [OptimismRewardToken.USDC, OptimismToken.USDC]
	}
	getDaiPools(): string[] {
		return []
	}
	getDaiTokens(): string[] {
		return [OptimismRewardToken.DAI, OptimismToken.DAI]
	}
	getUsdtPools(): string[] {
		return []
	}
	getUsdtTokens(): string[] {
		return [OptimismRewardToken.USDT, OptimismToken.USDT]
	}
	getEthPools(): string[] {
		return []
	}
	getEthTokens(): string[] {
		return [OptimismRewardToken.ETH, OptimismToken.ETH]
	}
	getSnxPools(): string[] {
		return []
	}
	getSnxTokens(): string[] {
		return [
			OptimismRewardToken.SNX_A,
			OptimismToken.SNX,
			OptimismRewardToken.SNX_B,
		]
	}

	getMaticPools(): string[] {
		return []
	}
	getMaticTokens(): string[] {
		return []
	}
}
