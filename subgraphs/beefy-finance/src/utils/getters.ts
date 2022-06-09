import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Token, Vault, YieldAggregator } from "../../generated/schema";
import { createVaultFromStrategy } from "../mappings/vault";
import { BeefyStrategy } from "../../generated/ExampleVault/BeefyStrategy";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../mappings/token";
import { BIGDECIMAL_ZERO, PROTOCOL_ID } from "../prices/common/constants";
import {
  createBeefyFinance,
  updateProtocolAndSave,
} from "../mappings/protocol";

export function getTokenOrCreate(tokenAddress: Address): Token {
  const tokenId = tokenAddress.toHexString();
  let token = Token.load(tokenId);
  if (!token) {
    token = new Token(tokenId);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.save();
  }
  return token;
}

export function getVaultFromStrategyOrCreate(
  strategyAddress: Address,
  currentBlock: ethereum.Block
): Vault {
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  const vaultId = strategyContract.vault().toHexString();
  let vault = Vault.load(vaultId);
  if (!vault) {
    vault = createVaultFromStrategy(strategyAddress, currentBlock);
  }
  return vault;
}

export function getBeefyFinanceOrCreate(
  vaultId: string,
  currentBlock: ethereum.Block
): YieldAggregator {
  let beefy = YieldAggregator.load(PROTOCOL_ID);
  if (!beefy) {
    beefy = createBeefyFinance(vaultId, currentBlock);
  } else {
    updateProtocolAndSave(beefy, currentBlock, vaultId);
  }
  return beefy;
}
