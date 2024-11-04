import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  Network,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import {
  Mint,
  MintFeeRateChanged,
  Redeem,
  RedeemFeeRateChanged,
  OFTSent,
  OFTReceived,
  Transfer,
  USDZ,
} from "../../generated/USDZ/USDZ";
import { _ERC20 } from "../../generated/USDZ/_ERC20";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    let tokenAddr = Address.fromBytes(token.id);

    const network = dataSource.network().toUpperCase().replace("-", "_");
    if (
      network == Network.MAINNET &&
      tokenAddr ==
        Address.fromString("0xa469b7ee9ee773642b3e93e842e5d9b5baa10067")
    ) {
      tokenAddr = Address.fromString(
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      );
    }
    if (
      network == Network.BASE &&
      tokenAddr ==
        Address.fromString("0x04d5ddf5f3a8939889f11e97f8c4bb48317f1938")
    ) {
      tokenAddr = Address.fromString(
        "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
      );
    }
    if (
      network == Network.ARBITRUM_ONE &&
      tokenAddr ==
        Address.fromString("0x5018609ab477cc502e170a5accf5312b86a4b94f")
    ) {
      tokenAddr = Address.fromString(
        "0xaf88d065e77c8cc2239327c5edb3a432268e5831"
      );
    }
    if (
      network == Network.BLAST_MAINNET &&
      tokenAddr ==
        Address.fromString("0x52056ed29fe015f4ba2e3b079d10c0b87f46e8c6")
    ) {
      tokenAddr = Address.fromString(
        "0x4300000000000000000000000000000000000003"
      );
    }

    const customPrice = getUsdPricePerToken(tokenAddr);
    returnPrice = customPrice.usdPrice;
    return returnPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    returnPrice = this.getTokenPrice(token);
    return returnPrice.times(_amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const erc20 = _ERC20.bind(address);
      name = erc20.name();
      symbol = erc20.symbol();
      decimals = erc20.decimals().toI32();
    }
    return new TokenParams(name, symbol, decimals);
  }
}

export function handleMint(event: Mint): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = USDZ.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const feeRate = pool.getMintFeeRate();
  const feeCoeff = contract.FEE_COEFFICIENT();
  const feeAmount = event.params.amount
    .toBigDecimal()
    .times(feeRate.toBigDecimal())
    .div(feeCoeff.toBigDecimal());
  pool.addRevenueNative(token, BIGINT_ZERO, bigDecimalToBigInt(feeAmount));
}

export function handleMintFeeRateChanged(event: MintFeeRateChanged): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  pool.setMintFeeRate(event.params.newFeeRate);
}

export function handleRedeem(event: Redeem): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = USDZ.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const feeRate = pool.getRedeemFeeRate();
  const feeCoeff = contract.FEE_COEFFICIENT();
  const feeAmount = event.params.amount
    .toBigDecimal()
    .times(feeRate.toBigDecimal())
    .div(feeCoeff.toBigDecimal());
  pool.addRevenueNative(token, BIGINT_ZERO, bigDecimalToBigInt(feeAmount));
}

export function handleRedeemFeeRateChanged(event: RedeemFeeRateChanged): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  pool.setRedeemFeeRate(event.params.newFeeRate);
}

export function handleOFTSent(event: OFTSent): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = USDZ.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleOFTReceived(event: OFTReceived): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = USDZ.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);
}

export function handleTransfer(event: Transfer): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = USDZ.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  if (
    event.params.from == Address.fromString(ZERO_ADDRESS) ||
    event.params.to == Address.fromString(ZERO_ADDRESS)
  ) {
    const user = event.transaction.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
}
