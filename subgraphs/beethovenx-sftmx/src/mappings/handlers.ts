import {
  Address,
  BigDecimal,
  BigInt,
  ByteArray,
  crypto,
  ethereum,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  ETH_ADDRESS,
  INT_ONE,
  INT_ZERO,
} from "../sdk/util/constants";

import {
  LogDeposited,
  LogWithdrawn,
  LogVaultWithdrawn,
  FTMStaking,
  LogUndelegated,
} from "../../generated/FTMStaking/FTMStaking";
import { _ERC20 } from "../../generated/FTMStaking/_ERC20";
import { ChainlinkDataFeed } from "../../generated/FTMStaking/ChainlinkDataFeed";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    if (Address.fromBytes(token.id) == NetworkConfigs.getLST()) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0xf4766552d15ae4d256ad41b6cf2933482b0680dc") // FTM / USD feed
      );
      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      return bigIntToBigDecimal(result, decimals);
    }
    return BIGDECIMAL_ZERO;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const usdPrice = this.getTokenPrice(token);
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

export function handleLogDeposited(event: LogDeposited): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLST());
  const pool = sdk.Pools.loadPool(NetworkConfigs.getLST());
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = FTMStaking.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const supply = contract.totalFTMWorth();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleLogUndelegated(event: LogUndelegated): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleLogWithdrawn(event: LogWithdrawn): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLST());
  const pool = sdk.Pools.loadPool(NetworkConfigs.getLST());
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = FTMStaking.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const supply = contract.totalFTMWorth();
  pool.setInputTokenBalances([supply], true);
}

export function handleLogVaultWithdrawn(event: LogVaultWithdrawn): void {
  const receipt = event.receipt;
  if (!receipt) {
    return;
  }
  const logs = event.receipt!.logs;
  if (!logs) {
    return;
  }

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLST());
  const pool = sdk.Pools.loadPool(NetworkConfigs.getLST());
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const signature = crypto.keccak256(
    ByteArray.fromUTF8("Withdrawn(address,uint256,uint256,uint256)")
  );

  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs.at(i);
    const topic_signature = thisLog.topics.at(INT_ZERO);

    if (topic_signature.equals(signature)) {
      const topic_delegator = ethereum
        .decode("address", thisLog.topics.at(INT_ONE))!
        .toAddress();

      if (topic_delegator.equals(event.params.vault)) {
        const amount = ethereum.decode("uint256", thisLog.data)!.toBigInt();

        // https://docs.beets.fi/sftmx#what-are-the-sftmx-fees
        const validatorFee = amount
          .toBigDecimal()
          .times(BigDecimal.fromString("0.15"));
        const protocolFee = amount
          .toBigDecimal()
          .minus(validatorFee)
          .times(BigDecimal.fromString("0.10"));
        const protocolSide = validatorFee.plus(protocolFee);
        const supplySide = amount.toBigDecimal().minus(protocolSide);

        pool.addRevenueNative(
          token,
          bigDecimalToBigInt(supplySide),
          bigDecimalToBigInt(protocolSide)
        );
      }
    }
  }
}
