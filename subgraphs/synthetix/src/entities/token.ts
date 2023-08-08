import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { RewardToken, Token } from "../../generated/schema";
import {
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  RewardTokenType,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { ERC20 } from "../../generated/issuance_Synthetix_0/ERC20";
import { ERC20SymbolBytes } from "../../generated/issuance_Synthetix_0/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../generated/issuance_Synthetix_0/ERC20NameBytes";

export function getETHToken(): Token {
  const token = new Token(ETH_ADDRESS);
  token.name = ETH_NAME;
  token.symbol = ETH_SYMBOL;
  token.decimals = 18;
  token.save();
  return token;
}

export function getRewardToken(address: string): RewardToken {
  const token = getOrCreateToken(address);
  const id = `${RewardTokenType.DEPOSIT}-${token.id}`;

  const rToken = new RewardToken(id);
  rToken.type = RewardTokenType.DEPOSIT;
  rToken.token = token.id;
  rToken.save();
  return rToken;
}

export function setCurrentETHPrice(blockNumber: BigInt, price: BigInt): void {
  const token = getETHToken();
  token.lastPriceUSD = bigIntToBigDecimal(price);
  token.lastPriceBlockNumber = blockNumber;
  token.save();
}

export function getCurrentETHPrice(): BigDecimal {
  const ethToken = Token.load(ETH_ADDRESS);
  return ethToken!.lastPriceUSD!;
}

// export function getCurrentPrice(address: string): BigDecimal {
//   const price = getUsdPrice(Address.fromString(address), BIGDECIMAL_ONE);
//   const token = getOrCreateToken(address)!;
//   token.lastPriceUSD = price;
//   token.save();
//   return token.lastPriceUSD!;
// }

export function getOrCreateToken(tokenAddress: string): Token {
  let token = Token.load(tokenAddress);
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress);
    token.symbol = fetchTokenSymbol(Address.fromString(tokenAddress));
    token.name = fetchTokenName(Address.fromString(tokenAddress));
    token.decimals = fetchTokenDecimals(Address.fromString(tokenAddress));
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token;
}

export const INVALID_TOKEN_DECIMALS = 0;
export const UNKNOWN_TOKEN_VALUE = "unknown";

export function fetchTokenSymbol(tokenAddress: Address): string {
  const contract = ERC20.bind(tokenAddress);
  const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

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

export function fetchTokenName(tokenAddress: Address): string {
  const contract = ERC20.bind(tokenAddress);
  const contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = UNKNOWN_TOKEN_VALUE;
  const nameResult = contract.try_name();
  if (!nameResult.reverted) {
    return nameResult.value;
  }

  // non-standard ERC20 implementation
  const nameResultBytes = contractNameBytes.try_name();
  if (!nameResultBytes.reverted) {
    // for broken exchanges that have no name function exposed
    if (!isNullEthValue(nameResultBytes.value.toHexString())) {
      nameValue = nameResultBytes.value.toString();
    }
  }

  return nameValue;
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  const contract = ERC20.bind(tokenAddress);

  // try types uint8 for decimals
  const decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    const decimalValue = decimalResult.value;
    return decimalValue;
  }

  return 0 as i32;
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}
