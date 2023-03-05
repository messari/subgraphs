import { log } from '@graphprotocol/graph-ts'
import { Configurations } from '../../../../../configurations/configurations/interface'
import {
	ArbitrumToken,
	MainnetToken,
	OptimismToken,
	PolygonBridge,
	XdaiToken,
	PolygonAmm,
	PolygonToken,
	PolygonRewardToken,
} from '../../constants/constant'
import { Network } from '../../../../../src/sdk/util/constants'
export class HopProtocolPolygonConfigurations implements Configurations {
	getNetwork(): string {
		return Network.MATIC
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
		if (tokenAddress == PolygonToken.USDC) {
			return PolygonAmm.USDC //USDC AMM
		} else if (tokenAddress == PolygonToken.DAI) {
			return PolygonAmm.DAI //DAI AMM
		} else if (tokenAddress == PolygonToken.MATIC) {
			return PolygonAmm.DAI //MATIC AMM
		} else if (tokenAddress == PolygonToken.USDT) {
			return PolygonAmm.USDT //USDT AMM
		} else if (tokenAddress == PolygonToken.ETH) {
			return PolygonAmm.ETH //ETH AMM
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}
	getTokenDetails(tokenAddress: string): string[] {
		if (this.getUsdcTokens().includes(tokenAddress)) {
			return ['USDC', 'USD Coin', '6', PolygonBridge.USDC]
		} else if (this.getDaiTokens().includes(tokenAddress)) {
			return ['DAI', 'DAI Stablecoin', '18', PolygonBridge.DAI]
		} else if (this.getUsdtTokens().includes(tokenAddress)) {
			return ['USDT', 'Tether USD', '6', PolygonBridge.USDT]
		} else if (this.getEthTokens().includes(tokenAddress)) {
			return ['ETH', 'ETH', '18', PolygonBridge.ETH]
		} else if (this.getMaticTokens().includes(tokenAddress)) {
			return ['MATIC', 'MATIC', '18', PolygonBridge.MATIC]
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getPoolAddressFromRewardTokenAddress(rewardToken: string): string {
		if (rewardToken == PolygonRewardToken.USDC) return PolygonAmm.USDC
		else if (rewardToken == PolygonRewardToken.USDT) return PolygonAmm.USDT
		else if (rewardToken == PolygonRewardToken.ETH) return PolygonAmm.ETH
		else if (rewardToken == PolygonRewardToken.DAI) return PolygonAmm.DAI
		else {
			log.critical('RewardToken not found', [])
			return ''
		}
	}

	getTokenAddressFromBridgeAddress(bridgeAddress: string): string {
		if (bridgeAddress == PolygonBridge.USDC) {
			return PolygonToken.USDC
		} else if (bridgeAddress == PolygonBridge.DAI) {
			return PolygonToken.DAI
		} else if (bridgeAddress == PolygonBridge.USDT) {
			return PolygonToken.USDT
		} else if (bridgeAddress == PolygonBridge.ETH) {
			return PolygonToken.ETH
		} else if (bridgeAddress == PolygonBridge.MATIC) {
			return PolygonToken.MATIC
		} else {
			log.critical('Token not found', [])
			return ''
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

	getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == PolygonToken.USDC) {
			return XdaiToken.USDC
		} else if (tokenAddress == PolygonToken.DAI) {
			return XdaiToken.DAI
		} else if (tokenAddress == PolygonToken.USDT) {
			return XdaiToken.USDT
		} else if (tokenAddress == PolygonToken.ETH) {
			return XdaiToken.ETH
		} else if (tokenAddress == PolygonToken.MATIC) {
			return XdaiToken.MATIC
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}
	getArbitrumCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == PolygonToken.USDC) {
			return ArbitrumToken.USDC
		} else if (tokenAddress == PolygonToken.DAI) {
			return ArbitrumToken.DAI
		} else if (tokenAddress == PolygonToken.USDT) {
			return ArbitrumToken.USDT
		} else if (tokenAddress == PolygonToken.ETH) {
			return ArbitrumToken.ETH
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == PolygonToken.USDC) {
			return OptimismToken.USDC
		} else if (tokenAddress == PolygonToken.DAI) {
			return OptimismToken.DAI
		} else if (tokenAddress == PolygonToken.USDT) {
			return OptimismToken.USDT
		} else if (tokenAddress == PolygonToken.ETH) {
			return OptimismToken.ETH
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
		if (tokenAddress == PolygonToken.USDC) {
			return MainnetToken.USDC //MAINNET USDC
		} else if (tokenAddress == PolygonToken.DAI) {
			return MainnetToken.DAI //MAINNET DAI
		} else if (tokenAddress == PolygonToken.USDT) {
			return MainnetToken.USDT //MAINNET USDT
		} else if (tokenAddress == PolygonToken.MATIC) {
			return MainnetToken.MATIC //MAINNET MATIC
		} else if (tokenAddress == PolygonToken.ETH) {
			return MainnetToken.ETH //MAINNET ETH
		} else {
			log.critical('Token not found', [])
		}
		return ''
	}

	getTokenAddressFromPoolAddress(poolAddress: string): string {
		if (poolAddress == PolygonAmm.USDC) {
			return PolygonToken.USDC
		} else if (poolAddress == PolygonAmm.DAI) {
			return PolygonToken.DAI
		} else if (poolAddress == PolygonAmm.USDT) {
			return PolygonToken.USDT
		} else if (poolAddress == PolygonAmm.ETH) {
			return PolygonToken.ETH
		} else if (poolAddress == PolygonAmm.MATIC) {
			return PolygonToken.MATIC
		} else {
			log.critical('Token not found', [])
			return ''
		}
	}

	getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
		if (bridgeAddress == PolygonBridge.USDC) {
			return PolygonAmm.USDC
		} else if (bridgeAddress == PolygonBridge.DAI) {
			return PolygonAmm.DAI
		} else if (bridgeAddress == PolygonBridge.USDT) {
			return PolygonAmm.USDT
		} else if (bridgeAddress == PolygonBridge.ETH) {
			return PolygonAmm.ETH
		} else if (bridgeAddress == PolygonBridge.MATIC) {
			return PolygonAmm.MATIC
		} else {
			log.critical('Address not found', [])
			return ''
		}
	}

	getPoolDetails(poolAddress: string): string[] {
		if (poolAddress == PolygonAmm.USDC) {
			return ['HOP-USDC', 'hUSDC/USDC']
		} else if (poolAddress == PolygonAmm.DAI) {
			return ['HOP-DAI', 'hDAI/DAI']
		} else if (poolAddress == PolygonAmm.USDT) {
			return ['HOP-USDT', 'hUSDT/USDT']
		} else if (poolAddress == PolygonAmm.ETH) {
			return ['HOP-ETH', 'hETH/ETH']
		} else if (poolAddress == PolygonAmm.MATIC) {
			return ['HOP-MATIC', 'hMATIC/MATIC']
		} else {
			log.critical('Token not found', [])
			return []
		}
	}

	getTokenList(): string[] {
		return [
			PolygonToken.USDC,
			PolygonToken.DAI,
			PolygonToken.USDT,
			PolygonToken.MATIC,
			PolygonToken.ETH,
		]
	}
	getPoolsList(): string[] {
		return [
			PolygonAmm.USDC,
			PolygonAmm.DAI,
			PolygonAmm.USDT,
			PolygonAmm.MATIC,
			PolygonAmm.ETH,
		]
	}
	getBridgeList(): string[] {
		return [
			PolygonBridge.USDC,
			PolygonBridge.DAI,
			PolygonBridge.USDT,
			PolygonBridge.MATIC,
			PolygonBridge.ETH,
		]
	}

	getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
		return ''
	}

	getRewardTokenList(): string[] {
		return [
			PolygonRewardToken.DAI,
			PolygonRewardToken.ETH,
			PolygonRewardToken.USDC,
			PolygonRewardToken.USDT,
		]
	}
	getUsdcPools(): string[] {
		return []
	}
	getDaiPools(): string[] {
		return []
	}
	getUsdcTokens(): string[] {
		return [PolygonToken.USDC]
	}
	getDaiTokens(): string[] {
		return [PolygonToken.DAI]
	}
	getEthTokens(): string[] {
		return [PolygonToken.ETH]
	}
	getMaticTokens(): string[] {
		return [PolygonToken.MATIC]
	}
	getUsdtTokens(): string[] {
		return [PolygonToken.USDT]
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
}
