import { 
    Address
} from "@graphprotocol/graph-ts";

// Null address
export const ADDRESS_ZERO = Address.fromString("0x0000000000000000000000000000000000000000")

// Default address used for token
export const TOKEN_ADDRESS_GEIST = Address.fromString("0xd8321AA83Fb0a4ECd6348D4577431310A6E0814d");
export const TOKEN_DECIMALS_GEIST: i32 = 18; 
export const TOKEN_NAME_GEIST: string = "Geist.Finance Protocol Token"; 
export const TOKEN_SYMBOL_GEIST: string = "GEIST"; 

// Default address used for reward token
export const REWARD_TOKEN_ADDRESS = Address.fromString("0xd8321AA83Fb0a4ECd6348D4577431310A6E0814d");
export const REWARD_TOKEN_DECIMALS: i32 = 18; 
export const REWARD_TOKEN_NAME: string = "Geist.Finance Protocol Token"; 
export const REWARD_TOKEN_SYMBOL: string = "GEIST";

// Token contract can be used to get addresses of all reward tokens
export const REWARD_TOKEN_CONTRACT = Address.fromString("0x49c93a95dbcc9A6A4D8f77E59c038ce5020e82f8");

// Additional reward token addresses (not used but kept anyway)
export const TOKEN_ADDRESS_gDAI = Address.fromString("0x07E6332dD090D287d3489245038daF987955DCFB");
export const TOKEN_ADDRESS_gETH = Address.fromString("0x25c130B2624CF12A4Ea30143eF50c5D68cEFA22f");
export const TOKEN_ADDRESS_gFTM = Address.fromString("0x39B3bd37208CBaDE74D0fcBDBb12D606295b430a");
export const TOKEN_ADDRESS_gWBTC = Address.fromString("0x38aCa5484B8603373Acc6961Ecd57a6a594510A3");
export const TOKEN_ADDRESS_gfUSDT = Address.fromString("0x940F41F0ec9ba1A34CF001cc03347ac092F5F6B5");
export const TOKEN_ADDRESS_gUSDC = Address.fromString("0xe578C856933D8e1082740bf7661e379Aa2A30b26");
export const TOKEN_ADDRESS_gCRV = Address.fromString("0x690754A168B022331cAA2467207c61919b3F8A98");
export const TOKEN_ADDRESS_gMIM = Address.fromString("0xc664Fc7b8487a3E10824Cda768c1d239F2403bBe");
export const TOKEN_ADDRESS_gLINK = Address.fromString("0xBeCF29265B0cc8D33fA24446599955C7bcF7F73B");

// Token contracts used to query oracle as proxies for reward tokens
// This is done as the Oracle does not accept reward token address
export const TOKEN_ADDRESS_DAI = Address.fromString("0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E");
export const TOKEN_ADDRESS_ETH = Address.fromString("0x74b23882a30290451A17c44f4F05243b6b58C76d");
export const TOKEN_ADDRESS_WFTM = Address.fromString("0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83");
export const TOKEN_ADDRESS_BTC = Address.fromString("0x321162Cd933E2Be498Cd2267a90534A804051b11");
export const TOKEN_ADDRESS_fUSDT = Address.fromString("0x049d68029688eAbF473097a2fC38ef61633A3C7A");
export const TOKEN_ADDRESS_USDC = Address.fromString("0x04068DA6C83AFCFA0e13ba15A6696662335D5B75");
export const TOKEN_ADDRESS_CRV = Address.fromString("0x1E4F97b9f9F913c46F1632781732927B9019C68b");
export const TOKEN_ADDRESS_MIM = Address.fromString("0x82f0B8B456c1A451378467398982d4834b6829c1");
export const TOKEN_ADDRESS_LINK = Address.fromString("0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8");

// Aave price oracle
export const PRICE_ORACLE = Address.fromString("0xC466e3FeE82C6bdc2E17f2eaF2c6F1E91AD10FD3");

// GEIST-FTM LP on SpookySwap
export const GEIST_FTM_LP_ADDRESS = Address.fromString("0x668AE94D0870230AC007a01B471D02b2c94DDcB9");
