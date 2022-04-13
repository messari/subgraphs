import { dataSource } from '@graphprotocol/graph-ts';
import { SchemaNetwork, SubgraphNetwork } from "../src/common/utils/constants"

let DEPLOYED_NETWORK_TEMP: string           // Name of network deployed to
let FACTORY_ADDRESS_TEMP: string            // Address of the factory contract
let NATIVE_TOKEN_TEMP: string               // Address of the native token contract
let NATIVE_TOKEN_ORACLE_POOL_TEMP: string   // Address of the native token oracle pool contract
let WHITELIST_TOKENS_TEMP: string[]         // List of addresses of whitelisted tokens
let STABLE_COINS_TEMP: string[]             // List of addresses of stable coins

if (dataSource.network() == SubgraphNetwork.ETHEREUM) {
    DEPLOYED_NETWORK_TEMP = SchemaNetwork.ETHEREUM 
    FACTORY_ADDRESS_TEMP  = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

    NATIVE_TOKEN_TEMP = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    NATIVE_TOKEN_ORACLE_POOL_TEMP = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8' // wETH/USDC

    // token where amounts should contribute to tracked volume and liquidity
    // usually tokens that many tokens are paired with s
    WHITELIST_TOKENS_TEMP = [
    NATIVE_TOKEN_TEMP, // WETH
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
    '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
    '0x86fadb80d8d2cff3c3680819e4da99c10232ba0f', // EBASE
    '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
    '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
    '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
    '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
    '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', // SNX
    '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', // YFI
    '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
    '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8', // yCurv
    '0x956f47f50a910163d8bf957cf5846d573e7f87ca', // FEI
    '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC
    '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
    '0xfe2e637202056d30016725477c5da089ab0a043a' // sETH2
    ]

    STABLE_COINS_TEMP = [
    '0x6b175474e89094c44da98b954eedeac495271d0f',
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
    '0x0000000000085d4780b73119b644ae5ecd22b376',
    '0x956f47f50a910163d8bf957cf5846d573e7f87ca',
    '0x4dd28568d05f09b02220b09c2cb307bfd837cb95'
    ]
}
else if (dataSource.network() == SubgraphNetwork.POLYGON) {
    DEPLOYED_NETWORK_TEMP = SchemaNetwork.POLYGON
    FACTORY_ADDRESS_TEMP  = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

    NATIVE_TOKEN_TEMP = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
    NATIVE_TOKEN_ORACLE_POOL_TEMP = '0x45dDa9cb7c25131DF268515131f647d726f50608' // wETH/USDC

    // token where amounts should contribute to tracked volume and liquidity
    // usually tokens that many tokens are paired with s
    WHITELIST_TOKENS_TEMP = [
    NATIVE_TOKEN_TEMP, // WETH
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
    '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1', // miMATIC
    '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
    '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', // LINK
    '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // MATIC
    ]

    STABLE_COINS_TEMP = [
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
    '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1'  // miMATIC
    ]
}

else if (dataSource.network() == SubgraphNetwork.OPTIMISM) {
    DEPLOYED_NETWORK_TEMP = SchemaNetwork.OPTIMISM
    FACTORY_ADDRESS_TEMP  = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

    NATIVE_TOKEN_TEMP = '0x4200000000000000000000000000000000000006'
    NATIVE_TOKEN_ORACLE_POOL_TEMP = '0x03aF20bDAaFfB4cC0A521796a223f7D85e2aAc31' // wETH/DAI

    // token where amounts should contribute to tracked volume and liquidity
    // usually tokens that many tokens are paired with s
    WHITELIST_TOKENS_TEMP = [
    NATIVE_TOKEN_TEMP, // WETH
    "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC
    "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // TUSD
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
    "0x68f180fcCe6836688e9084f035309E29Bf0A2095", // wBTC
    "0x9e1028F5F1D5eDE59748FFceE5532509976840E0", // PERP
    "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // LYRA
    "0x61BAADcF22d2565B0F471b291C475db5555e0b76", // AELIN

    ]

    STABLE_COINS_TEMP = [
        "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC
        "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // TUSD
        "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" // DAI
    ]
}

else {
    DEPLOYED_NETWORK_TEMP = SubgraphNetwork.ARBITRUM
    FACTORY_ADDRESS_TEMP  = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

    NATIVE_TOKEN_TEMP = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
    NATIVE_TOKEN_ORACLE_POOL_TEMP = '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443' // wETH/USDC
    // token where amounts should contribute to tracked volume and liquidity
    // usually tokens that many tokens are paired with s
    WHITELIST_TOKENS_TEMP = [
    NATIVE_TOKEN_TEMP, // WETH
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
    '0xD74f5255D557944cf7Dd0E45FF521520002D5748', // USDs
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // WBTC
    "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", // GMX
    ]

    STABLE_COINS_TEMP = [
        '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC
        '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
        '0xD74f5255D557944cf7Dd0E45FF521520002D5748', // USDs
    ]
}
export namespace NetworkParameters {
    export const NETWORK = DEPLOYED_NETWORK_TEMP 
    export const FACTORY_ADDRESS = FACTORY_ADDRESS_TEMP
    export const NATIVE_TOKEN = NATIVE_TOKEN_TEMP
    export const NATIVE_TOKEN_ORACLE_POOL = NATIVE_TOKEN_ORACLE_POOL_TEMP
    export let WHITELIST_TOKENS = WHITELIST_TOKENS_TEMP
    export let STABLE_COINS = STABLE_COINS_TEMP
}
