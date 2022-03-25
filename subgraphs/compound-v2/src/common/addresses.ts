// store common addresses

import { Address } from "@graphprotocol/graph-ts"

// market mapping interfaces
export interface MarketData {
    name: string,
    symbol: string,
    underlyingAddress: Address,
    underlyingName: string,
    underlyingSymbol: string,
    underlyingDecimals: number
    timestamp: number,
    block: number
}

interface MarketMapping {
    [market: string]: MarketData
}

// null address
export const ADDRESS_ZERO = Address.fromString("0x0000000000000000000000000000000000000000")

// "factory" address (Comptroller.sol)
export const COMPTROLLER_ADDRESS = Address.fromString("0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b")

// PriceOracle Addresses
export const PRICE_ORACLE1_ADDRESS = Address.fromString("0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904")

// cToken addresses
export const CAAVE_ADDRESS  =   Address.fromString("0xe65cdb6479bac1e22340e4e755fae7e509ecd06c")
export const CBAT_ADDRESS   =   Address.fromString("0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e")
export const CCOMP_ADDRESS  =   Address.fromString("0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4")
export const CDAI_ADDRESS   =   Address.fromString("0x5d3a536e4d6dbd6114cc1ead35777bab948e3643")
export const CETH_ADDRESS   =   Address.fromString("0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5")
export const CFEI_ADDRESS   =   Address.fromString("0x7713dd9ca933848f6819f38b8352d9a15ea73f67")
export const CLINK_ADDRESS  =   Address.fromString("0xface851a4921ce59e912d19329929ce6da6eb0c7")
export const CMKR_ADDRESS   =   Address.fromString("0x95b4ef2869ebd94beb4eee400a99824bf5dc325b")
export const CREP_ADDRESS   =   Address.fromString("0x158079ee67fce2f58472a96584a73c7ab9ac95c1")
export const CSAI_ADDRESS   =   Address.fromString("0xf5dce57282a584d2746faf1593d3121fcac444dc")
export const CSUSHI_ADDRESS =   Address.fromString("0x4b0181102a0112a2ef11abee5563bb4a3176c9d7")
export const CTUSD_ADDRESS  =   Address.fromString("0x12392f67bdf24fae0af363c24ac620a2f67dad86")
export const CUNI_ADDRESS   =   Address.fromString("0x35a18000230da775cac24873d00ff85bccded550")
export const CUSDC_ADDRESS  =   Address.fromString("0x39aa39c021dfbae8fac545936693ac917d5e7563")
export const CUSDP_ADDRESS  =   Address.fromString("0x041171993284df560249b57358f931d9eb7b925d")
export const CUSDT_ADDRESS  =   Address.fromString("0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9")
export const CWBTC_ADDRESS  =   Address.fromString("0xc11b1268c1a384e55c48c2391d8d480264a3a7f4")
export const CWBTC2_ADDRESS =   Address.fromString("0xccf4429db6322d5c611ee964527d42e5d685dd6a")
export const CYFI_ADDRESS   =   Address.fromString("0x80a2ae356fc9ef4305676f7a3e2ed04e12c33946")
export const CZRX_ADDRESS   =   Address.fromString("0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407")

// erc20 addresses
export const AAVE_ADDRESS  =   Address.fromString("0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9")
export const BAT_ADDRESS   =   Address.fromString("0x0D8775F648430679A709E98d2b0Cb6250d2887EF")
export const COMP_ADDRESS  =   Address.fromString("0xc00e94cb662c3520282e6f5717214004a7f26888")
export const DAI_ADDRESS   =   Address.fromString("0x6B175474E89094C44Da98b954EedeAC495271d0F")
export const FEI_ADDRESS   =   Address.fromString("0x956F47F50A910163D8BF957Cf5846D573E7f87CA")
export const LINK_ADDRESS  =   Address.fromString("0x514910771AF9Ca656af840dff83E8264EcF986CA")
export const MKR_ADDRESS   =   Address.fromString("0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2")
export const REP_ADDRESS   =   Address.fromString("0x1985365e9f78359a9B6AD760e32412f4a445E862")
export const SAI_ADDRESS   =   Address.fromString("0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359")
export const SUSHI_ADDRESS =   Address.fromString("0x6B3595068778DD592e39A122f4f5a5cF09C90fE2")
export const TUSD_ADDRESS  =   Address.fromString("0x0000000000085d4780B73119b644AE5ecd22b376")
export const UNI_ADDRESS   =   Address.fromString("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984")
export const USDC_ADDRESS  =   Address.fromString("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
export const USDP_ADDRESS  =   Address.fromString("0x8E870D67F660D95d5be530380D0eC0bd388289E1")
export const USDT_ADDRESS  =   Address.fromString("0xdAC17F958D2ee523a2206206994597C13D831ec7")
export const WBTC_ADDRESS  =   Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")
export const YFI_ADDRESS   =   Address.fromString("0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e")
export const ZRX_ADDRESS   =   Address.fromString("0xE41d2489571d322189246DaFA5ebDe1F4699F498")

// create/populate MARKETS
export const MARKETS:MarketMapping = {}
MARKETS[CAAVE_ADDRESS.toHexString()] = {
    name: "Compound Aave",
    symbol: "cAAVE",
    underlyingAddress: AAVE_ADDRESS,
    underlyingName: "Aave",
    underlyingSymbol: "AAVE",
    underlyingDecimals: 18,
    timestamp: 1626578345,
    block: 12848198
}
MARKETS[CBAT_ADDRESS.toHexString()] = {
    name: "Compound Basic Attention Token",
    symbol: "cBAT",
    underlyingAddress: BAT_ADDRESS,
    underlyingName: "Basic Attention Token",
    underlyingSymbol: "BAT",
    underlyingDecimals: 18,
    timestamp: 1557192085,
    block: 7710735
}
MARKETS[CCOMP_ADDRESS.toHexString()] = {
    name: "Compound Collateral",
    symbol: "cCOMP",
    underlyingAddress: COMP_ADDRESS,
    underlyingName: "Compound",
    underlyingSymbol: "COMP",
    underlyingDecimals: 18,
    timestamp: 1601419265,
    block: 10960099
}
MARKETS[CDAI_ADDRESS.toHexString()] = {
    name: "Compound Dai",
    symbol: "cDAI",
    underlyingAddress: DAI_ADDRESS,
    underlyingName: "Dai",
    underlyingSymbol: "DAI",
    underlyingDecimals: 18,
    timestamp: 1574471013,
    block: 8983575
}
MARKETS[CETH_ADDRESS.toHexString()] = {
    name: "Compound Ether",
    symbol: "cETH",
    underlyingAddress: ADDRESS_ZERO,
    underlyingName: "Ether",
    underlyingSymbol: "ETH",
    underlyingDecimals: 18,
    timestamp: 1557192318,
    block: 7710758
}
MARKETS[CFEI_ADDRESS.toHexString()] = {
    name: "Compound Fei USD",
    symbol: "cFEI",
    underlyingAddress: FEI_ADDRESS,
    underlyingName: "Fei USD",
    underlyingSymbol: "FEI",
    underlyingDecimals: 18,
    timestamp: 1631672795,
    block: 13227624
}
MARKETS[CLINK_ADDRESS.toHexString()] = {
    name: "Compound Chainlink",
    symbol: "cLINK",
    underlyingAddress: LINK_ADDRESS,
    underlyingName: "Chainlink",
    underlyingSymbol: "LINK",
    underlyingDecimals: 18,
    timestamp: 1619041102,
    block: 12286030
}
MARKETS[CMKR_ADDRESS.toHexString()] = {
    name: "Compound Maker",
    symbol: "cMKR",
    underlyingAddress: MKR_ADDRESS,
    underlyingName: "Maker",
    underlyingSymbol: "MKR",
    underlyingDecimals: 18,
    timestamp: 1626413417,
    block: 12836064
}
MARKETS[CREP_ADDRESS.toHexString()] = {
    name: "Compound Augur",
    symbol: "cREP",
    underlyingAddress: REP_ADDRESS,
    underlyingName: "Augur",
    underlyingSymbol: "REP",
    underlyingDecimals: 18,
    timestamp: 1557192288,
    block: 7710755
}
MARKETS[CSAI_ADDRESS.toHexString()] = {
    name: "Compound Dai",
    symbol: "cDAI",
    underlyingAddress: SAI_ADDRESS,
    underlyingName: "Single Collateral Dai",
    underlyingSymbol: "SAI",
    underlyingDecimals: 18,
    timestamp: 1557192252,
    block: 7710752 
}
MARKETS[CSUSHI_ADDRESS.toHexString()] = {
    name: "Compound Sushi Token",
    symbol: "cSUSHI",
    underlyingAddress: SUSHI_ADDRESS,
    underlyingName: "Sushi Token",
    underlyingSymbol: "SUSHI",
    underlyingDecimals: 18,
    timestamp: 1626577979,
    block: 12848166
}
MARKETS[CTUSD_ADDRESS.toHexString()] = {
    name: "Compound TrueUSD",
    symbol: "cTUSD",
    underlyingAddress: TUSD_ADDRESS,
    underlyingName: "TrueUSD",
    underlyingSymbol: "TUSD",
    underlyingDecimals: 18,
    timestamp: 1602071129,
    block: 11008385
}
MARKETS[CUNI_ADDRESS.toHexString()] = {
    name: "Compound Uniswap",
    symbol: "cUNI",
    underlyingAddress: UNI_ADDRESS,
    underlyingName: "Uniswap",
    underlyingSymbol: "UNI",
    underlyingDecimals: 18,
    timestamp: 1600898747,
    block: 10921410
}
MARKETS[CUSDC_ADDRESS.toHexString()] = {
    name: "Compound USD Coin",
    symbol: "cUSDC",
    underlyingAddress: USDC_ADDRESS,
    underlyingName: "",
    underlyingSymbol: "",
    underlyingDecimals: 6,
    timestamp: 1557192331,
    block: 7710760
}
MARKETS[CUSDP_ADDRESS.toHexString()] = {
    name: "Compound Pax Dollar",
    symbol: "cUSDP",
    underlyingAddress: USDP_ADDRESS,
    underlyingName: "Pax Dollar",
    underlyingSymbol: "USDP",
    underlyingDecimals: 18,
    timestamp: 1632080577,
    block: 13258119
}
MARKETS[CUSDT_ADDRESS.toHexString()] = {
    name: "Compound USDT",
    symbol: "cUSDT",
    underlyingAddress: USDT_ADDRESS,
    underlyingName: "Tether",
    underlyingSymbol: "USDT",
    underlyingDecimals: 6,
    timestamp: 1586985186,
    block: 9879363
}
MARKETS[CWBTC_ADDRESS.toHexString()] = { // Legacy version of WBTC
    name: "Compound Wrapped BTC",
    symbol: "cWBTC",
    underlyingAddress: WBTC_ADDRESS,
    underlyingName: "Wrapped BTC",
    underlyingSymbol: "WBTC",
    underlyingDecimals: 8,
    timestamp: 1563306457,
    block: 8163813
}
MARKETS[CWBTC2_ADDRESS.toHexString()] = { // Newest WBTC market
    name: "Compound Wrapped BTC",
    symbol: "cWBTC",
    underlyingAddress: WBTC_ADDRESS,
    underlyingName: "Wrapped BTC",
    underlyingSymbol: "WBTC",
    underlyingDecimals: 8,
    timestamp: 1615751087,
    block: 12038653
}
MARKETS[CYFI_ADDRESS.toHexString()] = {
    name: "Compound yearn.finance",
    symbol: "cYFI",
    underlyingAddress: YFI_ADDRESS,
    underlyingName: "yearn.finance",
    underlyingSymbol: "YFI",
    underlyingDecimals: 18,
    timestamp: 1626578345,
    block: 12848198
}
MARKETS[CZRX_ADDRESS.toHexString()] = {
    name: "Compound 0x",
    symbol: "cZRX",
    underlyingAddress: ZRX_ADDRESS,
    underlyingName: "0x",
    underlyingSymbol: "ZRX",
    underlyingDecimals: 18,
    timestamp: 1557192054,
    block: 7710733
}
