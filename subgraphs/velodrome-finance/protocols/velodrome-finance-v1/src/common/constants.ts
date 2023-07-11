import { TypedMap } from "@graphprotocol/graph-ts";

/* FACTORY_ADDRESS is used as the protocol.id;
ignoring lint rule here so grafting on older deployment does not create multiple protocol entities */

/* eslint-disable-next-line rulesdir/no-checksum-addresses */
export const FACTORY_ADDRESS = "0x25CbdDb98b35ab1FF77413456B31EC81A6B6B746";
export const PROTOCOL_NAME = "Velodrome Finance V1";
export const PROTOCOL_SLUG = "velodrome-finance-v1";
export const VELO_ADDRESS = "0x3c8b650257cfb5f272f799f5e2b4e65093a11a05";

const OPTIMISM_POOLS = new TypedMap<string, string>();
OPTIMISM_POOLS.set("USDC_sUSD", "0xd16232ad60188b68076a235c65d692090caba155");
OPTIMISM_POOLS.set("USDC_DAI", "0x4f7ebc19844259386dbddb7b2eb759eefc6f8353");
OPTIMISM_POOLS.set("OP_USDC", "0x47029bc8f5cbe3b464004e87ef9c9419a48018cd");
OPTIMISM_POOLS.set("WETH_USDC", "0x79c912fef520be002c2b6e57ec4324e260f38e50");

export const HARDCODED_POOLS = new TypedMap<string, TypedMap<string, string>>();
HARDCODED_POOLS.set("optimism", OPTIMISM_POOLS);
