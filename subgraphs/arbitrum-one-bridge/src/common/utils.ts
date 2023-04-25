import { Token } from "../../generated/schema";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { TokenPricer } from "../sdk/protocols/config";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { TokenInitializer, TokenParams } from "../sdk/protocols/bridge/tokens";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { _ERC20 } from "../../generated/ERC20Gateway/_ERC20";
import { BridgePermissionType } from "../sdk/protocols/bridge/enums";
import { BridgeConfig } from "../sdk/protocols/bridge/config";
import { Versions } from "../versions";
import { ETH_ADDRESS, ETH_NAME, ETH_SYMBOL } from "../sdk/util/constants";
import { BIGDECIMAL_ZERO } from "../prices/common/constants";

export class Pricer implements TokenPricer {
  block: ethereum.Block;

  constructor(block: ethereum.Block) {
    this.block = block;
  }

  getTokenPrice(token: Token): BigDecimal {
    if (tokenHasPriceIssue(Address.fromBytes(token.id).toHexString())) {
      return BIGDECIMAL_ZERO;
    }

    const price = getUsdPricePerToken(Address.fromBytes(token.id), this.block);
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    if (tokenHasPriceIssue(Address.fromBytes(token.id).toHexString())) {
      return BIGDECIMAL_ZERO;
    }

    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount, this.block);
  }
}

export class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    let name: string;
    let symbol: string;
    let decimals: i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = ETH_NAME;
      symbol = ETH_SYMBOL;
      decimals = 18;
    } else {
      name = this.fetchTokenName(address);
      symbol = this.fetchTokenSymbol(address);
      decimals = this.fetchTokenDecimals(address) as i32;
    }

    return {
      name,
      symbol,
      decimals,
    };
  }

  fetchTokenName(tokenAddress: Address): string {
    const tokenContract = _ERC20.bind(tokenAddress);
    const call = tokenContract.try_name();
    if (call.reverted) {
      return tokenAddress.toHexString();
    } else {
      return call.value;
    }
  }

  fetchTokenSymbol(tokenAddress: Address): string {
    const tokenContract = _ERC20.bind(tokenAddress);
    const call = tokenContract.try_symbol();
    if (call.reverted) {
      return " ";
    } else {
      return call.value;
    }
  }

  fetchTokenDecimals(tokenAddress: Address): number {
    const tokenContract = _ERC20.bind(tokenAddress);
    const call = tokenContract.try_decimals();
    if (call.reverted) {
      return 0;
    } else {
      return call.value.toI32();
    }
  }
}

function tokenHasPriceIssue(tokenAddress: string): bool {
  const TOKENS_WITH_PRICE_ISSUE: Array<string> = [
    "0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3", // ELON
    "0xd9a8bb44968f35282f1b91c353f77a61baf31a4b", // GTPS
    "0x050cbff7bff0432b6096dd15cd9499913ddf8e23", // FCI
    "0xcfaf8edcea94ebaa080dc4983c3f9be5701d6613", // EXPO
  ];

  for (let i = 0; i < TOKENS_WITH_PRICE_ISSUE.length; i++) {
    if (TOKENS_WITH_PRICE_ISSUE[i] == tokenAddress) {
      return true;
    }
  }

  return false;
}

// Note: Using one of the proxy admin contracts as bridge id
// ProxyAdmin 1 - 0x554723262467F125Ac9e1cDFa9Ce15cc53822dbD
// ProxyAdmin 2 - 0x9aD46fac0Cf7f790E5be05A0F15223935A0c0aDa
export const ethSideConf = new BridgeConfig(
  "0x554723262467f125ac9e1cdfa9ce15cc53822dbd",
  "arbitrum-one",
  "arbitrum-one",
  BridgePermissionType.WHITELIST,
  Versions
);

export const arbSideConf = new BridgeConfig(
  "0x0000000000000000000000000000000000000064",
  "arbitrum-one",
  "arbitrum-one",
  BridgePermissionType.WHITELIST,
  Versions
);

export const ethAddress = Address.fromString(ETH_ADDRESS);
