import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Transfer,
  Approval,
  TokenExchange,
  TokenExchangeUnderlying,
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityOne,
  RemoveLiquidityImbalance,
  RampA,
  StopRampA,
  ApplyNewFee,
  SetNewMATime
} from "../generated/implementation_v_700/implementation_v_700"

export function createTransferEvent(
  sender: Address,
  receiver: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createTokenExchangeEvent(
  buyer: Address,
  sold_id: BigInt,
  tokens_sold: BigInt,
  bought_id: BigInt,
  tokens_bought: BigInt
): TokenExchange {
  let tokenExchangeEvent = changetype<TokenExchange>(newMockEvent())

  tokenExchangeEvent.parameters = new Array()

  tokenExchangeEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  tokenExchangeEvent.parameters.push(
    new ethereum.EventParam("sold_id", ethereum.Value.fromSignedBigInt(sold_id))
  )
  tokenExchangeEvent.parameters.push(
    new ethereum.EventParam(
      "tokens_sold",
      ethereum.Value.fromUnsignedBigInt(tokens_sold)
    )
  )
  tokenExchangeEvent.parameters.push(
    new ethereum.EventParam(
      "bought_id",
      ethereum.Value.fromSignedBigInt(bought_id)
    )
  )
  tokenExchangeEvent.parameters.push(
    new ethereum.EventParam(
      "tokens_bought",
      ethereum.Value.fromUnsignedBigInt(tokens_bought)
    )
  )

  return tokenExchangeEvent
}

export function createTokenExchangeUnderlyingEvent(
  buyer: Address,
  sold_id: BigInt,
  tokens_sold: BigInt,
  bought_id: BigInt,
  tokens_bought: BigInt
): TokenExchangeUnderlying {
  let tokenExchangeUnderlyingEvent = changetype<TokenExchangeUnderlying>(
    newMockEvent()
  )

  tokenExchangeUnderlyingEvent.parameters = new Array()

  tokenExchangeUnderlyingEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  tokenExchangeUnderlyingEvent.parameters.push(
    new ethereum.EventParam("sold_id", ethereum.Value.fromSignedBigInt(sold_id))
  )
  tokenExchangeUnderlyingEvent.parameters.push(
    new ethereum.EventParam(
      "tokens_sold",
      ethereum.Value.fromUnsignedBigInt(tokens_sold)
    )
  )
  tokenExchangeUnderlyingEvent.parameters.push(
    new ethereum.EventParam(
      "bought_id",
      ethereum.Value.fromSignedBigInt(bought_id)
    )
  )
  tokenExchangeUnderlyingEvent.parameters.push(
    new ethereum.EventParam(
      "tokens_bought",
      ethereum.Value.fromUnsignedBigInt(tokens_bought)
    )
  )

  return tokenExchangeUnderlyingEvent
}

export function createAddLiquidityEvent(
  provider: Address,
  token_amounts: Array<BigInt>,
  fees: Array<BigInt>,
  invariant: BigInt,
  token_supply: BigInt
): AddLiquidity {
  let addLiquidityEvent = changetype<AddLiquidity>(newMockEvent())

  addLiquidityEvent.parameters = new Array()

  addLiquidityEvent.parameters.push(
    new ethereum.EventParam("provider", ethereum.Value.fromAddress(provider))
  )
  addLiquidityEvent.parameters.push(
    new ethereum.EventParam(
      "token_amounts",
      ethereum.Value.fromUnsignedBigIntArray(token_amounts)
    )
  )
  addLiquidityEvent.parameters.push(
    new ethereum.EventParam(
      "fees",
      ethereum.Value.fromUnsignedBigIntArray(fees)
    )
  )
  addLiquidityEvent.parameters.push(
    new ethereum.EventParam(
      "invariant",
      ethereum.Value.fromUnsignedBigInt(invariant)
    )
  )
  addLiquidityEvent.parameters.push(
    new ethereum.EventParam(
      "token_supply",
      ethereum.Value.fromUnsignedBigInt(token_supply)
    )
  )

  return addLiquidityEvent
}

export function createRemoveLiquidityEvent(
  provider: Address,
  token_amounts: Array<BigInt>,
  fees: Array<BigInt>,
  token_supply: BigInt
): RemoveLiquidity {
  let removeLiquidityEvent = changetype<RemoveLiquidity>(newMockEvent())

  removeLiquidityEvent.parameters = new Array()

  removeLiquidityEvent.parameters.push(
    new ethereum.EventParam("provider", ethereum.Value.fromAddress(provider))
  )
  removeLiquidityEvent.parameters.push(
    new ethereum.EventParam(
      "token_amounts",
      ethereum.Value.fromUnsignedBigIntArray(token_amounts)
    )
  )
  removeLiquidityEvent.parameters.push(
    new ethereum.EventParam(
      "fees",
      ethereum.Value.fromUnsignedBigIntArray(fees)
    )
  )
  removeLiquidityEvent.parameters.push(
    new ethereum.EventParam(
      "token_supply",
      ethereum.Value.fromUnsignedBigInt(token_supply)
    )
  )

  return removeLiquidityEvent
}

export function createRemoveLiquidityOneEvent(
  provider: Address,
  token_id: BigInt,
  token_amount: BigInt,
  coin_amount: BigInt,
  token_supply: BigInt
): RemoveLiquidityOne {
  let removeLiquidityOneEvent = changetype<RemoveLiquidityOne>(newMockEvent())

  removeLiquidityOneEvent.parameters = new Array()

  removeLiquidityOneEvent.parameters.push(
    new ethereum.EventParam("provider", ethereum.Value.fromAddress(provider))
  )
  removeLiquidityOneEvent.parameters.push(
    new ethereum.EventParam(
      "token_id",
      ethereum.Value.fromSignedBigInt(token_id)
    )
  )
  removeLiquidityOneEvent.parameters.push(
    new ethereum.EventParam(
      "token_amount",
      ethereum.Value.fromUnsignedBigInt(token_amount)
    )
  )
  removeLiquidityOneEvent.parameters.push(
    new ethereum.EventParam(
      "coin_amount",
      ethereum.Value.fromUnsignedBigInt(coin_amount)
    )
  )
  removeLiquidityOneEvent.parameters.push(
    new ethereum.EventParam(
      "token_supply",
      ethereum.Value.fromUnsignedBigInt(token_supply)
    )
  )

  return removeLiquidityOneEvent
}

export function createRemoveLiquidityImbalanceEvent(
  provider: Address,
  token_amounts: Array<BigInt>,
  fees: Array<BigInt>,
  invariant: BigInt,
  token_supply: BigInt
): RemoveLiquidityImbalance {
  let removeLiquidityImbalanceEvent = changetype<RemoveLiquidityImbalance>(
    newMockEvent()
  )

  removeLiquidityImbalanceEvent.parameters = new Array()

  removeLiquidityImbalanceEvent.parameters.push(
    new ethereum.EventParam("provider", ethereum.Value.fromAddress(provider))
  )
  removeLiquidityImbalanceEvent.parameters.push(
    new ethereum.EventParam(
      "token_amounts",
      ethereum.Value.fromUnsignedBigIntArray(token_amounts)
    )
  )
  removeLiquidityImbalanceEvent.parameters.push(
    new ethereum.EventParam(
      "fees",
      ethereum.Value.fromUnsignedBigIntArray(fees)
    )
  )
  removeLiquidityImbalanceEvent.parameters.push(
    new ethereum.EventParam(
      "invariant",
      ethereum.Value.fromUnsignedBigInt(invariant)
    )
  )
  removeLiquidityImbalanceEvent.parameters.push(
    new ethereum.EventParam(
      "token_supply",
      ethereum.Value.fromUnsignedBigInt(token_supply)
    )
  )

  return removeLiquidityImbalanceEvent
}

export function createRampAEvent(
  old_A: BigInt,
  new_A: BigInt,
  initial_time: BigInt,
  future_time: BigInt
): RampA {
  let rampAEvent = changetype<RampA>(newMockEvent())

  rampAEvent.parameters = new Array()

  rampAEvent.parameters.push(
    new ethereum.EventParam("old_A", ethereum.Value.fromUnsignedBigInt(old_A))
  )
  rampAEvent.parameters.push(
    new ethereum.EventParam("new_A", ethereum.Value.fromUnsignedBigInt(new_A))
  )
  rampAEvent.parameters.push(
    new ethereum.EventParam(
      "initial_time",
      ethereum.Value.fromUnsignedBigInt(initial_time)
    )
  )
  rampAEvent.parameters.push(
    new ethereum.EventParam(
      "future_time",
      ethereum.Value.fromUnsignedBigInt(future_time)
    )
  )

  return rampAEvent
}

export function createStopRampAEvent(A: BigInt, t: BigInt): StopRampA {
  let stopRampAEvent = changetype<StopRampA>(newMockEvent())

  stopRampAEvent.parameters = new Array()

  stopRampAEvent.parameters.push(
    new ethereum.EventParam("A", ethereum.Value.fromUnsignedBigInt(A))
  )
  stopRampAEvent.parameters.push(
    new ethereum.EventParam("t", ethereum.Value.fromUnsignedBigInt(t))
  )

  return stopRampAEvent
}

export function createApplyNewFeeEvent(
  fee: BigInt,
  offpeg_fee_multiplier: BigInt
): ApplyNewFee {
  let applyNewFeeEvent = changetype<ApplyNewFee>(newMockEvent())

  applyNewFeeEvent.parameters = new Array()

  applyNewFeeEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )
  applyNewFeeEvent.parameters.push(
    new ethereum.EventParam(
      "offpeg_fee_multiplier",
      ethereum.Value.fromUnsignedBigInt(offpeg_fee_multiplier)
    )
  )

  return applyNewFeeEvent
}

export function createSetNewMATimeEvent(
  ma_exp_time: BigInt,
  D_ma_time: BigInt
): SetNewMATime {
  let setNewMaTimeEvent = changetype<SetNewMATime>(newMockEvent())

  setNewMaTimeEvent.parameters = new Array()

  setNewMaTimeEvent.parameters.push(
    new ethereum.EventParam(
      "ma_exp_time",
      ethereum.Value.fromUnsignedBigInt(ma_exp_time)
    )
  )
  setNewMaTimeEvent.parameters.push(
    new ethereum.EventParam(
      "D_ma_time",
      ethereum.Value.fromUnsignedBigInt(D_ma_time)
    )
  )

  return setNewMaTimeEvent
}
