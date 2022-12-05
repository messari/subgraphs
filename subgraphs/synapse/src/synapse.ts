import {
  BigInt,
  BigDecimal,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import {
  Synapse,
  TokenDeposit,
  TokenRedeem,
  TokenWithdraw,
  TokenMint,
  TokenDepositAndSwap,
} from "../generated/Synapse/Synapse";
import { Token } from "../generated/schema";
import { SDK } from "./sdk/protocols/bridge";
import { TokenPricer } from "./sdk/protocols/config";
import { Versions } from "./versions";
import { Pool } from "./sdk/protocols/bridge/pool";
import { Tokens } from "./sdk/protocols/bridge/tokens";
import { BridgeConfig } from "./sdk/protocols/bridge/config";
import { bigIntToBigDecimal } from "./sdk/util/numbers";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "./sdk/protocols/bridge/constants";
import { getUsdPrice, getUsdPricePerToken } from "./prices";

const conf = new BridgeConfig(
  "0x2796317b0fF8538F253012862c06787Adfb8cEb6",
  "Synapse",
  "synapse",
  "WHITELIST",
  Versions
);

// deposit = transferout
// withdraw = transferin
// redeem = transferout
// mint = transferin

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountPrice(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

export function handleDeposit(event: TokenDeposit): void {
  const sdk = new SDK(conf, new Pricer(), event);
  const accounts = sdk.accounts;
  const pools = sdk.pools;

  const poolID = event.address.concat(event.params.token);
  const pool = pools.loadPool(poolID, onDepositCreatePool);
  const crossToken = Tokens.initCrosschainToken(
    event.params.chainId.toI32(),
    event.params.token,
    CrosschainTokenType.WRAPPED, // ? todo
    event.params.token
  );
  pool.addDestinationToken(crossToken);

  const acc = accounts.loadAccount(event.transaction.from);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.to,
    event.params.amount,
    event.transaction.hash
  );
}

export function handleRedeem(event: TokenRedeem): void {
  const sdk = new SDK(conf, new Pricer(), event);
  const accounts = sdk.accounts;
  const pools = sdk.pools;

  const poolID = event.address.concat(event.params.token);
  const pool = pools.loadPool(poolID, onBurnCreatePool);
  const crossToken = Tokens.initCrosschainToken(
    event.params.chainId.toI32(),
    event.params.token,
    CrosschainTokenType.CANONICAL,
    event.params.token
  );
  pool.addDestinationToken(crossToken);

  const acc = accounts.loadAccount(event.params.to);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.to,
    event.params.amount
  );
}

export function handleWithdraw(event: TokenWithdraw): void {
  const sdk = new SDK(conf, new Pricer(), event);
  const accounts = sdk.accounts;
  const pools = sdk.pools;

  const poolID = event.address.concat(event.params.token);
  const pool = pools.loadPool(poolID, onWithdrawCreatePool);
  const crossToken = Tokens.initCrosschainToken(
    -1,
    event.params.token,
    CrosschainTokenType.WRAPPED,
    event.params.token
  );
  pool.addDestinationToken(crossToken);

  const acc = accounts.loadAccount(event.params.to);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.to,
    event.params.amount
  );
}

export function handleMint(event: TokenMint): void {
  const sdk = new SDK(conf, new Pricer(), event);
  const accounts = sdk.accounts;
  const pools = sdk.pools;

  const poolID = event.address.concat(event.params.token);
  const pool = pools.loadPool(poolID, onMintCreatePool);
  const crossToken = Tokens.initCrosschainToken(
    -1,
    event.params.token,
    CrosschainTokenType.CANONICAL,
    event.params.token
  );
  pool.addDestinationToken(crossToken);

  const acc = accounts.loadAccount(event.params.to);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.to,
    event.params.amount
  );
}

export function handleDepositAndSwap(event: TokenDepositAndSwap): void {
  log.warning("not implemented", []);
}

function onDepositCreatePool(event: TokenDeposit, pool: Pool): void {
  const inputToken = Tokens.initToken(event.params.token);
  const name = `${inputToken.name} Pool`;
  const symbol = inputToken.symbol;
  const type = BridgePoolType.LOCK_RELEASE;
  pool.initialize(name, symbol, type, inputToken);
}

function onBurnCreatePool(event: TokenRedeem, pool: Pool): void {
  const inputToken = Tokens.initToken(event.params.token);
  const name = `${inputToken.name} Pool`;
  const symbol = inputToken.symbol;
  const type = BridgePoolType.BURN_MINT;
  pool.initialize(name, symbol, type, inputToken);
}

function onWithdrawCreatePool(event: TokenWithdraw, pool: Pool): void {
  const inputToken = Tokens.initToken(event.params.token);
  const name = `${inputToken.name} Pool`;
  const symbol = inputToken.symbol;
  const type = BridgePoolType.LOCK_RELEASE;
  pool.initialize(name, symbol, type, inputToken);
}

function onMintCreatePool(event: TokenMint, pool: Pool): void {
  const inputToken = Tokens.initToken(event.params.token);
  const name = `${inputToken.name} Pool`;
  const symbol = inputToken.symbol;
  const type = BridgePoolType.BURN_MINT;
  pool.initialize(name, symbol, type, inputToken);
}
