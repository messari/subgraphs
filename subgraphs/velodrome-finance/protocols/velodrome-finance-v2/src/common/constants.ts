import { TypedMap } from "@graphprotocol/graph-ts";

export const FACTORY_ADDRESS = "0xf1046053aa5682b4f9a81b5481394da16be5ff5a";
export const PROTOCOL_NAME = "Velodrome Finance V2";
export const PROTOCOL_SLUG = "velodrome-finance-v2";
export const VELO_ADDRESS = "0x9560e827af36c94d2ac33a39bce1fe78631088db";

const OPTIMISM_POOLS = new TypedMap<string, string>();
OPTIMISM_POOLS.set("USDC_sUSD", "0x6d5ba400640226e24b50214d2bbb3d4db8e6e15a");
OPTIMISM_POOLS.set("USDC_DAI", "0x19715771e30c93915a5bbda134d782b81a820076");
OPTIMISM_POOLS.set("OP_USDC", "0x0df083de449f75691fc5a36477a6f3284c269108");
OPTIMISM_POOLS.set("WETH_USDC", "0x0493bf8b6dbb159ce2db2e0e8403e753abd1235b");

export const HARDCODED_POOLS = new TypedMap<string, TypedMap<string, string>>();
HARDCODED_POOLS.set("optimism", OPTIMISM_POOLS);
