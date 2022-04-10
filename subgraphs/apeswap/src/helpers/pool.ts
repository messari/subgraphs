import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Factory/ERC20";
import { _HelperStore, LiquidityPool, Token } from "../../generated/schema";
import {
  getOrCreateProtocol,
  getOrCreateProtocolFeeShare,
  getOrCreateSupplyFeeShare,
  getOrCreateTradingFees,
  getOrCreateTransfer,
} from "../utils/common";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, toBigInt, toDecimal, TransferType } from "../utils/constant";
import { findNativeTokenPricePerToken } from "../utils/pricing";
import { getOrCreateRewardToken, getOrCreateToken } from "../utils/token";

export function getOrCreatePool(
  event: ethereum.Event,
  poolAddress: Address,
  token0: Token,
  token1: Token,
): LiquidityPool {
  let id = poolAddress.toHexString();
  let protocol = getOrCreateProtocol();
  // Check if pool already exist
  let pool = LiquidityPool.load(id);
  if (pool == null) {
    pool = new LiquidityPool(id);
    pool.protocol = protocol.id;

    // Internal fields
    pool._token0 = token0.id;
    pool._reserve0 = BIGDECIMAL_ZERO;
    pool._token1 = token1.id;
    pool._reserve1 = BIGDECIMAL_ZERO;
    pool._nativeTokenReserve = BIGDECIMAL_ZERO;
    pool._token0Price = BIGDECIMAL_ZERO;
    pool._token1Price = BIGDECIMAL_ZERO;
    pool._volumeToken0 = BIGDECIMAL_ZERO;
    pool._volumeToken1 = BIGDECIMAL_ZERO;
    pool._trackedNativeTokenReserve = BIGDECIMAL_ZERO;
    // Input tokens
    let inputTokens: Token[] = [];
    inputTokens.push(token0);
    inputTokens.push(token1);
    pool.inputTokens = inputTokens.map<string>(token => token.id);

    // Output Tokens
    let outputToken = getOrCreateToken(poolAddress);
    pool.outputToken = outputToken.id;
    pool.rewardTokens = [];
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.totalVolumeUSD = BIGDECIMAL_ZERO;
    let inputTokenbalances: BigInt[] = [];
    for (let i = 0; i < inputTokens.length; i++) {
      inputTokenbalances.push(BIGINT_ZERO);
    }
    pool.inputTokenBalances = inputTokenbalances.map<BigInt>(tokenBalance => tokenBalance);
    let poolContract = ERC20.bind(event.address);
    let getTotalSupply = poolContract.try_totalSupply();
    if (!getTotalSupply.reverted) {
    }
    pool.outputTokenSupply = BIGINT_ZERO;
    // OutputToken Price
    let helperStore = _HelperStore.load("1")!;
    let outputTokenPriceBNB = findNativeTokenPricePerToken(outputToken);
    pool.outputTokenPriceUSD = outputTokenPriceBNB.times(helperStore._value);
    pool.rewardTokenEmissionsAmount = [];
    pool.rewardTokenEmissionsUSD = [];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
    pool.name = outputToken.name;
    pool.symbol = outputToken.symbol;
    let tradingFee = getOrCreateTradingFees(poolAddress).id;
    let protocolFee = getOrCreateProtocolFeeShare(poolAddress).id;
    let supplySideFee = getOrCreateSupplyFeeShare(poolAddress).id;
    pool.fees = [tradingFee, protocolFee, supplySideFee];

    pool.save();
    return pool as LiquidityPool;
  }

  return pool as LiquidityPool;
}

export function updatePool(pool: LiquidityPool): void {
  let inputTokenBalances: BigInt[] = [];
  inputTokenBalances.push(toBigInt(pool._reserve0));
  inputTokenBalances.push(toBigInt(pool._reserve1));
  pool.inputTokenBalances = inputTokenBalances.map<BigInt>(tb => tb);
  pool.save();
}

export function updateLpWithReward(lpTokenAddress: Address, bananaAddress: Address, bananaRewardPerDay: BigInt): void {
  let pool = LiquidityPool.load(lpTokenAddress.toHexString());
  if (pool !== null) {
    let helperStore = _HelperStore.load("1")!;
    let bananaToken = getOrCreateToken(bananaAddress);
    pool.rewardTokens = [getOrCreateRewardToken(bananaAddress).id];
    pool.rewardTokenEmissionsAmount = [bananaRewardPerDay];
    let rewardTokenEmissionsBNB = findNativeTokenPricePerToken(bananaToken).times(toDecimal(bananaRewardPerDay));
    pool.rewardTokenEmissionsUSD = [rewardTokenEmissionsBNB.times(helperStore._value)];

    pool.save();
  }
}

// Handle data from transfer event for mints. Used to populate deposit entity in the mint event.
export function handleTransferMint(event: ethereum.Event, value: BigInt, to: Address): void {
  let pool = LiquidityPool.load(event.address.toHexString());
  if (pool !== null) {
    let transfer = getOrCreateTransfer(event);

    // create new mint if no mints so far or if last one is done already
    if (!transfer._type) {
      transfer._type = TransferType.MINT;

      // Address that is minted to
      transfer._sender = to.toHexString();
      transfer._liquidity = value;
    }

    // This is done to remove a potential feeto mint --- Not active
    else if (transfer._type == TransferType.MINT) {
      // Updates the liquidity if the previous mint was a fee mint
      // Address that is minted to
      transfer._sender = to.toHexString();
      transfer._liquidity = value;
    }

    transfer.save();
    pool.save();
  }
}

// Handle data from transfer event for burns. Used to populate deposit entity in the burn event.
export function handleTransferToPoolBurn(event: ethereum.Event, value: BigInt, from: Address): void {
  let transfer = getOrCreateTransfer(event);

  transfer._type = TransferType.BURN;
  transfer._sender = from.toHexString();

  transfer.save();
}

// Handle data from transfer event for burns. Used to populate deposit entity in the burn event.
export function handleTransferBurn(event: ethereum.Event, value: BigInt, from: Address): void {
  let pool = LiquidityPool.load(event.address.toHexString());
  if (pool !== null) {
    let transfer = getOrCreateTransfer(event);

    // Tracks supply of minted LP tokens
    pool.outputTokenSupply = pool.outputTokenSupply.minus(value);

    // Uses address from the transfer to pool part of the burn. Otherwise create with this transfer event.
    if (transfer._type == TransferType.BURN) {
      transfer._liquidity = value;
    } else {
      transfer._type = TransferType.BURN;
      transfer._sender = from.toHexString();
      transfer._liquidity = value;
    }

    transfer.save();
    pool.save();
  }
}
