import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../generated/schema";
import { PairCreated } from "../../generated/BiswapFactory/BiswapFactory";
import { Mint, Burn, Swap } from "../../generated/BiswapFactory/BiswapPair";
import { BiswapPair } from "../../generated/templates";
import { BIGINT_ZERO, INT_ZERO, UsageType } from "../common/constants";
import {
  createDeposit,
  createLiquidityPool,
  createSwapHandleVolumeAndFees,
  createWithdraw,
} from "../common/creators";
import {
  updateFinancials,
  updatePoolMetrics,
  updateUsageMetrics,
} from "../common/updateMetrics";

// Liquidity pool is created from the Factory contract.
// Create a pool entity and start monitoring events from the newly deployed pool contract specified in the subgraph.yaml.
export function handlePairCreated(event: PairCreated): void {
  log.info(" -------> inside handlePairCreated", []);

  BiswapPair.create(event.params.pair);

  let liquidityPool = LiquidityPool.load(event.params.pair.toHexString());
  if (!liquidityPool) {
    createLiquidityPool(
      event,
      event.params.pair.toHexString(),
      event.params.token0.toHexString(),
      event.params.token1.toHexString()
    );
  }
}

// Handle a mint event emitted from a pool contract. Considered a deposit into the given liquidity pool.
export function handleMint(event: Mint): void {
  log.info(" -------> inside handleMint", []);
  createDeposit(
    event,
    event.params.sender,
    event.params.amount0,
    event.params.amount1
  );
  updateUsageMetrics(event, event.params.sender, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event);
}

// Handle a burn event emitted from a pool contract. Considered a withdraw into the given liquidity pool.
export function handleBurn(event: Burn): void {
  log.info(" -------> inside handleBurn", []);
  createWithdraw(
    event,
    event.params.sender,
    event.params.amount0,
    event.params.amount1
  );
  updateUsageMetrics(event, event.params.sender, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event);
}

// Handle a swap event emitted from a pool contract.
export function handleSwap(event: Swap): void {
  log.info(" -------> inside handleSwap", []);
  createSwapHandleVolumeAndFees(
    event,
    event.params.amount0In,
    event.params.amount0Out,
    event.params.amount1In,
    event.params.amount1Out,
    event.params.to,
    event.params.sender
  );
  updateFinancials(event);
  updatePoolMetrics(event);
  updateUsageMetrics(event, event.transaction.from, UsageType.SWAP);
}

// --------------------------------------------------------------
// BANCOR APPROACH
// --------------------------------------------------------------

// export function handlePairCreated(event: PairCreated): void {
//   let token0Address = event.params.token0;
//   let token1Address = event.params.token1;
//   let pairTokenAddress = event.params.pair;

//   let token0ID = token0Address.toHexString();
//   let token0 = Token.load(token0ID);
//   if (token0 != null) {
//     log.warning("[handlePairCreated] pool token {} already exists", [token0ID]);
//     return;
//   }

//   let token1ID = token1Address.toHexString();
//   let token1 = Token.load(token1ID);
//   if (token1 != null) {
//     log.warning("[handlePairCreated] pool token {} already exists", [token1ID]);
//     return;
//   }

//   let pairTokenID = pairTokenAddress.toHexString();
//   let pairToken = Token.load(pairTokenID);
//   if (pairToken != null) {
//     log.warning("[handlePairCreated] pool token {} already exists", [
//       pairTokenID,
//     ]);
//     return;
//   }

//   // token0
//   token0 = new Token(token0ID);
//   let token0Contract = BiswapERC20.bind(token0Address);

//   let token0NameResult = token0Contract.try_name();
//   if (token0NameResult.reverted) {
//     log.warning("[handlePairCreated] try_name on {} reverted", [token0ID]);
//     token0.name = "unknown name";
//   } else {
//     token0.name = token0NameResult.value;
//   }

//   let token0SymbolResult = token0Contract.try_symbol();
//   if (token0SymbolResult.reverted) {
//     log.warning("[handlePairCreated] try_symbol on {} reverted", [token0ID]);
//     token0.symbol = "unknown symbol";
//   } else {
//     token0.symbol = token0SymbolResult.value;
//   }

//   let token0DecimalsResult = token0Contract.try_decimals();
//   if (token0DecimalsResult.reverted) {
//     log.warning("[handlePairCreated] try_decimals on {} reverted", [token0ID]);
//     token0.decimals = 0;
//   } else {
//     token0.decimals = token0DecimalsResult.value;
//   }

//   const token0Price = getUsdPricePerToken(token0Address);
//   if (token0Price.reverted) {
//     token0.lastPriceUSD = BIGDECIMAL_ZERO;
//   } else {
//     token0.lastPriceUSD = token0Price.usdPrice.div(token0Price.decimalsBaseTen);
//   }
//   token0.lastPriceBlockNumber = event.block.number;

//   token0.save();

//   // token1
//   token1 = new Token(token1ID);
//   let token1Contract = BiswapERC20.bind(token1Address);

//   let token1NameResult = token1Contract.try_name();
//   if (token1NameResult.reverted) {
//     log.warning("[handleToken1Created] try_name on {} reverted", [token1ID]);
//     token1.name = "unknown name";
//   } else {
//     token1.name = token1NameResult.value;
//   }

//   let token1SymbolResult = token1Contract.try_symbol();
//   if (token1SymbolResult.reverted) {
//     log.warning("[handleToken1Created] try_symbol on {} reverted", [token1ID]);
//     token1.symbol = "unknown symbol";
//   } else {
//     token1.symbol = token1SymbolResult.value;
//   }

//   let token1DecimalsResult = token1Contract.try_decimals();
//   if (token1DecimalsResult.reverted) {
//     log.warning("[handleToken1Created] try_decimals on {} reverted", [
//       token1ID,
//     ]);
//     token1.decimals = 0;
//   } else {
//     token1.decimals = token1DecimalsResult.value;
//   }

//   const token1Price = getUsdPricePerToken(token1Address);
//   if (token1Price.reverted) {
//     token0.lastPriceUSD = BIGDECIMAL_ZERO;
//   } else {
//     token1.lastPriceUSD = token1Price.usdPrice.div(token1Price.decimalsBaseTen);
//   }
//   token1.lastPriceBlockNumber = event.block.number;

//   token1.save();

//   // token0-token1 LP Token (pairToken/poolToken)
//   pairToken = new Token(pairTokenID);
//   let pairTokenContract = BiswapERC20.bind(pairTokenAddress);

//   let pairTokenNameResult = pairTokenContract.try_name();
//   if (pairTokenNameResult.reverted) {
//     log.warning("[handlepairTokenCreated] try_name on {} reverted", [
//       pairTokenID,
//     ]);
//     pairToken.name = "unknown name";
//   } else {
//     pairToken.name = pairTokenNameResult.value;
//   }

//   let pairTokenSymbolResult = pairTokenContract.try_symbol();
//   if (pairTokenSymbolResult.reverted) {
//     log.warning("[handlepairTokenCreated] try_symbol on {} reverted", [
//       pairTokenID,
//     ]);
//     pairToken.symbol = "unknown symbol";
//   } else {
//     pairToken.symbol = pairTokenSymbolResult.value;
//   }

//   let pairTokenDecimalsResult = pairTokenContract.try_decimals();
//   if (pairTokenDecimalsResult.reverted) {
//     log.warning("[handlepairTokenCreated] try_decimals on {} reverted", [
//       pairTokenID,
//     ]);
//     pairToken.decimals = 0;
//   } else {
//     pairToken.decimals = pairTokenDecimalsResult.value;
//   }

//   const pairTokenPrice = getUsdPricePerToken(pairTokenAddress);
//   if (pairTokenPrice.reverted) {
//     pairToken.lastPriceUSD = BIGDECIMAL_ZERO;
//   } else {
//     pairToken.lastPriceUSD = pairTokenPrice.usdPrice.div(
//       pairTokenPrice.decimalsBaseTen
//     );
//   }
//   pairToken.lastPriceBlockNumber = event.block.number;

//   pairToken.save();

//   // liquidity pool

//   let liquidityPool = createLiquidityPool(
//     token0,
//     token1,
//     pairToken,
//     event.block.timestamp,
//     event.block.number
//   );

//   // pools

//   let protocol = DexAmmProtocol.load(BISWAP_FACTORY_ADDR);
//   if (!protocol) {
//     log.warning("[handlePairCreated] protocol not found", []);
//     return;
//   }

//   let poolIDs = protocol._poolIDs;
//   poolIDs.push(liquidityPool.id);
//   protocol._poolIDs = poolIDs;
//   protocol.totalPoolCount = poolIDs.length;
//   protocol.save();
// }

// // -- Protocol

// function getOrCreateProtocol(): DexAmmProtocol {
//   let protocol = DexAmmProtocol.load(BISWAP_FACTORY_ADDR);
//   if (!protocol) {
//     // Protocol Metadata
//     protocol = new DexAmmProtocol(BISWAP_FACTORY_ADDR);
//     protocol.name = "Biswap";
//     protocol.slug = "biswap";
//     protocol.schemaVersion = "1.3.0";
//     protocol.subgraphVersion = "1.0.0";
//     protocol.methodologyVersion = "1.0.0";
//     protocol.network = Network.BSC;
//     protocol.type = ProtocolType.EXCHANGE;

//     // Quantitative Data
//     protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
//     protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
//     protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
//     protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
//     protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
//     protocol.cumulativeUniqueUsers = 0;
//     protocol.totalPoolCount = 0;

//     // TODO: not needed at this time
//     protocol._poolIDs = [];
//     // protocol._defaultTradingFeeRate = BIGDECIMAL_ZERO;
//     // protocol._networkFeeRate = BIGDECIMAL_ZERO;
//     // protocol._withdrawalFeeRate = BIGDECIMAL_ZERO;

//     protocol.save();
//   }
//   return protocol;
// }

// // -- Liquidity Pool

// function createLiquidityPool(
//   token0: Token,
//   token1: Token,
//   pairToken: Token,
//   blockTimestamp: BigInt,
//   blockNumber: BigInt
// ): LiquidityPool {
//   let protocol = getOrCreateProtocol();

//   // fees - deposit/withdraw LP tokens
//   let depositFee = new LiquidityPoolFee(
//     LiquidityPoolFeeType.DEPOSIT_FEE.concat("-").concat(pairToken.id)
//   );
//   depositFee.feePercentage = BIGDECIMAL_ZERO;
//   depositFee.feeType = LiquidityPoolFeeType.DEPOSIT_FEE;
//   depositFee.save();

//   let withdrawalFee = new LiquidityPoolFee(
//     LiquidityPoolFeeType.WITHDRAWAL_FEE.concat("-").concat(pairToken.id)
//   );
//   withdrawalFee.feePercentage = BIGDECIMAL_ZERO;
//   withdrawalFee.feeType = LiquidityPoolFeeType.WITHDRAWAL_FEE;
//   withdrawalFee.save();

//   // fees - trading
//   let tradingFee = new LiquidityPoolFee(
//     // LiquidityPoolFeeType.FIXED_TRADING_FEE.concat(token0.id)
//     //   .concat("-")
//     //   .concat(token1.id)
//     LiquidityPoolFeeType.FIXED_TRADING_FEE.concat("-").concat(pairToken.id)
//   );
//   tradingFee.feePercentage = BIGDECIMAL_ZERO;
//   // tradingFee.feePercentage = 0.2;
//   tradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
//   tradingFee.save();

//   let protocolFee = new LiquidityPoolFee(
//     // LiquidityPoolFeeType.FIXED_PROTOCOL_FEE.concat(token0.id)
//     //   .concat("-")
//     //   .concat(token1.id)
//     LiquidityPoolFeeType.FIXED_PROTOCOL_FEE.concat("-").concat(pairToken.id)
//   );
//   protocolFee.feePercentage = BIGDECIMAL_ZERO;
//   // protocolFee.feePercentage = 0.05;
//   protocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
//   protocolFee.save();

//   let lpFee = new LiquidityPoolFee(
//     // LiquidityPoolFeeType.FIXED_LP_FEE.concat(token0.id)
//     //   .concat("-")
//     //   .concat(token1.id)
//     LiquidityPoolFeeType.FIXED_LP_FEE.concat("-").concat(pairToken.id)
//   );
//   lpFee.feePercentage = BIGDECIMAL_ZERO;
//   lpFee.feeType = LiquidityPoolFeeType.DYNAMIC_LP_FEE;
//   lpFee.save();

//   let rewardToken = new RewardToken(
//     RewardTokenType.DEPOSIT.concat("-").concat(pairToken.id)
//   );
//   rewardToken.token = pairToken.id;
//   rewardToken.type = RewardTokenType.DEPOSIT;
//   rewardToken.save();

//   let liquidityPool = new LiquidityPool(token1.id);
//   liquidityPool.protocol = protocol.id;
//   liquidityPool.name = token1.name;
//   liquidityPool.symbol = token1.symbol;
//   liquidityPool.inputTokens = [token0.id, token1.id];
//   liquidityPool.outputToken = pairToken.id;
//   liquidityPool.rewardTokens = [rewardToken.id];

//   liquidityPool.fees = [
//     withdrawalFee.id,
//     tradingFee.id,
//     protocolFee.id,
//     lpFee.id,
//   ];
//   liquidityPool.isSingleSided = true;
//   liquidityPool.createdTimestamp = blockTimestamp;
//   liquidityPool.createdBlockNumber = blockNumber;
//   liquidityPool.totalValueLockedUSD = BIGDECIMAL_ZERO;
//   liquidityPool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
//   liquidityPool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
//   liquidityPool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
//   liquidityPool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
//   liquidityPool.inputTokenBalances = [BIGINT_ZERO];
//   liquidityPool.inputTokenWeights = [new BigDecimal(BigInt.fromI32(1))];
//   liquidityPool.outputTokenSupply = BIGINT_ZERO;
//   liquidityPool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
//   liquidityPool.stakedOutputTokenAmount = BIGINT_ZERO;
//   liquidityPool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
//   liquidityPool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

//   //   TODO: not used yet
//   //   liquidityPool._tradingFeeRate = protocol._defaultTradingFeeRate;
//   //   liquidityPool._cumulativeTradingFeeAmountUSD = BIGDECIMAL_ZERO;
//   //   liquidityPool._cumulativeWithdrawalFeeAmountUSD = BIGDECIMAL_ZERO;
//   //   liquidityPool._latestRewardProgramID = BIGINT_ZERO;

//   liquidityPool.save();

//   //   updateLiquidityPoolFees(pairToken.id);

//   return liquidityPool;
// }
