// store common addresses

import { Address } from "@graphprotocol/graph-ts"

// null address
export const NULL_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000")

// "factory" address (Comptroller.sol)
export const COMPTROLLER_ADDRESS = Address.fromString("0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b")

// PriceOracle Addresses
export const PRICE_ORACLE1_ADDRESS = Address.fromString("0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904")

// cToken addresses
export const CAAVE_ADDRESS  =   Address.fromString("0xe65cdb6479bac1e22340e4e755fae7e509ecd06c")
export const CBAT_ADDRESS   =   Address.fromString("0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e")
export const CCOMP_ADDRESS  =   Address.fromString("0xc00e94cb662c3520282e6f5717214004a7f26888")
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

// cparallel cToken list - MUST be parallel with MARKETS
export const CTOKEN_LIST = [
    CAAVE_ADDRESS,
    CBAT_ADDRESS,
    CCOMP_ADDRESS,
    CDAI_ADDRESS,
    CETH_ADDRESS,
    CFEI_ADDRESS,
    CLINK_ADDRESS,
    CMKR_ADDRESS,
    CREP_ADDRESS,
    CSAI_ADDRESS,
    CSUSHI_ADDRESS,
    CTUSD_ADDRESS,
    CUNI_ADDRESS,
    CUSDC_ADDRESS,
    CUSDP_ADDRESS,
    CUSDT_ADDRESS,
    CWBTC_ADDRESS,
    CWBTC2_ADDRESS,
    CYFI_ADDRESS,
    CZRX_ADDRESS
]

// market mappings
export class MarketMapping {
    name: string
    symbol: string
    underlyingAddress: Address
    underlyingName: string
    underlyingSymbol: string
    underlyingDecimals: number
    timestamp: number
    block: number

    constructor(
        name: string,
        symbol: string,
        underlyingAddress: Address,
        underlyingName: string,
        underlyingSymbol: string,
        underlyingDecimals: number,
        timestamp: number,
        block: number
    ) {
        this.name = name
        this.symbol = symbol
        this.underlyingAddress = underlyingAddress
        this.underlyingName = underlyingName
        this.underlyingSymbol = underlyingSymbol
        this.underlyingDecimals = underlyingDecimals
        this.timestamp = timestamp
        this.block = block
    }
}

// create/populate MARKETS
export let MARKETS: MarketMapping[] = [
    new MarketMapping(
        "Compound Aave",
        "cAAVE",
        AAVE_ADDRESS,
        "Aave",
        "AAVE",
        18,
        1626578345,
        12848198
    ),
    new MarketMapping(
        "Compound Basic Attention Token",
        "cBAT",
        BAT_ADDRESS,
        "Basic Attention Token",
        "BAT",
        18,
        1557192085,
        7710735
    ),
    new MarketMapping(
        "Compound Collateral",
        "cCOMP",
        COMP_ADDRESS,
        "Compound",
        "COMP",
        18,
        1601419265,
        10960099
    ),
    new MarketMapping(
        "Compound Dai",
        "cDAI",
        DAI_ADDRESS,
        "Dai",
        "DAI",
        18,
        1574471013,
        8983575
    ),
    new MarketMapping(
        "Compound Ether",
        "cETH",
        ADDRESS_ZERO,
        "Ether",
        "ETH",
        18,
        1557192318,
        7710758
    ),
    new MarketMapping(
        "Compound Fei USD",
        "cFEI",
        FEI_ADDRESS,
        "Fei USD",
        "FEI",
        18,
        1631672795,
        13227624
    ),
    new MarketMapping(
        "Compound Chainlink",
        "cLINK",
        LINK_ADDRESS,
        "Chainlink",
        "LINK",
        18,
        1619041102,
        12286030
    ),
    new MarketMapping(
        "Compound Maker",
        "cMKR",
        MKR_ADDRESS,
        "Maker",
        "MKR",
        18,
        1626413417,
        12836064
    ),
    new MarketMapping(
        "Compound Augur",
        "cREP",
        REP_ADDRESS,
        "Augur",
        "REP",
        18,
        1557192288,
        7710755
    ),
    new MarketMapping(
        "Compound Dai",
        "cDAI",
        SAI_ADDRESS,
        "Single Collateral Dai",
        "SAI",
        18,
        1557192252,
        7710752 
    ),
    new MarketMapping(
        "Compound Sushi Token",
        "cSUSHI",
        SUSHI_ADDRESS,
        "Sushi Token",
        "SUSHI",
        18,
        1626577979,
        12848166
    ),
    new MarketMapping(
        "Compound TrueUSD",
        "cTUSD",
        TUSD_ADDRESS,
        "TrueUSD",
        "TUSD",
        18,
        1602071129,
        11008385
    ),
    new MarketMapping(
        "Compound Uniswap",
        "cUNI",
        UNI_ADDRESS,
        "Uniswap",
        "UNI",
        18,
        1600898747,
        10921410
    ),
    new MarketMapping(
        "Compound USD Coin",
        "cUSDC",
        USDC_ADDRESS,
        "",
        "",
        6,
        1557192331,
        7710760
    ),
    new MarketMapping(
        "Compound Pax Dollar",
        "cUSDP",
        USDP_ADDRESS,
        "Pax Dollar",
        "USDP",
        18,
        1632080577,
        13258119
    ),
    new MarketMapping(
        "Compound USDT",
        "cUSDT",
        USDT_ADDRESS,
        "Tether",
        "USDT",
        6,
        1586985186,
        9879363
    ),
    new MarketMapping( // Legacy version of WBTC
        "Compound Wrapped BTC",
        "cWBTC",
        WBTC_ADDRESS,
        "Wrapped BTC",
        "WBTC",
        8,
        1563306457,
        8163813
    ),
    new MarketMapping( // Newest WBTC market
        "Compound Wrapped BTC",
        "cWBTC",
        WBTC_ADDRESS,
        "Wrapped BTC",
        "WBTC",
        8,
        1615751087,
        12038653
    ),
    new MarketMapping(
        "Compound yearn.finance",
        "cYFI",
        YFI_ADDRESS,
        "yearn.finance",
        "YFI",
        18,
        1626578345,
        12848198
    ),
    new MarketMapping(
        "Compound 0x",
        "cZRX",
        ZRX_ADDRESS,
        "0x",
        "ZRX",
        18,
        1557192054,
        7710733
    ),

]
