export interface Configurations {
	getNetwork(): string
	getBridgeConfig(address: string): string[]
	getAmmAddress(address: string): string
	getTokenDetails(address: string): string[]
	getTokenList(): string[]
	getPoolDetails(poolAddress: string): string[]
	getCorrespondingTokenAddress(poolAddress: string): string
}
