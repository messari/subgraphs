import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import { Token } from "../generated/schema";
import { ERC20 } from "../generated/templates/Bridge/ERC20";
import { ERC20NameBytes } from "../generated/templates/Bridge/ERC20NameBytes";
import { ERC20SymbolBytes } from "../generated/templates/Bridge/ERC20SymbolBytes";
import {
  BRIDGE_ADDRESS,
  ETH_ADDRESS_OPTIMISM,
  WETH_ADDRESS_OPTIMISM,
} from "./constants";
import { getUsdPrice, getUsdPricePerToken } from "./prices";
import { SDK } from "./sdk/protocols/bridge";
import { BridgeConfig } from "./sdk/protocols/bridge/config";
import { BridgePermissionType } from "./sdk/protocols/bridge/enums";
import { TokenInitializer, TokenParams } from "./sdk/protocols/bridge/tokens";
import { TokenPricer } from "./sdk/protocols/config";
import { ETH_ADDRESS, ETH_NAME, ETH_SYMBOL } from "./sdk/util/constants";
import { bigIntToBigDecimal } from "./sdk/util/numbers";
import { Versions } from "./versions";

const conf = new BridgeConfig(
  BRIDGE_ADDRESS.get(dataSource.network().toUpperCase()),
  "Optimism Bridge V2",
  "optimism-bridge-v2",
  BridgePermissionType.WHITELIST,
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    let address = Address.fromBytes(token.id);
    // Use WETH address to get ETH price
    if (address == Address.fromString(ETH_ADDRESS_OPTIMISM)) {
      address = Address.fromString(WETH_ADDRESS_OPTIMISM);
    }
    const price = getUsdPricePerToken(address);
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    let address = Address.fromBytes(token.id);
    // Use WETH address to get ETH price
    if (address == Address.fromString(ETH_ADDRESS_OPTIMISM)) {
      address = Address.fromString(WETH_ADDRESS_OPTIMISM);
    }
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(address, _amount);
  }
}

class TokenInit implements TokenInitializer {
  private INVALID_TOKEN_DECIMALS: i32 = 0;
  private UNKNOWN_TOKEN_VALUE: string = "unknown";

  getTokenParams(address: Address): TokenParams {
    if (address == Address.fromString(ETH_ADDRESS)) {
      const name = ETH_NAME;
      const symbol = ETH_SYMBOL;
      const decimals = 18;
      return {
        name,
        symbol,
        decimals,
      };
    }
    const name = this.fetchTokenName(address);
    const symbol = this.fetchTokenSymbol(address);
    const decimals = this.fetchTokenDecimals(address);
    return {
      name,
      symbol,
      decimals,
    };
  }

  private fetchTokenSymbol(tokenAddress: Address): string {
    const contract = ERC20.bind(tokenAddress);
    const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

    // try types string and bytes32 for symbol
    let symbolValue = this.UNKNOWN_TOKEN_VALUE;
    const symbolResult = contract.try_symbol();
    if (!symbolResult.reverted) {
      return symbolResult.value;
    }

    // non-standard ERC20 implementation
    const symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!this.isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }

    return symbolValue;
  }

  private fetchTokenName(tokenAddress: Address): string {
    const contract = ERC20.bind(tokenAddress);
    const contractNameBytes = ERC20NameBytes.bind(tokenAddress);

    // try types string and bytes32 for name
    let nameValue = this.UNKNOWN_TOKEN_VALUE;
    const nameResult = contract.try_name();
    if (!nameResult.reverted) {
      return nameResult.value;
    }

    // non-standard ERC20 implementation
    const nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!this.isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      }
    }

    return nameValue;
  }

  private fetchTokenDecimals(tokenAddress: Address): i32 {
    const contract = ERC20.bind(tokenAddress);

    // try types uint8 for decimals
    const decimalResult = contract.try_decimals();
    if (!decimalResult.reverted) {
      const decimalValue = decimalResult.value;
      return decimalValue;
    }
    return this.INVALID_TOKEN_DECIMALS;
  }
  private isNullEthValue(value: string): boolean {
    return (
      value ==
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    );
  }
}

export function getSDK(event: ethereum.Event): SDK {
  return SDK.initialize(conf, new Pricer(), new TokenInit(), event);
}
