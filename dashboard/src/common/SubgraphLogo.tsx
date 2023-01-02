import { Avatar } from "@mui/material";

const subgraphLogoMap: Record<string, string> = {
  aave: "https://messari.io/asset-images/0472643b-1c7a-47a2-a45e-ec1e3e1269cd/128.png?v=2",
  abracadabra: "https://messari.io/asset-images/c0f133e6-dd92-4cbf-a112-93c1495288ea/128.png?v=2",
  balancer: "https://messari.io/asset-images/c47ecc75-5d26-4142-834b-a8274c640e7e/128.png?v=2",
  bancor: "https://storage.googleapis.com/subgraph-images/1655859225132bancor-bnt-logo.png",
  "bastion-protocol": "https://assets.coingecko.com/coins/images/24228/small/1_hm7Nmrw_PmniLj3zlzIdZA.png?1646949451",
  "beefy-finance": "https://assets.coingecko.com/coins/images/12704/small/token.png?1601876182",
  "beethoven-x": "https://storage.googleapis.com/subgraph-images/1655507943634beethoven-x.png",
  "saddle-finance": "https://messari.io/asset-images/b00ea47b-da58-403f-83b5-30c21bb28cb3/128.png?v=2",
  moonwell: "https://assets.coingecko.com/coins/images/23914/small/moonwell-logo-200px.png?1645682927",
  lido: "https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png?1609873644",
  apeswap: "https://messari.io/asset-images/78426375-fb5a-4079-91b3-e5db4fef2826/128.png?v=2",
  benqi: "https://messari.io/asset-images/0b731b8e-0387-48ee-8d7b-8342daf727f8/128.png?v=2",
  uniswap: "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png?1600306604",
  compound: "https://messari.io/asset-images/157f4fe3-6046-4b6d-bceb-a2af8ca021b5/128.png?v=2",
  liquity: "https://messari.io/asset-images/d2bc5118-39e8-4b2c-bdea-a7e0c43536f3/128.png?v=2",
  honeyswap: "https://storage.googleapis.com/subgraph-images/1656114165689honeyswap.png",
  "platypus-finance": "https://storage.googleapis.com/subgraph-images/1656114523112platypus-v2.png",
  "vvs-finance": "https://assets.coingecko.com/coins/images/20210/small/8glAYOTM_400x400.jpg?1636667919",
  dforce: "https://assets.coingecko.com/coins/images/9709/small/xlGxxIjI_400x400.jpg?1571006794",
  makerdao: "https://messari.io/asset-images/4758c080-821e-4a19-bbae-4df59682d229/128.png?v=2",
  "belt-finance": "https://assets.coingecko.com/coins/images/14319/small/belt_logo.jpg?1615387083",
  "stake-dao": "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
  "geist-finance": "https://storage.googleapis.com/subgraph-images/1651428792354geist-finance.png",
  "rari-fuse": "https://storage.googleapis.com/subgraph-images/1652677853847rari-fuse.png",
  qidao: "https://storage.googleapis.com/subgraph-images/1654484792092qidao.png",
  "euler-finance": "https://assets.coingecko.com/coins/images/26149/small/YCvKDfl8_400x400.jpeg?1656041509",
  tokemak: "https://messari.io/asset-images/39d6707f-c1f0-4ef9-b916-a3613dc7bd0f/128.png?v=2",
  yearn: "https://messari.io/asset-images/75af0d92-7ec7-4279-bd5b-05eafa1090bf/128.png?v=2",
  curve: "https://assets.coingecko.com/coins/images/12124/small/Curve.png?1597369484",
  "mm-finance": "https://assets.coingecko.com/coins/images/22273/small/MMF200X200.png?1650448869",
  "ellipsis-finance": "https://assets.coingecko.com/coins/images/25444/small/ellipsis-light_%281%29.png?1651786591",
  "gamma": "https://storage.googleapis.com/subgraph-images/1654636003709gamma.jpg",
  badgerdao: "https://storage.googleapis.com/subgraph-images/1651427188757badger.png",
  rari: "https://assets.coingecko.com/coins/images/12900/small/Rari_Logo_Transparent.png?1613978014",
  "vesper": "https://storage.googleapis.com/subgraph-images/1657324907963vesper.jpg",
  "inverse-finance": "https://assets.coingecko.com/coins/images/14205/small/inverse_finance.jpg?1614921871",
  "convex": "https://assets.coingecko.com/coins/images/15585/small/convex.png?1621256328",
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
  ubeswap: "https://assets.coingecko.com/coins/images/15317/small/ubeswap.png?1620395836",
  tectonic: "https://assets.coingecko.com/coins/images/21982/small/TONIC_logo.png?1640575290",
  "maple-finance": "https://assets.coingecko.com/coins/images/14097/small/Maple_Logo_Mark_Maple_Orange.png?1653381382",
  "cosmos": "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png?1555657960",
  near: "https://assets.coingecko.com/coins/images/10365/small/near_icon.png?1601359077",
  "trisolaris": "https://assets.coingecko.com/coins/images/20607/small/logo_-_2021-11-19T104946.772.png?1637290197",
  "arweave": "https://assets.coingecko.com/coins/images/4343/small/oRt6SiEN_400x400.jpg?1591059616",
  "rocket-pool": "https://assets.coingecko.com/coins/images/2090/small/rocket_pool_%28RPL%29.png?1637662441",
  "tornado-cash": "https://assets.coingecko.com/coins/images/13496/small/ZINt8NSB_400x400.jpg?1609193407",
  "graph": "https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png?1608145566",
  "truefi": "https://assets.coingecko.com/coins/images/13180/small/truefi_glyph_color.png?1617610941",
  "radiant": "https://assets.coingecko.com/coins/images/26536/small/Radiant-Logo-200x200.png?1658715865",
  "velodrome": "https://assets.coingecko.com/coins/images/25783/small/velo.png?1653817876"
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
  "rari-vaults": "rari",
  "compound-v2": "compound",
  "compound-v3": "compound",
  "yearn-v2": "yearn",
  "stakedao": "stake-dao",
  "curve-finance": "curve",
  "vesper-finance": "vesper",
  "gamma-strategies": "gamma",
  "convex-finance": "convex",
  "graph-protocol": "graph"
};

interface SubgraphLogoProps {
  name: string;
  size: number;
}

export const SubgraphLogo = ({ name, size }: SubgraphLogoProps) => {
  const logoName = subgraphMap[name] ?? name;
  let src = subgraphLogoMap[logoName];
  let opacity = 1;
  if (!src) {
    src = subgraphLogoMap.uniswap;
    opacity = 0;
  }
  return <Avatar src={src} sx={{ height: size, width: size, opacity }} />;
};