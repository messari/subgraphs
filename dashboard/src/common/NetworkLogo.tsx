import { Avatar, Tooltip } from "@mui/material";

export const NetworkLogos: Record<string, string> = {
  arbitrum: "https://directus.messari.io/assets/2801f8f2-d651-45b7-919c-92273691be3d",
  aurora: "https://directus.messari.io/assets/1ac00a2c-4086-45e1-bf17-82ed73c2b2fc",
  avalanche: "https://directus.messari.io/assets/53c3c5e5-af1d-4fdf-868d-c0dfd221a1d5",
  bsc: "https://directus.messari.io/assets/0aed5c48-d3b9-4501-8435-66a86c856bea",
  fantom: "https://directus.messari.io/assets/a4bd1068-110f-40c9-8aee-3c3daf946fbe",
  ethereum: "https://directus.messari.io/assets/af54c189-e5de-48a4-be95-ec9eb15b6d2b",
  polygon: "https://directus.messari.io/assets/ac98defc-d493-4a65-bbec-d2c76d905d01",
  moonriver: "https://messari.io/asset-images/27cbdc16-de27-4a65-a8c3-40bb205fe94f/128.png?v=2",
  moonbeam: "https://assets.coingecko.com/coins/images/22459/small/glmr.png?1641880985",
  optimism: "https://directus.messari.io/assets/8249c927-2347-411e-b725-bce15c41ca87",
  gnosis: "https://assets.coingecko.com/coins/images/662/small/logo_square_simple_300px.png?1609402668",
  celo: "https://assets.coingecko.com/coins/images/11090/small/icon-celo-CELO-color-500.png?1592293590",
  fuse: "https://assets.coingecko.com/coins/images/10347/small/vUXKHEe.png?1601523640",
  cronos: "https://assets.coingecko.com/coins/images/7310/small/oCw2s3GI_400x400.jpeg?1645172042",
  harmony: "https://assets.coingecko.com/coins/images/4344/small/Y88JAze.png?1565065793",
  cosmos: "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png?1555657960",
  "boba": "https://assets.coingecko.com/coins/images/20285/small/BOBA.png?1636811576",
  "near": "https://assets.coingecko.com/coins/images/10365/small/near_icon.png?1601359077",
  "osmosis": "https://assets.coingecko.com/coins/images/16724/small/osmo.png?1632763885",
  "arweave-mainnet": "https://assets.coingecko.com/coins/images/4343/small/oRt6SiEN_400x400.jpg?1591059616",
  "arweave": "https://assets.coingecko.com/coins/images/4343/small/oRt6SiEN_400x400.jpg?1591059616",
  "near-mainnet": "https://assets.coingecko.com/coins/images/10365/small/near_icon.png?1601359077",
  "clover": "https://assets.coingecko.com/coins/images/15278/small/photo_2022-03-24_10-22-33.jpg?1648531786",
  "graph": "https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png?1608145566"
};

export const networkMapping: { [x: string]: string } = {
  "mainnet": "ethereum",
  "binance": "bsc",
  "xdai": "celo"
}

interface NetworkLogoProps {
  network: string;
  size: number;
  tooltip: string;
}

export const NetworkLogo = ({ network, size, tooltip }: NetworkLogoProps) => {
  let src = NetworkLogos[network];
  let opacity = 1;
  if (!src) {
    src = NetworkLogos[networkMapping[network]];
  }
  if (!src) {
    src = NetworkLogos.ethereum;
    opacity = 0;
  }
  return <Tooltip title={tooltip} placement="bottom"><Avatar sx={{ height: size, width: size, opacity }} src={src} /></Tooltip >;
};
