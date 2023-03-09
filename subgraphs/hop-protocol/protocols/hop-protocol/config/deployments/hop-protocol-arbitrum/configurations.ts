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
	ArbitrumRewardToken,
	ZERO_ADDRESS,
	RewardTokens,
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
		else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (this.getUsdcTokens().includes(tokenAddress)) {
			return ['USDC', 'USDC', '6', ArbitrumBridge.USDC]
		} else if (this.getDaiTokens().includes(tokenAddress)) {
			return ['DAI', 'DAI', '18', ArbitrumBridge.DAI]
		} else if (this.getUsdtTokens().includes(tokenAddress)) {
			return ['USDT', 'USDT', '6', ArbitrumBridge.USDT]
		} else if (this.getEthTokens().includes(tokenAddress)) {
			return ['ETH', 'ETH', '18', ArbitrumBridge.ETH]
		} else if (tokenAddress == RewardTokens.GNO) {
			return ['GNO', 'Gnosis Token', '18', ZERO_ADDRESS]
		} else if (tokenAddress == RewardTokens.HOP) {
			return ['HOP', 'HOP Token', '18', ZERO_ADDRESS]
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
		]
	}
	getPoolsList(): string[] {
		return [
			ArbitrumAmm.USDC,
			ArbitrumAmm.DAI,
			ArbitrumAmm.USDT,
			ArbitrumAmm.ETH,
		]
	}
	getBridgeList(): string[] {
		return [
			ArbitrumBridge.USDC,
			ArbitrumBridge.DAI,
			ArbitrumBridge.USDT,
			ArbitrumBridge.ETH,
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
		return [ArbitrumToken.USDC]
	}
	getDaiTokens(): string[] {
		return [ArbitrumToken.DAI]
	}
	getUsdtTokens(): string[] {
		return [ArbitrumToken.USDT]
	}
	getEthTokens(): string[] {
		return [ArbitrumToken.ETH]
	}
	getDaiPools(): string[] {
		return []
	}
	getUsdtPools(): string[] {
		return []
	}
	getEthPools(): string[] {
		return []
	}
	getSnxPools(): string[] {
		return []
	}
	getSnxTokens(): string[] {
		return []
	}
	getMaticPools(): string[] {
		return []
	}
	getMaticTokens(): string[] {
		return []
	}

	getRewardTokenList(): string[] {
		return [
			ArbitrumRewardToken.DAI,
			ArbitrumRewardToken.ETH,
			ArbitrumRewardToken.USDC,
			ArbitrumRewardToken.USDT,
		]
	}
	getPoolAddressFromRewardTokenAddress(rewardToken: string): string {
		if (rewardToken == ArbitrumRewardToken.DAI) return ArbitrumAmm.USDC
		else if (rewardToken == ArbitrumRewardToken.ETH) return ArbitrumAmm.USDT
		else if (rewardToken == ArbitrumRewardToken.USDC) return ArbitrumAmm.ETH
		else if (rewardToken == ArbitrumRewardToken.USDT) return ArbitrumAmm.ETH
		else {
			log.critical('RewardToken not found', [])
			return ''
		}
	}
}
