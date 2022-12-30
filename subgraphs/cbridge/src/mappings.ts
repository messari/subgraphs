import {
  BigDecimal,
  BigInt,
  Address,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { Send } from "../generated/Bridge/Bridge";
import { SDK } from "./sdk/protocols/bridge";
import { TokenPricer } from "./sdk/protocols/config";
import { TokenInitializer, TokenParams } from "./sdk/protocols/bridge/tokens";
import { Pool } from "./sdk/protocols/bridge/pool";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "./sdk/protocols/bridge/enums";
import { BridgeConfig } from "./sdk/protocols/bridge/config";
import { ERC20 } from "../generated/Bridge/ERC20";
import { Versions } from "./versions";
import { Token } from "../generated/schema";
import { bigIntToBigDecimal } from "./sdk/util/numbers";
import { getUsdPricePerToken, getUsdPrice } from "./prices";

// Implement TokenPricer to pass it to the SDK constructor
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

// Implement TokenInitializer
class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = ERC20.bind(address);
    const name = erc20.name();
    const symbol = erc20.symbol();
    const decimals = erc20.decimals();
    return {
      name,
      symbol,
      decimals,
    };
  }
}

export function handleSend(event: Send): void {
  const conf = new BridgeConfig(
    event.address.toHexString(),
    "cBridge",
    "cbridge",
    BridgePermissionType.PERMISSIONLESS,
    Versions
  );
  const sdk = new SDK(conf, new Pricer(), new TokenInit(), event);

  const pool = sdk.Pools.loadPool(
    event.address,
    onCreatePool,
    BridgePoolType.LIQUIDITY
  );

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    event.params.dstChainId,
    event.params.token,
    CrosschainTokenType.WRAPPED,
    event.params.token
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(event.transaction.from);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.receiver,
    event.params.amount,
    event.transaction.hash
  );
  //pool.addRevenueNative(event.params.protocolFee, event.params.supplyFee);
}

function onCreatePool(
  event: Send,
  pool: Pool,
  sdk: SDK,
  type: BridgePoolType
): void {
  const inputToken = sdk.Tokens.getOrCreateToken(event.params.token);
  pool.initialize("celer Pool-based Bridge", "", type, inputToken);
}

export function handlePairCreated(event: ethereum.Event): void {}
