import { Avatar } from "@mui/material";

const subgraphLogoMap: Record<string, string> = {
  aave: "https://messari.io/asset-images/0472643b-1c7a-47a2-a45e-ec1e3e1269cd/128.png?v=2",
  abracadabra: "https://messari.io/asset-images/c0f133e6-dd92-4cbf-a112-93c1495288ea/128.png?v=2",
  balancer: "https://messari.io/asset-images/c47ecc75-5d26-4142-834b-a8274c640e7e/128.png?v=2",
  bancor: "https://storage.googleapis.com/subgraph-images/1655859225132bancor-bnt-logo.png",
  "bastion-protocol": "https://assets.coingecko.com/coins/images/24228/small/1_hm7Nmrw_PmniLj3zlzIdZA.png?1646949451",
  "beethoven-x": "https://storage.googleapis.com/subgraph-images/1655507943634beethoven-x.png",
  "saddle-finance": "https://messari.io/asset-images/b00ea47b-da58-403f-83b5-30c21bb28cb3/128.png?v=2",
  "moonwell": "https://assets.coingecko.com/coins/images/23914/small/moonwell-logo-200px.png?1645682927",
  apeswap: "https://messari.io/asset-images/78426375-fb5a-4079-91b3-e5db4fef2826/128.png?v=2",
  benqi: "https://messari.io/asset-images/0b731b8e-0387-48ee-8d7b-8342daf727f8/128.png?v=2",
  uniswap: "https://messari.io/asset-images/6efbfc8a-18c9-4c6f-aa78-feea100521cf/128.png?v=1",
  compound: "https://messari.io/asset-images/157f4fe3-6046-4b6d-bceb-a2af8ca021b5/128.png?v=2",
  liquity: "https://messari.io/asset-images/d2bc5118-39e8-4b2c-bdea-a7e0c43536f3/128.png?v=2",
  honeyswap: "https://storage.googleapis.com/subgraph-images/1656114165689honeyswap.png",
  platypus: "https://storage.googleapis.com/subgraph-images/1656114523112platypus-v2.png",
  "vvs-finance": "https://assets.coingecko.com/coins/images/20210/small/8glAYOTM_400x400.jpg?1636667919",
  dforce: "https://assets.coingecko.com/coins/images/9709/small/xlGxxIjI_400x400.jpg?1571006794",
  makerdao: "https://messari.io/asset-images/4758c080-821e-4a19-bbae-4df59682d229/128.png?v=2",
  "belt-finance": "https://assets.coingecko.com/coins/images/14319/small/belt_logo.jpg?1615387083",
  "stake-dao": "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
  "geist-finance": "https://storage.googleapis.com/subgraph-images/1651428792354geist-finance.png",
  "rari-fuse": "https://storage.googleapis.com/subgraph-images/1652677853847rari-fuse.png",
  "qidao": "https://storage.googleapis.com/subgraph-images/1654484792092qidao.png",
  tokemak: "https://messari.io/asset-images/39d6707f-c1f0-4ef9-b916-a3613dc7bd0f/128.png?v=2",
  yearn: "https://messari.io/asset-images/75af0d92-7ec7-4279-bd5b-05eafa1090bf/128.png?v=2",
  curve: "https://assets.coingecko.com/coins/images/12124/small/Curve.png?1597369484",
  "ellipsis-finance": "https://assets.coingecko.com/coins/images/25444/small/ellipsis-light_%281%29.png?1651786591",
  gamma: "https://storage.googleapis.com/subgraph-images/1654636003709gamma.jpg",
  badgerdao: "https://storage.googleapis.com/subgraph-images/1651427188757badger.png",
  rari: "https://assets.coingecko.com/coins/images/12900/small/Rari_Logo_Transparent.png?1613978014",
  vesper: "https://storage.googleapis.com/subgraph-images/1657324907963vesper.jpg",
  "inverse-finance": "https://assets.coingecko.com/coins/images/14205/small/inverse_finance.jpg?1614921871",
  convex: "https://assets.coingecko.com/coins/images/15585/small/convex.png?1621256328",
  aurigami: "https://assets.coingecko.com/coins/images/24074/small/EbB5N8IN_400x400.jpg?1646230298",
  "arrakis-finance": "https://storage.googleapis.com/subgraph-images/1657591665211arrakis.jpg",
  "cream-finance": "https://assets.coingecko.com/coins/images/11976/small/Cream.png?1596593418",
  "iron-bank": "https://assets.coingecko.com/coins/images/22902/small/ironbank.png?1642872464",
  "trader-joe": "https://assets.coingecko.com/markets/images/692/small/traderjoe.png?1628152581",
  sushiswap: "https://assets.coingecko.com/markets/images/576/small/2048x2048_Logo.png?1609208464",
  spookyswap: "https://storage.googleapis.com/subgraph-images/1653189196580spookyswap.png",
  venus: "https://storage.googleapis.com/subgraph-images/1654009958968venus.jpg",
  scream: "https://storage.googleapis.com/subgraph-images/1654009711828scream.png",
  spiritswap: "https://storage.googleapis.com/subgraph-images/1653965925262spiritiswap.png",
  "banker-joe": "https://storage.googleapis.com/subgraph-images/1654009863071banker-joe.png",
  quickswap: "https://assets.coingecko.com/coins/images/25393/small/quickswap.jpg?1651680141",
  solarbeam: "https://assets.coingecko.com/coins/images/18260/small/solarbeamlogo.png?1636080005",
};

// used for protocols with multiple versions
const subgraphMap: Record<string, string> = {
  "aave-v2": "aave",
  "aave-arc": "aave",
  "aave-amm": "aave",
  "aave-rwa": "aave",
  "aave-v3": "aave",
  "bancor-v3": "bancor",
  "balancer-v2": "balancer",
  "uniswap-v3": "uniswap",
  "uniswap-v2": "uniswap",
  "rari-vaults-v1": "rari",
  "compound-v2": "compound",
  "yearn-v2": "yearn",
};

interface SubgraphLogoProps {
  name: string;
}

export const SubgraphLogo = ({ name }: SubgraphLogoProps) => {
  const logoName = subgraphMap[name] ?? name;
  const url = subgraphLogoMap[logoName] ?? "";

  return <Avatar src={url} />;
};
