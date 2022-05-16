import { Address, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/templates/Swap/ERC20";
import { ERC20NameBytes } from "../../generated/templates/Swap/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/templates/Swap/ERC20SymbolBytes";
import { RewardToken, Token } from "../../generated/schema";
import { RewardTokenType } from "../utils/constants";

export const UNKNOWN_TOKEN_VALUE = "unknown";

export function getOrCreateToken(
  tokenAddress: Address,
  pool: string | null = null
): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    const contract = ERC20.bind(tokenAddress);
    token = new Token(tokenAddress.toHexString());
    token.name = fetchTokenName(contract);
    token.symbol = fetchTokenSymbol(contract);
    token.decimals = contract.decimals();
    token._pool = pool;
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
  let contractSymbolBytes = ERC20SymbolBytes.bind(contract._address);

  // try types string and bytes32 for symbol
  let symbolValue = UNKNOWN_TOKEN_VALUE;
  let symbolResult = contract.try_symbol();
  if (!symbolResult.reverted) {
    return symbolResult.value;
  }

  // non-standard ERC20 implementation
  let symbolResultBytes = contractSymbolBytes.try_symbol();
  if (!symbolResultBytes.reverted) {
    // for broken pairs that have no symbol function exposed
    if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
      symbolValue = symbolResultBytes.value.toString();
    }
  }

  return symbolValue;
}

export function checkValidToken(tokenAddress: Address): boolean {
  const contract = ERC20.bind(tokenAddress);
  return fetchTokenName(contract) != UNKNOWN_TOKEN_VALUE;
}

export function getOrCreateTokenFromString(
  tokenAddress: string,
  pool: string | null = null
): Token {
  return getOrCreateToken(Address.fromString(tokenAddress), pool);
}

export function getTokenDecimals(tokenAddress: string): i32 {
  return Token.load(tokenAddress)!.decimals;
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
