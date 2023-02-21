import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  Network,
  RewardTokenType,
  SECONDS_PER_DAY_BI,
} from "../sdk/util/constants";
import { Versions } from "../versions";
import { findOriginToken } from "../availableRoutesApi";

import { SDK } from "../sdk/protocols/bridge";
import { BridgeConfig } from "../sdk/protocols/bridge/config";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";

import { _ERC20 } from "../../generated/SpokePool/_ERC20";
import { FilledRelay } from "../../generated/SpokePool/SpokePool";
import { AcceleratingDistributor } from "../../generated/SpokePool/AcceleratingDistributor";
import { Pricer, TokenInit } from "./common";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";

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
    BridgePermissionType.WHITELIST, // TBD
    Versions
  );

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(event.block),
    new TokenInit(),
    event
  );

  // Chain
  const originChainId = event.params.originChainId;
  const destinationChainId = event.params.destinationChainId;

  // InputToken
  const inputTokenAddress = event.params.destinationToken;
  const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress!);

  // CrossToken
  const crossTokenAddress: Address = Address.fromString(
    findOriginToken(
      originChainId.toI32(),
      destinationChainId.toI32(),
      inputTokenAddress.toHexString()
    )
  );
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    originChainId,
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
  // TODO: lpfee % is not in %, fix
  // Note: We take the amount from crossChain (origin) and multiplying by inputToken price (destination).
  // This isn't ideal but we do this because we don't have access to price for the crossToken.
  const supplySideRevenue = bigIntToBigDecimal(
    event.params.amount.times(event.params.realizedLpFeePct),
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  pool.addSupplySideRevenueUSD(supplySideRevenue);

  // Rewards
  // RewardToken can also be fetched from AcceleratingDistributor contract ("rewardToken" method)
  // Only track rewardToken emissions on mainnet where AcceleratingDistributor is deployed
  if (destinationChainId == networkToChainID(Network.MAINNET)) {
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
}
