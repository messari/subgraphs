import {
  Address,
  BigDecimal,
  BigInt,
  ByteArray,
  dataSource,
  log,
  crypto,
  ethereum,
} from "@graphprotocol/graph-ts";

import { BridgeConfig } from "../sdk/protocols/bridge/config";
import { NetworkConfigs } from "../../configurations/configure";

import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";

import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { TokenPricer } from "../sdk/protocols/config";
import { Token } from "../../generated/schema";
import { SDK } from "../sdk/protocols/bridge";
import { Versions } from "../versions";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { TokenInitializer, TokenParams } from "../sdk/protocols/bridge/tokens";
import { _ERC20 } from "../../generated/Vault/_ERC20";
import { ERC20NameBytes } from "../../generated/Vault/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/Vault/ERC20SymbolBytes";

import {
  Deposit
} from "../../generated/Vault/Vault"

const conf = new BridgeConfig(
  NetworkConfigs.getFactoryAddress(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  BridgePermissionType.PRIVATE,
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    const decimals = erc20.decimals().toI32();

    let name = "Unknown Token";
    const nameResult = erc20.try_name();
    if (!nameResult.reverted) {
      name = nameResult.value;
    } else {
      const erc20name = ERC20NameBytes.bind(address);
      const nameResult = erc20name.try_name();
      if (!nameResult.reverted) {
        name = nameResult.value.toString();
      } else {
        log.warning("[getTokenParams]Fail to get name for token {}", [
          address.toHexString(),
        ]);
      }
    }

    let symbol = "Unknown";
    const symbolResult = erc20.try_symbol();
    if (!symbolResult.reverted) {
      symbol = symbolResult.value;
    } else {
      const erc20symbol = ERC20SymbolBytes.bind(address);
      const symbolResult = erc20symbol.try_symbol();
      if (!symbolResult.reverted) {
        symbol = symbolResult.value.toString();
      } else {
        log.warning("[getTokenParams]Fail to get symbol for token {}", [
          address.toHexString(),
        ]);
      }
    }

    return {
      name,
      symbol,
      decimals,
    };
  }
}

//     const name = wrappedERC20.name();
//     const symbol = wrappedERC20.symbol();
//     const decimals = wrappedERC20.decimals().toI32();
//     underlying = wrappedERC20.token();

//     return {
//       name,
//       symbol,
//       decimals,
//       underlying,
//     };
//   }
// }

// Bridge via the Original Token Vault
export function handleLockIn(event: Deposit): void {
  // log.warning("{}", [NetworkConfigs.getProtocolName()]);
  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);
}


// export function handleLockIn(event: Deposit): void {
//   log.warning("transaction hash: {} Block number: {}", [
//     event.transaction.hash.toHexString(),
//     event.block.number.toString(),
//   ]);

//   new Pricer();
// }


