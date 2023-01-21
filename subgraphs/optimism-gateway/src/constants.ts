import { Address } from "@graphprotocol/graph-ts";
import { Network } from "./sdk/util/constants";

export const ETH_ADDRESS_OPTIMISM =
  "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000";

export const WETH_ADDRESS_OPTIMISM =
  "0x4200000000000000000000000000000000000006";

export const BRIDGE_ADDRESS = new Map<string, string>();
BRIDGE_ADDRESS.set(
  Network.MAINNET,
  "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1"
);
BRIDGE_ADDRESS.set(
  Network.OPTIMISM,
  "0x4200000000000000000000000000000000000010"
);

export const SNX_ADDRESS_MAINNET = Address.fromString(
  "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f"
);
export const SNX_ADDRESS_OPTIMISM = Address.fromString(
  "0x8700daec35af8ff88c16bdf0418774cb3d7599b4"
);

export const SUSD_ADDRESS_MAINNET = Address.fromString(
  "0x57ab1ec28d129707052df4df418d58a2d46d5f51"
);
export const SUSD_ADDRESS_OPTIMISM = Address.fromString(
  "0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9"
);
