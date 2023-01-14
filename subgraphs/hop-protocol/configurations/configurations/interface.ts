export interface Configurations {
	getNetwork(): string
	getBridgeConfig(address: string): string[]
	getTokenDetails(address: string): string[]
	getBridgeList(): string[]
	getTokenList(): string[]
	getPoolsList(): string[]
	getPoolDetails(poolAddress: string): string[]
	getPoolAddressFromTokenAddress(tokenAddress: string): string
	getTokenAddressFromPoolAddress(poolAddress: string): string
	getTokenAddressFromBridgeAddress(bridgeAddress: string): string
	getPoolAddressFromBridgeAddress(bridgeAddress: string): string
	getArbitrumPoolAddressFromBridgeAddress(bridgeAddress: string): string
	getPolygonPoolAddressFromBridgeAddress(bridgeAddress: string): string
	getXdaiPoolAddressFromBridgeAddress(bridgeAddress: string): string
	getOptimismPoolAddressFromBridgeAddress(bridgeAddress: string): string
	getPoolAddressFromChainId(chainId: string, bridgeAddress: string): string
	getUsdcPools(): string[]
	getUsdcTokens(): string[]
	getDaiPools(): string[]
	getDaiTokens(): string[]
	getUsdtPools(): string[]
	getUsdtTokens(): string[]
	getEthPools(): string[]
	getEthTokens(): string[]
	getSnxPools(): string[]
	getSnxTokens(): string[]
	getsUSDPools(): string[]
	getsUSDTokens(): string[]
	getWbtcPools(): string[]
	getWbtcTokens(): string[]
	getMaticPools(): string[]
	getMaticTokens(): string[]
}
