import { Address, dataSource } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/templates/Vault/ERC20";
import { ERC20NameBytes } from "../../generated/templates/Vault/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/templates/Vault/ERC20SymbolBytes";
import { RewardToken, Token } from "../../generated/schema";
import { MAI_TOKEN_ADDRESS, RewardTokenType } from "../utils/constants";
import { uppercaseNetwork } from "../utils/strings";

export const UNKNOWN_TOKEN_VALUE = "unknown";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    const contract = ERC20.bind(tokenAddress);
    token = new Token(tokenAddress.toHexString());
    token.name = fetchTokenName(contract);
    token.symbol = fetchTokenSymbol(contract);
    token.decimals = contract.decimals();
    token.save();
  }
  return token;
}

function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

function fetchTokenName(contract: ERC20): string {
  // try types string and bytes32 for name
  let nameValue = UNKNOWN_TOKEN_VALUE;
  const nameResult = contract.try_name();
  if (!nameResult.reverted) {
    return nameResult.value;
  }

  // non-standard ERC20 implementation
  const contractNameBytes = ERC20NameBytes.bind(contract._address);
  const nameResultBytes = contractNameBytes.try_name();
  if (!nameResultBytes.reverted) {
    // for broken exchanges that have no name function exposed
    if (!isNullEthValue(nameResultBytes.value.toHexString())) {
      nameValue = nameResultBytes.value.toString();
    }
  }
  return nameValue;
}

function fetchTokenSymbol(contract: ERC20): string {
  const contractSymbolBytes = ERC20SymbolBytes.bind(contract._address);

  // try types string and bytes32 for symbol
  let symbolValue = UNKNOWN_TOKEN_VALUE;
  const symbolResult = contract.try_symbol();
  if (!symbolResult.reverted) {
    return symbolResult.value;
  }

  // non-standard ERC20 implementation
  const symbolResultBytes = contractSymbolBytes.try_symbol();
  if (!symbolResultBytes.reverted) {
    // for broken pairs that have no symbol function exposed
    if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
      symbolValue = symbolResultBytes.value.toString();
    }
  }

  return symbolValue;
}

export function getOrCreateRewardToken(tokenAddress: Address): RewardToken {
  const id = tokenAddress.toHexString();
  let rewardToken = RewardToken.load(id);
  if (!rewardToken) {
    rewardToken = new RewardToken(id);
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.token = getOrCreateToken(tokenAddress).id;
    rewardToken.save();
  }
  return rewardToken;
}

export function getMaiToken(): Token {
  const id = MAI_TOKEN_ADDRESS.get(uppercaseNetwork(dataSource.network()));
  let token = Token.load(id);
  if (!token) {
    const tokenAddress = Address.fromString(id);
    const contract = ERC20.bind(tokenAddress);
    token = new Token(tokenAddress.toHexString());
    token.name = fetchTokenName(contract);
    token.symbol = fetchTokenSymbol(contract);
    token.decimals = contract.decimals();
    token.save();
  }
  return token;
}
