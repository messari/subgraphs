import { Strategy, Token, Vault } from "../../generated/schema";

export function getTokenOrCreate(
  tokenAddress: string,
  tokenName: string,
  tokenSymbol: string,
  tokenDecimals: number,
  networkSuffix: string
): string {
  const tokenId = tokenAddress + networkSuffix;
  let token = Token.load(tokenId);
  if (token == null) {
    token = new Token(tokenId);
    token.name = tokenName;
    token.symbol = tokenSymbol;
    token.decimals = tokenDecimals;
  }
  return tokenId;
}

export function getVaultOrCreate(
  vaultAddress: string,
  networkSuffix: string
): Vault {
  const vaultId = vaultAddress + networkSuffix;
  let vault = Vault.load(vaultId);
  if (vault == null) {
    vault = new Vault(vaultId);
  }
  return vault;
}

export function getStrategyOrCreate(
  strategyAddress: string,
  networkSuffix: string
): Strategy {
  const strategyId = strategyAddress + networkSuffix;
  let strategy = Strategy.load(strategyId);
  if (strategy == null) {
    strategy = new Strategy(strategyId);
  }
  return strategy;
}
