import { SDK } from "./sdk/protocols/bridge";
import { TokenPricer } from "./sdk/protocols/config";
import { TokenInitializer, TokenParams } from "./sdk/protocols/bridge/tokens";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "./sdk/protocols/bridge/enums";
import { BridgeConfig } from "./sdk/protocols/bridge/config";
import { _ERC20 } from "../generated/L1ERC20Gateway/_ERC20";
import { Versions } from "./versions";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { Token } from "../generated/schema";
import { bigIntToBigDecimal } from "./sdk/util/numbers";
import {
  L1ERC20Gateway,
  WithdrawalFinalized,
} from "../generated/L1ERC20Gateway/L1ERC20Gateway";
import { networkToChainID } from "./sdk/protocols/bridge/chainIds";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, Network } from "./sdk/util/constants";
import { getUsdPricePerToken, getUsdPrice } from "./prices";
import { Pool } from "./sdk/protocols/bridge/pool";

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
    const name = this.fetchTokenName(address);
    const symbol = this.fetchTokenSymbol(address);
    const decimals = this.fetchTokenDecimals(address) as i32;

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

// === BRIDGECONFIG

// BridgeConfig based on different gateways
// Can we pass custom variables in a handler
const conf = new BridgeConfig(
  "0xa3A7B6F88361F48403514059F1F16C8E78d60EeC",
  "arbitrum-one",
  "arbitrum-one",
  BridgePermissionType.WHITELIST,
  Versions
);

export function handleTransferIn(event: WithdrawalFinalized): void {
  const sdk = new SDK(conf, new Pricer(), new TokenInit(), event);

  // === GATEWAY

  // TODO: need to configure this for it to work with all gateways
  const l1ERC20Gateway = L1ERC20Gateway.bind(
    Address.fromString("0xa3A7B6F88361F48403514059F1F16C8E78d60EeC")
  );

  // -- TOKENS

  let crossTokenAddress: Address;
  const crossTokenAddressResult = l1ERC20Gateway.try_calculateL2TokenAddress(
    event.params.l1Token
  );
  if (crossTokenAddressResult.reverted) {
    log.info("calculate cross token address call reverted", []);
  } else {
    crossTokenAddress = crossTokenAddressResult.value;
  }

  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(Network.ARBITRUM_ONE),
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    crossTokenAddress!
  );

  // -- POOL

  // TODO: review if poolId makes sense
  const poolId = event.address;

  const pool = sdk.Pools.loadPool(
    poolId,
    onCreatePool,
    BridgePoolType.LOCK_RELEASE
  );

  // Pool Metrics

  // need to be bigint for addRevenueNative and bigdecimal for addRevenueUSD
  const PROTOCOL_FEE = BIGINT_ZERO;
  const SUPPLY_FEE = BIGINT_ZERO;
  pool.addRevenueUSD(BIGDECIMAL_ZERO, BIGDECIMAL_ZERO);
  pool.addRevenueNative(PROTOCOL_FEE, SUPPLY_FEE);
  pool.addDestinationToken(crossToken);
  pool.getDestinationTokenRoute(crossToken);

  // -- ACCOUNT

  // TODO: review
  // to or from for acc?
  // transferOut = from
  // transferin = to ???
  const acc = sdk.Accounts.loadAccount(event.params._to);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params._from,
    event.params._amount,
    event.transaction.hash
  );
  // Account Metrics
  // transferIn()
  // transferOut()
  // liquidityDeposit()
  // liquidityWithdraw()
  // NEED ANYTHING ELSE?

  // -- PROTOCOL

  // Protocol Stuff
  // calculated automatically when pool and account metrics are updated
}

function onCreatePool(
  event: WithdrawalFinalized,
  pool: Pool,
  sdk: SDK,
  type: BridgePoolType
): void {
  pool.initialize(
    pool.pool.id.toString(),
    "ERC20",
    type,
    sdk.Tokens.getOrCreateToken(event.params.l1Token)
  );
}
