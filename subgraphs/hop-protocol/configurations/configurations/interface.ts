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
}
