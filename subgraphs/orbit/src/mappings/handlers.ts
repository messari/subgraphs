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
import { CustomEventType } from "../sdk/util/events";
import { Pool } from "../sdk/protocols/bridge/pool";
import { Versions } from "../versions";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { TokenInitializer, TokenParams } from "../sdk/protocols/bridge/tokens";
import { _ERC20 } from "../../generated/Vault/_ERC20";
import { ERC20NameBytes } from "../../generated/Vault/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/Vault/ERC20SymbolBytes";

import {
  Deposit
} from "../../generated/Vault/Vault"

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

function _getSDK(
  event: ethereum.Event | null = null,
  call: ethereum.Call | null = null
): SDK | null {
  let customEvent: CustomEventType;
  if (event) {
    customEvent = CustomEventType.initialize(
      event.block,
      event.transaction,
      event.transactionLogIndex,
      event
    );
  } else if (call) {
    customEvent = CustomEventType.initialize(
      call.block,
      call.transaction,
      call.transaction.index
    );
  } else {
    log.error("[_getSDK]either event or call needs to be specified", []);
    return null;
  }

  const conf = new BridgeConfig(
    NetworkConfigs.getFactoryAddress(),
    NetworkConfigs.getProtocolName(),
    NetworkConfigs.getProtocolSlug(),
    BridgePermissionType.PRIVATE,
    Versions
  );

  return new SDK(conf, new Pricer(), new TokenInit(), customEvent);
}


export function onCreatePool(
  // eslint-disable-next-line no-unused-vars
  event: CustomEventType,
  pool: Pool,
  // eslint-disable-next-line no-unused-vars
  sdk: SDK,
  aux1: BridgePoolType | null = null,
  aux2: string | null = null
): void {
  if (aux1 && aux2) {
    const token = sdk.Tokens.getOrCreateToken(Address.fromString(aux2));
    pool.initialize(
      `Pool-based Bridge: ${token.name}`,
      token.name,
      aux1,
      token
    );
  }
}

// Bridge via the Original Token Vault
export function handleLockIn(event: Deposit): void {
  // log.warning("{}", [NetworkConfigs.getProtocolName()]);
  const sdk = _getSDK(event)!;
  const poolAddr = dataSource.address();
  // const pool = sdk.Pools.loadPool<string>(poolAddr);
  const tokenAddr = event.params.token
  const pool = sdk.Pools.loadPool(
    event.address.concat(tokenAddr),
    onCreatePool,
    BridgePoolType.LOCK_RELEASE,
    tokenAddr.toHexString()
  );
  
}


// export function handleLockIn(event: Deposit): void {
//   log.warning("transaction hash: {} Block number: {}", [
//     event.transaction.hash.toHexString(),
//     event.block.number.toString(),
//   ]);

//   new Pricer();
// }


