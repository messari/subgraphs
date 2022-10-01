import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { DexAmmProtocol, LiquidityPool, LiquidityPoolFee, RewardToken, Token } from "../../generated/schema";
import  { PairCreated } from "../../generated/BiswapFactory/BiswapFactory";
import  { BiswapERC20 } from "../../generated/BiswapFactory/BiswapERC20";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, BISWAP_FACTORY_ADDR, LiquidityPoolFeeType, Network, ProtocolType, RewardTokenType } from "../common/constants";
import { getUsdPricePerToken } from "../prices";


enum EventType {
  Swap,
  Withdraw,
  Deposit,
}

export function handlePairCreated(event: PairCreated): void {
  let token0Address = event.params.token0;
  let token1Address = event.params.token1;
  let pairAddress = event.params.pair;

  let token0ID = token0Address.toHexString();
  let token0 = Token.load(token0ID);
  if (token0 != null) {
    log.warning("[handlePairCreated] pool token {} already exists", [
      token0ID,
    ]);
    return;
  }

  let token1ID = token1Address.toHexString();
  let token1 = Token.load(token1ID);
  if (token1 != null) {
    log.warning("[handlePairCreated] pool token {} already exists", [
      token1ID,
    ]);
    return;
  }

  // token0
  token0 = new Token(token0ID);
  let token0Contract = BiswapERC20.bind(token0Address);

  let token0NameResult = token0Contract.try_name();
  if (token0NameResult.reverted) {
    log.warning("[handlePairCreated] try_name on {} reverted", [
      token0ID,
    ]);
    token0.name = "unknown name";
  } else {
    token0.name = token0NameResult.value;
  }

  let token0SymbolResult = token0Contract.try_symbol();
  if (token0SymbolResult.reverted) {
    log.warning("[handlePairCreated] try_symbol on {} reverted", [
      token0ID,
    ]);
    token0.symbol = "unknown symbol";
  } else {
    token0.symbol = token0SymbolResult.value;
  }

  let token0DecimalsResult = token0Contract.try_decimals();
  if (token0DecimalsResult.reverted) {
    log.warning("[handlePairCreated] try_decimals on {} reverted", [
      token0ID,
    ]);
    token0.decimals = 0;
  } else {
    token0.decimals = token0DecimalsResult.value;
  }

  const token0Price = getUsdPricePerToken(token0Address);
  if (token0Price.reverted) {
    token0.lastPriceUSD = BIGDECIMAL_ZERO;
  } else {
    token0.lastPriceUSD = token0Price.usdPrice.div(token0Price.decimalsBaseTen);
  }
  token0.lastPriceBlockNumber = event.block.number;

  token0.save();

  // token1
  token1 = new Token(token1ID);
  let token1Contract = BiswapERC20.bind(token1Address);

  let token1NameResult = token1Contract.try_name();
  if (token1NameResult.reverted) {
    log.warning("[handleToken1Created] try_name on {} reverted", [
      token1ID,
    ]);
    token1.name = "unknown name";
  } else {
    token1.name = token1NameResult.value;
  }

  let token1SymbolResult = token1Contract.try_symbol();
  if (token1SymbolResult.reverted) {
    log.warning("[handleToken1Created] try_symbol on {} reverted", [
      token1ID,
    ]);
    token1.symbol = "unknown symbol";
  } else {
    token1.symbol = token1SymbolResult.value;
  }

  let token1DecimalsResult = token1Contract.try_decimals();
  if (token1DecimalsResult.reverted) {
    log.warning("[handleToken1Created] try_decimals on {} reverted", [
      token1ID,
    ]);
    token1.decimals = 0;
  } else {
    token1.decimals = token1DecimalsResult.value;
  }

  const token1Price = getUsdPricePerToken(token0Address);
  if (token1Price.reverted) {
    token0.lastPriceUSD = BIGDECIMAL_ZERO;
  } else {
    token0.lastPriceUSD = token1Price.usdPrice.div(token1Price.decimalsBaseTen);
  }
  token0.lastPriceBlockNumber = event.block.number;

  token1.save();

//   ---

  let liquidityPool = createLiquidityPool(
    token0,
    token1,
    event.block.timestamp,
    event.block.number
  );

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
}

// Protocol
function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(BISWAP_FACTORY_ADDR);
  if (!protocol) {
    // Protocol Metadata
    protocol = new DexAmmProtocol(BISWAP_FACTORY_ADDR);
    protocol.name = "Biswap";
    protocol.slug = "biswap";
    protocol.schemaVersion = "1.3.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.methodologyVersion = "1.0.0";
    protocol.network = Network.BSC;
    protocol.type = ProtocolType.EXCHANGE;

    // Quantitative Data 
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;

    // TODO: not needed at this time
    protocol._poolIDs = [];
    // protocol._defaultTradingFeeRate = BIGDECIMAL_ZERO;
    // protocol._networkFeeRate = BIGDECIMAL_ZERO;
    // protocol._withdrawalFeeRate = BIGDECIMAL_ZERO;

    protocol.save();
  }
  return protocol;
}

// Liquidity Pool
function createLiquidityPool(
  reserveToken: Token,
  poolToken: Token,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): LiquidityPool {
  let protocol = getOrCreateProtocol();

  // init fees
  let withdrawalFee = new LiquidityPoolFee(
    LiquidityPoolFeeType.WITHDRAWAL_FEE.concat("-").concat(poolToken.id)
  );
  withdrawalFee.feePercentage = BIGDECIMAL_ZERO;
  withdrawalFee.feeType = LiquidityPoolFeeType.WITHDRAWAL_FEE;
  withdrawalFee.save();

  let tradingFee = new LiquidityPoolFee(
    LiquidityPoolFeeType.DYNAMIC_TRADING_FEE.concat("-").concat(poolToken.id)
  );
  tradingFee.feePercentage = BIGDECIMAL_ZERO;
  tradingFee.feeType = LiquidityPoolFeeType.DYNAMIC_TRADING_FEE;
  tradingFee.save();

  let protocolFee = new LiquidityPoolFee(
    LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE.concat("-").concat(poolToken.id)
  );
  protocolFee.feePercentage = BIGDECIMAL_ZERO;
  protocolFee.feeType = LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE;
  protocolFee.save();

  let lpFee = new LiquidityPoolFee(
    LiquidityPoolFeeType.DYNAMIC_LP_FEE.concat("-").concat(poolToken.id)
  );
  lpFee.feePercentage = BIGDECIMAL_ZERO;
  lpFee.feeType = LiquidityPoolFeeType.DYNAMIC_LP_FEE;
  lpFee.save();

//   let rewardToken = new RewardToken(
//     RewardTokenType.DEPOSIT.concat("-").concat(BntAddr)
//   );
//   rewardToken.token = BnBntAddr;
//   rewardToken.type = RewardTokenType.DEPOSIT;
//   rewardToken.save();

  let liquidityPool = new LiquidityPool(poolToken.id);
  liquidityPool.protocol = protocol.id;
  liquidityPool.name = poolToken.name;
  liquidityPool.symbol = poolToken.symbol;
  liquidityPool.inputTokens = [reserveToken.id];
  liquidityPool.outputToken = poolToken.id;
//   liquidityPool.rewardTokens = [rewardToken.id];
  liquidityPool.rewardTokens = [];

  liquidityPool.fees = [
    withdrawalFee.id,
    tradingFee.id,
    protocolFee.id,
    lpFee.id,
  ];
  liquidityPool.isSingleSided = true;
  liquidityPool.createdTimestamp = blockTimestamp;
  liquidityPool.createdBlockNumber = blockNumber;
  liquidityPool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  liquidityPool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  liquidityPool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  liquidityPool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  liquidityPool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  liquidityPool.inputTokenBalances = [BIGINT_ZERO];
  liquidityPool.inputTokenWeights = [new BigDecimal(BigInt.fromI32(1))];
  liquidityPool.outputTokenSupply = BIGINT_ZERO;
  liquidityPool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  liquidityPool.stakedOutputTokenAmount = BIGINT_ZERO;
  liquidityPool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
  liquidityPool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

//   TODO: not used yet
//   liquidityPool._tradingFeeRate = protocol._defaultTradingFeeRate;
//   liquidityPool._cumulativeTradingFeeAmountUSD = BIGDECIMAL_ZERO;
//   liquidityPool._cumulativeWithdrawalFeeAmountUSD = BIGDECIMAL_ZERO;
//   liquidityPool._latestRewardProgramID = BIGINT_ZERO;

  liquidityPool.save();

//   updateLiquidityPoolFees(poolToken.id);

  return liquidityPool;
}