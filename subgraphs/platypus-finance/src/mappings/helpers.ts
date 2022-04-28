import { log } from "@graphprotocol/graph-ts";
import { BigInt, BigDecimal, Address, store, ethereum } from "@graphprotocol/graph-ts";
import { Asset, Deposit, DexAmmProtocol, LiquidityPool, Token, Withdraw } from "../../generated/schema";
import { TransactionType } from "../common/constants";
import {
  getOrCreateDexAmm,
  getOrCreateLiquidityPool,
  getOrCreateToken,
  getOrFetchTokenUsdPrice,
} from "../common/getters";
import { updateProtocolTVL } from "../common/metrics";

// export let assetContract = AssetContract.bind(Address.fromString(POOL_PROXY));

// Create a liquidity pool from PairCreated contract call
export function createLiquidityPool(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  poolAddress: Address,
  token0: Token,
  token1: Token,
  LPtoken: Token,
): void {
  // let pool = new LiquidityPool(poolAddress.toHexString());
  // pool.protocol = protocol.id;
  // pool.inputTokens = [token0.id, token1.id];
  // pool.outputToken = LPtoken.id;
  // ...
  // pool.save();
  // // create the tracked contract based on the template
  // PairTemplate.create(poolAddress);
}

export function createAsset(
  event: ethereum.Event,
  poolAddress: Address,
  tokenAddress: Address,
  assetAddress: Address,
): void {
  let asset = new Asset(assetAddress.toHexString());
  asset.token = tokenAddress.toHexString();
  asset.pool = poolAddress.toHexString();
  asset.maxSupply = BigInt.zero();
  asset.blockNumber = event.block.number;
  asset.timestamp = event.block.timestamp;
  asset.save();

  const token = getOrCreateToken(tokenAddress);
  token._asset = assetAddress.toHexString();
  token.save();

  const pool = getOrCreateLiquidityPool(poolAddress);

  let assets: string[] = pool._assets;
  let inputTokens: string[] = pool.inputTokens;
  let inputTokenBalances: BigInt[] = pool.inputTokenBalances;

  assets.push(assetAddress.toHexString());
  inputTokens.push(token.id);
  inputTokenBalances.push(BigInt.zero());

  pool._assets = assets;
  pool.inputTokens = inputTokens;
  pool.inputTokenBalances = inputTokenBalances;

  pool.save();
}

// Generate the deposit entity and update deposit account for the according pool.
export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  inputTokenAddress: Address,
  liquidity: BigInt,
  to: Address,
  sender: Address,
): void {
  let deposit = new Deposit(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  let protocol = getOrCreateDexAmm();
  let pool = getOrCreateLiquidityPool(event.address);
  let inputToken = getOrCreateToken(inputTokenAddress);

  // fetch price in USD

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.to = to.toHexString();
  deposit.pool = pool.id;
  deposit.from = sender.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [inputToken.id];
  deposit.inputTokenAmounts = [amount];
  deposit.outputToken = inputToken._asset;
  deposit.outputTokenAmount = liquidity;

  deposit.amountUSD = getOrFetchTokenUsdPrice(event, inputTokenAddress);

  deposit.save();
  updateBalancesInPool(event, deposit, TransactionType.DEPOSIT);
  updateProtocolTVL(event);
}

// Generate the withdraw entity
export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  inputTokenAddress: Address,
  liquidity: BigInt,
  to: Address,
  sender: Address,
): void {
  let withdraw = new Withdraw(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  let protocol = getOrCreateDexAmm();
  let pool = getOrCreateLiquidityPool(event.address);
  let inputToken = getOrCreateToken(inputTokenAddress);

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = protocol.id;
  withdraw.to = to.toHexString();
  withdraw.pool = pool.id;
  withdraw.from = sender.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.inputTokens = [inputToken.id];
  withdraw.inputTokenAmounts = [amount];
  withdraw.outputToken = inputToken._asset;
  withdraw.outputTokenAmount = liquidity;

  withdraw.amountUSD = getOrFetchTokenUsdPrice(event, inputTokenAddress);

  withdraw.save();
  updateBalancesInPool(event, withdraw, TransactionType.WITHDRAW);
  updateProtocolTVL(event);
}

// Handle swaps data and update entities volumes and fees
export function createSwapHandleVolumeAndFees(
  event: ethereum.Event,
  to: Address,
  sender: Address,
  amount0In: BigInt,
  amount1In: BigInt,
  amount0Out: BigInt,
  amount1Out: BigInt,
): void {
  // let swap = new SwapEvent(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  // // update swap event
  // swap.hash = event.transaction.hash.toHexString();
  // swap.logIndex = event.logIndex.toI32();
  // swap.protocol = FACTORY_ADDRESS;
  // ..
  // swap.save();
  // updateVolumeAndFees(event, trackedAmountUSD, feeUSD);
}

export function updateBalancesInPool(
  event: ethereum.Event,
  transaction: Deposit | Withdraw,
  transactionType: TransactionType,
) {
  let pool = getOrCreateLiquidityPool(Address.fromHexString(transaction.pool));

  for (let i = 0; i < pool.inputTokens.length; i++) {
    for (let j = 0; j < transaction.inputTokens.length; j++) {
      if (pool.inputTokens[i] === transaction.inputTokens[j]) {
        if (transactionType === TransactionType.DEPOSIT) {
          pool.inputTokenBalances[i] = pool.inputTokenBalances[i].plus(transaction.inputTokenAmounts[j]);
        } else if (transactionType === TransactionType.WITHDRAW) {
          pool.inputTokenBalances[i] = pool.inputTokenBalances[i].minus(transaction.inputTokenAmounts[j]);
        }
      }
    }
  }

  pool.save();
}
