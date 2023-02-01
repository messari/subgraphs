export const PROTOCOL_NAME = "Aave V3 Extended";
export const PROTOCOL_SLUG = "aave-v3-extended";

export namespace PositionSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

// returns block of market update to v3.0.1, or null if no upgrade
export function getUpdateBlock(network: string): u32 {
  let updateBlock = -1;
  if (network === 'mainnet') {
    updateBlock = 0;
  }
  // TODO: Add upgrade block numbers as they occur

  return updateBlock;
}