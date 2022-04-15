// import {test, assert, log} from "matchstick-as";
// import { BigDecimal, Address } from "@graphprotocol/graph-ts"
// import {calculatePrice} from "../src/common/pricing";
// import {weth, usdc, bal, gno} from "./state";
// import {_TokenPrice} from "../generated/schema";
//
// const expectedWethPriceInUsd = '3045.15826324921630545044492607652'
// const expectedBalPriceInUsd = '15.14895512317371825584230215638522'
// const expectedGnoPriceInUsd = '348.0842849269167592882439357671437'
//
// test("Calculate price of token when swapping with stable", () => {
//     const wethAmount = BigDecimal.fromString("25.744921874224422104")
//     const usdcAmount = BigDecimal.fromString("78397.361582")
//
//     const tokenInfo = calculatePrice(
//         Address.fromString(usdc.id),
//         usdcAmount,
//         null,
//         Address.fromString(weth.id),
//         wethAmount,
//         null
//     )
//
//     if (tokenInfo == null) throw Error("Token information should not be null")
//
//     const tokenPrice = new _TokenPrice(tokenInfo.address.toHexString())
//     tokenPrice.lastUsdPrice = tokenInfo.price
//     tokenPrice.save()
//     assert.stringEquals(tokenInfo.price.toString(), expectedWethPriceInUsd)
// })
//
// test('Calculate price of token when swapping with a previously stored base asset', () => {
//     const wethAmount = BigDecimal.fromString("149.9395")
//     const balAmount = BigDecimal.fromString("30140")
//
//     const tokenInfo = calculatePrice(
//         Address.fromString(weth.id),
//         wethAmount,
//         null,
//         Address.fromString(bal.id),
//         balAmount,
//         null,
//     )
//
//     if (tokenInfo == null) throw Error("Token information should not be null")
//
//     const tokenPrice = new _TokenPrice(tokenInfo.address.toHexString())
//     tokenPrice.lastUsdPrice = tokenInfo.price
//     tokenPrice.save()
//     assert.stringEquals(tokenPrice.lastUsdPrice.toString(), expectedBalPriceInUsd)
// })
//
// test('Calculate price of token when swapping with a previously stored base asset in a weighted pool', () => {
//     const wethAmount = BigDecimal.fromString("2946.2746")
//     const gnoAmount = BigDecimal.fromString("103100")
//
//     const tokenInfo = calculatePrice(
//         Address.fromString(weth.id),
//         wethAmount,
//         BigDecimal.fromString('0.2'),
//         Address.fromString(gno.id),
//         gnoAmount,
//         BigDecimal.fromString('0.8'),
//     )
//
//     if (tokenInfo == null) throw Error("Token information should not be null")
//     assert.stringEquals(tokenInfo.price.toString(), expectedGnoPriceInUsd)
// })