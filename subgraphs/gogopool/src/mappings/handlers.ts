import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  dataSource,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  Network,
} from "../sdk/util/constants";

import {
  Deposit,
  DepositedFromStaking,
  Withdraw,
  WithdrawnForStaking,
  NewRewardsCycle,
  GGAVAX,
} from "../../generated/GGAVAX/GGAVAX";
import {
  DepositFromDelegation,
  WithdrawForDelegation,
  MinipoolStatusChanged,
  MinipoolManager,
} from "../../generated/GGAVAX/MinipoolManager";
import { _ERC20 } from "../../generated/GGAVAX/_ERC20";
import { ChainlinkDataFeed } from "../../generated/GGAVAX/ChainlinkDataFeed";
import { Token } from "../../generated/schema";
import { CustomPriceType } from "../prices/common/types";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedTokenAddr = Address.fromBytes(token.id);
    let returnedPrice = BIGDECIMAL_ZERO;

    const network = dataSource.network().toUpperCase().replace("-", "_");
    if (network == Network.AVALANCHE) {
      if (pricedTokenAddr == NetworkConfigs.getWAVAXAddress()) {
        const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
          Address.fromString("0x0a77230d17318075983913bc2145db16c7366156") // AVAX / USD feed
        );

        const result = chainlinkDataFeedContract.latestAnswer();
        const decimals = chainlinkDataFeedContract.decimals();
        const usdPricePerToken = CustomPriceType.initialize(
          result.toBigDecimal(),
          decimals as i32,
          "ChainlinkFeed"
        );
        returnedPrice = usdPricePerToken.usdPrice;
      } else {
        returnedPrice = getUsdPricePerToken(pricedTokenAddr).usdPrice;
      }
    }
    return returnedPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedTokenAddr = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    let returnedPrice = BIGDECIMAL_ZERO;

    const network = dataSource.network().toUpperCase().replace("-", "_");
    if (network == Network.AVALANCHE) {
      if (pricedTokenAddr == NetworkConfigs.getWAVAXAddress()) {
        const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
          Address.fromString("0x0a77230d17318075983913bc2145db16c7366156") // AVAX / USD feed
        );

        const result = chainlinkDataFeedContract.latestAnswer();
        const decimals = chainlinkDataFeedContract.decimals();
        const usdPricePerToken = CustomPriceType.initialize(
          result.toBigDecimal(),
          decimals as i32,
          "ChainlinkFeed"
        );
        returnedPrice = usdPricePerToken.usdPrice.times(_amount);
      } else {
        returnedPrice = getUsdPrice(pricedTokenAddr, _amount);
      }
    }
    return returnedPrice;
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

export function handleDeposit(event: Deposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getWAVAXAddress());
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(Bytes.fromI32(1));
  if (!pool.isInitialized) {
    pool.initialize("Stakers Pool", "ggAVAX", [token.id], outputToken);
  }

  const ggAVAX = GGAVAX.bind(NetworkConfigs.getLSTAddress());
  const staked = ggAVAX.totalAssets();
  pool.setInputTokenBalances([staked], true);
  const supply = ggAVAX.totalSupply();
  pool.setOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleDepositedFromStaking(event: DepositedFromStaking): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getWAVAXAddress());
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(Bytes.fromI32(1));
  if (!pool.isInitialized) {
    pool.initialize("Stakers Pool", "ggAVAX", [token.id], outputToken);
  }

  const ggAVAX = GGAVAX.bind(NetworkConfigs.getLSTAddress());
  const staked = ggAVAX.totalAssets();
  pool.setInputTokenBalances([staked], true);
  const supply = ggAVAX.totalSupply();
  pool.setOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getWAVAXAddress());
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(Bytes.fromI32(1));
  if (!pool.isInitialized) {
    pool.initialize("Stakers Pool", "ggAVAX", [token.id], outputToken);
  }

  const ggAVAX = GGAVAX.bind(NetworkConfigs.getLSTAddress());
  const staked = ggAVAX.totalAssets();
  pool.setInputTokenBalances([staked], true);
  const supply = ggAVAX.totalSupply();
  pool.setOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdrawnForStaking(event: WithdrawnForStaking): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getWAVAXAddress());
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(Bytes.fromI32(1));
  if (!pool.isInitialized) {
    pool.initialize("Stakers Pool", "ggAVAX", [token.id], outputToken);
  }

  const ggAVAX = GGAVAX.bind(NetworkConfigs.getLSTAddress());
  const staked = ggAVAX.totalAssets();
  pool.setInputTokenBalances([staked], true);
  const supply = ggAVAX.totalSupply();
  pool.setOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleNewRewardsCycle(event: NewRewardsCycle): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getWAVAXAddress());
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(Bytes.fromI32(1));
  if (!pool.isInitialized) {
    pool.initialize("Stakers Pool", "ggAVAX", [token.id], outputToken);
  }

  const rewards = event.params.rewardsAmt;

  pool.addRevenueNative(token, rewards, BIGINT_ZERO);
}

export function handleDepositFromDelegation(
  event: DepositFromDelegation
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getWAVAXAddress());

  const pool = sdk.Pools.loadPool(Bytes.fromI32(2));
  if (!pool.isInitialized) {
    pool.initialize("Operators Pool", "ggAVAX", [token.id], null);
  }

  const mm = MinipoolManager.bind(event.address);
  const staked = mm.getTotalAVAXLiquidStakerAmt();
  pool.setInputTokenBalances([staked], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdrawForDelegation(
  event: WithdrawForDelegation
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getWAVAXAddress());

  const pool = sdk.Pools.loadPool(Bytes.fromI32(2));
  if (!pool.isInitialized) {
    pool.initialize("Operators Pool", "ggAVAX", [token.id], null);
  }

  const mm = MinipoolManager.bind(event.address);
  const staked = mm.getTotalAVAXLiquidStakerAmt();
  pool.setInputTokenBalances([staked], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleMinipoolStatusChanged(
  event: MinipoolStatusChanged
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getWAVAXAddress());

  const pool = sdk.Pools.loadPool(Bytes.fromI32(2));
  if (!pool.isInitialized) {
    pool.initialize("Operators Pool", "ggAVAX", [token.id], null);
  }

  const mm = MinipoolManager.bind(event.address);
  const staked = mm.getTotalAVAXLiquidStakerAmt();
  pool.setInputTokenBalances([staked], true);
}
