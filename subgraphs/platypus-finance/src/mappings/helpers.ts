import { log } from "@graphprotocol/graph-ts";
import { BigInt, BigDecimal, Address, store, ethereum } from "@graphprotocol/graph-ts";
import { Asset, Deposit, DexAmmProtocol, LiquidityPool, Token, Withdraw } from "../../generated/schema";
import { SushiSwapRouterAvax as SushiSwapRouterContract } from "../../generated/Pool/SushiSwapRouterAvax";
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
  asset.save();

  const token = getOrCreateToken(tokenAddress);
  token._asset = assetAddress.toHexString();
  token.save();

  const pool = getOrCreateLiquidityPool(poolAddress);

  let assets: string[] = [];
  if (pool._assets) {
    assets = pool._assets!;
  }
  assets.push(assetAddress.toHexString());
  pool._assets = assets;

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
  let amountInUSD: BigDecimal = getPriceFromSushiSwapRouter(inputTokenAddress, amount);
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.to = pool.id;
  deposit.pool = pool.id;
  deposit.from = sender.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [inputToken.id];
  deposit.inputTokenAmounts = [amount];
  deposit.outputToken = inputToken._asset;
  // deposit.outputToken have to be deteminded based in the inputToken
  deposit.amountUSD = amountInUSD;
  deposit.save();

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

  // fetch price in USD
  let amountInUSD: BigDecimal = getPriceFromSushiSwapRouter(inputTokenAddress, amount);
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = protocol.id;
  withdraw.to = pool.id;
  withdraw.pool = pool.id;
  withdraw.from = sender.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.inputTokens = [inputToken.id];
  withdraw.inputTokenAmounts = [amount];
  withdraw.outputToken = inputToken._asset;
  // withdraw.outputToken have to be deteminded based in the inputToken
  withdraw.amountUSD = amountInUSD;
  withdraw.save();

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

export function getPriceFromSushiSwapRouter(tokenAddress: Address, amount: BigInt): BigDecimal {
  log.warning("getPriceFromSushiSwapRouter {}", [tokenAddress.toHexString()]);

  const routerAddressesV2: Address = Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506");
  const WAVAX_ADDRESS: Address = Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7");
  const USDC_ADDRESS: Address = Address.fromString("0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e");

  const path: Address[] = [tokenAddress, WAVAX_ADDRESS, USDC_ADDRESS];
  const amountIn = BigInt.fromString("1000000");

  const path_string: string = path.map<string>(x => x.toHexString()).join("-");
  log.warning("sushiswap amountIn:{} path:{}", [amountIn.toString(), path_string]);

  const sushiSwapRouterV2 = SushiSwapRouterContract.bind(routerAddressesV2);
  let amountOutArray = sushiSwapRouterV2.try_getAmountsOut(amountIn, path);

  if (amountOutArray.reverted) {
    log.warning("getPriceFromSushiSwapRouter isReverted: {}", [amountOutArray.reverted.toString()]);
    return BigDecimal.zero();
  }

  let amountOut = amountOutArray.value[amountOutArray.value.length - 1];
  let feeBips = BigInt.fromI32(30); // .3% per swap fees

  let amountOutBigDecimal = amountOut
    .times(amount)
    .times(BigInt.fromI32(10000))
    .div(BigInt.fromI32(10000).minus(feeBips.times(BigInt.fromI32(2))))
    .toBigDecimal();

  return amountOutBigDecimal;
}
