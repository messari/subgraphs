import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_THOUSAND,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import {
  Transfer,
  FeeCollectionAddressChanged,
  TMetal,
} from "../../generated/Gold/TMetal";
import { _ERC20 } from "../../generated/Gold/_ERC20";
import { ChainlinkDataFeed } from "../../generated/Gold/ChainlinkDataFeed";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token, block: BigInt): BigDecimal {
    if (
      Address.fromBytes(token.id) ==
        Address.fromString("0x34abce75d2f8f33940c721dca0f562617787bff3") &&
      block > BigInt.fromString("10606498")
    ) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        NetworkConfigs.getAgChainlinkDataFeed() // XAG / USD feed
      );
      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      return bigIntToBigDecimal(result, decimals).div(
        BigDecimal.fromString("32")
      );
    }
    if (
      Address.fromBytes(token.id) ==
        Address.fromString("0xe4a6f23fb9e00fca037aa0ea0a6954de0a6c53bf") &&
      block > BigInt.fromString("10606502")
    ) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        NetworkConfigs.getAuChainlinkDataFeed() // XAU / USD feed
      );
      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      return bigIntToBigDecimal(result, decimals).div(
        BigDecimal.fromString("32")
      );
    }

    return BIGDECIMAL_ZERO;
  }

  getAmountValueUSD(token: Token, amount: BigInt, block: BigInt): BigDecimal {
    const usdPrice = this.getTokenPrice(token, block);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    return usdPrice.times(_amount);
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

export function handleFeeCollectionAddressChanged(
  event: FeeCollectionAddressChanged
): void {
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
  pool.setFeeCollectionAddress(event.params.feeCollectionAddress.toHexString());

  log.warning("[FeeCollectionAddressChanged] addr: {} tx: {}", [
    event.params.feeCollectionAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
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
  const TMetalContract = TMetal.bind(event.address);
  const supply = TMetalContract.totalSupply();
  pool.setInputTokenBalances([supply], true);
  if (
    event.params.from == Address.fromString(ZERO_ADDRESS) ||
    event.params.to == Address.fromString(ZERO_ADDRESS)
  ) {
    const user = event.transaction.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();

    log.warning("[Transfer Mint/Burn] from: {} to: {} value: {} tx: {}", [
      event.params.from.toHexString(),
      event.params.to.toHexString(),
      event.params.value.toString(),
      event.transaction.hash.toHexString(),
    ]);
  } else if (
    event.params.to == Address.fromString(pool.getFeeCollectionAddress())
  ) {
    const fee = event.params.value;
    pool.addRevenueNative(token, BIGINT_ZERO, fee);

    log.warning("[Transfer Fee] from: {} to: {} value: {} tx: {}", [
      event.params.from.toHexString(),
      event.params.to.toHexString(),
      event.params.value.toString(),
      event.transaction.hash.toHexString(),
    ]);
  }
}
