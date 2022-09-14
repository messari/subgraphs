import { BigInt, ethereum, Address } from '@graphprotocol/graph-ts/index'
import { Deposit, LiquidityPool, Withdraw } from '../../generated/schema';
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from '../common/constants';
import { createEventID, getOrCreateDexAmm, getOrCreateToken } from '../common/getters';
import { absValBigInt, bigIntToBigDecimal } from '../common/utils/numbers';
import { getLpTokenPriceUSD, getTokenPrice } from './snapshots';


export function handleDepositEvent(pool: LiquidityPool, tokenSupply: BigInt, tokenAmounts: BigInt[], provider: Address, event: ethereum.Event): void {
    let liquidityEvent = new Deposit(createEventID("deposit", event))
    liquidityEvent.hash = event.transaction.hash.toHexString();
    liquidityEvent.logIndex = event.transactionLogIndex.toI32();
    liquidityEvent.protocol = getOrCreateDexAmm().id;
    liquidityEvent.to = pool.id;
    liquidityEvent.from = provider.toHexString();
    liquidityEvent.blockNumber = event.block.number;
    liquidityEvent.timestamp = event.block.timestamp;
    liquidityEvent.pool = pool.id;
    liquidityEvent.outputToken = pool.outputToken;
    liquidityEvent.outputTokenAmount = absValBigInt(tokenSupply.minus(pool.outputTokenSupply!))
    let inputTokens = liquidityEvent.inputTokens;
    let inputTokenAmounts = liquidityEvent.inputTokenAmounts;
    let inputTokenBalances = pool.inputTokenBalances;
    let amountUSD = BIGDECIMAL_ZERO;
    for (let i = 0; i < tokenAmounts.length; i++) {
      let inputTokenAddress = Address.fromString(pool.coins[i]);
      let inputToken = getOrCreateToken(inputTokenAddress)
      let inputTokenIndex = pool.inputTokens.indexOf(inputToken.id);
      let inputTokenAmount = tokenAmounts[i];
      let inputTokenPrice = getTokenPrice(inputTokenAddress, pool, event.block.timestamp);
      inputTokenBalances[inputTokenIndex] = inputTokenBalances[inputTokenIndex].plus(inputTokenAmount);
      inputTokens.push(inputToken.id);
      inputTokenAmounts.push(inputTokenAmount);
      amountUSD = amountUSD.plus(bigIntToBigDecimal(inputTokenAmount,inputToken.decimals).times(inputTokenPrice));
    }
    liquidityEvent.inputTokens = inputTokens;
    liquidityEvent.inputTokenAmounts = inputTokenAmounts;
    liquidityEvent.amountUSD = amountUSD;
  
    //pool.inputTokenBalances = inputTokenBalances;
    pool.outputTokenSupply = tokenSupply;
    
    liquidityEvent.save();
    pool.save();
  }


  export function handleWithdrawEvent(pool: LiquidityPool, tokenSupply: BigInt, tokenAmounts: BigInt[], provider: Address, event: ethereum.Event): void {
    let liquidityEvent = new Withdraw(createEventID("withdraw", event));
    liquidityEvent.hash = event.transaction.hash.toHexString();
    liquidityEvent.logIndex = event.transactionLogIndex.toI32();
    liquidityEvent.protocol = getOrCreateDexAmm().id;
    liquidityEvent.to = pool.id;
    liquidityEvent.from = provider.toHexString();
    liquidityEvent.blockNumber = event.block.number;
    liquidityEvent.timestamp = event.block.timestamp;
    liquidityEvent.pool = pool.id;
    liquidityEvent.outputToken = pool.outputToken;
    liquidityEvent.outputTokenAmount = absValBigInt(tokenSupply.minus(pool.outputTokenSupply!))
    let inputTokens = liquidityEvent.inputTokens;
    let inputTokenAmounts = liquidityEvent.inputTokenAmounts;
    let inputTokenBalances = pool.inputTokenBalances;
    let amountUSD = BIGDECIMAL_ZERO;
    for (let i = 0; i < tokenAmounts.length; i++) {
      let inputTokenAddress = Address.fromString(pool.coins[i]);
      let inputToken = getOrCreateToken(inputTokenAddress)
      let inputTokenIndex = pool.inputTokens.indexOf(inputToken.id);
      let inputTokenAmount = tokenAmounts[i];
      let inputTokenPrice = getTokenPrice(inputTokenAddress, pool, event.block.timestamp);
      inputTokenBalances[inputTokenIndex] = inputTokenBalances[inputTokenIndex].plus(inputTokenAmount);
      inputTokens.push(inputToken.id);
      inputTokenAmounts.push(inputTokenAmount);
      amountUSD = amountUSD.plus(bigIntToBigDecimal(inputTokenAmount,inputToken.decimals).times(inputTokenPrice));
    }
    liquidityEvent.inputTokens = inputTokens;
    liquidityEvent.inputTokenAmounts = inputTokenAmounts;
    liquidityEvent.amountUSD = amountUSD;
  
    //pool.inputTokenBalances = inputTokenBalances;
    pool.outputTokenSupply = tokenSupply;
    
    liquidityEvent.save();
    pool.save();
  }

export function handleLiquidityEvent(eventType: string, pool: LiquidityPool, tokenSupply: BigInt, tokenAmounts: BigInt[], provider: Address, event: ethereum.Event): void {
    if (eventType == "deposit"){
        handleDepositEvent(pool, tokenSupply, tokenAmounts, provider, event);
    } else if (eventType == "withdraw"){
        handleWithdrawEvent(pool, tokenSupply, tokenAmounts, provider, event);
    }
}

export function handleLiquidityRemoveOne(pool: LiquidityPool, tokenAmount: BigInt, provider: Address, event: ethereum.Event): void {
    const withdrawEvent = new Deposit(createEventID("withdraw", event));
    withdrawEvent.hash = event.transaction.hash.toHexString();
    withdrawEvent.logIndex = event.transactionLogIndex.toI32();
    withdrawEvent.protocol = getOrCreateDexAmm().id;
    withdrawEvent.to = pool.id;
    withdrawEvent.from = provider.toHexString();
    withdrawEvent.blockNumber = event.block.number;
    withdrawEvent.timestamp = event.block.timestamp;
    withdrawEvent.pool = pool.id;
    withdrawEvent.outputToken = pool.outputToken;
    withdrawEvent.outputTokenAmount = tokenAmount;
    let inputTokens = withdrawEvent.inputTokens;
    inputTokens = pool.coins;
    withdrawEvent.inputTokens = inputTokens;
    let inputTokenAmounts = withdrawEvent.inputTokenAmounts;
    for(let i = 0; i < pool.coins.length; i++) {
        inputTokenAmounts.push(BIGINT_ZERO); // it is impossible to get which coin is withdrawn from this event, so we just set all to 0
    }
    let price = getLpTokenPriceUSD(pool, event.block.timestamp);
    withdrawEvent.amountUSD = bigIntToBigDecimal(tokenAmount,getOrCreateToken(Address.fromString(pool.outputToken)).decimals).times(price);
    withdrawEvent.inputTokenAmounts = inputTokenAmounts;
    pool.outputTokenSupply = pool.outputTokenSupply!.minus(tokenAmount);
    
    withdrawEvent.save();
    pool.save();
}