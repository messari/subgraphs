import { test, assert, log } from 'matchstick-as'
import {Address, BigDecimal, BigInt, Bytes, ethereum} from "@graphprotocol/graph-ts";
import {createNewPoolBalanceChangeEvent, createNewPoolEvent, createNewSwapEvent, mockMethod} from "./helpers";
import {handlePoolBalanceChanged, handlePoolRegister, handleSwap} from "../src/mappings/handlers";
import { LiquidityPool, LiquidityPoolFee, Token } from "../generated/schema";
import { BIGINT_ZERO, LiquidityPoolFeeType } from "../src/common/constants";

/**
 * Test inspired from pool https://app.balancer.fi/#/pool/0x36128d5436d2d70cab39c9af9cce146c38554ff0000200000000000000000009
 */
const poolId = Bytes.fromHexString('0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019')
const poolAddress = Address.fromString("0x8e9aa87e45e92bad84d5f8dd1bff34fb92637de9")

mockMethod(poolAddress, 'decimals', [], [], 'uint8', [ethereum.Value.fromI32(18)], false)
mockMethod(poolAddress, 'name', [], [], 'string', [ethereum.Value.fromString('name')], false)
mockMethod(poolAddress, 'symbol', [], [], 'string', [ethereum.Value.fromString('symbol')], false)
mockMethod(poolAddress, 'getSwapFeePercentage', [], [], 'uint256', [ethereum.Value.fromI32(18)], false)
mockMethod(poolAddress, 'getNormalizedWeights', [], [], 'uint256[]', [], true)

const gno = new Token('0x6810e776880C02933D47DB1b9fc05908e5386b96')

mockMethod(Address.fromString(gno.id), 'decimals', [], [], 'uint8', [ethereum.Value.fromI32(18)], false)
mockMethod(Address.fromString(gno.id), 'name', [], [], 'string', [ethereum.Value.fromString('name')], false)
mockMethod(Address.fromString(gno.id), 'symbol', [], [], 'string', [ethereum.Value.fromString('symbol')], false)

const bal = new Token('0xba100000625a3754423978a60c9317c58a424e3D')

mockMethod(Address.fromString(bal.id), 'decimals', [], [], 'uint8', [ethereum.Value.fromI32(18)], false)
mockMethod(Address.fromString(bal.id), 'name', [], [], 'string', [ethereum.Value.fromString('name')], false)
mockMethod(Address.fromString(bal.id), 'symbol', [], [], 'string', [ethereum.Value.fromString('symbol')], false)


gno.save()
bal.save()

test('Create and register pool', () => {
    let registerPoolEvent = createNewPoolEvent(
        poolId,
        poolAddress,
        2
    )

    handlePoolRegister(registerPoolEvent)
    assert.fieldEquals(
        "LiquidityPool",
        poolId.toHexString(),
        "outputToken",
        poolAddress.toHexString()
    )
})

test('Handle swap and updates base asset usd price value', () => {
    let pool: LiquidityPool | null  = new LiquidityPool(poolId.toHexString())
    const fee = new LiquidityPoolFee(poolId.toHexString())

    fee.feePercentage = BigDecimal.fromString('0.003')
    fee.feeType = LiquidityPoolFeeType.DYNAMIC_FEE
    fee.save()

    if (pool == null) throw new Error('Pool is not defined')

    pool.fees = [fee.id]
    pool.inputTokens = [gno.id, bal.id]
    pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO]
    pool.outputToken = poolAddress.toHexString()

    pool.save()


    const newAmounts = [BigInt.fromI64(500000000000000000), BigInt.fromI64(9135000000000000000)]
    const deposit = createNewPoolBalanceChangeEvent(
        poolId,
        Address.fromString("0xf71d161fdc3895f21612d79f15aa819b7a3d296a"),
        [Address.fromString(gno.id), Address.fromString(bal.id)],
        newAmounts,
        [new BigInt(0), new BigInt(0)]
    )

    handlePoolBalanceChanged(deposit)

    pool = LiquidityPool.load(poolId.toHexString())
    if (pool == null) throw new Error('Pool is not defined')
    assert.equals(
        ethereum.Value.fromSignedBigIntArray(pool.inputTokenBalances),
        ethereum.Value.fromSignedBigIntArray(newAmounts),
    )

    const swap = createNewSwapEvent(
        poolId,
        Address.fromString(bal.id),
        Address.fromString(gno.id),
        BigInt.fromI64(47520557162941119),
        BigInt.fromI64(12873420099327150),
    )

    handleSwap(swap)

    pool = LiquidityPool.load(poolId.toHexString())

    if (pool == null) throw new Error('Pool is not defined')
    assert.equals(
        ethereum.Value.fromSignedBigIntArray(pool.inputTokenBalances),
        ethereum.Value.fromSignedBigIntArray([BigInt.fromI64(9182520557162941000), BigInt.fromI64(487126579900672830)]),
    )

})