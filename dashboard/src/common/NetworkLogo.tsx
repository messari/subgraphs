import { Avatar } from "@mui/material";

const NetworkLogos: Record<string, string> = {
  arbitrum: "https://directus.messari.io/assets/2801f8f2-d651-45b7-919c-92273691be3d",
  aurora: "https://directus.messari.io/assets/1ac00a2c-4086-45e1-bf17-82ed73c2b2fc",
  avalanche: "https://directus.messari.io/assets/53c3c5e5-af1d-4fdf-868d-c0dfd221a1d5",
  bsc: "https://directus.messari.io/assets/0aed5c48-d3b9-4501-8435-66a86c856bea",
  fantom: "https://directus.messari.io/assets/a4bd1068-110f-40c9-8aee-3c3daf946fbe",
  mainnet: "https://directus.messari.io/assets/af54c189-e5de-48a4-be95-ec9eb15b6d2b",
  matic: "https://directus.messari.io/assets/ac98defc-d493-4a65-bbec-d2c76d905d01",
  moonriver: "https://messari.io/asset-images/27cbdc16-de27-4a65-a8c3-40bb205fe94f/128.png?v=2",
  optimism: "https://directus.messari.io/assets/8249c927-2347-411e-b725-bce15c41ca87",
  gnosis: "https://assets.coingecko.com/coins/images/662/small/logo_square_simple_300px.png?1609402668",
};

interface NetworkLogoProps {
  network: string;
}

export const NetworkLogo = ({ network }: NetworkLogoProps) => {
  return <Avatar sx={{ width: 24, height: 24 }} src={NetworkLogos[network] ?? ""} />;
};
