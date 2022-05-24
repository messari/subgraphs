import { Avatar } from "@mui/material";

const subgraphLogoMap: Record<string, string> = {
  aave: "https://messari.io/asset-images/0472643b-1c7a-47a2-a45e-ec1e3e1269cd/128.png?v=2",
  abracadabra: "https://messari.io/asset-images/c0f133e6-dd92-4cbf-a112-93c1495288ea/128.png?v=2",
  balancer: "https://messari.io/asset-images/c47ecc75-5d26-4142-834b-a8274c640e7e/128.png?v=2",
  bastion: "https://assets.coingecko.com/coins/images/24228/small/1_hm7Nmrw_PmniLj3zlzIdZA.png?1646949451",
  saddleFinance: "https://messari.io/asset-images/b00ea47b-da58-403f-83b5-30c21bb28cb3/128.png?v=2",
  moonwell: "https://assets.coingecko.com/coins/images/23914/small/moonwell-logo-200px.png?1645682927",
  apeswap: "https://messari.io/asset-images/78426375-fb5a-4079-91b3-e5db4fef2826/128.png?v=2",
  benqi: "https://messari.io/asset-images/0b731b8e-0387-48ee-8d7b-8342daf727f8/128.png?v=2",
  uniswap: "https://messari.io/asset-images/6efbfc8a-18c9-4c6f-aa78-feea100521cf/128.png?v=1",
  compound: "https://messari.io/asset-images/157f4fe3-6046-4b6d-bceb-a2af8ca021b5/128.png?v=2",
  liquity: "https://messari.io/asset-images/d2bc5118-39e8-4b2c-bdea-a7e0c43536f3/128.png?v=2",
  makerDAO: "https://messari.io/asset-images/4758c080-821e-4a19-bbae-4df59682d229/128.png?v=2",
  beltFinance: "https://assets.coingecko.com/coins/images/14319/small/belt_logo.jpg?1615387083",
  stakeDAO: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
  tokemak: "https://messari.io/asset-images/39d6707f-c1f0-4ef9-b916-a3613dc7bd0f/128.png?v=2",
  yearn: "https://messari.io/asset-images/75af0d92-7ec7-4279-bd5b-05eafa1090bf/128.png?v=2",
  curve: "https://assets.coingecko.com/coins/images/12124/small/Curve.png?1597369484",
  ellipsis: "https://assets.coingecko.com/coins/images/25444/small/ellipsis-light_%281%29.png?1651786591",
  rari: "https://assets.coingecko.com/coins/images/12900/small/Rari_Logo_Transparent.png?1613978014",
  inverse: "https://assets.coingecko.com/coins/images/14205/small/inverse_finance.jpg?1614921871",
  convex: "https://assets.coingecko.com/coins/images/15585/small/convex.png?1621256328",
  aurigami: "https://assets.coingecko.com/coins/images/24074/small/EbB5N8IN_400x400.jpg?1646230298",
};

const subgraphMap: Record<string, string> = {
  aaveV2: "aave",
  balancerV2: "balancer",
  BENQI: "benqi",
  uniswapV3: "uniswap",
  uniswapV2: "uniswap",
  yearnV2: "yearn",
};

interface SubgraphLogoProps {
  name: string;
}

export const SubgraphLogo = ({ name }: SubgraphLogoProps) => {
  const logoName = subgraphMap[name] ?? name;
  const url = subgraphLogoMap[logoName] ?? "";

  return <Avatar src={url} />;
};
