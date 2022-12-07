import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { IERC20Detailed } from "../../generated/TroveManager/IERC20Detailed";
import { IERC20DetailedBytes } from "../../generated/TroveManager/IERC20DetailedBytes";
import { RewardToken, Token } from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  RewardTokenType,
  VSTA_ADDRESS,
  VST_ADDRESS,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

export const UNKNOWN_TOKEN_VALUE = "unknown";

export function getOrCreateAssetToken(tokenAddress: Address): Token {
  return getOrCreateToken(tokenAddress);
}

export function getVSTToken(): Token {
  const token = getOrCreateToken(Address.fromString(VST_ADDRESS));
  if ((token.lastPriceUSD = BIGDECIMAL_ZERO)) {
    token.lastPriceUSD = BIGDECIMAL_ONE;
  }
  token.save();
  return token;
}

function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());

  if (!token) {
    token = new Token(tokenAddress.toHexString());
    if (tokenAddress.toHexString() == ETH_ADDRESS) {
      // Vesta finance use zero address as ETH reference address
      token.name = ETH_NAME;
      token.symbol = ETH_SYMBOL;
      token.decimals = DEFAULT_DECIMALS;
    } else {
      const contract = IERC20Detailed.bind(tokenAddress);
      token.name = fetchTokenName(contract);
      token.symbol = fetchTokenSymbol(contract);
      token.decimals = fetchTokenDecimals(contract);
    }

    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.save();
  }
  return token;
}

export function setCurrentAssetPrice(
  blockNumber: BigInt,
  asset: Address,
  price: BigInt
): void {
  const token = getOrCreateAssetToken(asset);
  token.lastPriceUSD = bigIntToBigDecimal(price);
  token.lastPriceBlockNumber = blockNumber;
  token.save();
}

export function getCurrentAssetPrice(asset: Address): BigDecimal {
  const assetToken = getOrCreateAssetToken(asset);
  return assetToken.lastPriceUSD!;
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
  const tryNameResult = contract.try_name();
  if (!tryNameResult.reverted) {
    return tryNameResult.value;
  }

  // non-standard ERC20 implementation
  const contractNameBytes = IERC20DetailedBytes.bind(contract._address);
  const tryNameResultBytes = contractNameBytes.try_name();
  if (!tryNameResultBytes.reverted) {
    // for broken exchanges that have no name function exposed
    if (!isNullEthValue(tryNameResultBytes.value.toHexString())) {
      nameValue = tryNameResultBytes.value.toString();
    }
  }
  return nameValue;
}

function fetchTokenSymbol(contract: IERC20Detailed): string {
  const contractSymbolBytes = IERC20DetailedBytes.bind(contract._address);

  // try types string and bytes32 for symbol
  let symbolValue = UNKNOWN_TOKEN_VALUE;
  const trySymbolResult = contract.try_symbol();
  if (!trySymbolResult.reverted) {
    return trySymbolResult.value;
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

function fetchTokenDecimals(contract: IERC20Detailed): i32 {
  let decimalValue = DEFAULT_DECIMALS;
  const tryDecimalsResult = contract.try_decimals();
  if (!tryDecimalsResult.reverted) {
    decimalValue = tryDecimalsResult.value;
  }

  return decimalValue;
}

export function getOrCreateRewardToken(): RewardToken {
  const token = getOrCreateToken(Address.fromString(VSTA_ADDRESS));
  const id = `${RewardTokenType.DEPOSIT}-${token.id}`;

  let rToken = RewardToken.load(id);
  if (!rToken) {
    rToken = new RewardToken(id);
    rToken.type = RewardTokenType.DEPOSIT;
    rToken.token = token.id;
    rToken.save();
  }
  return rToken;
}
