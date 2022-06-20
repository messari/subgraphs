import { Address } from "@graphprotocol/graph-ts";
import { RewardToken, Token } from "../../generated/schema";
import { IERC20Detailed } from "../../generated/templates/PoolConfigurator/IERC20Detailed";
import { IERC20DetailedBytes } from "../../generated/templates/PoolConfigurator/IERC20DetailedBytes";
import { RewardTokenType } from "../utils/constants";

export const UNKNOWN_TOKEN_VALUE = "unknown";

export function getOrCreateToken(
  tokenAddress: Address,
  underlyingAsset: string | null = null
): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    const contract = IERC20Detailed.bind(tokenAddress);
    token = new Token(tokenAddress.toHexString());
    token.name = fetchTokenName(contract);
    token.symbol = fetchTokenSymbol(contract);
    token.decimals = contract.decimals();
    token.underlyingAsset = underlyingAsset;
    token.save();
  }
  return token;
}

export function getTokenById(tokenId: string): Token {
  return Token.load(tokenId)!;
}

function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

function fetchTokenName(contract: IERC20Detailed): string {
  // try types string and bytes32 for name
  let nameValue = UNKNOWN_TOKEN_VALUE;
  const nameResult = contract.try_name();
  if (!nameResult.reverted) {
    return nameResult.value;
  }

  // non-standard ERC20 implementation
  const contractNameBytes = IERC20DetailedBytes.bind(contract._address);
  const nameResultBytes = contractNameBytes.try_name();
  if (!nameResultBytes.reverted) {
    // for broken exchanges that have no name function exposed
    if (!isNullEthValue(nameResultBytes.value.toHexString())) {
      nameValue = nameResultBytes.value.toString();
    }
  }
  return nameValue;
}

function fetchTokenSymbol(contract: IERC20Detailed): string {
  let contractSymbolBytes = IERC20DetailedBytes.bind(contract._address);

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
