import { SDK } from "./sdk/protocols/bridge";

import { Token } from "../generated/schema";
import { bigIntToBigDecimal } from "./sdk/util/numbers";
import { TokenPricer } from "./sdk/protocols/config";
import { getUsdPrice, getUsdPricePerToken } from "./prices";
import { TokenInitializer, TokenParams } from "./sdk/protocols/bridge/tokens";
import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { _ERC20 } from "../generated/SpokePool/_ERC20";
import { BridgeConfig } from "./sdk/protocols/bridge/config";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "./sdk/protocols/bridge/enums";
import { Versions } from "./versions";

// import {
//   LiquidityAdded,
//   LiquidityRemoved,
// } from "../generated/Spoke/HubPool";
import { FilledRelay } from "../generated/SpokePool/SpokePool";
import { AcceleratingDistributor } from "../generated/SpokePool/AcceleratingDistributor";
import {
  chainIDToNetwork,
  networkToChainID,
} from "./sdk/protocols/bridge/chainIds";
import { RewardTokenType, SECONDS_PER_DAY_BI } from "./sdk/util/constants";

export class Pricer implements TokenPricer {
  block: ethereum.Block;

  constructor(block: ethereum.Block) {
    this.block = block;
  }

  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id), this.block);
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount, this.block);
  }
}

export class TokenInit implements TokenInitializer {
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

// TODO conf for liquidity is same, reduce duplication
// export function handleLiquidityAdded(event: LiquidityAdded): void {
//   const conf = new BridgeConfig(
//     "0xc186fA914353c44b2E33eBE05f21846F1048bEda", // hub-pool address
//     "across-v2", //NetworkConfigs.getProtocolName(),
//     "across-v2", // NetworkConfigs.getProtocolSlug(),
//     BridgePermissionType.WHITELIST, // TBD
//     Versions
//   );

//   const sdk = SDK.initializeFromEvent(
//     conf,
//     new Pricer(event.block),
//     new TokenInit(),
//     event
//   );
//   const token = sdk.Tokens.getOrCreateToken(event.params.l1Token);
//   const poolId = event.address
//     .toHexString()
//     .concat(event.params.l1Token.toHexString());

//   const pool = sdk.Pools.loadPool<string>(Bytes.fromUTF8(poolId));
//   if (!pool.isInitialized) {
//     pool.initialize(token.name, token.symbol, BridgePoolType.LIQUIDITY, token);
//   }

//   const amount = event.params.amount;
//   const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);

//   // TODO: liquidityDeposit.from is set to poolId, expected?
//   // TODO: should pool name and symbol be "Pool - Token" (Eg HubPool - Wrapped Ether)? Doesn't matter since there is only a single liquidity pool in ethereum anyway.
//   account.liquidityDeposit(pool, amount);
// }

// export function handleLiquidityRemoved(event: LiquidityRemoved): void {
//   const conf = new BridgeConfig(
//     "0xc186fA914353c44b2E33eBE05f21846F1048bEda", // hub-pool address
//     "across-v2", //NetworkConfigs.getProtocolName(),
//     "across-v2", // NetworkConfigs.getProtocolSlug(),
//     BridgePermissionType.WHITELIST, // TBD
//     Versions
//   );

//   const sdk = SDK.initializeFromEvent(
//     conf,
//     new Pricer(event.block),
//     new TokenInit(),
//     event
//   );
//   const token = sdk.Tokens.getOrCreateToken(event.params.l1Token);
//   const poolId = event.address
//     .toHexString()
//     .concat(event.params.l1Token.toHexString());

//   const pool = sdk.Pools.loadPool<string>(Bytes.fromUTF8(poolId));
//   if (!pool.isInitialized) {
//     pool.initialize(token.name, token.symbol, BridgePoolType.LIQUIDITY, token);
//   }

//   const amount = event.params.amount;
//   const account = sdk.Accounts.loadAccount(event.params.liquidityProvider);

//   account.liquidityWithdraw(pool, amount);
// }

// TODO: use the same event for all chains
// - customize spoke-pool-address
// TODO - is the bridge permissionless? https://docs.across.to/v/developer-docs/additional-info/new-token-request
// export function handleFundsDeposited(event: FundsDeposited): void {
//   const conf = new BridgeConfig(
//     "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381", // eth-spoke-pool address
//     "across-v2", //NetworkConfigs.getProtocolName(),
//     "across-v2", // NetworkConfigs.getProtocolSlug(),
//     BridgePermissionType.PERMISSIONLESS, // TBD
//     Versions
//   );

//   const sdk = SDK.initializeFromEvent(
//     conf,
//     new Pricer(event.block),
//     new TokenInit(),
//     event
//   );

//   // TODO: is origin chain ever not ethereum on ethereum spoke pool?
//   // TODO: we dont have access to crossToken, how do we find? API call
//   // event.params.originChainId
//   // event.params.destinationChainId
//   // event.params.depositId
//   // event.params.depositor
//   // event.params.recipient
//   // event.params.originToken
//   // event.params.amount
//   // event.params.relayerFeePct
//   // event.params.quoteTimestamp

//   // Chain
//   const destinationChainId = chainIDToNetwork(event.params.destinationChainId);

//   const inputTokenAddress: Address = event.params.originToken;
//   const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);

//   // TODO: temporary, to fix
//   const crossTokenAddress = inputTokenAddress;
//   const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
//     networkToChainID(destinationChainId),
//     crossTokenAddress!,
//     CrosschainTokenType.CANONICAL, // TODO
//     crossTokenAddress!
//   );

//   const poolId = event.address.concat(Bytes.fromUTF8(inputToken.symbol));
//   const pool = sdk.Pools.loadPool<string>(poolId);

//   if (!pool.isInitialized) {
//     pool.initialize(
//       poolId.toString(),
//       inputToken.symbol,
//       BridgePoolType.LIQUIDITY,
//       inputToken
//     );
//   }

//   pool.addDestinationToken(crossToken);

//   const acc = sdk.Accounts.loadAccount(event.params.depositor);
//   acc.transferOut(
//     pool,
//     pool.getDestinationTokenRoute(crossToken)!,
//     event.params.recipient,
//     event.params.amount,
//     event.transaction.hash
//   );

//   // TODO: revenue stuff
//   // supply side revenue
//   const lpFee = BIGINT_ONE // need to be calculated
//   const supplySideRevenue = bigIntToBigDecimal(event.params.amount).times(
//     inputToken.lastPriceUSD!
//   ).times(lpFee);
//   pool.addSupplySideRevenueUSD;
//   // pool.addSupplySideRevenueUSD()
//   // pool.addProtocolSideRevenueUSD()

//   // This should be taken care of by the sdk internals
//   // pool.addRevenueNative
//   // pool.addTotalValueLocked
//   // pool.addVolume

//   // TODO: rewards
// }

export function handleFilledRelay(event: FilledRelay): void {
  // uint256 amount
  // uint256 totalFilledAmount
  // uint256 fillAmount
  // uint256 repaymentChainId
  // uint256 originChainId
  // uint256 destinationChainId
  // uint64 relayerFeePct
  // uint64 appliedRelayerFeePct
  // uint64 realizedLpFeePct
  // uint32 depositId
  // address destinationToken
  // index_topic_1 address relayer
  // index_topic_2 address depositor
  // address recipient
  // bool isSlowRelay

  // Config
  const conf = new BridgeConfig(
    event.address.toHexString(), // TODO: verify
    "across-v2", //NetworkConfigs.getProtocolName(),
    "across-v2", // NetworkConfigs.getProtocolSlug(),
    BridgePermissionType.PERMISSIONLESS, // TBD
    Versions
  );

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // Chain
  const destinationChainId = chainIDToNetwork(event.params.destinationChainId);

  // TODO: find input token and fix it
  // InputToken
  const inputTokenAddress: Address = event.params.destinationToken;
  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);

  // CrossToken
  const crossTokenAddress = event.params.destinationToken;
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    networkToChainID(destinationChainId),
    crossTokenAddress!,
    CrosschainTokenType.CANONICAL,
    inputTokenAddress!
  );

  // Pool
  const poolId = event.address.concat(Bytes.fromUTF8(inputToken.symbol));
  const pool = sdk.Pools.loadPool<string>(poolId);

  if (!pool.isInitialized) {
    pool.initialize(
      poolId.toString(),
      inputToken.symbol,
      BridgePoolType.LIQUIDITY,
      inputToken
    );
  }

  pool.addDestinationToken(crossToken);

  // Account
  const acc = sdk.Accounts.loadAccount(event.params.depositor);
  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.depositor,
    event.params.amount,
    event.transaction.hash
  );

  // Revenue
  // TODO: don't have crossToken, using inputToken
  // TODO: lpfee % is not in %, fix
  log.error("1", []);
  log.error(
    "2 - tx.hash: {}, event.params.amount :{}, event.params.realizedLpFeePct: {}, inputToken decimals: {}, inputToken.lastPriceUSD: {}",
    [
      event.transaction.hash.toHexString(),
      event.params.amount.toString(),
      event.params.realizedLpFeePct.toString(),
      inputToken.decimals.toString(),
      inputToken.lastPriceUSD!.toString(),
    ]
  );
  const supplySideRevenue = bigIntToBigDecimal(
    event.params.amount.times(event.params.realizedLpFeePct),
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  log.error("3", []);
  pool.addSupplySideRevenueUSD(supplySideRevenue);
  log.error("4", []);

  // Rewards
  // can also be fetched from AcceleratingDistributor contract, "rewardToken" method
  const rewardTokenAddress = Address.fromString(
    "0x44108f0223A3C3028F5Fe7AEC7f9bb2E66beF82F"
  );
  const rewardToken = sdk.Tokens.getOrCreateToken(rewardTokenAddress);

  const acceleratingDistributorContract = AcceleratingDistributor.bind(
    Address.fromString("0x9040e41eF5E8b281535a96D9a48aCb8cfaBD9a48")
  );
  const contractCall =
    acceleratingDistributorContract.try_stakingTokens(rewardTokenAddress);

  let baseEmissionRate: BigInt;
  if (contractCall.reverted) {
    log.info(
      "[AcceleratingDistributor:stakingToken()] retrieve baseEmissionRate for pools call reverted",
      []
    );
  } else {
    baseEmissionRate = contractCall.value.getBaseEmissionRate();
  }

  const amount = baseEmissionRate!
    .times(SECONDS_PER_DAY_BI)
    .div(BigInt.fromI32(rewardToken.decimals));
  pool.setRewardEmissions(RewardTokenType.DEPOSIT, rewardToken, amount);
}
