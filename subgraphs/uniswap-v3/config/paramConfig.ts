import { dataSource, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Network } from "../src/common/constants";
import { toLowerCase } from "../src/common/utils/utils";

export namespace Protocol {
  export const UNISWAPV3 = "Uniswap V3";
}

// Choose which protocol you are indexing.
// The deployed network will already be determined.
let PROTOCOL_NAME_TEMP = Protocol.UNISWAPV3;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let PROTOCOL_SLUG_TEMP: string;

let DEPLOYED_NETWORK_TEMP: string; // Name of network deployed to
let FACTORY_ADDRESS_TEMP: string; // Address of the factory contract

let NATIVE_TOKEN_TEMP: string; // Address of the native token contract
let REWARD_TOKENS_TEMP: string[]; // Address of reward token
let WHITELIST_TOKENS_TEMP: string[]; // List of addresses of whitelisted tokens
let STABLE_COINS_TEMP: string[]; // List of addresses of stable coins
let STABLE_ORACLE_POOLS_TEMP: string[]; // List of addresses of stable coin oracle pools
let UNTRACKED_PAIRS_TEMP: string[]; // List of addresses of untracked pairs
let UNTRACKED_TOKENS_TEMP: string[]; // List of addresses of untracked tokens

let MIN_NATIVE_LOCKED_TEMP: BigDecimal; // Minimum amount of native token to be tracked

if (dataSource.network() == Network.MAINNET.toLowerCase()) {
  PROTOCOL_SLUG_TEMP = "uniswap-v3";

  DEPLOYED_NETWORK_TEMP = Network.MAINNET;
  FACTORY_ADDRESS_TEMP = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  NATIVE_TOKEN_TEMP = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  MIN_NATIVE_LOCKED_TEMP = BigDecimal.fromString("60");

  // token where amounts should contribute to tracked volume and liquidity
  // usually tokens that many tokens are paired with s
  WHITELIST_TOKENS_TEMP = [
    NATIVE_TOKEN_TEMP, // WETH
    "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
    "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
    "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
    "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643", // cDAI
    "0x39aa39c021dfbae8fac545936693ac917d5e7563", // cUSDC
    "0x86fadb80d8d2cff3c3680819e4da99c10232ba0f", // EBASE
    "0x57ab1ec28d129707052df4df418d58a2d46d5f51", // sUSD
    "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", // MKR
    "0xc00e94cb662c3520282e6f5717214004a7f26888", // COMP
    "0x514910771af9ca656af840dff83e8264ecf986ca", // LINK
    "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", // SNX
    "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e", // YFI
    "0x111111111117dc0aa78b770fa6a738034120c302", // 1INCH
    "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8", // yCurv
    "0x956f47f50a910163d8bf957cf5846d573e7f87ca", // FEI
    "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0", // MATIC
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", // AAVE
    "0xfe2e637202056d30016725477c5da089ab0a043a", // sETH2
  ];

  STABLE_COINS_TEMP = [
    "0x6b175474e89094c44da98b954eedeac495271d0f",
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "0xdac17f958d2ee523a2206206994597c13d831ec7",
    "0x0000000000085d4780b73119b644ae5ecd22b376",
    "0x956f47f50a910163d8bf957cf5846d573e7f87ca",
    "0x4dd28568d05f09b02220b09c2cb307bfd837cb95",
  ];

  STABLE_ORACLE_POOLS_TEMP = [
    "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8", // USDC/wETH
  ];
  UNTRACKED_TOKENS_TEMP = [
    "0xc7283b66eb1eb5fb86327f08e1b5816b0720212b", // TRIBE - Price issues
    "0x6b4c7a5e3f0b99fcd83e9c089bddd6c7fce5c611", // Million
    "0x1a4b46696b2bb4794eb3d4c26f1c55f9170fa4c5",
    "0x18aaa7115705e8be94bffebde57af9bfc265b998", // Audius
    "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", // Synthetix
    "0x9e46a38f5daabe8683e10793b06749eef7d733d1", // Nectar
    "0xbc396689893d065f41bc2c6ecbee5e0085233447", // Perpetual
    "0x1c5db575e2ff833e46a2e9864c22f4b22e0b37c2", // renZEC
    "0x48fb253446873234f2febbf9bdeaa72d9d387f94", // Bancor Governance
    "0xd5cd84d6f044abe314ee7e414d37cae8773ef9d3", // Harmony One
    "0xb05097849bca421a3f51b249ba6cca4af4b97cb9", // Float Protocol
    "0x8686525d6627a25c68de82c228448f43c97999f2", // Lilly Finance
    "0x4f9254c83eb525f9fcf346490bbb3ed28a81c667", // Celer Token
    "0x1559fa1b8f28238fd5d76d9f434ad86fd20d1559", // Eden
    "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3", // Magic Internet Money
    "0x2af1df3ab0ab157e1e2ad8f88a7d04fbea0c7dc6", // Bankless Bed Index
    "0x15b7c0c907e4c6b9adaaaabc300c08991d6cea05", // Gelato Network Token
    "0x4d224452801aced8b2f0aebe155379bb5d594381", // Apecoin
    "0xc581b735a1688071a1746c968e0798d642ede491", // EuroTether
    "0x04f2694c8fcee23e8fd0dfea1d4f5bb8c352111f", // Staked Olympus
    "0x398aea1c9ceb7de800284bb399a15e0efe5a9ec2", // Escrowed Illuvium
  ];
} else if (dataSource.network() == Network.MATIC.toLowerCase()) {
  PROTOCOL_SLUG_TEMP = "uniswap-v3";

  DEPLOYED_NETWORK_TEMP = Network.MATIC;
  FACTORY_ADDRESS_TEMP = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  NATIVE_TOKEN_TEMP = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // wETH - Used eth because there is more liquidity
  MIN_NATIVE_LOCKED_TEMP = BigDecimal.fromString("5");

  // token where amounts should contribute to tracked volume and liquidity
  // usually tokens that many tokens are paired with s
  WHITELIST_TOKENS_TEMP = [
    NATIVE_TOKEN_TEMP, // WETH
    "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1", // miMATIC
    "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC
    "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", // LINK
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // MATIC
  ];

  STABLE_COINS_TEMP = [
    "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1", // miMATIC
  ];

  STABLE_ORACLE_POOLS_TEMP = [
    "0x45dda9cb7c25131df268515131f647d726f50608", // USDC/wETH - 0.05
    "0x0e44ceb592acfc5d3f09d996302eb4c499ff8c10", // USDC/wETH - 0.30
  ];
} else if (dataSource.network() == Network.OPTIMISM.toLowerCase()) {
  PROTOCOL_SLUG_TEMP = "uniswap-v3";

  DEPLOYED_NETWORK_TEMP = Network.OPTIMISM;
  FACTORY_ADDRESS_TEMP = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  NATIVE_TOKEN_TEMP = "0x4200000000000000000000000000000000000006"; // wETH
  MIN_NATIVE_LOCKED_TEMP = BigDecimal.fromString("5");

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
  ];

  STABLE_COINS_TEMP = [
    "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC
    "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // TUSD
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
  ];

  STABLE_ORACLE_POOLS_TEMP = [
    "0x03aF20bDAaFfB4cC0A521796a223f7D85e2aAc31", // wETH/DAI
    "0xB589969D38CE76D3d7AA319De7133bC9755fD840", // wETH/USDC - 0.30
    "0x85149247691df622eaF1a8Bd0CaFd40BC45154a9", // wETH/USDC - 0.05
  ];
  UNTRACKED_TOKENS_TEMP = [
    "0x296f55f8fb28e498b858d0bcda06d955b2cb3f97", // StargateToken
    "0x2e3d870790dc77a83dd1d18184acc7439a53f475", // Frax
  ];
} else {
  PROTOCOL_SLUG_TEMP = "uniswap-v3";

  DEPLOYED_NETWORK_TEMP = Network.ARBITRUM_ONE;
  FACTORY_ADDRESS_TEMP = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  NATIVE_TOKEN_TEMP = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"; //wETH
  MIN_NATIVE_LOCKED_TEMP = BigDecimal.fromString("5");

  // token where amounts should contribute to tracked volume and liquidity
  // usually tokens that many tokens are paired with s
  WHITELIST_TOKENS_TEMP = [
    NATIVE_TOKEN_TEMP, // WETH
    "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
    "0xD74f5255D557944cf7Dd0E45FF521520002D5748", // USDs
    "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // WBTC
    "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", // GMX
  ];

  STABLE_COINS_TEMP = [
    "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
    "0xD74f5255D557944cf7Dd0E45FF521520002D5748", // USDs
  ];

  STABLE_ORACLE_POOLS_TEMP = [
    "0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443", // wETH/USDC - 0.05
    "0x17c14D2c404D167802b16C450d3c99F88F2c4F4d", // wETH/USDC - 0.30
    "0xc858A329Bf053BE78D6239C4A4343B8FbD21472b", // wETH/USDT
  ];
  UNTRACKED_TOKENS_TEMP = [
    "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a", // Magic Internet Money
  ];
}

export namespace NetworkConfigs {
  export const PROTOCOL_NAME = PROTOCOL_NAME_TEMP;
  export const PROTOCOL_SLUG = PROTOCOL_SLUG_TEMP;
  export const NETWORK = DEPLOYED_NETWORK_TEMP;
  export const FACTORY_ADDRESS = FACTORY_ADDRESS_TEMP;
  export const NATIVE_TOKEN = NATIVE_TOKEN_TEMP;
  export const REWARD_TOKENS = REWARD_TOKENS_TEMP;
  export let WHITELIST_TOKENS = toLowerCase(WHITELIST_TOKENS_TEMP);
  export let STABLE_COINS = toLowerCase(STABLE_COINS_TEMP);
  export let STABLE_ORACLE_POOLS = toLowerCase(STABLE_ORACLE_POOLS_TEMP);
  export let UNTRACKED_PAIRS = toLowerCase(UNTRACKED_PAIRS_TEMP);
  export let UNTRACKED_TOKENS = toLowerCase(UNTRACKED_TOKENS_TEMP);
  export const MIN_NATIVE_LOCKED = MIN_NATIVE_LOCKED_TEMP;
}
