import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGINT_TEN_TO_EIGHTEENTH,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import { _ERC20 } from "../../generated/LiquidStaking/_ERC20";
import {
  EthStake as EthStakeV1,
  EthUnstake as EthUnstakeV1,
  LiquidStaking,
} from "../../generated/LiquidStaking/LiquidStaking";
import {
  WithdrawalsReceive,
  LargeWithdrawalsRequest,
  LargeWithdrawalsClaim,
  WithdrawalRequest,
} from "../../generated/WithdrawalRequest/WithdrawalRequest";
import { NodeOperatorRegistry } from "../../generated/LiquidStaking/NodeOperatorRegistry";
import { LargeStaking } from "../../generated/LiquidStaking/LargeStaking";
import {
  EthStake as EthStakeStaking,
  EthUnstake as EthUnstakeStaking,
  WithdrawalsRequest as WithdrawalsRequestStaking,
  WithdrawalsClaimed as WithdrawalsClaimedStaking,
  NethPool,
} from "../../generated/NethPool/NethPool";
import { NETH } from "../../generated/LiquidStaking/NETH";
import {
  EthStake as EthStakeRestaking,
  EthUnstake as EthUnstakeRestaking,
  WithdrawalsRequest as WithdrawalsRequestRestaking,
  WithdrawalsClaimed as WithdrawalsClaimedRestaking,
} from "../../generated/RestakingPool/RestakingPool";
import { RNETH } from "../../generated/RestakingPool/RNETH";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getLSTAddress().toHexString(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    return getUsdPricePerToken(Address.fromBytes(token.id)).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    return getUsdPrice(
      Address.fromBytes(token.id),
      bigIntToBigDecimal(amount, token.decimals)
    );
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const nameCall = erc20.try_name();
      if (!nameCall.reverted) {
        name = nameCall.value;
      } else {
        log.warning("[getTokenParams] nameCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const symbolCall = erc20.try_symbol();
      if (!symbolCall.reverted) {
        symbol = symbolCall.value;
      } else {
        log.warning("[getTokenParams] symbolCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const decimalsCall = erc20.try_decimals();
      if (!decimalsCall.reverted) {
        decimals = decimalsCall.value.toI32();
      } else {
        log.warning("[getTokenParams] decimalsCall reverted for {}", [
          address.toHexString(),
        ]);
      }
    }
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export function handleEthStakeV1(event: EthStakeV1): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const poolContract = LiquidStaking.bind(event.address);
  const outputTokenAddr = poolContract.nETHContract();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      "Liquid Staking V1 Pool",
      "LiquidStakingV1Pool",
      [token.id],
      outputToken,
      false
    );
  }

  const balanceStaking = poolContract.getTotalEthValue();
  let balanceNodeOperator = BIGINT_ZERO;

  const zeroAddr = Address.fromString(ZERO_ADDRESS);

  let nodeOperatorRegistryContractAddr = zeroAddr;
  const nodeOperatorRegistryContractAddrCall =
    poolContract.try_nodeOperatorRegistryContract();
  if (!nodeOperatorRegistryContractAddrCall.reverted) {
    nodeOperatorRegistryContractAddr =
      nodeOperatorRegistryContractAddrCall.value;
    const nodeOperatorRegistryContract = NodeOperatorRegistry.bind(
      nodeOperatorRegistryContractAddr
    );

    let largeStakingContractAddr = zeroAddr;
    const largeStakingContractAddrCall =
      nodeOperatorRegistryContract.try_largeStakingContract();
    if (!largeStakingContractAddrCall.reverted) {
      largeStakingContractAddr = largeStakingContractAddrCall.value;
      const largeStakingContract = LargeStaking.bind(largeStakingContractAddr);

      const nodeOperatorCount =
        nodeOperatorRegistryContract.getNodeOperatorsCount();
      let validatorCount = BIGINT_ZERO;
      for (let i = 1; i <= nodeOperatorCount.toI32(); i++) {
        validatorCount = validatorCount.plus(
          largeStakingContract.getOperatorValidatorCounts(BigInt.fromI32(i))
        );
      }

      balanceNodeOperator = validatorCount.times(
        BigInt.fromI32(32).times(BIGINT_TEN_TO_EIGHTEENTH)
      );
    }
  }
  pool.setInputTokenBalances([balanceStaking.plus(balanceNodeOperator)], true);

  const nethContract = NETH.bind(outputTokenAddr);
  const supply = nethContract.totalSupply();
  pool.addOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleEthUnstakeV1(event: EthUnstakeV1): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const poolContract = LiquidStaking.bind(event.address);
  const outputTokenAddr = poolContract.nETHContract();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      "Liquid Staking V1 Pool",
      "LiquidStakingV1Pool",
      [token.id],
      outputToken,
      false
    );
  }

  const balanceStaking = poolContract.getTotalEthValue();
  let balanceNodeOperator = BIGINT_ZERO;

  const zeroAddr = Address.fromString(ZERO_ADDRESS);

  let nodeOperatorRegistryContractAddr = zeroAddr;
  const nodeOperatorRegistryContractAddrCall =
    poolContract.try_nodeOperatorRegistryContract();
  if (!nodeOperatorRegistryContractAddrCall.reverted) {
    nodeOperatorRegistryContractAddr =
      nodeOperatorRegistryContractAddrCall.value;
    const nodeOperatorRegistryContract = NodeOperatorRegistry.bind(
      nodeOperatorRegistryContractAddr
    );

    let largeStakingContractAddr = zeroAddr;
    const largeStakingContractAddrCall =
      nodeOperatorRegistryContract.try_largeStakingContract();
    if (!largeStakingContractAddrCall.reverted) {
      largeStakingContractAddr = largeStakingContractAddrCall.value;
      const largeStakingContract = LargeStaking.bind(largeStakingContractAddr);

      const nodeOperatorCount =
        nodeOperatorRegistryContract.getNodeOperatorsCount();
      let validatorCount = BIGINT_ZERO;
      for (let i = 1; i <= nodeOperatorCount.toI32(); i++) {
        validatorCount = validatorCount.plus(
          largeStakingContract.getOperatorValidatorCounts(BigInt.fromI32(i))
        );
      }

      balanceNodeOperator = validatorCount.times(
        BigInt.fromI32(32).times(BIGINT_TEN_TO_EIGHTEENTH)
      );
    }
  }
  pool.setInputTokenBalances([balanceStaking.plus(balanceNodeOperator)], true);

  const nethContract = NETH.bind(outputTokenAddr);
  const supply = nethContract.totalSupply();
  pool.addOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdrawalsReceive(event: WithdrawalsReceive): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const withdrawalContract = WithdrawalRequest.bind(event.address);
  const poolContractAddr = withdrawalContract.liquidStakingContract();
  const poolContract = LiquidStaking.bind(poolContractAddr);
  const outputTokenAddr = poolContract.nETHContract();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const pool = sdk.Pools.loadPool(poolContractAddr);
  if (!pool.isInitialized) {
    pool.initialize(
      "Liquid Staking V1 Pool",
      "LiquidStakingV1Pool",
      [token.id],
      outputToken,
      false
    );
  }

  const balanceStaking = poolContract.getTotalEthValue();
  let balanceNodeOperator = BIGINT_ZERO;

  const zeroAddr = Address.fromString(ZERO_ADDRESS);

  let nodeOperatorRegistryContractAddr = zeroAddr;
  const nodeOperatorRegistryContractAddrCall =
    poolContract.try_nodeOperatorRegistryContract();
  if (!nodeOperatorRegistryContractAddrCall.reverted) {
    nodeOperatorRegistryContractAddr =
      nodeOperatorRegistryContractAddrCall.value;
    const nodeOperatorRegistryContract = NodeOperatorRegistry.bind(
      nodeOperatorRegistryContractAddr
    );

    let largeStakingContractAddr = zeroAddr;
    const largeStakingContractAddrCall =
      nodeOperatorRegistryContract.try_largeStakingContract();
    if (!largeStakingContractAddrCall.reverted) {
      largeStakingContractAddr = largeStakingContractAddrCall.value;
      const largeStakingContract = LargeStaking.bind(largeStakingContractAddr);

      const nodeOperatorCount =
        nodeOperatorRegistryContract.getNodeOperatorsCount();
      let validatorCount = BIGINT_ZERO;
      for (let i = 1; i <= nodeOperatorCount.toI32(); i++) {
        validatorCount = validatorCount.plus(
          largeStakingContract.getOperatorValidatorCounts(BigInt.fromI32(i))
        );
      }

      balanceNodeOperator = validatorCount.times(
        BigInt.fromI32(32).times(BIGINT_TEN_TO_EIGHTEENTH)
      );
    }
  }
  pool.setInputTokenBalances([balanceStaking.plus(balanceNodeOperator)], true);

  const nethContract = NETH.bind(outputTokenAddr);
  const supply = nethContract.totalSupply();
  pool.addOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleLargeWithdrawalsRequest(
  event: LargeWithdrawalsRequest
): void {
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

export function handleLargeWithdrawalsClaim(
  event: LargeWithdrawalsClaim
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const withdrawalContract = WithdrawalRequest.bind(event.address);
  const poolContractAddr = withdrawalContract.liquidStakingContract();
  const poolContract = LiquidStaking.bind(poolContractAddr);
  const outputTokenAddr = poolContract.nETHContract();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const pool = sdk.Pools.loadPool(poolContractAddr);
  if (!pool.isInitialized) {
    pool.initialize(
      "Liquid Staking V1 Pool",
      "LiquidStakingV1Pool",
      [token.id],
      outputToken,
      false
    );
  }

  const balanceStaking = poolContract.getTotalEthValue();
  let balanceNodeOperator = BIGINT_ZERO;

  const zeroAddr = Address.fromString(ZERO_ADDRESS);

  let nodeOperatorRegistryContractAddr = zeroAddr;
  const nodeOperatorRegistryContractAddrCall =
    poolContract.try_nodeOperatorRegistryContract();
  if (!nodeOperatorRegistryContractAddrCall.reverted) {
    nodeOperatorRegistryContractAddr =
      nodeOperatorRegistryContractAddrCall.value;
    const nodeOperatorRegistryContract = NodeOperatorRegistry.bind(
      nodeOperatorRegistryContractAddr
    );

    let largeStakingContractAddr = zeroAddr;
    const largeStakingContractAddrCall =
      nodeOperatorRegistryContract.try_largeStakingContract();
    if (!largeStakingContractAddrCall.reverted) {
      largeStakingContractAddr = largeStakingContractAddrCall.value;
      const largeStakingContract = LargeStaking.bind(largeStakingContractAddr);

      const nodeOperatorCount =
        nodeOperatorRegistryContract.getNodeOperatorsCount();
      let validatorCount = BIGINT_ZERO;
      for (let i = 1; i <= nodeOperatorCount.toI32(); i++) {
        validatorCount = validatorCount.plus(
          largeStakingContract.getOperatorValidatorCounts(BigInt.fromI32(i))
        );
      }

      balanceNodeOperator = validatorCount.times(
        BigInt.fromI32(32).times(BIGINT_TEN_TO_EIGHTEENTH)
      );
    }
  }
  pool.setInputTokenBalances([balanceStaking.plus(balanceNodeOperator)], true);

  const nethContract = NETH.bind(outputTokenAddr);
  const supply = nethContract.totalSupply();
  pool.addOutputTokenSupply(supply);
}

export function handleEthStakeStaking(event: EthStakeStaking): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const poolContract = NethPool.bind(event.address);
  const outputTokenAddr = poolContract.poolToken();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const poolV1 = sdk.Pools.loadPool(NetworkConfigs.getPoolV1());
  poolV1.setInputTokenBalances([BIGINT_ZERO], true);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Neth Pool", "NETHPool", [token.id], outputToken, false);
  }

  const balance = poolContract.totalUnderlyingAsset();
  pool.setInputTokenBalances([balance], true);

  const nethContract = NETH.bind(outputTokenAddr);
  const supply = nethContract.totalSupply();
  pool.addOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleEthUnstakeStaking(event: EthUnstakeStaking): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const poolContract = NethPool.bind(event.address);
  const outputTokenAddr = poolContract.poolToken();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const poolV1 = sdk.Pools.loadPool(NetworkConfigs.getPoolV1());
  poolV1.setInputTokenBalances([BIGINT_ZERO], true);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Neth Pool", "NETHPool", [token.id], outputToken, false);
  }

  const balance = poolContract.totalUnderlyingAsset();
  pool.setInputTokenBalances([balance], true);

  const nethContract = NETH.bind(outputTokenAddr);
  const supply = nethContract.totalSupply();
  pool.addOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdrawalsRequestStaking(
  event: WithdrawalsRequestStaking
): void {
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

export function handleWithdrawalsClaimedStaking(
  event: WithdrawalsClaimedStaking
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const poolContract = NethPool.bind(event.address);
  const outputTokenAddr = poolContract.poolToken();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Neth Pool", "NETHPool", [token.id], outputToken, false);
  }

  const balance = poolContract.totalUnderlyingAsset();
  pool.setInputTokenBalances([balance], true);

  const nethContract = NETH.bind(outputTokenAddr);
  const supply = nethContract.totalSupply();
  pool.addOutputTokenSupply(supply);
}

export function handleEthStakeRestaking(event: EthStakeRestaking): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const poolContract = NethPool.bind(event.address);
  const outputTokenAddr = poolContract.poolToken();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      "Restaking Pool",
      "RNETHPool",
      [token.id],
      outputToken,
      false
    );
  }

  const balance = poolContract.totalUnderlyingAsset();
  pool.setInputTokenBalances([balance], true);

  const rnethContract = RNETH.bind(outputTokenAddr);
  const supply = rnethContract.totalSupply();
  pool.addOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleEthUnstakeRestaking(event: EthUnstakeRestaking): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const poolContract = NethPool.bind(event.address);
  const outputTokenAddr = poolContract.poolToken();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      "Restaking Pool",
      "RNETHPool",
      [token.id],
      outputToken,
      false
    );
  }

  const balance = poolContract.totalUnderlyingAsset();
  pool.setInputTokenBalances([balance], true);

  const rnethContract = RNETH.bind(outputTokenAddr);
  const supply = rnethContract.totalSupply();
  pool.addOutputTokenSupply(supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdrawalsRequestRestaking(
  event: WithdrawalsRequestRestaking
): void {
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

export function handleWithdrawalsClaimedRestaking(
  event: WithdrawalsClaimedRestaking
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const poolContract = NethPool.bind(event.address);
  const outputTokenAddr = poolContract.poolToken();
  const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddr);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      "Restaking Pool",
      "RNETHPool",
      [token.id],
      outputToken,
      false
    );
  }

  const balance = poolContract.totalUnderlyingAsset();
  pool.setInputTokenBalances([balance], true);

  const rnethContract = RNETH.bind(outputTokenAddr);
  const supply = rnethContract.totalSupply();
  pool.addOutputTokenSupply(supply);
}
