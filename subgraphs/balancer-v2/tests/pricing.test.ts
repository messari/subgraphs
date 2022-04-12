import { test, assert } from 'matchstick-as'
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
    createNewPoolBalanceChangeEvent,
    createNewPoolEvent,
    createNewSwapEvent,
    createTokensRegisteredEvent
} from "./helpers";
import {handlePoolBalanceChanged, handlePoolRegister, handleSwap, handleTokensRegister} from "../src/mappings/handlers";
import { LiquidityPool } from "../generated/schema";
import { gnoBalPoolId, gnoBalPoolAddress, gno, bal } from "./state";

test('Create and register pool', () => {
    let registerPoolEvent = createNewPoolEvent(
        gnoBalPoolId,
        gnoBalPoolAddress,
        2
    )

    const pair = [Address.fromString(gno.id), Address.fromString(bal.id)]

    const tokensRegisterEvent = createTokensRegisteredEvent(
        gnoBalPoolId,
        pair,
        []
    )

    handlePoolRegister(registerPoolEvent)
    handleTokensRegister(tokensRegisterEvent)
    let pool = LiquidityPool.load(gnoBalPoolId.toHexString())
    if (pool == null) throw new Error('Pool is not defined')

    assert.equals(
        ethereum.Value.fromStringArray([gno.id.toLowerCase(), bal.id.toLowerCase()]),
        ethereum.Value.fromStringArray(pool.inputTokens),
    )
    assert.fieldEquals(
        "LiquidityPool",
        gnoBalPoolId.toHexString(),
        "outputToken",
        gnoBalPoolAddress.toHexString()
    )
})

test('Handle pool balance change because of deposit', () => {
    const newAmounts = [BigInt.fromI64(500000000000000000), BigInt.fromI64(9135000000000000000)]
    const deposit = createNewPoolBalanceChangeEvent(
        gnoBalPoolId,
        Address.fromString("0xf71d161fdc3895f21612d79f15aa819b7a3d296a"),
        [Address.fromString(gno.id), Address.fromString(bal.id)],
        newAmounts,
        [new BigInt(0), new BigInt(0)]
    )

    handlePoolBalanceChanged(deposit)

    let pool = LiquidityPool.load(gnoBalPoolId.toHexString())
    if (pool == null) throw new Error('Pool is not defined')
    assert.equals(
        ethereum.Value.fromSignedBigIntArray(pool.inputTokenBalances),
        ethereum.Value.fromSignedBigIntArray(newAmounts),
    )
})

test('Handle swap and updates base asset usd price value', () => {
    let amountIn = BigInt.fromI64(47520557162941119)
    let amountOut = BigInt.fromI64(12873420099327150)

    let pool = LiquidityPool.load(gnoBalPoolId.toHexString())
    if (pool == null) throw new Error('Pool is not defined')
    let newAmounts = [
        pool.inputTokenBalances[0].minus(amountOut),
        pool.inputTokenBalances[1].plus(amountIn),
    ]

    const swap = createNewSwapEvent(
        gnoBalPoolId,
        Address.fromString(bal.id),
        Address.fromString(gno.id),
        amountIn,
        amountOut,
    )
    handleSwap(swap)
    pool = LiquidityPool.load(gnoBalPoolId.toHexString())
    if (pool == null) throw new Error('Pool is not defined')
    assert.equals(
        ethereum.Value.fromSignedBigIntArray(pool.inputTokenBalances),
        ethereum.Value.fromSignedBigIntArray(newAmounts)
    )
})