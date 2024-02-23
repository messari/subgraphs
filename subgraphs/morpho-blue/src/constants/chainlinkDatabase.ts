import { Address } from "@graphprotocol/graph-ts";

export class ChainlinkFeed {
  constructor(
    public proxyAddress: Address,
    public decimals: u8
  ) {}
}

const chainlinkFeeds = new Map<string, ChainlinkFeed>();
chainlinkFeeds.set(
  "JPY-USD",
  new ChainlinkFeed(
    Address.fromString("0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "UST-USD",
  new ChainlinkFeed(
    Address.fromString("0x8b6d9085f310396C6E4f0012783E9f850eaa8a82"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "UST-ETH",
  new ChainlinkFeed(
    Address.fromString("0xa20623070413d42a5C01Db2c8111640DD7A5A03a"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "EUR-USD",
  new ChainlinkFeed(
    Address.fromString("0xb49f677943BC038e9857d61E7d053CaA2C1734C1"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "SNX-USD",
  new ChainlinkFeed(
    Address.fromString("0xDC3EA94CD0AC27d9A86C180091e7f78C683d3699"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "SNX-ETH",
  new ChainlinkFeed(
    Address.fromString("0x79291A9d692Df95334B1a0B3B4AE6bC606782f8c"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "SPELL-USD",
  new ChainlinkFeed(
    Address.fromString("0x8c110B94C5f1d347fAcF5E1E938AB2db60E3c9a8"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "GTC-ETH",
  new ChainlinkFeed(
    Address.fromString("0x0e773A17a01E2c92F5d4c53435397E2bd48e215F"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "HBAR-USD",
  new ChainlinkFeed(
    Address.fromString("0x38C5ae3ee324ee027D88c5117ee58d07c9b4699b"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "WTI-USD",
  new ChainlinkFeed(
    Address.fromString("0xf3584F4dd3b467e73C2339EfD008665a70A4185c"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BRL-USD",
  new ChainlinkFeed(
    Address.fromString("0x971E8F1B779A5F1C36e1cd7ef44Ba1Cc2F5EeE0f"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "AVAX-USD",
  new ChainlinkFeed(
    Address.fromString("0xFF3EEb22B5E3dE6e705b44749C2559d704923FD7"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "SUSD-USD",
  new ChainlinkFeed(
    Address.fromString("0xad35Bd71b9aFE6e4bDc266B345c198eaDEf9Ad94"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "SUSD-ETH",
  new ChainlinkFeed(
    Address.fromString("0x8e0b7e6062272B5eF4524250bFFF8e5Bd3497757"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "IDR-USD",
  new ChainlinkFeed(
    Address.fromString("0x91b99C9b75aF469a71eE1AB528e8da994A5D7030"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "DAI-ETH",
  new ChainlinkFeed(
    Address.fromString("0x773616E4d11A78F511299002da57A0a94577F1f4"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "AXS-ETH",
  new ChainlinkFeed(
    Address.fromString("0x8B4fC5b68cD50eAc1dD33f695901624a4a1A0A8b"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "MIM-USD",
  new ChainlinkFeed(
    Address.fromString("0x7A364e8770418566e3eb2001A96116E6138Eb32F"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "CAKE-USD",
  new ChainlinkFeed(
    Address.fromString("0xEb0adf5C06861d6c07174288ce4D0a8128164003"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "FTT-ETH",
  new ChainlinkFeed(
    Address.fromString("0xF0985f7E2CaBFf22CecC5a71282a89582c382EFE"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "TOMO-USD",
  new ChainlinkFeed(
    Address.fromString("0x3d44925a8E9F9DFd90390E58e92Ec16c996A331b"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "YFII-ETH",
  new ChainlinkFeed(
    Address.fromString("0xaaB2f6b45B28E962B3aCd1ee4fC88aEdDf557756"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "RARI-ETH",
  new ChainlinkFeed(
    Address.fromString("0x2a784368b1D492f458Bf919389F42c18315765F5"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "LUSD-USD",
  new ChainlinkFeed(
    Address.fromString("0x3D7aE7E594f2f2091Ad8798313450130d0Aba3a0"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "SWAP-ETH",
  new ChainlinkFeed(
    Address.fromString("0xffa4Bb3a24B60C0262DBAaD60d77a3c3fa6173e8"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "GNO-ETH",
  new ChainlinkFeed(
    Address.fromString("0xA614953dF476577E90dcf4e3428960e221EA4727"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "RAI-USD",
  new ChainlinkFeed(
    Address.fromString("0x483d36F6a1d063d580c7a24F9A42B346f3a69fbb"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "RAI-ETH",
  new ChainlinkFeed(
    Address.fromString("0x4ad7B025127e89263242aB68F0f9c4E5C033B489"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "ATOM-ETH",
  new ChainlinkFeed(
    Address.fromString("0x15c8eA24Ba2d36671Fa22aD4Cff0a8eafe144352"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "ATOM-USD",
  new ChainlinkFeed(
    Address.fromString("0xDC4BDB458C6361093069Ca2aD30D74cc152EdC75"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BAL-ETH",
  new ChainlinkFeed(
    Address.fromString("0xC1438AA3823A6Ba0C159CfA8D98dF5A994bA120b"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "BAL-USD",
  new ChainlinkFeed(
    Address.fromString("0xdF2917806E30300537aEB49A7663062F4d1F2b5F"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "CSPR-USD",
  new ChainlinkFeed(
    Address.fromString("0x9e37a8Ee3bFa8eD6783Db031Dc458d200b226074"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "INR-USD",
  new ChainlinkFeed(
    Address.fromString("0x605D5c2fBCeDb217D7987FC0951B5753069bC360"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "DOGE-USD",
  new ChainlinkFeed(
    Address.fromString("0x2465CefD3b488BE410b941b1d4b2767088e2A028"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "OMG-USD",
  new ChainlinkFeed(
    Address.fromString("0x7D476f061F8212A8C9317D5784e72B4212436E93"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "OMG-ETH",
  new ChainlinkFeed(
    Address.fromString("0x57C9aB3e56EE4a83752c181f241120a3DBba06a1"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "DPI-ETH",
  new ChainlinkFeed(
    Address.fromString("0x029849bbc0b1d93b85a8b6190e979fd38F5760E2"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "DPI-USD",
  new ChainlinkFeed(
    Address.fromString("0xD2A593BF7594aCE1faD597adb697b5645d5edDB2"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BORING-USD",
  new ChainlinkFeed(
    Address.fromString("0xde9299851FaC41c6AA43Ec96Cd33C28F74837AA9"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BIT-USD",
  new ChainlinkFeed(
    Address.fromString("0x7b33EbfA52F215a30FaD5a71b3FeE57a4831f1F0"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "FLOW-USD",
  new ChainlinkFeed(
    Address.fromString("0xD9BdD9f5ffa7d89c846A5E3231a093AE4b3469D2"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "REN-USD",
  new ChainlinkFeed(
    Address.fromString("0x0f59666EDE214281e956cb3b2D0d69415AfF4A01"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "REN-ETH",
  new ChainlinkFeed(
    Address.fromString("0x3147D7203354Dc06D9fd350c7a2437bcA92387a4"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "CRO-ETH",
  new ChainlinkFeed(
    Address.fromString("0xcA696a9Eb93b81ADFE6435759A29aB4cf2991A96"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "CRO-USD",
  new ChainlinkFeed(
    Address.fromString("0x00Cb80Cf097D9aA9A3779ad8EE7cF98437eaE050"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "IMX-USD",
  new ChainlinkFeed(
    Address.fromString("0xBAEbEFc1D023c0feCcc047Bff42E75F15Ff213E6"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "MANA-ETH",
  new ChainlinkFeed(
    Address.fromString("0x82A44D92D6c329826dc557c5E1Be6ebeC5D5FeB9"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "MANA-USD",
  new ChainlinkFeed(
    Address.fromString("0x56a4857acbcfe3a66965c251628B1c9f1c408C19"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "MATIC-USD",
  new ChainlinkFeed(
    Address.fromString("0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "OCEAN-ETH",
  new ChainlinkFeed(
    Address.fromString("0x9b0FC4bb9981e5333689d69BdBF66351B9861E62"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "FEI-ETH",
  new ChainlinkFeed(
    Address.fromString("0x7F0D2c2838c6AC24443d13e23d99490017bDe370"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "OGN-ETH",
  new ChainlinkFeed(
    Address.fromString("0x2c881B6f3f6B5ff6C975813F87A4dad0b241C15b"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "CAD-USD",
  new ChainlinkFeed(
    Address.fromString("0xa34317DB73e77d453b1B8d04550c44D10e981C8e"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BOND-ETH",
  new ChainlinkFeed(
    Address.fromString("0xdd22A54e05410D8d1007c38b5c7A3eD74b855281"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "GBP-USD",
  new ChainlinkFeed(
    Address.fromString("0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "FRAX-ETH",
  new ChainlinkFeed(
    Address.fromString("0x14d04Fff8D21bd62987a5cE9ce543d2F1edF5D3E"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "FRAX-USD",
  new ChainlinkFeed(
    Address.fromString("0xB9E1E3A9feFf48998E45Fa90847ed4D467E8BcfD"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BADGER-ETH",
  new ChainlinkFeed(
    Address.fromString("0x58921Ac140522867bf50b9E009599Da0CA4A2379"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "BADGER-USD",
  new ChainlinkFeed(
    Address.fromString("0x66a47b7206130e6FF64854EF0E1EDfa237E65339"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BUSD-ETH",
  new ChainlinkFeed(
    Address.fromString("0x614715d2Af89E6EC99A233818275142cE88d1Cfd"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "BUSD-USD",
  new ChainlinkFeed(
    Address.fromString("0x833D8Eb16D306ed1FbB5D7A2E019e106B960965A"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "REP-ETH",
  new ChainlinkFeed(
    Address.fromString("0xD4CE430C3b67b3E2F7026D86E7128588629e2455"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "KP3R-ETH",
  new ChainlinkFeed(
    Address.fromString("0xe7015CCb7E5F788B8c1010FC22343473EaaC3741"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "KSM-USD",
  new ChainlinkFeed(
    Address.fromString("0x06E4164E24E72B879D93360D1B9fA05838A62EB5"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "PAXG-ETH",
  new ChainlinkFeed(
    Address.fromString("0x9B97304EA12EFed0FAd976FBeCAad46016bf269e"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "UMA-ETH",
  new ChainlinkFeed(
    Address.fromString("0xf817B69EA583CAFF291E287CaE00Ea329d22765C"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "DYDX-USD",
  new ChainlinkFeed(
    Address.fromString("0x478909D4D798f3a1F11fFB25E4920C959B4aDe0b"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "ZRX-ETH",
  new ChainlinkFeed(
    Address.fromString("0x2Da4983a622a8498bb1a21FaE9D8F6C664939962"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "GUSD-USD",
  new ChainlinkFeed(
    Address.fromString("0xa89f5d2365ce98B3cD68012b6f503ab1416245Fc"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "GUSD-ETH",
  new ChainlinkFeed(
    Address.fromString("0x96d15851CBac05aEe4EFD9eA3a3DD9BDEeC9fC28"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "STETH-ETH",
  new ChainlinkFeed(
    Address.fromString("0x86392dC19c0b719886221c78AB11eb8Cf5c52812"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "STETH-USD",
  new ChainlinkFeed(
    Address.fromString("0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "ALPHA-ETH",
  new ChainlinkFeed(
    Address.fromString("0x89c7926c7c15fD5BFDB1edcFf7E7fC8283B578F6"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "APE-ETH",
  new ChainlinkFeed(
    Address.fromString("0xc7de7f4d4C9c991fF62a07D18b3E31e349833A18"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "APE-USD",
  new ChainlinkFeed(
    Address.fromString("0xD10aBbC76679a20055E167BB80A24ac851b37056"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "CTSI-ETH",
  new ChainlinkFeed(
    Address.fromString("0x0a1d1b9847d602e789be38B802246161FFA24930"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "STG-USD",
  new ChainlinkFeed(
    Address.fromString("0x7A9f34a0Aa917D438e9b6E630067062B7F8f6f3d"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "ALCX-ETH",
  new ChainlinkFeed(
    Address.fromString("0x194a9AaF2e0b67c35915cD01101585A33Fe25CAa"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "ALCX-USD",
  new ChainlinkFeed(
    Address.fromString("0xc355e4C0B3ff4Ed0B49EaACD55FE29B311f42976"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "MLN-ETH",
  new ChainlinkFeed(
    Address.fromString("0xDaeA8386611A157B08829ED4997A8A62B557014C"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "GRT-ETH",
  new ChainlinkFeed(
    Address.fromString("0x17D054eCac33D91F7340645341eFB5DE9009F1C1"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "GRT-USD",
  new ChainlinkFeed(
    Address.fromString("0x86cF33a451dE9dc61a2862FD94FF4ad4Bd65A5d2"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "ENS-USD",
  new ChainlinkFeed(
    Address.fromString("0x5C00128d4d1c2F4f652C267d7bcdD7aC99C16E16"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "ORN-ETH",
  new ChainlinkFeed(
    Address.fromString("0xbA9B2a360eb8aBdb677d6d7f27E12De11AA052ef"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "USDC-USD",
  new ChainlinkFeed(
    Address.fromString("0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "USDC-ETH",
  new ChainlinkFeed(
    Address.fromString("0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "LDO-ETH",
  new ChainlinkFeed(
    Address.fromString("0x4e844125952D32AcdF339BE976c98E22F6F318dB"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "CHF-USD",
  new ChainlinkFeed(
    Address.fromString("0x449d117117838fFA61263B61dA6301AA2a88B13A"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "USDT-ETH",
  new ChainlinkFeed(
    Address.fromString("0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "USDT-USD",
  new ChainlinkFeed(
    Address.fromString("0x3E7d1eAB13ad0104d2750B8863b489D65364e32D"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "AUD-USD",
  new ChainlinkFeed(
    Address.fromString("0x77F9710E7d0A19669A13c055F62cd80d313dF022"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "ANT-ETH",
  new ChainlinkFeed(
    Address.fromString("0x8f83670260F8f7708143b836a2a6F11eF0aBac01"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "CRV-ETH",
  new ChainlinkFeed(
    Address.fromString("0x8a12Be339B0cD1829b91Adc01977caa5E9ac121e"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "CRV-USD",
  new ChainlinkFeed(
    Address.fromString("0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "PAX-ETH",
  new ChainlinkFeed(
    Address.fromString("0x3a08ebBaB125224b7b6474384Ee39fBb247D2200"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "BTC-ETH",
  new ChainlinkFeed(
    Address.fromString("0xdeb288F737066589598e9214E782fa5A8eD689e8"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "REQ-USD",
  new ChainlinkFeed(
    Address.fromString("0x2F05888D185970f178f40610306a0Cc305e52bBF"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BAT-ETH",
  new ChainlinkFeed(
    Address.fromString("0x0d16d4528239e9ee52fa531af613AcdB23D88c94"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "BNT-USD",
  new ChainlinkFeed(
    Address.fromString("0x1E6cF0D433de4FE882A437ABC654F58E1e78548c"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BNT-ETH",
  new ChainlinkFeed(
    Address.fromString("0xCf61d1841B178fe82C8895fe60c2EDDa08314416"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "NMR-ETH",
  new ChainlinkFeed(
    Address.fromString("0x9cB2A01A7E64992d32A34db7cEea4c919C391f6A"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "NMR-USD",
  new ChainlinkFeed(
    Address.fromString("0xcC445B35b3636bC7cC7051f4769D8982ED0d449A"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "KRW-USD",
  new ChainlinkFeed(
    Address.fromString("0x01435677FB11763550905594A16B645847C1d0F3"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "OHM-ETH",
  new ChainlinkFeed(
    Address.fromString("0x90c2098473852E2F07678Fe1B6d595b1bd9b16Ed"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "FARM-ETH",
  new ChainlinkFeed(
    Address.fromString("0x611E0d2709416E002A3f38085e4e1cf77c015921"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "ONT-USD",
  new ChainlinkFeed(
    Address.fromString("0xcDa3708C5c2907FCca52BB3f9d3e4c2028b89319"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "CVX-USD",
  new ChainlinkFeed(
    Address.fromString("0xd962fC30A72A84cE50161031391756Bf2876Af5D"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "CVX-ETH",
  new ChainlinkFeed(
    Address.fromString("0xC9CbF687f43176B302F03f5e58470b77D07c61c6"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "IOTX-USD",
  new ChainlinkFeed(
    Address.fromString("0x96c45535d235148Dc3ABA1E48A6E3cFB3510f4E2"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "ADX-USD",
  new ChainlinkFeed(
    Address.fromString("0x231e764B44b2C1b7Ca171fa8021A24ed520Cde10"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "EURT-USD",
  new ChainlinkFeed(
    Address.fromString("0x01D391A48f4F7339aC64CA2c83a07C22F95F587a"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "Total_Marketcap-USD",
  new ChainlinkFeed(
    Address.fromString("0xEC8761a0A73c34329CA5B1D3Dc7eD07F30e836e2"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "OXT-USD",
  new ChainlinkFeed(
    Address.fromString("0xd75AAaE4AF0c398ca13e2667Be57AF2ccA8B5de6"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "LRC-ETH",
  new ChainlinkFeed(
    Address.fromString("0x160AC928A16C93eD4895C2De6f81ECcE9a7eB7b4"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "TUSD-ETH",
  new ChainlinkFeed(
    Address.fromString("0x3886BA987236181D98F2401c507Fb8BeA7871dF2"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "TUSD-USD",
  new ChainlinkFeed(
    Address.fromString("0xec746eCF986E2927Abd291a2A1716c940100f8Ba"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "FIL-ETH",
  new ChainlinkFeed(
    Address.fromString("0x0606Be69451B1C9861Ac6b3626b99093b713E801"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "MSFT-USD",
  new ChainlinkFeed(
    Address.fromString("0x021Fb44bfeafA0999C7b07C4791cf4B859C3b431"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "OHMV2-ETH",
  new ChainlinkFeed(
    Address.fromString("0x9a72298ae3886221820B1c878d12D872087D3a23"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "COMP-ETH",
  new ChainlinkFeed(
    Address.fromString("0x1B39Ee86Ec5979ba5C322b826B3ECb8C79991699"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "RETH-ETH",
  new ChainlinkFeed(
    Address.fromString("0x536218f9E9Eb48863970252233c8F271f554C2d0"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "FXS-USD",
  new ChainlinkFeed(
    Address.fromString("0x6Ebc52C8C1089be9eB3945C4350B68B8E4C2233f"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "RSR-USD",
  new ChainlinkFeed(
    Address.fromString("0x759bBC1be8F90eE6457C44abc7d443842a976d02"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "XSUSHI-USD",
  new ChainlinkFeed(
    Address.fromString("0xF05D9B6C08757EAcb1fbec18e36A1B7566a13DEB"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "YFI-ETH",
  new ChainlinkFeed(
    Address.fromString("0x7c5d4F8345e66f68099581Db340cd65B078C41f4"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "TRU-USD",
  new ChainlinkFeed(
    Address.fromString("0x26929b85fE284EeAB939831002e1928183a10fb1"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "PERP-USD",
  new ChainlinkFeed(
    Address.fromString("0x01cE1210Fe8153500F60f7131d63239373D7E26C"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "PERP-ETH",
  new ChainlinkFeed(
    Address.fromString("0x3b41D5571468904D4e53b6a8d93A6BaC43f02dC9"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "KNC-ETH",
  new ChainlinkFeed(
    Address.fromString("0x656c0544eF4C98A6a98491833A89204Abb045d6b"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "KNC-USD",
  new ChainlinkFeed(
    Address.fromString("0xf8fF43E991A81e6eC886a3D281A2C6cC19aE70Fc"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "LON-ETH",
  new ChainlinkFeed(
    Address.fromString("0x13A8F2cC27ccC2761ca1b21d2F3E762445f201CE"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "SHIB-ETH",
  new ChainlinkFeed(
    Address.fromString("0x8dD1CD88F43aF196ae478e91b9F5E4Ac69A97C61"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "ANKR-USD",
  new ChainlinkFeed(
    Address.fromString("0x7eed379bf00005CfeD29feD4009669dE9Bcc21ce"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BNB-USD",
  new ChainlinkFeed(
    Address.fromString("0x14e613AC84a31f709eadbdF89C6CC390fDc9540A"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BNB-ETH",
  new ChainlinkFeed(
    Address.fromString("0xc546d2d06144F9DD42815b8bA46Ee7B8FcAFa4a2"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "PHA-USD",
  new ChainlinkFeed(
    Address.fromString("0x2B1248028fe48864c4f1c305E524e2e6702eAFDF"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "ENJ-USD",
  new ChainlinkFeed(
    Address.fromString("0x23905C55dC11D609D5d11Dc604905779545De9a7"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "ENJ-ETH",
  new ChainlinkFeed(
    Address.fromString("0x24D9aB51950F3d62E9144fdC2f3135DAA6Ce8D1B"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "SXP-USD",
  new ChainlinkFeed(
    Address.fromString("0xFb0CfD6c19e25DB4a08D8a204a387cEa48Cc138f"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "XCN-USD",
  new ChainlinkFeed(
    Address.fromString("0xeb988B77b94C186053282BfcD8B7ED55142D3cAB"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "SAND-USD",
  new ChainlinkFeed(
    Address.fromString("0x35E3f7E558C04cE7eEE1629258EcbbA03B36Ec56"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "BAND-ETH",
  new ChainlinkFeed(
    Address.fromString("0x0BDb051e10c9718d1C29efbad442E88D38958274"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "SOL-USD",
  new ChainlinkFeed(
    Address.fromString("0x4ffC43a60e009B551865A93d232E33Fce9f01507"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "USDP-USD",
  new ChainlinkFeed(
    Address.fromString("0x09023c0DA49Aaf8fc3fA3ADF34C6A7016D38D5e3"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "MKR-ETH",
  new ChainlinkFeed(
    Address.fromString("0x24551a8Fb2A7211A25a17B1481f043A8a8adC7f2"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "LTC-USD",
  new ChainlinkFeed(
    Address.fromString("0x6AF09DF7563C363B5763b9102712EbeD3b9e859B"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "GLM-USD",
  new ChainlinkFeed(
    Address.fromString("0x83441C3A10F4D05de6e0f2E849A850Ccf27E6fa7"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "RUNE-ETH",
  new ChainlinkFeed(
    Address.fromString("0x875D60C44cfbC38BaA4Eb2dDB76A767dEB91b97e"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "TRY-USD",
  new ChainlinkFeed(
    Address.fromString("0xB09fC5fD3f11Cf9eb5E1C5Dba43114e3C9f477b5"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "1INCH-ETH",
  new ChainlinkFeed(
    Address.fromString("0x72AFAECF99C9d9C8215fF44C77B94B99C28741e8"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "1INCH-USD",
  new ChainlinkFeed(
    Address.fromString("0xc929ad75B72593967DE83E7F7Cda0493458261D9"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "AMPL-ETH",
  new ChainlinkFeed(
    Address.fromString("0x492575FDD11a0fCf2C6C719867890a7648d526eB"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "AMPL-USD",
  new ChainlinkFeed(
    Address.fromString("0xe20CA8D7546932360e37E9D72c1a47334af57706"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "ADA-USD",
  new ChainlinkFeed(
    Address.fromString("0xAE48c91dF1fE419994FFDa27da09D5aC69c30f55"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "FTM-ETH",
  new ChainlinkFeed(
    Address.fromString("0x2DE7E4a9488488e0058B95854CC2f7955B35dC9b"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "DOT-USD",
  new ChainlinkFeed(
    Address.fromString("0x1C07AFb8E2B827c5A4739C6d59Ae3A5035f28734"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "LINK-ETH",
  new ChainlinkFeed(
    Address.fromString("0xDC530D9457755926550b59e8ECcdaE7624181557"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "WNXM-ETH",
  new ChainlinkFeed(
    Address.fromString("0xe5Dc0A609Ab8bCF15d3f35cFaa1Ff40f521173Ea"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "UNI-ETH",
  new ChainlinkFeed(
    Address.fromString("0xD6aA3D25116d8dA79Ea0246c4826EB951872e02e"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "TRIBE-ETH",
  new ChainlinkFeed(
    Address.fromString("0x84a24deCA415Acc0c395872a9e6a63E27D6225c8"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "ILV-ETH",
  new ChainlinkFeed(
    Address.fromString("0xf600984CCa37cd562E74E3EE514289e3613ce8E4"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "WING-USD",
  new ChainlinkFeed(
    Address.fromString("0x134fE0a225Fb8e6683617C13cEB6B3319fB4fb82"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "AAPL-USD",
  new ChainlinkFeed(
    Address.fromString("0x139C8512Cde1778e9b9a8e721ce1aEbd4dD43587"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "SGD-USD",
  new ChainlinkFeed(
    Address.fromString("0xe25277fF4bbF9081C75Ab0EB13B4A13a721f3E13"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "SUSHI-ETH",
  new ChainlinkFeed(
    Address.fromString("0xe572CeF69f43c2E488b33924AF04BDacE19079cf"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "CEL-ETH",
  new ChainlinkFeed(
    Address.fromString("0x75FbD83b4bd51dEe765b2a01e8D3aa1B020F9d33"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "XHV-USD",
  new ChainlinkFeed(
    Address.fromString("0xeccBeEd9691d8521385259AE596CF00D68429de0"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "NZD-USD",
  new ChainlinkFeed(
    Address.fromString("0x3977CFc9e4f29C184D4675f4EB8e0013236e5f3e"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "CBETH-ETH",
  new ChainlinkFeed(
    Address.fromString("0xF017fcB346A1885194689bA23Eff2fE6fA5C483b"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "RLC-ETH",
  new ChainlinkFeed(
    Address.fromString("0x4cba1e1fdc738D0fe8DB3ee07728E2Bc4DA676c6"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "NEAR-USD",
  new ChainlinkFeed(
    Address.fromString("0xC12A6d1D827e23318266Ef16Ba6F397F2F91dA9b"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "AUDIO-USD",
  new ChainlinkFeed(
    Address.fromString("0xBf739E677Edf6cF3408857404746cAcfd7120EB2"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "XAG-USD",
  new ChainlinkFeed(
    Address.fromString("0x379589227b15F1a12195D3f2d90bBc9F31f95235"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "AAVE-ETH",
  new ChainlinkFeed(
    Address.fromString("0x6Df09E975c830ECae5bd4eD9d90f3A95a4f88012"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "FORTH-USD",
  new ChainlinkFeed(
    Address.fromString("0x7D77Fd73E468baECe26852776BeaF073CDc55fA0"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "HIGH-USD",
  new ChainlinkFeed(
    Address.fromString("0xe2F95bC12FE8a3C35684Be7586C39fD7c0E5b403"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "XAU-USD",
  new ChainlinkFeed(
    Address.fromString("0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "FOR-USD",
  new ChainlinkFeed(
    Address.fromString("0x456834f736094Fb0AAD40a9BBc9D4a0f37818A54"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "CREAM-ETH",
  new ChainlinkFeed(
    Address.fromString("0x82597CFE6af8baad7c0d441AA82cbC3b51759607"),
    18 as u8
  )
);
chainlinkFeeds.set(
  "CNY-USD",
  new ChainlinkFeed(
    Address.fromString("0xeF8A4aF35cd47424672E3C590aBD37FBB7A7759a"),
    8 as u8
  )
);
chainlinkFeeds.set(
  "CELO-ETH",
  new ChainlinkFeed(
    Address.fromString("0x9ae96129ed8FE0C707D6eeBa7b90bB1e139e543e"),
    18 as u8
  )
);
