import { Address } from "@graphprotocol/graph-ts";
import { Strategy, Token, Vault } from "../../generated/schema";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../mappings/token";

export function getTokenOrCreate(
  tokenAddress: Address,
  networkSuffix: string
): Token {
  const tokenId = tokenAddress.toHexString() + networkSuffix;
  let token = Token.load(tokenId);
  if (!token) {
    token = new Token(tokenId);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;
  }
  return token;
}

export function getVaultOrCreate(
  vaultAddress: Address,
  networkSuffix: string
): Vault {
  const vaultId = vaultAddress.toHexString() + networkSuffix;
  let vault = Vault.load(vaultId);
  if (!vault) {
    vault = new Vault(vaultId); //no!!! use createVault instead
  }
  return vault;
}

export function getStrategyOrCreate(
  strategyAddress: Address,
  networkSuffix: string,
  vault?: Vault
): Strategy {
  const strategyId = strategyAddress.toHexString() + networkSuffix;
  let strategy = Strategy.load(strategyId);
  if (!strategy) {
    strategy = new Strategy(strategyId);
  }
  return strategy;
}
