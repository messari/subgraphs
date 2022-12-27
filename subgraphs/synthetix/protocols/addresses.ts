import { BigInt, Address } from "@graphprotocol/graph-ts";

interface ContractInfo {
  address: string;
}

export function getContractDeployment(
  contractName: string,
  network: string,
  block: BigInt
): Address | null {
  if (network == "mainnet") {
    if (contractName == "OneNetAggregatorsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x646F23085281Dbd006FBFD211FD38d0743884864")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x08F30Ecf2C15A783083ab9D5b9211c22388d0564")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xfb020CA7f4e8C4a5bBBe060f59a249c6275d2b69")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x1cB004a8e84a5CE95C1fF895EE603BaC8EC506c7")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xBb5b03E920cF702De5A3bA9Fc1445aF4B3919c88")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xa8E31E3C38aDD6052A9407298FAEB8fD393A6cF9")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xdc883b9d9Ee16f74bE08826E68dF4C9D9d26e8bD")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xE1cc2332852B2Ac0dA59A1f9D3051829f4eF3c1C")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x10A5F7D9D65bCc2734763444D4940a31b109275f")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x5D4C724BFe3a228Ff0E29125Ac1571FE093700a4")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xDF69bC4541b86Aa4c5A470B4347E730c38b2c3B2")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x918b1dbf0917FdD74D03fB9434915E2ECEc89286")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xE5CC99EFA57943F4EA0cE6bed265318697748649")
      );
    if (contractName == "SynthsADA")
      return changetype<Address>(
        Address.fromHexString("0x91b82d62Ff322b8e02b86f33E9A99a813437830d")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x942Eb6e8c029EB22103743C99985aF4F4515a559")
      );
    if (contractName == "SynthsDOT")
      return changetype<Address>(
        Address.fromHexString("0x75A0c1597137AA36B40b6a515D997F9a6c6eefEB")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0xdAe6C79c46aB3B280Ca28259000695529cbD1339")
      );
    if (contractName == "SynthsETHBTC")
      return changetype<Address>(
        Address.fromHexString("0x07C1E81C345A7c58d7c24072EFc5D929BD0647AD")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x7F30336E0e01bEe8dD1C641bD793400f82d080cf")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x931933807c4c808657b6016f9e539486e7B5d374")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xD64D83829D92B5bdA881f6f61A4e4E27Fc185387")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x0689b1F72930Eb25cACB99f790d2778E713a2c33")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xdD3c1c64402A679e8D709FcCf606BD77eE12b567")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x307bDCE0A68C612a17BaE8d929f36402d7c94CFA")
      );
    if (contractName == "Liquidator")
      return changetype<Address>(
        Address.fromHexString("0x0e5fe1b05612581576e9A3dB048416d0B1E3C425")
      );
    if (contractName == "LiquidatorRewards")
      return changetype<Address>(
        Address.fromHexString("0xf79603a71144e415730C1A6f57F366E4Ea962C00")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xb4dc5ced63C2918c89E491D19BF1C0e92845de7C")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x639032d3900875a4cf4960aD6b9ee441657aA93C")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x9aB91BdCE9ae5D66d7d925699743Fa3A503c8eb8")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x7808bFD6e20AFE2d82b159590Ca5635b6263Db3F")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xA4339a001c87e2C79B2d8A50D38c16cf12F3D6EE")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0x39Ea01a0298C315d149a490E34B59Dbf2EC7e48F")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x5DABae966208192e5c3028A7480392337014Ed8E")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xf48F8D49Ad04C0DaA612470A91e760b3d9Fa8f88")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x68938Be4c72A77891E99B198F4d31C5582018b40")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x6fA9E5923CBFDD39F0B625Bf1350Ffb50D5006b9")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x3B2f389AeE480238A49E3A9985cd6815370712eB")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xC4546bDd93cDAADA6994e84Fb6F2722C620B019C")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x18FcC34bdEaaF9E3b69D2500343527c0c995b1d6")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xCC83a57B080a4c7C86F0bB892Bc180C8C7F8791d")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x1b06a00Df0B27E7871E753720D4917a7D1aac68b")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xAE7A2C1e326e59f2dB2132652115a59E8Adb5eBf")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xB82f11f3168Ece7D56fe6a5679567948090de7C5")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x7df9b3f8f1C011D8BD707430e97E747479DD532a")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x4FB63c954Ef07EC74335Bb53835026C75DD91dC6")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xe08518bA3d2467F7cA50eFE68AA00C5f78D4f3D6")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xf533aeEe48f0e04E30c2F6A1f19FbB675469a124")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x74E9a032B04D9732E826eECFC5c7A1C183602FB1")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xE60E71E47Ca405946CF147CA9d7589a851DBcddC")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x696c905F8F8c006cA46e9808fE7e00049507798F")
      );
    if (contractName == "SynthsADA")
      return changetype<Address>(
        Address.fromHexString("0xB34F4d7c207D8979D05EDb0F63f174764Bd67825")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x1620Aa736939597891C1940CF0d28b82566F9390")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0xc51f137e19F1ae6944887388FD12b2b6dFD12594")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x95aE43E5E96314E4afffcf19D9419111cd11169e")
      );
    if (contractName == "SynthsDOT")
      return changetype<Address>(
        Address.fromHexString("0x27b45A4208b87A899009f45888139882477Acea5")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0x527637bE27640d6C3e751d24DC67129A6d13E11C")
      );
    if (contractName == "SynthsETHBTC")
      return changetype<Address>(
        Address.fromHexString("0x6DF798ec713b33BE823b917F27820f2aA0cf7662")
      );
    if (contractName == "SignedSafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x728A2B79Cad691531CC1146eF802617FF50c7095")
      );
    if (contractName == "OneNetAggregatorIssuedSynths")
      return changetype<Address>(
        Address.fromHexString("0xcf1405b18dBCEA2893Abe635c88359C75878B9e1")
      );
    if (contractName == "OneNetAggregatorDebtRatio")
      return changetype<Address>(
        Address.fromHexString("0x977d0DD7eA212E9ca1dcD4Ec15cd7Ceb135fa68D")
      );
    if (contractName == "ExchangeCircuitBreaker")
      return changetype<Address>(
        Address.fromHexString("0xeAcaEd9581294b1b5cfb6B941d4B8B81B2005437")
      );
    if (contractName == "FuturesMarketManager")
      return changetype<Address>(
        Address.fromHexString("0x834Ef6c82D431Ac9A7A6B66325F185b2430780D7")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xE95A536cF5C7384FF1ef54819Dc54E03d0FF1979")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0x8d203C458d536Fe0F97e9f741bC231EaC8cd91cf")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xBE02A2C22a581D796b90b200CF530Fdd1e6f54ec")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x97607b048aEa97A821C3EdC881aF7743f8868950")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x16e5ACe2B8a9DE5c42fCFd85d6EC5992a43C0837")
      );
    if (contractName == "SynthetixDebtShare")
      return changetype<Address>(
        Address.fromHexString("0x89FCb32F29e509cc42d0C8b6f058C993013A843F")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x426Be4cC70066b2C42Edb1aE838c741069b1972c")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xF68ECd50de7733015318361295547D8E939F93E6")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x3e343E89F4fF8057806F54F2208940B1Cd5C40ca")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x80d65Bb7b9436A86c1928F93D6E7cc186987Ac54")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0xa62F71D599Ec6179B4f6569adD69ffC7E1A7a1c5")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xF66d34426C10CE91cDBcd86F8e9594AfB83049bd")
      );
    if (contractName == "TokenStatesETHBTC")
      return changetype<Address>(
        Address.fromHexString("0x042A7A0022A7695454ac5Be77a4860e50c9683fC")
      );
    if (contractName == "ProxysETHBTC")
      return changetype<Address>(
        Address.fromHexString("0x104eDF1da359506548BFc7c25bA1E28C16a70235")
      );
    if (contractName == "SynthsETHBTC")
      return changetype<Address>(
        Address.fromHexString("0xcc3aab773e2171b2E257Ee17001400eE378aa52B")
      );
    if (contractName == "WrapperFactory")
      return changetype<Address>(
        Address.fromHexString("0x02f9bC46beD33acdB9cb002fe346734CeF8a9480")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x4D3AF899DF121751422c49Ec3fDe29bE485d220c")
      );
    if (contractName == "OwnerRelayOnEthereum")
      return changetype<Address>(
        Address.fromHexString("0x0e16A6876210841577b233C4165d7B7EdF640b8a")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x6d9296Df2ad52F174bF671f555d78628bEBa7752")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xc398406FFfBEd5B0680e706634490062CB1DB579")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xDC01020857afbaE65224CfCeDb265d1216064c59")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x005d19CA7ff9D79a5Bdf0805Fc01D9D7c53B6827")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x2B3eb5eF0EF06f2E02ef60B3F36Be4793d321353")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x39DDbbb113AF3434048b9d8018a3e99d67C6eE0D")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xe301da3d2D3e96e57D05b8E557656629cDdbe7A0")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xde3892383965FBa6eC434bE6350F85f140098708")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x4ed5c5D5793f86c8a85E1a96E37b6d374DE0E85A")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xAFDd6B5A8aB32156dBFb4060ff87F6d9E31191bA")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xc70B42930BD8D30A79B55415deC3be60827559f7")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x3FFE35c3d412150C3B91d3E22eBA60E16030C608")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xe59dFC746D566EB40F92ed0B162004e24E3AC932")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x2A417C61B8062363e4ff50900779463b45d235f6")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xC2F1F551bfAd1E9A3b4816513bFd41d77f40F915")
      );
    if (contractName == "SynthsADA")
      return changetype<Address>(
        Address.fromHexString("0x8f9fa817200F5B95f9572c8Acf2b31410C00335a")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xb6B476C41Ea01930e6abE1f44b96800de0404c98")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x9D5551Cd3425Dd4585c3E7Eb7E4B98902222521E")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x0705F0716b12a703d4F8832Ec7b97C61771f0361")
      );
    if (contractName == "SynthsDOT")
      return changetype<Address>(
        Address.fromHexString("0xfA60918C4417b64E722ca15d79C751c1f24Ab995")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0xe2f532c389deb5E42DCe53e78A9762949A885455")
      );
    if (contractName == "WrapperFactory")
      return changetype<Address>(
        Address.fromHexString("0x0a6956d554485a43494D69Eca78C5103511a8fEb")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xF67998902EBc37d885ad310C2430C822Ca981E1E")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x08118E04F58d7863b4fCF1de0e07c83a2541b89e")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x510adfDF6E7554C571b7Cd9305Ce91473610015e")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x54f25546260C7539088982bcF4b7dC8EDEF19f21")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xC8a5f06858a1B49A7F703EacD433A1444a5e5bd9")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x967968963517AFDC9b8Ccc9AD6649bC507E83a7b")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xCFA46B4923c0E75B7b84E9FBde70ED26feFefBf6")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x7634F2A1741a683ccda37Dce864c187F990D7B4b")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x922C84B3894298296C34842D866BfC0d36C54778")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xe92B4c7428152052B0930c81F4c687a5F1A12292")
      );
    if (contractName == "SynthRedeemer")
      return changetype<Address>(
        Address.fromHexString("0xe533139Af961c9747356D947838c98451015e234")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x43AE8037179a5746D618DA077A38DdeEa9640cBa")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x613c773c7a1D85D2F1DCC051B0573D33470762Eb")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xcf9E60005C9aca983caf65d3669a24fDd0775fc0")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x4D8dBD193d89b7B506BE5dC9Db75B91dA00D6a1d")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xab4e760fEEe20C5c2509061b995e06b542D3112B")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xB774711F0BC1306ce892ef8C02D0476dCccB46B7")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xD3C8d372bFCd36c2B452639a7ED6ef7dbFDC56F8")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x9bB05EF2cA7DBAafFC3da1939D1492e6b00F39b8")
      );
    if (contractName == "EtherWrapper")
      return changetype<Address>(
        Address.fromHexString("0xC1AAE9d18bBe386B102435a8632C8063d31e747C")
      );
    if (contractName == "NativeEtherWrapper")
      return changetype<Address>(
        Address.fromHexString("0x7A3d898b717e50a96fd8b232E9d15F0A547A7eeb")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0xCd9D4988C0AE61887B075bA77f08cbFAd2b65068")
      );
    if (contractName == "SynthetixBridgeEscrow")
      return changetype<Address>(
        Address.fromHexString("0x5Fd79D46EBA7F351fe49BFF9E87cdeA6c821eF9f")
      );
    if (contractName == "StakingRewardssCOINBalancer")
      return changetype<Address>(
        Address.fromHexString("0x1C1D97f6338759AB814a5A717aE359573Ab5D5d4")
      );
    if (contractName == "StakingRewardssMSFTBalancer")
      return changetype<Address>(
        Address.fromHexString("0x9D003Cc298E7Ea141A809C241C0a703176DA3ba3")
      );
    if (contractName == "TokenStatesCOIN")
      return changetype<Address>(
        Address.fromHexString("0x102e541a34AA7e7205c32ddF58308395d733Ce1f")
      );
    if (contractName == "ProxysCOIN")
      return changetype<Address>(
        Address.fromHexString("0x9EeF4CA7aB9fa8bc0650127341C2d3F707a40f8A")
      );
    if (contractName == "SynthsCOIN")
      return changetype<Address>(
        Address.fromHexString("0x249612F641111022f2f48769f3Df5D85cb3E26a2")
      );
    if (contractName == "TokenStatesMSFT")
      return changetype<Address>(
        Address.fromHexString("0x7EbeEa83591c048a40502985254A3Df19Ea90067")
      );
    if (contractName == "ProxysMSFT")
      return changetype<Address>(
        Address.fromHexString("0x745a824D6aBBD236AA794b5530062778A6Ad7523")
      );
    if (contractName == "SynthsMSFT")
      return changetype<Address>(
        Address.fromHexString("0x04720DbBD4599aD26811545595d97fB813E84964")
      );
    if (contractName == "StakingRewardssFBBalancer")
      return changetype<Address>(
        Address.fromHexString("0x26Fa0665660c1D3a3666584669511d3c66Ad37Cb")
      );
    if (contractName == "StakingRewardssAAPLBalancer")
      return changetype<Address>(
        Address.fromHexString("0x7af65f1740c0eB816A27FD808EaF6Ab09F6Fa646")
      );
    if (contractName == "StakingRewardssAMZNBalancer")
      return changetype<Address>(
        Address.fromHexString("0xDC338C7544654c7dadFEb7E44076E457963113B0")
      );
    if (contractName == "StakingRewardssNFLXBalancer")
      return changetype<Address>(
        Address.fromHexString("0x8Ef8cA2AcAaAfEc19fB366C11561718357F780F2")
      );
    if (contractName == "StakingRewardssGOOGBalancer")
      return changetype<Address>(
        Address.fromHexString("0x6fB7F0E78582746bd01BcB6dfbFE62cA5F4F9175")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x585fD19eBa8F1a81F37C5eb322FD4b8D911367e8")
      );
    if (contractName == "TokenStates1INCH")
      return changetype<Address>(
        Address.fromHexString("0xeD1EfD716C7E2e821BBD4EC1480D649df7fb2279")
      );
    if (contractName == "Proxys1INCH")
      return changetype<Address>(
        Address.fromHexString("0xcD39b5434a0A92cf47D1F567a7dF84bE356814F0")
      );
    if (contractName == "Synths1INCH")
      return changetype<Address>(
        Address.fromHexString("0x0E8Fa2339314AB7E164818F26207897bBe29C3af")
      );
    if (contractName == "TokenStatesRUNE")
      return changetype<Address>(
        Address.fromHexString("0x860C5f944b098cE28CF9f2Da099913F01c9364D8")
      );
    if (contractName == "ProxysRUNE")
      return changetype<Address>(
        Address.fromHexString("0x0352557B007A4Aae1511C114409b932F06F9E2f4")
      );
    if (contractName == "SynthsRUNE")
      return changetype<Address>(
        Address.fromHexString("0xe615Df79AC987193561f37E77465bEC2aEfe9aDb")
      );
    if (contractName == "TokenStatesCRV")
      return changetype<Address>(
        Address.fromHexString("0x602590F2aa35B71ccB1Ca72E673A75b26eC7f4E8")
      );
    if (contractName == "ProxysCRV")
      return changetype<Address>(
        Address.fromHexString("0xD38aEb759891882e78E957c80656572503D8c1B1")
      );
    if (contractName == "SynthsCRV")
      return changetype<Address>(
        Address.fromHexString("0x13D0F5B8630520eA04f694F17A001fb95eaFD30E")
      );
    if (contractName == "TokenStatesAAPL")
      return changetype<Address>(
        Address.fromHexString("0x830B48539D82a4D34dD670bfE163f9eF84B6c2f1")
      );
    if (contractName == "ProxysAAPL")
      return changetype<Address>(
        Address.fromHexString("0x7537AAe01f3B218DAE75e10d952473823F961B87")
      );
    if (contractName == "SynthsAAPL")
      return changetype<Address>(
        Address.fromHexString("0x815CeF3b7773f35428B4353073B086ecB658f73C")
      );
    if (contractName == "TokenStatesFB")
      return changetype<Address>(
        Address.fromHexString("0xBF416bdf37b1590A3A37A1504865354Bf5D90b34")
      );
    if (contractName == "ProxysFB")
      return changetype<Address>(
        Address.fromHexString("0xf50B5e535F62a56A9BD2d8e2434204E726c027Fa")
      );
    if (contractName == "SynthsFB")
      return changetype<Address>(
        Address.fromHexString("0xb0e0BA880775B7F2ba813b3800b3979d719F0379")
      );
    if (contractName == "TokenStatesGOOG")
      return changetype<Address>(
        Address.fromHexString("0x272BbF5eEf131A3eb4a3078A58cFcD0978585F98")
      );
    if (contractName == "ProxysGOOG")
      return changetype<Address>(
        Address.fromHexString("0xC63B8ECCE56aB9C46184eC6aB85e4771fEa4c8AD")
      );
    if (contractName == "SynthsGOOG")
      return changetype<Address>(
        Address.fromHexString("0x8e082925e78538955bC0e2F363FC5d1Ab3be739b")
      );
    if (contractName == "TokenStatesNFLX")
      return changetype<Address>(
        Address.fromHexString("0x438D8701892AB7578ea34F8cDCdCAdc93e48D443")
      );
    if (contractName == "ProxysNFLX")
      return changetype<Address>(
        Address.fromHexString("0x5A7E3c07604EB515C16b36cd51906a65f021F609")
      );
    if (contractName == "SynthsNFLX")
      return changetype<Address>(
        Address.fromHexString("0x399BA516a6d68d6Ad4D5f3999902D0DeAcaACDdd")
      );
    if (contractName == "TokenStatesAMZN")
      return changetype<Address>(
        Address.fromHexString("0xc341BD8d6BB064FdD94b5142513027A01c1716C9")
      );
    if (contractName == "ProxysAMZN")
      return changetype<Address>(
        Address.fromHexString("0x9CF7E61853ea30A41b02169391b393B901eac457")
      );
    if (contractName == "SynthsAMZN")
      return changetype<Address>(
        Address.fromHexString("0x9530FA32a3059114AC20A5812870Da12D97d1174")
      );
    if (contractName == "VirtualSynthMastercopy")
      return changetype<Address>(
        Address.fromHexString("0xf02ce48fD47D7FA1B7a45a0444805d320D035775")
      );
    if (contractName == "TokenStatesKRW")
      return changetype<Address>(
        Address.fromHexString("0x93B6e9FbBd2c32a0DC3C2B943B7C3CBC2fE23730")
      );
    if (contractName == "ProxysKRW")
      return changetype<Address>(
        Address.fromHexString("0x269895a3dF4D73b077Fc823dD6dA1B95f72Aaf9B")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0xCeC4e038371d32212C6Dcdf36Fdbcb6F8a34C6d8")
      );
    if (contractName == "StakingRewardssTSLABalancer")
      return changetype<Address>(
        Address.fromHexString("0xF0de877F2F9E7A60767f9BA662F10751566AD01c")
      );
    if (contractName == "TokenStatesTSLA")
      return changetype<Address>(
        Address.fromHexString("0x259F2584E8A672DA3773F91D66567a3229Dee93d")
      );
    if (contractName == "ProxysTSLA")
      return changetype<Address>(
        Address.fromHexString("0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D")
      );
    if (contractName == "SynthsTSLA")
      return changetype<Address>(
        Address.fromHexString("0x0d1c4e5C07B071aa4E6A14A604D4F6478cAAC7B4")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x97767D7D04Fd0dB0A1a2478DCd4BA85290556B48")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x1c86B3CDF2a60Ae3a574f7f71d44E2C50BDdB87E")
      );
    if (contractName == "ShortingRewardssETH")
      return changetype<Address>(
        Address.fromHexString("0x12DC1273915A16ab8BD47bA7866B240c253e4c12")
      );
    if (contractName == "ShortingRewardssBTC")
      return changetype<Address>(
        Address.fromHexString("0xCed4055b47cfD0421f3727a35F69CE659c8bAF7a")
      );
    if (contractName == "TokenStatesAAVE")
      return changetype<Address>(
        Address.fromHexString("0x9BcED8A8E3Ad81c9b146FFC880358f734A06f7c0")
      );
    if (contractName == "ProxysAAVE")
      return changetype<Address>(
        Address.fromHexString("0xd2dF355C19471c8bd7D8A3aa27Ff4e26A21b4076")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0xaB38249f4f56Ef868F6b5E01D9cFa26B952c1270")
      );
    if (contractName == "TokenStatesUNI")
      return changetype<Address>(
        Address.fromHexString("0x9234733bD0F3E227e431BBE7B09CEB0E3E9755e3")
      );
    if (contractName == "ProxysUNI")
      return changetype<Address>(
        Address.fromHexString("0x30635297E450b930f8693297eBa160D9e6c8eBcf")
      );
    if (contractName == "SynthsUNI")
      return changetype<Address>(
        Address.fromHexString("0xAa1b12E3e5F70aBCcd1714F4260A74ca21e7B17b")
      );
    if (contractName == "TokenStatesYFI")
      return changetype<Address>(
        Address.fromHexString("0xF61F4A57C63340ac1Fd75578ae878c8a263aeC06")
      );
    if (contractName == "ProxysYFI")
      return changetype<Address>(
        Address.fromHexString("0x992058B7DB08F9734d84485bfbC243C4ee6954A7")
      );
    if (contractName == "SynthsYFI")
      return changetype<Address>(
        Address.fromHexString("0x0F393ce493d8FB0b83915248a21a3104932ed97c")
      );
    if (contractName == "TokenStatesDOT")
      return changetype<Address>(
        Address.fromHexString("0x73B1a2643507Cd30F11Dfcf2D974f4373E5BC077")
      );
    if (contractName == "ProxysDOT")
      return changetype<Address>(
        Address.fromHexString("0x1715AC0743102BF5Cd58EfBB6Cf2dC2685d967b6")
      );
    if (contractName == "SynthsDOT")
      return changetype<Address>(
        Address.fromHexString("0xfD0435A588BF5c5a6974BA19Fa627b772833d4eb")
      );
    if (contractName == "TokenStatesREN")
      return changetype<Address>(
        Address.fromHexString("0x6e6d86D88d2Ce382918EB4F062F0fff82B8c9b99")
      );
    if (contractName == "ProxysREN")
      return changetype<Address>(
        Address.fromHexString("0xD31533E8d0f3DF62060e94B3F1318137bB6E3525")
      );
    if (contractName == "SynthsREN")
      return changetype<Address>(
        Address.fromHexString("0x4287dac1cC7434991119Eba7413189A66fFE65cF")
      );
    if (contractName == "TokenStatesCOMP")
      return changetype<Address>(
        Address.fromHexString("0x5f298BD4391d32Af25368FA78dc210A56c7Ccc9c")
      );
    if (contractName == "ProxysCOMP")
      return changetype<Address>(
        Address.fromHexString("0xEb029507d3e043DD6C87F2917C4E82B902c35618")
      );
    if (contractName == "SynthsCOMP")
      return changetype<Address>(
        Address.fromHexString("0x34c76BC146b759E58886e821D62548AC1e0BA7Bc")
      );
    if (contractName == "TokenStateiAAVE")
      return changetype<Address>(
        Address.fromHexString("0xC43c0D8b2A3509d193974695568164C190af2AAF")
      );
    if (contractName == "ProxyiAAVE")
      return changetype<Address>(
        Address.fromHexString("0x176C674Ee533C6139B0dc8b458D72A93dCB3e705")
      );
    if (contractName == "SynthiAAVE")
      return changetype<Address>(
        Address.fromHexString("0x1cB27Ac646afAE192dF9928A2808C0f7f586Af7d")
      );
    if (contractName == "TokenStateiUNI")
      return changetype<Address>(
        Address.fromHexString("0x13caB49E4484C2E0624d2bdF3dADfAD43e5611f9")
      );
    if (contractName == "ProxyiUNI")
      return changetype<Address>(
        Address.fromHexString("0x36A00FF9072570eF4B9292117850B8FE08d96cce")
      );
    if (contractName == "SynthiUNI")
      return changetype<Address>(
        Address.fromHexString("0x3dD7b893c25025CabFBd290A5E06BaFF3DE335b8")
      );
    if (contractName == "TokenStateiYFI")
      return changetype<Address>(
        Address.fromHexString("0x643088Ad7A6CEB1ec95be0E7B382438399CA8e7C")
      );
    if (contractName == "ProxyiYFI")
      return changetype<Address>(
        Address.fromHexString("0x592244301CeA952d6daB2fdC1fE6bd9E53917306")
      );
    if (contractName == "SynthiYFI")
      return changetype<Address>(
        Address.fromHexString("0x1A4505543C92084bE57ED80113eaB7241171e7a8")
      );
    if (contractName == "TokenStateiDOT")
      return changetype<Address>(
        Address.fromHexString("0x41d85Df6513A86eb2eA186e2cf4ec0fE5dD16754")
      );
    if (contractName == "ProxyiDOT")
      return changetype<Address>(
        Address.fromHexString("0x46a97629C9C1F58De6EC18C7F536e7E6d6A6ecDe")
      );
    if (contractName == "SynthiDOT")
      return changetype<Address>(
        Address.fromHexString("0xF6ce55E09De0F9F97210aAf6DB88Ed6b6792Ca1f")
      );
    if (contractName == "TokenStateiREN")
      return changetype<Address>(
        Address.fromHexString("0x348C3c80c4F23574BC8cDF669A0Dc106a4E32BFf")
      );
    if (contractName == "ProxyiREN")
      return changetype<Address>(
        Address.fromHexString("0x0fEd38108bdb8e62ef7b5680E8E0726E2F29e0De")
      );
    if (contractName == "SynthiREN")
      return changetype<Address>(
        Address.fromHexString("0xacAAB69C2BA65A2DB415605F309007e18D4F5E8C")
      );
    if (contractName == "TokenStateiCOMP")
      return changetype<Address>(
        Address.fromHexString("0x673Be1f8b8e1F2AB64C475b44060EE39163423f0")
      );
    if (contractName == "ProxyiCOMP")
      return changetype<Address>(
        Address.fromHexString("0x6345728B1ccE16E6f8C509950b5c84FFF88530d9")
      );
    if (contractName == "SynthiCOMP")
      return changetype<Address>(
        Address.fromHexString("0x9A5Ea0D8786B8d17a70410A905Aed1443fae5A38")
      );
    if (contractName == "StakingRewardsiETH")
      return changetype<Address>(
        Address.fromHexString("0x3f27c540ADaE3a9E8c875C61e3B970b559d7F65d")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x778D2d3E3515e42573EB1e6a8d8915D4a22D9d54")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x273cA27361CbF5169fCb7C1391968b6371294420")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x0DecF74C966438C3b4578b46Dcc64C907141f670")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xaC87648CA3b88b6CE566aaC9d7f3c0eB635b3a1e")
      );
    if (contractName == "CollateralStateEth")
      return changetype<Address>(
        Address.fromHexString("0xbe5B5a7c198bC156474ed5c33CBf2F3F604F8fF8")
      );
    if (contractName == "CollateralEth")
      return changetype<Address>(
        Address.fromHexString("0x5c8344bcdC38F1aB5EB5C1d4a35DdEeA522B5DfA")
      );
    if (contractName == "CollateralStateErc20")
      return changetype<Address>(
        Address.fromHexString("0x8A1A00Df7aA0102497C7591912bA8301e8dB8CdB")
      );
    if (contractName == "CollateralErc20")
      return changetype<Address>(
        Address.fromHexString("0xaa03aB31b55DceEeF845C8d17890CC61cD98eD04")
      );
    if (contractName == "CollateralStateShort")
      return changetype<Address>(
        Address.fromHexString("0x13A114a3Fa8A6CE03a0C5488BE9e614d78eDdb0c")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0x1F2c3a1046c32729862fcB038369696e3273a516")
      );
    if (contractName == "RewardEscrowV2")
      return changetype<Address>(
        Address.fromHexString("0xDA4eF8520b1A57D7d63f1E249606D1A459698876")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0x045e507925d2e05D114534D0810a1abD94aca8d6")
      );
    if (contractName == "StakingRewardssEURCurve")
      return changetype<Address>(
        Address.fromHexString("0xc0d8994Cd78eE1980885DF1A0C5470fC977b5cFe")
      );
    if (contractName == "StakingRewardsiBTC")
      return changetype<Address>(
        Address.fromHexString("0x167009dcDA2e49930a71712D956f02cc980DcC1b")
      );
    if (contractName == "StakingRewardsiETH")
      return changetype<Address>(
        Address.fromHexString("0x6d4F135aF7DFCd4BDF6dCb9D7911F5d243872a52")
      );
    if (contractName == "StakingRewardsiBTC")
      return changetype<Address>(
        Address.fromHexString("0xDcdD9e45FA94cf50eCd3251dd8f8157B2D492DD9")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xd69b189020EF614796578AfE4d10378c5e7e1138")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x28d8458C76C7029257BAA10F86E9dA7481C513fb")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x6e6a43A8148B5c54A94C044a835476D3f3f4D59A")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x37B648a07476F4941D3D647f81118AFd55fa8a04")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xDB91E4B3b6E19bF22E810C43273eae48C9037e74")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xcf9bB94b5d65589039607BA66e3DAC686d3eFf01")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xC61b352fCc311Ae6B0301459A970150005e74b3E")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xEF285D339c91aDf1dD7DE0aEAa6250805FD68258")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x388fD1A8a7d36e03eFA1ab100a1c5159a3A3d427")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x6C85C5198C3CC4dB1b87Cb43b2674241a30f4845")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x9745606DA6e162866DAD7bF80f2AbF145EDD7571")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x5eDf7dd83fE2889D264fa9D3b93d0a6e6A45D6C6")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x87641989057242Bff28D0D6108d007C79774D06f")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xda3c83750b1FA31Fda838136ef3f853b41cb7a5a")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0x8350d1b2d6EF5289179fe49E5b0F208165B4e32e")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x29DD4A59F4D339226867e77aF211724eaBb45c02")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xf7B8dF8b16dA302d85603B8e7F95111a768458Cc")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x47bD14817d7684082E04934878EE2Dd3576Ae19d")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x6F927644d55E32318629198081923894FbFe5c07")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x0517A56da8A517e3b2D484Cc5F1Da4BDCfE68ec3")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x099CfAd1640fc7EA686ab1D83F0A285Ba0470882")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x2acfe6265D358d982cB1c3B521199973CD443C71")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x6Dc6a64724399524184C2c44a526A2cff1BaA507")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0xe3D5E1c1bA874C0fF3BA31b999967F24d5ca04e5")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0xA962208CDC8588F9238fae169d0F63306c353F4F")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xcd980Fc5CcdAe62B18A52b83eC64200121A929db")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x46A7Af405093B27DA6DeF193C508Bd9240A255FA")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x19cC1f63e344D74A87D955E3F3E95B28DDDc61d8")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x4D50A0e5f068ACdC80A1da2dd1f0Ad48845df2F8")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0xb73c665825dAa926D6ef09417FbE5654473c1b49")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x87eb6e935e3C7E3E3A0E31a5658498bC87dE646E")
      );
    if (contractName == "AddressResolver")
      return changetype<Address>(
        Address.fromHexString("0x823bE81bbF96BEc0e25CA13170F5AaCb5B79ba83")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x0bfDc04B38251394542586969E2356d0D731f7DE")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x611Abc0e066A01AFf63910fC8935D164267eC6CF")
      );
    if (contractName == "SynthsEOS")
      return changetype<Address>(
        Address.fromHexString("0xAf090d6E583C082f2011908cf95c2518BE7A53ac")
      );
    if (contractName == "SynthsBCH")
      return changetype<Address>(
        Address.fromHexString("0x7DA860eF331D22518C28E475af08a77e8599393A")
      );
    if (contractName == "SynthsETC")
      return changetype<Address>(
        Address.fromHexString("0x21ee4afBd6c151fD9A69c1389598170B1d45E0e3")
      );
    if (contractName == "SynthsDASH")
      return changetype<Address>(
        Address.fromHexString("0xcb6Cb218D558ae7fF6415f95BDA6616FCFF669Cb")
      );
    if (contractName == "SynthsXMR")
      return changetype<Address>(
        Address.fromHexString("0x7B29C9e188De18563B19d162374ce6836F31415a")
      );
    if (contractName == "SynthsADA")
      return changetype<Address>(
        Address.fromHexString("0xC22e51FA362654ea453B4018B616ef6f6ab3b779")
      );
    if (contractName == "SynthsFTSE")
      return changetype<Address>(
        Address.fromHexString("0x3E2dA260B4A85782A629320EB027A3B7c28eA9f1")
      );
    if (contractName == "SynthsNIKKEI")
      return changetype<Address>(
        Address.fromHexString("0xc02DD182Ce029E6d7f78F37492DFd39E4FEB1f8b")
      );
    if (contractName == "SynthiEOS")
      return changetype<Address>(
        Address.fromHexString("0x806A599d60B2FdBda379D5890287D2fba1026cC0")
      );
    if (contractName == "SynthiBCH")
      return changetype<Address>(
        Address.fromHexString("0x13Fae0E7E85ba720078038bea5011C2957cDcef2")
      );
    if (contractName == "SynthiETC")
      return changetype<Address>(
        Address.fromHexString("0xCea42504874586a718954746A564B72bc7eba3E3")
      );
    if (contractName == "SynthiDASH")
      return changetype<Address>(
        Address.fromHexString("0x947d5656725fB9A8f9c826A91b6082b07E2745B7")
      );
    if (contractName == "SynthiXMR")
      return changetype<Address>(
        Address.fromHexString("0x186E56A62E7caCE1308f1A1B0dbb27f33F80f16f")
      );
    if (contractName == "SynthiADA")
      return changetype<Address>(
        Address.fromHexString("0x931c5516EE121a177bD2B60e0122Da5B27630ABc")
      );
    if (contractName == "Liquidations")
      return changetype<Address>(
        Address.fromHexString("0xAD95C918af576c82Df740878C3E983CBD175daB6")
      );
    if (contractName == "BinaryOptionMarketFactory")
      return changetype<Address>(
        Address.fromHexString("0x211bA925B35b82246a3CCfa3A991a39A840f025C")
      );
    if (contractName == "BinaryOptionMarketManager")
      return changetype<Address>(
        Address.fromHexString("0x915D1c9dF12142B535F6a7437F0196D80bCCC1BD")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x4751775867ebB3b5aa436a2F33D1e1ccA4157F35")
      );
    if (contractName == "TradingRewards")
      return changetype<Address>(
        Address.fromHexString("0x62922670313bf6b41C580143d1f6C173C5C20019")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x12c815b0c404D66Dd0491f4EC62839904cec25e7")
      );
    if (contractName == "SynthsOIL")
      return changetype<Address>(
        Address.fromHexString("0x2962EA4E749e54b10CFA557770D597027BA67cB3")
      );
    if (contractName == "SynthiOIL")
      return changetype<Address>(
        Address.fromHexString("0x53869BDa4b8d85aEDCC9C6cAcf015AF9447Cade7")
      );
    if (contractName == "CollateralManagerState")
      return changetype<Address>(
        Address.fromHexString("0x573E5105c4B92416D1544A188F1bf77d442Bb52d")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0x067e398605E84F2D0aEEC1806e62768C5110DCc6")
      );
    if (contractName == "CollateralStateEth")
      return changetype<Address>(
        Address.fromHexString("0x04D9231B1fff88464a3d26Fd91A1bA0b24796107")
      );
    if (contractName == "CollateralEth")
      return changetype<Address>(
        Address.fromHexString("0x3FF5c0A14121Ca39211C95f6cEB221b86A90729E")
      );
    if (contractName == "CollateralStateErc20")
      return changetype<Address>(
        Address.fromHexString("0x54277B3a7A4aEe0fdF279E16aBF9D5Dad87828D6")
      );
    if (contractName == "CollateralErc20")
      return changetype<Address>(
        Address.fromHexString("0x3B3812BB9f6151bEb6fa10783F1ae848a77a0d46")
      );
    if (contractName == "CollateralStateShort")
      return changetype<Address>(
        Address.fromHexString("0xd322259B4D93F81a2a59f6010BEC166F6f5E870c")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0x188C2274B04Ea392B21487b5De299e382Ff84246")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x93b434b2e21d0F4E3ed1e9efa3Aa254A6D863B2A")
      );
    if (contractName == "StakingRewardsiETH")
      return changetype<Address>(
        Address.fromHexString("0x3fdbbbd81b0962fdf486d74f94a68c70ba87c6c7")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xf87A0587Fe48Ca05dd68a514Ce387C0d4d3AE31C")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xd3970a9D35d2Be3aaf62D2b5B2be3Ee303aC4228")
      );
    if (contractName == "StakingRewardsiBTC")
      return changetype<Address>(
        Address.fromHexString("0x32C9F03490A9F560EccC9f107e71560C1b0A2535")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xA68C6020fF9Ea79F05345cDd2CE37DF4b89478ed")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x7e6ab054070599ca7B1552aEa7962b6B344A9950")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x300F0f100389282b51F1Bc486D8c2ad22B6C4E42")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xdd692195b3b632B196FE33eB274CCBE91b8D849f")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x198A560EA4842c8E64Dd7cF445C5fBC5903B2736")
      );
    if (contractName == "TokenStatesOIL")
      return changetype<Address>(
        Address.fromHexString("0x98d7CcF403B8BD2F6DC3F3cA4161f1E8db3dD080")
      );
    if (contractName == "ProxysOIL")
      return changetype<Address>(
        Address.fromHexString("0x6d16cF3EC5F763d4d99cB0B0b110eefD93B11B56")
      );
    if (contractName == "SynthsOIL")
      return changetype<Address>(
        Address.fromHexString("0xDE3Eaa39875d0528A575dBcC436b2C6ae9fc353c")
      );
    if (contractName == "TokenStateiOIL")
      return changetype<Address>(
        Address.fromHexString("0xF92BE89BF1aebA61AC48D90CF7C9Ac2b3616c4Da")
      );
    if (contractName == "ProxyiOIL")
      return changetype<Address>(
        Address.fromHexString("0xA5a5DF41883Cdc00c4cCC6E8097130535399d9a3")
      );
    if (contractName == "SynthiOIL")
      return changetype<Address>(
        Address.fromHexString("0x54EA32890a1bDB1C1aE106C921bE010F2C7faaC2")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xda80E6024bC82C9fe9e4e6760a9769CF0D231E80")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xc4942df0d3c561c71417BBA09d2DEA7a3CC676Fb")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x2BA226A6134516457471583AE172457b189187C0")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x703D37fb776A4C905e28f7Ff23C73102ce36E08B")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xdB2Ae36C2e9C00070e5bF752Be1FA2d477E98BDa")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x013D16CB1Bd493bBB89D45b43254842FadC169C8")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x705142E6f3970F004721bdf05b696B45Fc4aD6d7")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xB9c9B2D4A514d0c00266FBbCBd2f471da984861a")
      );
    if (contractName == "EtherCollateralsUSD")
      return changetype<Address>(
        Address.fromHexString("0xfED77055B40d63DCf17ab250FFD6948FBFF57B82")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xbCc4ac49b8f57079df1029dD3146C8ECD805acd0")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x17eC614dB5db8C6917BA7Be639507d3CEb95a4D2")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x6eB3aC83701f624bAEfBc50db654b53d1F51dC94")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x1d53a13D78766C0Db6eF73eC0ae1138eA2b6f5D4")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x62D6c67b2c06e9d7b889cc1d1b3a24F3370f241A")
      );
    if (contractName == "Liquidations")
      return changetype<Address>(
        Address.fromHexString("0x46338723022deF2c5151e83BE759796A988754a2")
      );
    if (contractName == "FlexibleStorage")
      return changetype<Address>(
        Address.fromHexString("0xc757aCBa3c0506218b3022266a9DC7F3612d85f5")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x26C6C7F10e271Eef0011d07319622F31d22D139c")
      );
    if (contractName == "TradingRewards")
      return changetype<Address>(
        Address.fromHexString("0xfF535F02CE0Df35D52c7A1bdace447101D2514D3")
      );
    if (contractName == "StakingRewardsiETH")
      return changetype<Address>(
        Address.fromHexString("0x6Dc0b8A7DACe47Bc75D2dDFDF8BF29e363d92693")
      );
    if (contractName == "StakingRewardsiBTC")
      return changetype<Address>(
        Address.fromHexString("0xE5Ea1DDA3299C0b133a93A47eF9F5536C6892AcE")
      );
    if (contractName == "BinaryOptionMarketData")
      return changetype<Address>(
        Address.fromHexString("0xe523184876c97945da45998582526cDb6a3dA260")
      );
    if (contractName == "SynthUtil")
      return changetype<Address>(
        Address.fromHexString("0x81Aee4EA48f678E172640fB5813cf7A96AFaF6C3")
      );
    if (contractName == "DappMaintenance")
      return changetype<Address>(
        Address.fromHexString("0xAb0B2f1Cf979cdbF4676251F35353eC5AF2732Dd")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x439502C922ADA61FE49329248B7A8ecb31C0b329")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0x7133afF303539b0A4F60Ab9bd9656598BF49E272")
      );
    if (contractName == "StakingRewardsSNXBalancer")
      return changetype<Address>(
        Address.fromHexString("0xFBaEdde70732540cE2B11A8AC58Eb2dC0D69dE10")
      );
    if (contractName == "StakingRewardsiETH")
      return changetype<Address>(
        Address.fromHexString("0xC746bc860781DC90BBFCD381d6A058Dc16357F8d")
      );
    if (contractName == "StakingRewardssBTCCurve")
      return changetype<Address>(
        Address.fromHexString("0x13C1542A468319688B89E323fe9A3Be3A90EBb27")
      );
    if (contractName == "StakingRewardssUSDCurve")
      return changetype<Address>(
        Address.fromHexString("0xDCB6A51eA3CA5d3Fd898Fd6564757c7aAeC3ca92")
      );
    if (contractName == "StakingRewardssXAUUniswapV2")
      return changetype<Address>(
        Address.fromHexString("0x8302FE9F0C509a996573D3Cc5B0D5D51e4FDD5eC")
      );
    if (contractName == "BinaryOptionMarketFactory")
      return changetype<Address>(
        Address.fromHexString("0x72c091691b5cD86fAcD048972157985f74Ea1F07")
      );
    if (contractName == "BinaryOptionMarketManager")
      return changetype<Address>(
        Address.fromHexString("0x8071bA88e58a19176EF007995FB5D9E1Faa73F92")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x5eF0de4bd373e435341Cd82311dfb13d5E8fdEf5")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xba727c69636491ecdfE3E6F64cBE9428aD371e48")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x6AAeBDfbf23134eF8d81deB2E253f32394B2857B")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x4E2f13a347584b17F99521497B987f01660b877d")
      );
    if (contractName == "AddressResolver")
      return changetype<Address>(
        Address.fromHexString("0x61166014E3f04E40C953fe4EAb9D9E40863C83AE")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xfaDAFb3ece40Eac206404B8dF5aF841F16f60E62")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xb7D018F57b82D1523f15a270d6b942836204310b")
      );
    if (contractName == "BinaryOptionMarketFactory")
      return changetype<Address>(
        Address.fromHexString("0x8EC58faA4c1B693B50B7F1331897AD6B52Dd824A")
      );
    if (contractName == "BinaryOptionMarketManager")
      return changetype<Address>(
        Address.fromHexString("0x673e76631981Cb55783527F744e581ABA8Cf406D")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x21bD6b9C3cB3f7E0c6Aa7061D2B02f22CDEbD2aB")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xc6738ed1Eb79FA23941c75b4f437fC65893b5476")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x7Dfe5aa8fc36c0Ae788a3a71062728bFc3036216")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xEB4c3266E1b295654EC36F16FFCFD24D3Ef3E735")
      );
    if (contractName == "Liquidations")
      return changetype<Address>(
        Address.fromHexString("0x9f9C7BA80442767e7BeF5E8121cEc53cF8182827")
      );
    if (contractName == "EternalStorageLiquidations")
      return changetype<Address>(
        Address.fromHexString("0x0F7c200C4d3b5570C777764884Ce6DE67F31D3Ba")
      );
    if (contractName == "ReadProxyAddressResolver")
      return changetype<Address>(
        Address.fromHexString("0x4E3b31eB0E5CB73641EE1E65E7dCEFe520bA3ef2")
      );
    if (contractName == "TokenStatesEOS")
      return changetype<Address>(
        Address.fromHexString("0x631443C4121ca7B4c90dC79a37B1DcE8B79aDeEc")
      );
    if (contractName == "ProxysEOS")
      return changetype<Address>(
        Address.fromHexString("0x88C8Cf3A212c0369698D13FE98Fcb76620389841")
      );
    if (contractName == "SynthsEOS")
      return changetype<Address>(
        Address.fromHexString("0x31a9c51eEd5282F11ae5CDD061A65A4ce0346C08")
      );
    if (contractName == "TokenStatesBCH")
      return changetype<Address>(
        Address.fromHexString("0xb7ee031093B9578DF124983823330BBe277FD8b4")
      );
    if (contractName == "ProxysBCH")
      return changetype<Address>(
        Address.fromHexString("0x36a2422a863D5B950882190Ff5433E513413343a")
      );
    if (contractName == "SynthsBCH")
      return changetype<Address>(
        Address.fromHexString("0x9b68b85c61B082B2495B342F26B20a57cFd73D26")
      );
    if (contractName == "TokenStatesETC")
      return changetype<Address>(
        Address.fromHexString("0xd4DB55Cf39c37BEAa3A47F2555D57B4ea2d9Ff39")
      );
    if (contractName == "ProxysETC")
      return changetype<Address>(
        Address.fromHexString("0x22602469d704BfFb0936c7A7cfcD18f7aA269375")
      );
    if (contractName == "SynthsETC")
      return changetype<Address>(
        Address.fromHexString("0x2369D37ae9B30451D859C11CAbAc70df1CE48F78")
      );
    if (contractName == "TokenStatesDASH")
      return changetype<Address>(
        Address.fromHexString("0x136b1EC699c62b0606854056f02dC7Bb80482d63")
      );
    if (contractName == "ProxysDASH")
      return changetype<Address>(
        Address.fromHexString("0xfE33ae95A9f0DA8A845aF33516EDc240DCD711d6")
      );
    if (contractName == "SynthsDASH")
      return changetype<Address>(
        Address.fromHexString("0xc66499aCe3B6c6a30c784bE5511E8d338d543913")
      );
    if (contractName == "TokenStatesXMR")
      return changetype<Address>(
        Address.fromHexString("0x23d5381713841724A67B731026b32322228cA3C7")
      );
    if (contractName == "ProxysXMR")
      return changetype<Address>(
        Address.fromHexString("0x5299d6F7472DCc137D7f3C4BcfBBB514BaBF341A")
      );
    if (contractName == "SynthsXMR")
      return changetype<Address>(
        Address.fromHexString("0x86FD9c0261E804476bA11056fFD758da2469ed56")
      );
    if (contractName == "TokenStatesADA")
      return changetype<Address>(
        Address.fromHexString("0x9956c5019a24fbd5B506AD070b771577bAc5c343")
      );
    if (contractName == "ProxysADA")
      return changetype<Address>(
        Address.fromHexString("0xe36E2D3c7c34281FA3bC737950a68571736880A1")
      );
    if (contractName == "SynthsADA")
      return changetype<Address>(
        Address.fromHexString("0x1Cda42C559D2EB137103D9A01d1ae736dEDA3aEF")
      );
    if (contractName == "TokenStatesFTSE")
      return changetype<Address>(
        Address.fromHexString("0xD1B420854527e4b0e489bd37ec8f9DB1E6305515")
      );
    if (contractName == "ProxysFTSE")
      return changetype<Address>(
        Address.fromHexString("0x23348160D7f5aca21195dF2b70f28Fce2B0be9fC")
      );
    if (contractName == "SynthsFTSE")
      return changetype<Address>(
        Address.fromHexString("0x8D34924EAe7578692775fDd94Ed27bc355397E4a")
      );
    if (contractName == "TokenStatesNIKKEI")
      return changetype<Address>(
        Address.fromHexString("0xc69D8B688a309FDEa9273DDE1A46bF1e51928a55")
      );
    if (contractName == "ProxysNIKKEI")
      return changetype<Address>(
        Address.fromHexString("0x757de3ac6B830a931eF178C6634c5C551773155c")
      );
    if (contractName == "SynthsNIKKEI")
      return changetype<Address>(
        Address.fromHexString("0x4CeB220C5E38E27ef5187F7ab853aC182D233d39")
      );
    if (contractName == "TokenStateiEOS")
      return changetype<Address>(
        Address.fromHexString("0x68a8b098967Ae077dcFf5cC8E29B7cb15f1A3cC8")
      );
    if (contractName == "ProxyiEOS")
      return changetype<Address>(
        Address.fromHexString("0xF4EebDD0704021eF2a6Bbe993fdf93030Cd784b4")
      );
    if (contractName == "SynthiEOS")
      return changetype<Address>(
        Address.fromHexString("0xc66a263f2C7C1Af0bD70c6cA4Bff5936F3D6Ef9F")
      );
    if (contractName == "TokenStateiBCH")
      return changetype<Address>(
        Address.fromHexString("0x780a7206313F411db5f32c79B15B1C80FaABED59")
      );
    if (contractName == "ProxyiBCH")
      return changetype<Address>(
        Address.fromHexString("0xf6E9b246319ea30e8C2fA2d1540AAEBF6f9E1B89")
      );
    if (contractName == "SynthiBCH")
      return changetype<Address>(
        Address.fromHexString("0x0E87a320daCE86A0b427FA2Bae282dE5c7697278")
      );
    if (contractName == "TokenStateiETC")
      return changetype<Address>(
        Address.fromHexString("0x71892d13BA2b19f196760f619eE9C67534a49E37")
      );
    if (contractName == "ProxyiETC")
      return changetype<Address>(
        Address.fromHexString("0xd50c1746D835d2770dDA3703B69187bFfeB14126")
      );
    if (contractName == "SynthiETC")
      return changetype<Address>(
        Address.fromHexString("0xF13f9E75913b352622F8AEEA5Ac32498b1C228d0")
      );
    if (contractName == "TokenStateiDASH")
      return changetype<Address>(
        Address.fromHexString("0x01ADA1140cA795897c45016Dfd296382267b264a")
      );
    if (contractName == "ProxyiDASH")
      return changetype<Address>(
        Address.fromHexString("0xCB98f42221b2C251A4E74A1609722eE09f0cc08E")
      );
    if (contractName == "SynthiDASH")
      return changetype<Address>(
        Address.fromHexString("0x5f7A299Be82D8f5A626300c62C477b233F616121")
      );
    if (contractName == "TokenStateiXMR")
      return changetype<Address>(
        Address.fromHexString("0xE20117888AB22ACF65b02C196A9f8423b502876c")
      );
    if (contractName == "ProxyiXMR")
      return changetype<Address>(
        Address.fromHexString("0x4AdF728E2Df4945082cDD6053869f51278fae196")
      );
    if (contractName == "SynthiXMR")
      return changetype<Address>(
        Address.fromHexString("0xC5D2b3f5DAf11B6111Af86a72A5938B0fE6c5045")
      );
    if (contractName == "TokenStateiADA")
      return changetype<Address>(
        Address.fromHexString("0xD636802A5b903b23726189D9B89daAD2750177FA")
      );
    if (contractName == "ProxyiADA")
      return changetype<Address>(
        Address.fromHexString("0x8A8079c7149B8A1611e5C5d978DCA3bE16545F83")
      );
    if (contractName == "SynthiADA")
      return changetype<Address>(
        Address.fromHexString("0x9D4193187B247a400E8D8ba716F1C18c0dC65528")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x8a34AefF4cDed94aFa786fcf811A6307aA7c656a")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x2987252148e34863612Ac7f4Ef3260de0C2A68f7")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xe04d8770Dc06135Dd97214ea8bcbf7B1CC057AA3")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x17628A557d1Fc88D1c35989dcBAC3f3e275E2d2B")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x253914cf059f4c3E277c28060C404acFc38FB6e2")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x2fB419E7023b32201e9aB3aba947f5c101a5C30e")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xB3098Ae40f488ffdb979827Fd01597CC20c5a5A0")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x8ed1B71B00DbaB96A6db6DF0C910f749243de6D3")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xAe38b81459d74A8C16eAa968c792207603D84480")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x1B9d6cD65dDC981410cb93Af91B097667E0Bc7eE")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0xA408d8e01C8E084B67559226C5B55D6F0B7074e2")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xD0DC005d31C2979CC0d38718e23c82D1A50004C0")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xadaD43Be81E2206f6D1aF4299cA2a029e16af7AB")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xc704c9AA89d1ca60F67B3075d05fBb92b3B00B3B")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0xaE55F163337A2A46733AA66dA9F35299f9A46e9e")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xf86048DFf23cF130107dfB4e6386f574231a5C65")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0x15fd6e554874B9e70F832Ed37f231Ac5E142362f")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0xD1599E478cC818AFa42A4839a6C665D9279C3E50")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0xC4Be4583bc0307C56CF301975b2B2B1E5f95fcB2")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x91DBC6f587D043FEfbaAD050AB48696B30F13d89")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x1228c7D8BBc5bC53DB181bD7B1fcE765aa83bF8A")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0xdD87cbDe3C1f8F728C7924c8C9C983Af6dfcfeA8")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x6dFDFbfB4B180be4482F8b753fb33720C2831a9f")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x5eA2544551448cF6DcC1D853aDdd663D480fd8d3")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x817c39c8825e12eA7752483c85dd2c800b78B357")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0xF5d0BFBc617d3969C1AcE93490A76cE80Db1Ed0e")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0x6cF29c515A33209c6eCa43c293004ac80c0614f0")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xAf918f4a72BC34E59dFaF65866feC87947F1f590")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xf5a6115Aa582Fd1BEEa22BC93B7dC7a785F60d03")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x71Cd588eFA3609bc14E7B0c7C57dDDfd3a72E8a2")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x63d630B6D89c21E171E86c51C7243284510DBd79")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0x0f5BdfD0958345C2e7Adb1741024aEd6Dd159e6C")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x489d4D4c4bC781EAab3A36C44d66762Ceb6e1e2D")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x271d0C1940fE546e787B273A0CCc780ECD8db461")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xdE51788d7113bCf845b62B878bD5Ed971A49CF85")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x4534E92eefecc63C6105F53893D355C14aA129cf")
      );
    if (contractName == "DelegateApprovalsEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0x8F586F063ffbb89b186C8e604FC6614766f9C9d1")
      );
    if (contractName == "Unipool")
      return changetype<Address>(
        Address.fromHexString("0x48D7f315feDcaD332F68aafa017c7C158BC54760")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x8454190C164e52664Af2c9C24ab58c4e14D6bbE4")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x357b58E0b1Be9d8A944380048fa1080c57c7A362")
      );
    if (contractName == "IssuanceEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0x631E93A0fb06B5eC6d52c0A2D89a3f9672d6Ba64")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0xE1f64079aDa6Ef07b03982Ca34f1dD7152AA3b86")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x9D7F70AF5DF5D5CC79780032d47a34615D1F1d77")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x1Be675c50C4cC419517219B88fE84a573cC223fA")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x153C3148A0a285A6f9F6d1996E1348832249bF7e")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xACa2179a884bAC7C3D0bc4131585E1B7DbDD048e")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xF0ac210915BD88Ea51c9EB800a4078a85927efdF")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x64C73355FBD0274e677609E8fb372427DF975508")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x57e4A2D7D9b759Cf6FA2C937D52E408c66fB6384")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x8FA7FBb0144CeA832a76547aEAB1Ad8d9e4588F1")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x68043c3EAE66Ac1c28341867491E615412fc84FD")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x2A020C1ad728f1C12735bC4877CEECa4491A4a3D")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xd415e342a5C7Ee189D939b4DC17E85880fE1096A")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x00aB7c26A5a6C4C32D0b897E4Af3CB32F92aad34")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0x96f9D144E55149437640512B82d7Dda065E89773")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x9f71b6596b2C9d357f9F04F8cA772fbD6e2c211C")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xaE3971E603b11dA40aea85d8c2355150c7c47683")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0x810425566d1d3078B15A6f035b17886F18F3c54B")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0xc0bA711B4E128425Be9245ce750D82c90b42D6D2")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xc68b5Eb9e035b2B84568A4C6201e3b200C0236ba")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x54A0326fB698c2CFACa5327550a897FA66d21f07")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x3d0e7c09242b0cAd4e81cB2f6D2183EF517500EF")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x2CB1B47fB16013798086f267E04E6579dcb72A74")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x10A0532DE3C86D9cE810F004FaBcf5a1EA464390")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x2DE37AF5BA64f5CaE3202Bf13dbEDc4D46e8046f")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x59D39e14cC735b39746c94351E7fbDd92C8D0d3C")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x2420057461bD2fb756e0A610897c51De7fB18311")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0xf7011510572d0EFE31d1E90cd6dc1EF84e6B13b8")
      );
    if (contractName == "RewardsDistribution")
      return changetype<Address>(
        Address.fromHexString("0x29C295B046a73Cde593f21f63091B072d407e3F2")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x4dc1E8bAcc26D563941dCB59c72BD9FE58663778")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0x79BEf89A63bE04A75F1fA42E8f42ad873B6f43e2")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x3D663Dbe79fA9752815e03e129D6703eDE1C6D71")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xE725d6Ff29d0679C9Cb6Fa8972a1E8a7FB49610B")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0xccda7941aB1AC7a32F49843c0b3EDF618b20F6Ae")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x8c6680412e914932A9abC02B6c7cbf690e583aFA")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0xfca2e82E5414c695c81b99D753b0b11c50bDC93D")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0xaE7D62Fb6a305E6d9E9F8c43bbb41093c2bE52f6")
      );
    if (contractName == "AddressResolver")
      return changetype<Address>(
        Address.fromHexString("0xFbB6526ed92DA8915d4843a86166020d0B7bAAd0")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x6289fd70d3Dce8DE61896959cdEfcFF3cE46A108")
      );
    if (contractName == "ExchangeState")
      return changetype<Address>(
        Address.fromHexString("0x545973f28950f50fc6c7F52AAb4Ad214A27C0564")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x23Bf838AF72Ee8F43870A73947d8F4Edb63adAe3")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0x0F3d8ad599Be443A54c7934B433A87464Ed0DFdC")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x94dBa784e87A3F5F12e25EC98bF14233c1e69017")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x7cB89c509001D25dA9938999ABFeA6740212E5f0")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0xA05e45396703BabAa9C276B5E5A9B6e2c175b521")
      );
    if (contractName == "Math")
      return changetype<Address>(
        Address.fromHexString("0x385e1Eb2FF28F4A637DA2C9971F8CAF5F5b1E77c")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xE95Ef4e7a04d2fB05cb625c62CA58da10112c605")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xa6FE80c4c4AADb4B33dB7f22dc9AE2C4697cC406")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x6bCd1caE4A3c099c696B51f889bE2120DF62b7c0")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xfF0b8894CC44F300e124bcd39F95555816b8B1d5")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x68473dc4B7A4b0867fd7C5b9A982Fea407DAD320")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x486e27D56c0744970687927728598F8B96451Cc4")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x4B1cE9C42A381CB2d74ffeF20103e502e2fc619C")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x289e9a4674663decEE54f781AaDE5327304A32f8")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x3A412043939d9F7e53373b64f858ecB870a92E50")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x4d96b67f5BDe58A622D9bF2B8a1906C8B084fAf4")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0x30A46E656CdcA6B401Ff043e1aBb151490a07ab0")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xD81AdA188331e627567BBEF80F91217cd3109592")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xE5787927410b659cc4eA2441cDaa361f9D7b250C")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0x83266A95429b903cC5e954bF61c7eddf8a52b971")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0xf53B56B6Fb98aaF514bcd28f6Fa6fd20C24E5c22")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x09400Ec683F70174E1217d6dcdBf42448E8De5d6")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x84965DCa28c4Eb9dE61d80f80e811eA12BE1c819")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x1A60E2E2A8BE0BC2B6381dd31Fd3fD5F9A28dE4c")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0xe109da5361299eD96D91146B8Cc12F682D21964e")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0xD95e7F80766580634B2E0E49d9F66af317994FC7")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x406555dbF02e9E4df9AdeAeC9DA76ABeED8C1BC3")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xAD7258d0054c03112a4f5489A4B24eC34a2fc787")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x8a3ca1d2d9a05683EB4DB447d0e3122Fec09d9ee")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0xDa5eD43B9B6E36b4f27cc6D8c1974532cdBd55F9")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0xC64CdA66Bc1d026b984D6BEE6aDBf71eAc8A099d")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0x088256945480c884C067a8Bc98A72A1C984f826B")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x46824bFAaFd049fB0Af9a45159A88e595Bbbb9f7")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xF778Ec504245EfE1eA010C5C3E50b6F5f5E117da")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0xd7adF1b5E31D1C40E08F16a2095338ce3aA8f2Fc")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x3DdF5dAd59F8F8e8f957709B044eE84e87B42e25")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0xec98BB42C8F03485bf659378da694512a16f3482")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0xC5Bfbc63dc8D36E81434e93e0ee097999879d7F4")
      );
    if (contractName == "DappMaintenance")
      return changetype<Address>(
        Address.fromHexString("0x778ec2d9B4baE65C57a6436a6c37AFc135baD727")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xA8CB0B163cEfB21f22c72f6a7d243184bD688A5A")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x9642c7026822391100a4773d7aA597AE18ECE7dd")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x22a67ECd108f7A6Fc52Da9e2655DDfe88ecCd9CA")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x2656a6E566f8e60f444B283bf346fC74A9990c96")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x0577d4268ABE6777aE37688D015598819088297B")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x565C9EB432f4AE9633e50e1213AB4f23D8f31f54")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xb211e3b026b6DB2f65F5C5ec03d44Bb97BB69fB8")
      );
    if (contractName == "TokenStatesXRP")
      return changetype<Address>(
        Address.fromHexString("0xb90AafFB61dFC042e7a7AbcE069DDB4BAE9ab192")
      );
    if (contractName == "ProxysXRP")
      return changetype<Address>(
        Address.fromHexString("0xa2B0fDe6D710e201d0d608e924A484d1A5fEd57c")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0xFf6866FF46c71706DcD5A0A38f12279553bE6233")
      );
    if (contractName == "TokenStatesLTC")
      return changetype<Address>(
        Address.fromHexString("0xe1a2C7957a4771031301f2E25b0f52039aD97270")
      );
    if (contractName == "ProxysLTC")
      return changetype<Address>(
        Address.fromHexString("0xC14103C2141E842e228FBaC594579e798616ce7A")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0x8e0cC15bBCd10E170AC07982B5D6930502C63784")
      );
    if (contractName == "TokenStatesLINK")
      return changetype<Address>(
        Address.fromHexString("0x577D4a7395c6A5f46d9981a5F83fa7294926aBB0")
      );
    if (contractName == "ProxysLINK")
      return changetype<Address>(
        Address.fromHexString("0xbBC455cb4F1B9e4bFC4B73970d360c8f032EfEE6")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x34B19046c6657D26B0C9b63d3Fb54C2754Ed4537")
      );
    if (contractName == "TokenStatesDEFI")
      return changetype<Address>(
        Address.fromHexString("0x7Ac2D37098a65B0f711CFfA3be635F1E6aCacFaB")
      );
    if (contractName == "ProxysDEFI")
      return changetype<Address>(
        Address.fromHexString("0xe1aFe1Fd76Fd88f78cBf599ea1846231B8bA3B6B")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x4917E9Ef69E3a1C82651c9158cA2c25b3A564760")
      );
    if (contractName == "TokenStateiXRP")
      return changetype<Address>(
        Address.fromHexString("0xa9d6aE0F9E9da6FFC357Cd155CCe18E3491e135D")
      );
    if (contractName == "ProxyiXRP")
      return changetype<Address>(
        Address.fromHexString("0x27269b3e45A4D3E79A3D6BFeE0C8fB13d0D711A6")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0xcBBb17D9767bD57FBF4Bbf8842E916bCb3826ec1")
      );
    if (contractName == "TokenStateiLINK")
      return changetype<Address>(
        Address.fromHexString("0x3FdF819c3665D6866b5Bb0F56E1EDA0D7f69B714")
      );
    if (contractName == "ProxyiLINK")
      return changetype<Address>(
        Address.fromHexString("0x2d7aC061fc3db53c39fe1607fB8cec1B2C162B01")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0xEC114001D23eeFE6624Fb42cCbF4b3c793e295f1")
      );
    if (contractName == "TokenStateiLTC")
      return changetype<Address>(
        Address.fromHexString("0x7B1010586F923CbF61e7C314146853675705751F")
      );
    if (contractName == "ProxyiLTC")
      return changetype<Address>(
        Address.fromHexString("0x79da1431150C9b82D2E5dfc1C68B33216846851e")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0x05DD55C18999b4a2f905978C029B85dA37750170")
      );
    if (contractName == "TokenStateiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x6E9BAC2827dBBa78D11b270115086CC357988928")
      );
    if (contractName == "ProxyiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x14d10003807AC60d07BB0ba82cAeaC8d2087c157")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x8E39e807D9eaE1cED9BCE296F211c38BA5ab2f9B")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x42D03f506c2308ECd06aE81D8fA22352BC7A8F2b")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x99a46c42689720d9118FF7aF7ce80C2a92fC4f97")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xc566a81F193626ee88A85fB3dCC82279B96A094E")
      );
    if (contractName == "ProxysAUD")
      return changetype<Address>(
        Address.fromHexString("0xF48e200EAF9906362BB1442fca31e0835773b8B4")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6")
      );
    if (contractName == "ProxysCHF")
      return changetype<Address>(
        Address.fromHexString("0x0F83287FF768D1c1e17a42F44d644D7F22e8ee1d")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0xD71eCFF9342A5Ced620049e616c5035F1dB98620")
      );
    if (contractName == "ProxysGBP")
      return changetype<Address>(
        Address.fromHexString("0x97fe22E7341a0Cd8Db6F6C021A24Dc8f4DAD855F")
      );
    if (contractName == "ProxysJPY")
      return changetype<Address>(
        Address.fromHexString("0xF6b1C627e95BFc3c1b4c9B825a032Ff0fBf3e07d")
      );
    if (contractName == "ProxysXAG")
      return changetype<Address>(
        Address.fromHexString("0x6A22e5e94388464181578Aa7A6B869e00fE27846")
      );
    if (contractName == "ProxysXAU")
      return changetype<Address>(
        Address.fromHexString("0x261EfCdD24CeA98652B9700800a13DfBca4103fF")
      );
    if (contractName == "ProxyXDR")
      return changetype<Address>(
        Address.fromHexString("0xb3f67dE9a919476a4c0fE821d67bf5C4637D8429")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xA36aC1f924087B7B959592c3D89Cb066D1Cc35D5")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x710882750DDe5DBc64e5a7df23a8cF068dF74910")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x832177F21CCDcc286003faDF4e98fc11dc5C627F")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x296b019E6dF25Ce3b71d4239b8C7CEc1a417d4E9")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x45AA2F706C3d695aCC1DA9698Fb803b8Ef5157ba")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xD8C733Ac0B2Db47BbA7af7716Eb696e62C417D5b")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x11Dfa1Bf994Ea47e361eC474519Afd627e932eb0")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xd8B325e9a95aBc44cEdc90AAb64ec1f231F2Cc8f")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xD6308849094c5E6Eb0EDAba255A06Ca32B0106Bf")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x4a15d9dfC95ba7B9e33CE70e7E0762dc8F7AC237")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0x6025f88ABB6d99d02c5EEd82C151d52Bac8E444b")
      );
    if (contractName == "ProxysETH")
      return changetype<Address>(
        Address.fromHexString("0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x8519d1BDb4cC1753DF95C6E98F6Bd0E95dE568D9")
      );
    if (contractName == "ProxysBNB")
      return changetype<Address>(
        Address.fromHexString("0x617aeCB6137B5108D1E7D4918e3725C8cEbdB848")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x33cE216C10dEA5E724b7A90628ce7853eef127B3")
      );
    if (contractName == "ProxyiBTC")
      return changetype<Address>(
        Address.fromHexString("0xD6014EA05BDe904448B743833dDF07c3C7837481")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xCe88906100c145522Be3a509683881241aBb3C52")
      );
    if (contractName == "ProxyiETH")
      return changetype<Address>(
        Address.fromHexString("0xA9859874e1743A32409f75bB11549892138BBA1E")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x3f3804176D90640aC6063124afd4bc0636aC85B6")
      );
    if (contractName == "ProxyiBNB")
      return changetype<Address>(
        Address.fromHexString("0xAFD870F32CE54EfdBF677466B612bf8ad164454B")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x57Ff288dd9D478b046647A5aB917195449F1F6e5")
      );
    if (contractName == "ProxysMKR")
      return changetype<Address>(
        Address.fromHexString("0x4140919DE11fCe58E654cC6038017Af97f810De1")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0xFAc2B3400Df00a348C3118831a45A05255F9004A")
      );
    if (contractName == "ProxysTRX")
      return changetype<Address>(
        Address.fromHexString("0xf2E08356588EC5cd9E437552Da87C0076b4970B0")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x0dA04b80e21B344fCFD49C04bEC658E80F1D7428")
      );
    if (contractName == "ProxysXTZ")
      return changetype<Address>(
        Address.fromHexString("0x2e59005c5c0f0a4D77CcA82653d48b46322EE5Cd")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0xC0b1F43Ee7b0670F7B34e14c4702e54a905A51B5")
      );
    if (contractName == "ProxyiMKR")
      return changetype<Address>(
        Address.fromHexString("0x0794D09be5395f69534ff8151D72613077148b29")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x047FC84504714d526808Be07BF17Bdd70726ef92")
      );
    if (contractName == "ProxyiTRX")
      return changetype<Address>(
        Address.fromHexString("0xC5807183a9661A533CB08CbC297594a0B864dc12")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x80eDAC70ec108a9c5B47972da9924397Ba974Ff9")
      );
    if (contractName == "ProxyiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x8deef89058090ac5655A99EEB451a4f9183D1678")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x72661E76475354403838EB04144206f70Ff97d79")
      );
    if (contractName == "ProxysCEX")
      return changetype<Address>(
        Address.fromHexString("0xeABACD844A196D7Faf3CE596edeBF9900341B420")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x93CfF799F255eDa2089cFB3F05696B5B66873C1A")
      );
    if (contractName == "ProxyiCEX")
      return changetype<Address>(
        Address.fromHexString("0x336213e1DDFC69f4701Fc3F86F4ef4A160c1159d")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x43e1505E315BE6C8b875a37F7D8753Ba84140A37")
      );
    if (contractName == "ArbRewarder")
      return changetype<Address>(
        Address.fromHexString("0xA6B5E74466eDc95D0b6e65c5CBFcA0a676d893a4")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0x57Ab1ec28D129707052df4dF418D58a2D46d5f51")
      );
    if (contractName == "ProxyERC20sUSD")
      return changetype<Address>(
        Address.fromHexString("0x57Ab1ec28D129707052df4dF418D58a2D46d5f51")
      );
    if (contractName == "ProxysETH")
      return changetype<Address>(
        Address.fromHexString("0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xA70B3c3DcD4d3CDC55992DC5BEBED33dA92a259A")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xfFC91F7088BF40F0419B451fB9D85718D8903628")
      );
    if (contractName == "RewardsDistribution")
      return changetype<Address>(
        Address.fromHexString("0xFfA72Fd80d8A84032d855bfb67036BAF45949009")
      );
    if (contractName == "TokenStatesCEX")
      return changetype<Address>(
        Address.fromHexString("0xc5680d24C3086e10f618b5176A59E90D6284be9f")
      );
    if (contractName == "ProxysCEX")
      return changetype<Address>(
        Address.fromHexString("0xb91B114a24a1c16834F1217cC3B9eE117b6c817A")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x6aa0f8620614aFe9BD4aBA3148439b08eb2557C0")
      );
    if (contractName == "TokenStateiCEX")
      return changetype<Address>(
        Address.fromHexString("0x3Fb1F228168432688b4E851Fe909907248cf9eCD")
      );
    if (contractName == "ProxyiCEX")
      return changetype<Address>(
        Address.fromHexString("0xAE7F21C0dFe5481ca77d538b5609938a51850942")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x66B86625ee80b06e94E027e44eA35680a0730233")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xbD88D2Ddf55b65BDBbA6f6a5A626B854835d7844")
      );
    if (contractName == "ProxyERC20")
      return changetype<Address>(
        Address.fromHexString("0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xccC395f0eBFAA26dCC2D3BACc23d55614002236b")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x9b461df6fc38E1baEC08c06EB9e916093af8d11C")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xED4A3Adffa428fFD126AeD8ba5b8B58bb12c11ca")
      );
    if (contractName == "TokenStateiMKR")
      return changetype<Address>(
        Address.fromHexString("0xa0c19218271F056bc10b1cDd7a5FaB48F757BC86")
      );
    if (contractName == "ProxyiMKR")
      return changetype<Address>(
        Address.fromHexString("0xEAf60dA0199bE2f62005225248705De774582328")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x99bcc501d04F400Ba3F78b5375D00B56acE6Ee0D")
      );
    if (contractName == "TokenStateiTRX")
      return changetype<Address>(
        Address.fromHexString("0xd69EabdF940174cA571A6D71dde9B9A4dbCdBb0f")
      );
    if (contractName == "ProxyiTRX")
      return changetype<Address>(
        Address.fromHexString("0xCd8D927f2CB03d2eFB7f96CeB66Ec4976843E012")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x87ea2450EaB99A74e55E2B446290011765393AC1")
      );
    if (contractName == "TokenStateiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xca0d3004f5E771A129fB94619f8867A23e8A23de")
      );
    if (contractName == "ProxyiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xc2992b2C22238F296c2f429ee2f7AfB462Ed1750")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xFE6Cd6dE459db214818492f532Ec02Ba87319437")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x0a24864596C54D79C825e64b281645249C14590C")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x70C629875daDBE702489a5E1E3bAaE60e38924fa")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x2Dea20405c52Fb477ecCa8Fe622661d316Ac5400")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x5cBB53Ca85A9E52B593Baf8ae90282C4B3dB0b25")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x5e5F5542dAd3E06CC8E1cd2461E83f872835117B")
      );
    if (contractName == "TokenStatesMKR")
      return changetype<Address>(
        Address.fromHexString("0xCEE0A0Dc7f393ED6AC84A3Ac2191C28d6A53AcEf")
      );
    if (contractName == "ProxysMKR")
      return changetype<Address>(
        Address.fromHexString("0xe88A4976CB7D8898D39E3f317421D625403ecb8C")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x13586160e4F890D0631c3C08D989f5b7AFe202b0")
      );
    if (contractName == "TokenStatesTRX")
      return changetype<Address>(
        Address.fromHexString("0x7EC5697C724895DA7f2320bDE063BEF6215a72e2")
      );
    if (contractName == "ProxysTRX")
      return changetype<Address>(
        Address.fromHexString("0x0944d2C41FEF3088467287e208E5bBB622A0c09C")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0xa6e5DA838D3b8338783E0710E1D5F6C8e8E998CE")
      );
    if (contractName == "TokenStatesXTZ")
      return changetype<Address>(
        Address.fromHexString("0x959894a82fbF99d35B12ed1EA81e783296229862")
      );
    if (contractName == "ProxysXTZ")
      return changetype<Address>(
        Address.fromHexString("0xF45B14ddaBF0F0e275E215b94dD24Ae013a27F12")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x6E5Bc3e877CFaa06eF97dfA12e63EfbB8FCbb03e")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x503e91fc2b9ad7453700130d0825e661565e4c3b")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x5a4aDe4f3E934a0885f42884F7077261C3F4f66F")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x3D32f1404deacE2A43B08211E4662275045b495b")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xD76C5B71ba091C785aEc1A5c1c901b04876d073B")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0x97A853e9536Cf7CF123AA14Da726b71a848290cE")
      );
    if (contractName == "FeePoolEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0xC9DFff5fA5605fd94F8B7927b892F2B57391e8bB")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x9B7E40031f7d4f6AB6e5D36bBF2Fea3bCCcc75a5")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xEf8a2c1BC94e630463293F71bF5414d13e80F62D")
      );
    if (contractName == "RewardEscrow")
      return changetype<Address>(
        Address.fromHexString("0xb671F2210B1F6621A2607EA63E6B2DC3e2464d1F")
      );
    if (contractName == "FeePoolState")
      return changetype<Address>(
        Address.fromHexString("0x11164F6a47C3f8472D19b9aDd516Fc780cb7Ee02")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0xA3de830b5208851539De8e4FF158D635E8f36FCb")
      );
    if (contractName == "EscrowChecker")
      return changetype<Address>(
        Address.fromHexString("0x3b399e00AFd8201ACf8A5a0EcCF1C47d8D5E41da")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xba34e436C9383aa8FA1e3659D2807ae040592498")
      );
    if (contractName == "TokenStatesETH")
      return changetype<Address>(
        Address.fromHexString("0x34A5ef81d18F3a305aE9C2d7DF42beef4c79031c")
      );
    if (contractName == "ProxysETH")
      return changetype<Address>(
        Address.fromHexString("0xaCf5C0101cbBe8476E87c652E0bEF33684Cc94D6")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x42456D7084eacF4083f1140d3229471bbA2949A8")
      );
    if (contractName == "TokenStatesBNB")
      return changetype<Address>(
        Address.fromHexString("0xf9bd94C6F93c1FA5F38174c5e424721e1046af07")
      );
    if (contractName == "ProxysBNB")
      return changetype<Address>(
        Address.fromHexString("0x013AE307648f529aa72c5767A334DDd37aaB43c3")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xC906de7f8b4C1a4787023F50F49CE98F9F67c4b8")
      );
    if (contractName == "TokenStateiBTC")
      return changetype<Address>(
        Address.fromHexString("0xa1652766155D4Debc31D01BF3f748cB46508745b")
      );
    if (contractName == "ProxyiBTC")
      return changetype<Address>(
        Address.fromHexString("0x2B143041a6F8BE9dCC66E9110178a264A223A3bd")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xd8f6B6b6782632275B2B51230654f687f5b12Cde")
      );
    if (contractName == "TokenStateiETH")
      return changetype<Address>(
        Address.fromHexString("0x7b6ab32Ca02B31485fbf7265437c2853792CC5d9")
      );
    if (contractName == "ProxyiETH")
      return changetype<Address>(
        Address.fromHexString("0xD4fb1706Ae549FEBeC06bb7175b08010DD1B0C2e")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x51Fe40e6292dbC44623b298a4086ffA6f5976ba1")
      );
    if (contractName == "TokenStateiBNB")
      return changetype<Address>(
        Address.fromHexString("0xc4E4c442653fDC78A71401684fd6cF9d67B3B643")
      );
    if (contractName == "ProxyiBNB")
      return changetype<Address>(
        Address.fromHexString("0x7c8F07Ac5b0a2876ee582a661d53dE2D0BbAd96F")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x56751D5Ac7D2B614C79d22e6b52D3285cFA8a293")
      );
    if (contractName == "EscrowChecker")
      return changetype<Address>(
        Address.fromHexString("0x3b399e00afd8201acf8a5a0eccf1c47d8d5e41da")
      );
    if (contractName == "TokenStateXDR")
      return changetype<Address>(
        Address.fromHexString("0xBF093390d8046ae2d0f5465DEC7001d65DC159d5")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0x172E09691DfBbC035E37c73B62095caa16Ee2388")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x73b172756BD5DDf0110Ba8D7b88816Eb639Eb21c")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xEBdBac38835A1105851e80C7Fa1f1E6e25A86e32")
      );
    if (contractName == "ProxyFeePool")
      return changetype<Address>(
        Address.fromHexString("0xb440DD674e1243644791a4AdfE3A2AbB0A92d309")
      );
    if (contractName == "ProxysAUD")
      return changetype<Address>(
        Address.fromHexString("0xED4699f180a14B5974c26f494483F9c327Fd381a")
      );
    if (contractName == "ProxysBRL")
      return changetype<Address>(
        Address.fromHexString("0x5D609C25adAafd856021F92296C66dB602A0fcE8")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0x9073Ee83b6CE96C444547DdCAf777b9352163581")
      );
    if (contractName == "ProxysCAD")
      return changetype<Address>(
        Address.fromHexString("0x0Bc209fB72390AF12bD6Fd775355ea0856864B31")
      );
    if (contractName == "ProxysCHF")
      return changetype<Address>(
        Address.fromHexString("0x28AF5a2f0cC12F2f19dd946608c945456b52b3F6")
      );
    if (contractName == "ProxysCNY")
      return changetype<Address>(
        Address.fromHexString("0x60feeeD05004476518281D43185fB7F52d9722c0")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0x3EB064766109D150e4362222df80638BcE00e037")
      );
    if (contractName == "ProxysGBP")
      return changetype<Address>(
        Address.fromHexString("0x0C8A7D55ef593A2cAd34894c1523162eE2ffB9aC")
      );
    if (contractName == "ProxysINR")
      return changetype<Address>(
        Address.fromHexString("0x74C80bB51Da1EAc2d40074c647CbD0ab6920063f")
      );
    if (contractName == "ProxysJPY")
      return changetype<Address>(
        Address.fromHexString("0x559E848A1b6a7AfC69Ee27F8d20280A42628b2cf")
      );
    if (contractName == "ProxysKRW")
      return changetype<Address>(
        Address.fromHexString("0xdCE506b196B0dF677d07e718f872CAc9Bc368A33")
      );
    if (contractName == "ProxysNZD")
      return changetype<Address>(
        Address.fromHexString("0x26C0cb14470803120321b70aE85405ac298e5A42")
      );
    if (contractName == "ProxysPLN")
      return changetype<Address>(
        Address.fromHexString("0xD9553f0fDa012224141AeCc1ECa0e29868fF7FE8")
      );
    if (contractName == "ProxysRUB")
      return changetype<Address>(
        Address.fromHexString("0xDcB5821fcFDAB5553307b8f99591fC9DaA3C4be3")
      );
    if (contractName == "ProxysSGD")
      return changetype<Address>(
        Address.fromHexString("0x632dB1c25C03dCAc8d23Ff2c9A4cEa34cbEffa1B")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0x57Ab1E02fEE23774580C119740129eAC7081e9D3")
      );
    if (contractName == "ProxysXAG")
      return changetype<Address>(
        Address.fromHexString("0x6e5709515C767c907e43a03388cc816Bd65e797C")
      );
    if (contractName == "ProxysXAU")
      return changetype<Address>(
        Address.fromHexString("0xe05D803fa0c5832Fa2262465290abB25d6C2bFA3")
      );
    if (contractName == "ProxySynthetix")
      return changetype<Address>(
        Address.fromHexString("0xC011A72400E58ecD99Ee497CF89E3775d4bd732F")
      );
    if (contractName == "ProxyXDR")
      return changetype<Address>(
        Address.fromHexString("0x62492F15cF60c5847d3053e482cAde8C5c29af88")
      );
    if (contractName == "SafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x84D626B2BB4D0F064067e4BF80FCe7055d8F3E7B")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x3772f9716Cf6D7a09edE3587738AA2af5577483a")
      );
    if (contractName == "SynthetixEscrow")
      return changetype<Address>(
        Address.fromHexString("0x971e78e0C92392A4E39099835cF7E6aB535b2227")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0x4b9Ca5607f1fF8019c1C6A3c2f0CC8de622D5B82")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xB03dFc4b9C9756B6D4Fbc12DAde7732149Fcf00d")
      );
    if (contractName == "SynthsBRL")
      return changetype<Address>(
        Address.fromHexString("0xa5A4ccCCcAa26Cea096F6E493839423F4D66c63F")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xf8AD89091B2724bdb7528c50B282B565Db4635bb")
      );
    if (contractName == "SynthsCAD")
      return changetype<Address>(
        Address.fromHexString("0x8f69c9Ee79Bf9320E1A5C19e559108E1cb3d002B")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x9270D9970D6ACA773e2FA01633CDc091a46714c9")
      );
    if (contractName == "SynthsCNY")
      return changetype<Address>(
        Address.fromHexString("0x60C34eB93AFCd1B701fF8C036B128441C68A8A70")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xC2bb52457D81FBD223CC92b44cd372d36b338A10")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xdB36B8f25bB1f289d97aeE8f87BAcCaC58fA8883")
      );
    if (contractName == "SynthsINR")
      return changetype<Address>(
        Address.fromHexString("0x51671B7556EbEB4c43180e983F5569973e15cAc9")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xD9E5A009Ec07dE76616d7361Ed713eF434d71325")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0xdF846D3ded30A0590319f8A7ECD4e233B0e9188C")
      );
    if (contractName == "SynthsNZD")
      return changetype<Address>(
        Address.fromHexString("0xCF401f31c63F58DEbfC76F441731dfa945cd0Bde")
      );
    if (contractName == "SynthsPLN")
      return changetype<Address>(
        Address.fromHexString("0x1943dBd2A793c588B5170188Ee6fb62E02AfdfF7")
      );
    if (contractName == "SynthsRUB")
      return changetype<Address>(
        Address.fromHexString("0x8a8DcbBa6038c6Fc6D192F5cf5C5dD83B98591bc")
      );
    if (contractName == "SynthsSGD")
      return changetype<Address>(
        Address.fromHexString("0x2aE393C18b6Aa62D6a2250aF7b803Fa6973bC981")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x0cBE2dF57CA9191B64a7Af3baa3F946fa7Df2F25")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x4D57A8212BDb8bdca049365BCE8afA0244a0E3FC")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x112D5fA64e4902B6ff1a35495a0f878c210A5601")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0x2972705AF18c66c14CDd27AD412961E01944A9C3")
      );
    if (contractName == "TokenStatesAUD")
      return changetype<Address>(
        Address.fromHexString("0xCb29D2cf2C65d3Be1d00F07f3441390432D55203")
      );
    if (contractName == "TokenStatesBRL")
      return changetype<Address>(
        Address.fromHexString("0x0985de52896fC4C9A84d108F5582ec02fdF91605")
      );
    if (contractName == "TokenStatesBTC")
      return changetype<Address>(
        Address.fromHexString("0x4F6296455F8d754c19821cF1EC8FeBF2cD456E67")
      );
    if (contractName == "TokenStatesCAD")
      return changetype<Address>(
        Address.fromHexString("0xdDf91Fc27087e076574Df31483Db5C21A85E47b6")
      );
    if (contractName == "TokenStatesCHF")
      return changetype<Address>(
        Address.fromHexString("0x52496fE8a4feaEFe14d9433E00D48E6929c13deC")
      );
    if (contractName == "TokenStatesCNY")
      return changetype<Address>(
        Address.fromHexString("0x5cCA1f0c514C0624d3BA7585d56fD2d72CbeFd80")
      );
    if (contractName == "TokenStatesEUR")
      return changetype<Address>(
        Address.fromHexString("0x6568D9e750fC44AF00f857885Dfb8281c00529c4")
      );
    if (contractName == "TokenStatesGBP")
      return changetype<Address>(
        Address.fromHexString("0x7e88D19A79b291cfE5696d496055f7e57F537A75")
      );
    if (contractName == "TokenStatesINR")
      return changetype<Address>(
        Address.fromHexString("0xf8F2f8001fca737eFA2bC26217Fc20C1F8267fbA")
      );
    if (contractName == "TokenStatesJPY")
      return changetype<Address>(
        Address.fromHexString("0x4dFACfB15514C21c991ff75Bc7Bf6Fb1F98361ed")
      );
    if (contractName == "TokenStatesKRW")
      return changetype<Address>(
        Address.fromHexString("0x249A10c68AfA9827571cb73f29ab5Af57Ee5A596")
      );
    if (contractName == "TokenStatesNZD")
      return changetype<Address>(
        Address.fromHexString("0x3FDa286F354a3318534026dBAcf021c84A71B03c")
      );
    if (contractName == "TokenStatesPLN")
      return changetype<Address>(
        Address.fromHexString("0xdb957f324Be2dE9BdAB01A3dbb50228569FDEe1B")
      );
    if (contractName == "TokenStatesRUB")
      return changetype<Address>(
        Address.fromHexString("0xF1eF8ee7DfEE4BD0e06B0fCed1d299387B78Cb09")
      );
    if (contractName == "TokenStatesSGD")
      return changetype<Address>(
        Address.fromHexString("0x000F49FD739d4023B0A6C87eE8705eF1Ffb55C87")
      );
    if (contractName == "TokenStatesUSD")
      return changetype<Address>(
        Address.fromHexString("0x05a9CBe762B36632b3594DA4F082340E0e5343e8")
      );
    if (contractName == "TokenStatesXAG")
      return changetype<Address>(
        Address.fromHexString("0x53d244Fb46357568DBeF082225cCC87cBD94aAE8")
      );
    if (contractName == "TokenStatesXAU")
      return changetype<Address>(
        Address.fromHexString("0x20569B49d74c1EDE765382574F7F3fdC2a078A4f")
      );
    if (contractName == "TokenStateSynthetix")
      return changetype<Address>(
        Address.fromHexString("0x5b1b5fEa1b99D83aD479dF0C222F0492385381dD")
      );
    if (contractName == "TokenStateXDR")
      return changetype<Address>(Address.fromHexString("0x0"));
  }
  if (network == "optimism") {
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xFE8E48Bf36ccC3254081eC8C65965D1c8b2E744D")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xc5Ae1Eca0AFC915F88C0135cdaaf270d710f03FF")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xDfA2d3a0d32F870D87f8A0d7AA6b9CdEB7bc5AdB")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xe9dceA0136FEFC76c4E639Ec60CCE70482E2aCF7")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x421DEF861D623F7123dfE0878D86E9576cbb3975")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x0F6877e0Bb54a0739C6173A814B39D5127804123")
      );
    if (contractName == "SynthsSOL")
      return changetype<Address>(
        Address.fromHexString("0x04B50a5992Ea2281E14d43494d656698EA9C24dD")
      );
    if (contractName == "SynthsAVAX")
      return changetype<Address>(
        Address.fromHexString("0x368A5126fF8e659004b6f9C9F723E15632e2B428")
      );
    if (contractName == "SynthsMATIC")
      return changetype<Address>(
        Address.fromHexString("0xf49C194954b6B91855aC06D6C88Be316da60eD96")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xdEdb0b04AFF1525bb4B6167F00e61601690c1fF2")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x34783A738DdC355cD7c737D4101b20622681332a")
      );
    if (contractName == "SynthsUNI")
      return changetype<Address>(
        Address.fromHexString("0xcF2E165D2359E3C4dFF1E10eC40dBB5a745223A9")
      );
    if (contractName == "SynthsINR")
      return changetype<Address>(
        Address.fromHexString("0x34c2360ffe5D21542f76e991FFD104f281D4B3fb")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x84Ec90f9CD4D00Ad95002d88D35f99cd9F66E393")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0xeb4b5ABcE7310855319440d936cd3aDd77DFA193")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x0333BD82e1F5FF89c19EC44Ab5302A0041b33139")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x274D1dbe298993EaD5AC1B25624F53786d16006e")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xdE48d4b3B8737446193720ce23ef24f922341155")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xc66a263f2C7C1Af0bD70c6cA4Bff5936F3D6Ef9F")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xcC02F000b0aA8a0eFC2B55C9cf2305Fb3531cca1")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x939313420A85ab8F21B8c2fE15b60528f34E0d63")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0xC818f3A73F0f4A9AfdC9835BE2682e627A04A4ff")
      );
    if (contractName == "Liquidator")
      return changetype<Address>(
        Address.fromHexString("0x68a8b098967Ae077dcFf5cC8E29B7cb15f1A3cC8")
      );
    if (contractName == "LiquidatorRewards")
      return changetype<Address>(
        Address.fromHexString("0xF4EebDD0704021eF2a6Bbe993fdf93030Cd784b4")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x1c7A2E680849bC9C6ab8b437A28885C028739B82")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x22602469d704BfFb0936c7A7cfcD18f7aA269375")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x2369D37ae9B30451D859C11CAbAc70df1CE48F78")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x0a1059c33ce5cd3345BBca557b8e44F4088FC359")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xfBa85D793FF7fAa973c1bEd1C698cEE692a4c306")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0x136b1EC699c62b0606854056f02dC7Bb80482d63")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0xd4DB55Cf39c37BEAa3A47F2555D57B4ea2d9Ff39")
      );
    if (contractName == "TokenStatesINR")
      return changetype<Address>(
        Address.fromHexString("0xfE33ae95A9f0DA8A845aF33516EDc240DCD711d6")
      );
    if (contractName == "ProxysINR")
      return changetype<Address>(
        Address.fromHexString("0xa3A538EA5D5838dC32dde15946ccD74bDd5652fF")
      );
    if (contractName == "SynthsINR")
      return changetype<Address>(
        Address.fromHexString("0xc66499aCe3B6c6a30c784bE5511E8d338d543913")
      );
    if (contractName == "FuturesMarketAPE")
      return changetype<Address>(
        Address.fromHexString("0xFe00395ec846240dc693e92AB2Dd720F94765Aa3")
      );
    if (contractName == "FuturesMarketDYDX")
      return changetype<Address>(
        Address.fromHexString("0x10305C1854d6DB8A1060dF60bDF8A8B2981249Cf")
      );
    if (contractName == "FuturesMarketSOL")
      return changetype<Address>(
        Address.fromHexString("0xcF853f7f8F78B2B801095b66F8ba9c5f04dB1640")
      );
    if (contractName == "FuturesMarketAVAX")
      return changetype<Address>(
        Address.fromHexString("0x4ff54624D5FB61C34c634c3314Ed3BfE4dBB665a")
      );
    if (contractName == "FuturesMarketAAVE")
      return changetype<Address>(
        Address.fromHexString("0x001b7876F567f0b3A639332Ed1e363839c6d85e2")
      );
    if (contractName == "FuturesMarketUNI")
      return changetype<Address>(
        Address.fromHexString("0x5Af0072617F7f2AEB0e314e2faD1DE0231Ba97cD")
      );
    if (contractName == "FuturesMarketMATIC")
      return changetype<Address>(
        Address.fromHexString("0xbCB2D435045E16B059b2130b28BE70b5cA47bFE5")
      );
    if (contractName == "FuturesMarketXAU")
      return changetype<Address>(
        Address.fromHexString("0x4434f56ddBdE28fab08C4AE71970a06B300F8881")
      );
    if (contractName == "FuturesMarketXAG")
      return changetype<Address>(
        Address.fromHexString("0xb147C69BEe211F57290a6cde9d1BAbfD0DCF3Ea3")
      );
    if (contractName == "FuturesMarketEUR")
      return changetype<Address>(
        Address.fromHexString("0xad44873632840144fFC97b2D1de716f6E2cF0366")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x81875E4A7b256762381F5ADf95dCb4324450B01F")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xd056351FC32b5Ec443305198FB9093057f8e988C")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0xE8c41bE1A167314ABAF2423b72Bf8da826943FFD")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x1B9d6cD65dDC981410cb93Af91B097667E0Bc7eE")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xD3739A5F06747e148E716Dcb7147B9BA15b70fcc")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x17628A557d1Fc88D1c35989dcBAC3f3e275E2d2B")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x059681217E9186E007864AA16893b65A0589718B")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xadaD43Be81E2206f6D1aF4299cA2a029e16af7AB")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xD1599E478cC818AFa42A4839a6C665D9279C3E50")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0x8F7b21BF5f8490FAa63386f6f6434C6Ae8D8A120")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x0681883084b5De1564FE2706C87affD77F1677D5")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xC4Be4583bc0307C56CF301975b2B2B1E5f95fcB2")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x2302D7F7783e2712C48aA684451b9d706e74F299")
      );
    if (contractName == "SynthsSOL")
      return changetype<Address>(
        Address.fromHexString("0x91DBC6f587D043FEfbaAD050AB48696B30F13d89")
      );
    if (contractName == "SynthsAVAX")
      return changetype<Address>(
        Address.fromHexString("0x5D7569CD81dc7c8E7FA201e66266C9D0c8a3712D")
      );
    if (contractName == "SynthsMATIC")
      return changetype<Address>(
        Address.fromHexString("0xF5d0BFBc617d3969C1AcE93490A76cE80Db1Ed0e")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xB16ef128b11e457afA07B09FCE52A01f5B05a937")
      );
    if (contractName == "SignedSafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x253914cf059f4c3E277c28060C404acFc38FB6e2")
      );
    if (contractName == "OneNetAggregatorIssuedSynths")
      return changetype<Address>(
        Address.fromHexString("0xe152A2DbcE62E6c0bd387fFd1bb8086F44c5Fd04")
      );
    if (contractName == "OneNetAggregatorDebtRatio")
      return changetype<Address>(
        Address.fromHexString("0xA408d8e01C8E084B67559226C5B55D6F0B7074e2")
      );
    if (contractName == "ExchangeCircuitBreaker")
      return changetype<Address>(
        Address.fromHexString("0x7322e8F6cB6c6a7B4e6620C486777fcB9Ea052a4")
      );
    if (contractName == "TokenStatesAAVE")
      return changetype<Address>(
        Address.fromHexString("0xAf918f4a72BC34E59dFaF65866feC87947F1f590")
      );
    if (contractName == "ProxysAAVE")
      return changetype<Address>(
        Address.fromHexString("0x00B8D5a5e1Ac97Cb4341c4Bc4367443c8776e8d9")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x5eA2544551448cF6DcC1D853aDdd663D480fd8d3")
      );
    if (contractName == "TokenStatesUNI")
      return changetype<Address>(
        Address.fromHexString("0xf32b995Fe4dDf540C848236dB9638d137Aa9b6ff")
      );
    if (contractName == "ProxysUNI")
      return changetype<Address>(
        Address.fromHexString("0xf5a6115Aa582Fd1BEEa22BC93B7dC7a785F60d03")
      );
    if (contractName == "SynthsUNI")
      return changetype<Address>(
        Address.fromHexString("0xC19d27d1dA572d582723C1745650E51AC4Fc877F")
      );
    if (contractName == "FuturesMarketManager")
      return changetype<Address>(
        Address.fromHexString("0xc704c9AA89d1ca60F67B3075d05fBb92b3B00B3B")
      );
    if (contractName == "FuturesMarketData")
      return changetype<Address>(
        Address.fromHexString("0xC51aeDBEC3aCD26650a7E85B6909E8AEc4d0F19e")
      );
    if (contractName == "FuturesMarketSettings")
      return changetype<Address>(
        Address.fromHexString("0xaE55F163337A2A46733AA66dA9F35299f9A46e9e")
      );
    if (contractName == "FuturesMarketBTC")
      return changetype<Address>(
        Address.fromHexString("0xEe8804d8Ad10b0C3aD1Bd57AC3737242aD24bB95")
      );
    if (contractName == "FuturesMarketETH")
      return changetype<Address>(
        Address.fromHexString("0xf86048DFf23cF130107dfB4e6386f574231a5C65")
      );
    if (contractName == "FuturesMarketLINK")
      return changetype<Address>(
        Address.fromHexString("0x1228c7D8BBc5bC53DB181bD7B1fcE765aa83bF8A")
      );
    if (contractName == "TokenStatesAVAX")
      return changetype<Address>(
        Address.fromHexString("0x2114d1C571CB541f3416a65f8BccFf9BB9E55Dc5")
      );
    if (contractName == "ProxysAVAX")
      return changetype<Address>(
        Address.fromHexString("0xB2b42B231C68cbb0b4bF2FFEbf57782Fd97D3dA4")
      );
    if (contractName == "SynthsAVAX")
      return changetype<Address>(
        Address.fromHexString("0x5C2B0fdB3C828f087FDdA19Cf7F6fF7c51022aFb")
      );
    if (contractName == "TokenStatesMATIC")
      return changetype<Address>(
        Address.fromHexString("0x937C9E1d18bEB4F8E1BCB0Dd7a612ca6012517a3")
      );
    if (contractName == "ProxysMATIC")
      return changetype<Address>(
        Address.fromHexString("0x81DDfAc111913d3d5218DEA999216323B7CD6356")
      );
    if (contractName == "SynthsMATIC")
      return changetype<Address>(
        Address.fromHexString("0x6E3FfC4161931793B7FD084E761C0D12126FD376")
      );
    if (contractName == "TokenStatesEUR")
      return changetype<Address>(
        Address.fromHexString("0x7afF10fc89B162c7aBf77974d190E7959cb456f5")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0xFBc4198702E81aE77c06D58f81b629BDf36f0a71")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x824dA469B59eC0E6E6BB5D611888aBF440970414")
      );
    if (contractName == "TokenStatesSOL")
      return changetype<Address>(
        Address.fromHexString("0x6825Dd6B5b83FBbFF1049A44dc808A10fe9a6719")
      );
    if (contractName == "ProxysSOL")
      return changetype<Address>(
        Address.fromHexString("0x8b2F7Ae8cA8EE8428B6D76dE88326bB413db2766")
      );
    if (contractName == "SynthsSOL")
      return changetype<Address>(
        Address.fromHexString("0x8ab13Ca3b6591554a086B7Ad2A012d25C3efD704")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xcFDcCFf3835Eb002eF0360F9514A66E6717fCC54")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x8518f879a2B8138405E947A48326F55FF9D5f3aD")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xdf1F1f0059bA70C182471467d3017511B1a122E8")
      );
    if (contractName == "SynthetixDebtShare")
      return changetype<Address>(
        Address.fromHexString("0x45c55BF488D3Cb8640f12F63CbeDC027E8261E79")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x5a439C235C8BB9F813C5b45Dc194A00EC23CB78E")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x28224ef515d01709916F5ac4D8a72664A7b56e98")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xB4437efD22B4CCe7E25B3c47A469BC719cBdB60c")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x11Ac553488b2170A9ad751A5455d0C9A134C982f")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x478D479BAc034f89FA28D8d2ab430eC973a3a0aC")
      );
    if (contractName == "StakingRewardssUSDDAIUniswapV3")
      return changetype<Address>(
        Address.fromHexString("0x7E11c004d20b502729918687E6E6777b28499085")
      );
    if (contractName == "StakingRewardsSNXWETHUniswapV3")
      return changetype<Address>(
        Address.fromHexString("0xfD49C7EE330fE060ca66feE33d49206eB96F146D")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xFDf3Be612c65464AEB4859047350a6220F304F52")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x20eBfbdD14c9D8093E9AC33e736Ac61bbaC90092")
      );
    if (contractName == "CollateralEth")
      return changetype<Address>(
        Address.fromHexString("0x308AD16ef90fe7caCb85B784A603CB6E71b1A41a")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xbc12131c93Da011B2844FA76c373A8cf5b0db4B5")
      );
    if (contractName == "WrapperFactory")
      return changetype<Address>(
        Address.fromHexString("0x27be2EFAd45DeBd732C1EBf5C9F7b49D498D4a93")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x3fDccCf40eefe389a8Ba73Ff2AEDA10888ff8F3E")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xA2412e0654CdD40F5677Aaad1a0c572e75dF246C")
      );
    if (contractName == "OwnerRelayOnOptimism")
      return changetype<Address>(
        Address.fromHexString("0x6d4a64C57612841c2C6745dB2a4E4db34F002D20")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x1a094457F83dA71bF223BFA49E7fa67839285905")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xc08db5823a7c1DC8fe9894F51A05799F1262bAC0")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x01f8C5e421172B67cc14B7f5F369cfb10de0acD4")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x3EF4265a40fb5581e65D69fC7a978904fA50a5Ee")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x78aAA3fb165deCAA729DFE3cf0E97Ab6FCF484da")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xBD2657CF89F930F27eE1854EF4B389773DF43b29")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x8Ce809a955DB85b41e7A378D7659e348e0C6AdD2")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xF33e7B48538C9D0480a48f3b5eEf79026e2a28f6")
      );
    if (contractName == "WrapperFactory")
      return changetype<Address>(
        Address.fromHexString("0x620C8800Ec73aC705151EC8327913c2910cC46B1")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xBa32006fDCdc840f80cb9C8EC69C92f06e82E588")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x3Ae7F9091CB429464707b61398b5cfDCD2a25981")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x8f571a7bD9924e25a3d2aC0B7F721C5Ed675c3c8")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xc53E9375A77bD98eb0068559bC56C8D6cEA254fA")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xff4287311138ad3BD051F84524B2eA3A682944a5")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xe1f47188168837485527A5B44E7FA7ca55F29C65")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xFe06fbe87E9f705B5D337D82dF8Fd812774974F9")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x86f36d4873F1D338d1AA768C70A7A3aE83be8511")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x7Eb21e5eF2D8bB3804380D02a5FE0487DcBfe184")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0x15E7D4972a3E477878A5867A47617122BE2d1fF0")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x0ea0902950aa58b19Ed1876901B843cd2f85a8E9")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x58B453f01966CEe805CE12F9B2138E7B0c46Ce99")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xC806963F83D0B7ad3B96F59B0f7a77E5D2BBB57D")
      );
    if (contractName == "SynthRedeemer")
      return changetype<Address>(
        Address.fromHexString("0xA997BD647AEe62Ef03b41e6fBFAdaB43d8E57535")
      );
    if (contractName == "CollateralUtil")
      return changetype<Address>(
        Address.fromHexString("0xD21969A86Ce5c41aAb2D492a0F802AA3e015cd9A")
      );
    if (contractName == "CollateralManagerState")
      return changetype<Address>(
        Address.fromHexString("0xbA10526cD8742acC73AedeF5f7Dbb2477Bf86922")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0xEbCe9728E2fDdC26C9f4B00df5180BdC5e184953")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x46D4504ed0f751309e3c6b1f544ad2E8458537Dc")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xAe4CA85A36920b4130A8DB9303a31abA64e3d2A8")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x395eC94bf3E3dCd3aFBd82cd03197731411E396B")
      );
    if (contractName == "EtherWrapper")
      return changetype<Address>(
        Address.fromHexString("0xc3Ee42caBD773A608fa9Ec951982c94BD6F33d59")
      );
    if (contractName == "TokenStatesETH")
      return changetype<Address>(
        Address.fromHexString("0xEc3665F7e696b0Ad0D04Ae5161b18782D48cd1fd")
      );
    if (contractName == "ProxysETH")
      return changetype<Address>(
        Address.fromHexString("0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xE118737eB5F931FCeB663fACd3234B4169aC638A")
      );
    if (contractName == "TokenStatesBTC")
      return changetype<Address>(
        Address.fromHexString("0xA9E630952522E3F110322711F424528Af894e307")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0x298B9B95708152ff6968aafd889c6586e9169f1D")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x6f1EE829627C8a544CB3e7AB296de386245C14a3")
      );
    if (contractName == "TokenStatesLINK")
      return changetype<Address>(
        Address.fromHexString("0x08a008eEA07d3cC7ca1913EEC3468C10F8F79e6A")
      );
    if (contractName == "ProxysLINK")
      return changetype<Address>(
        Address.fromHexString("0xc5Db22719A06418028A40A9B5E9A7c02959D0d08")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x388dD240bFFA4047D85D1d6F3Dc814c054217a23")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0xf83c5f65dBef4017CD19Ae99b15E1B8649AdbEb4")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x8e9D85099ffc4bE029F362728B84Bb8BBb5665c1")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x8be60b5031C0686e48a079C81822173bFa1268DA")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xd48BEc0A784692dde6d2D481eD71911cdC12513A")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0x3f87Ff1de58128eF8FCb4c807eFD776E1aC72E51")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0x9770239D49Db97E77fc5Adcb5413654C9e45A510")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xF950a48E9463a13b13D75F452200E711c1c426b6")
      );
    if (contractName == "FeePoolState")
      return changetype<Address>(
        Address.fromHexString("0x6e0d26cffc3a63d763F1546f749bf62ebC7d72D8")
      );
    if (contractName == "SafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x0142F40c25CE1F1177Ed131101FA19217396cB88")
      );
    if (contractName == "Math")
      return changetype<Address>(
        Address.fromHexString("0x0B3A73EE0740b3130e40B2A6b5aaf59E7E3Ef74c")
      );
    if (contractName == "AddressResolver")
      return changetype<Address>(
        Address.fromHexString("0x95A6a3f44a70172E7d50a9e28c85Dfd712756B8C")
      );
    if (contractName == "ReadProxyAddressResolver")
      return changetype<Address>(
        Address.fromHexString("0x1Cb059b7e74fD21665968C908806143E744D5F30")
      );
    if (contractName == "FlexibleStorage")
      return changetype<Address>(
        Address.fromHexString("0x47649022380d182DA8010Ae5d257fea4227b21ff")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x8454190C164e52664Af2c9C24ab58c4e14D6bbE4")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x357b58E0b1Be9d8A944380048fa1080c57c7A362")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x631E93A0fb06B5eC6d52c0A2D89a3f9672d6Ba64")
      );
    if (contractName == "RewardEscrow")
      return changetype<Address>(
        Address.fromHexString("0xd32138018210edA0028240638f35b70ECC0D8C22")
      );
    if (contractName == "RewardEscrowV2")
      return changetype<Address>(
        Address.fromHexString("0x47eE58801C1AC44e54FF2651aE50525c5cfc66d0")
      );
    if (contractName == "SynthetixEscrow")
      return changetype<Address>(
        Address.fromHexString("0x06C6D063896ac733673c4474E44d9268f2402A55")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0x71D838995f8A97f636CbfdCd8dE94b30d2Bd4760")
      );
    if (contractName == "ProxyFeePool")
      return changetype<Address>(
        Address.fromHexString("0x4a16A42407AA491564643E1dfc1fd50af29794eF")
      );
    if (contractName == "DelegateApprovalsEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0x02f7fB66B55e6ca476d126d96f14c5732Eeb4363")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0x2A23bc0EA97A89abD91214E8e4d20F02Fe14743f")
      );
    if (contractName == "Liquidations")
      return changetype<Address>(
        Address.fromHexString("0x14E6f8e6Da00a32C069b11b64e48EA1FEF2361D4")
      );
    if (contractName == "EternalStorageLiquidations")
      return changetype<Address>(
        Address.fromHexString("0x76d2de36936005A0182a1BB61dA501A8A044D477")
      );
    if (contractName == "FeePoolEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0x41140Bf6498a36f2E44eFd49f21dAe3bbb7367c8")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x608457BC647e6f8f76eAD8b99d343D367e0f4D62")
      );
    if (contractName == "FeePoolState")
      return changetype<Address>(
        Address.fromHexString("0xd12A749E2FF15E66e095D0BfD3CE680756F36379")
      );
    if (contractName == "RewardsDistribution")
      return changetype<Address>(
        Address.fromHexString("0x5d9187630E99dBce4BcAB8733B76757f7F44aA2e")
      );
    if (contractName == "ProxyERC20")
      return changetype<Address>(
        Address.fromHexString("0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4")
      );
    if (contractName == "TokenStateSynthetix")
      return changetype<Address>(
        Address.fromHexString("0xB9c6CA25452E7f6D0D3340CE1e9B573421afc2eE")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xD85eAFa37734E4ad237C3A3443D64DC94ae998E7")
      );
    if (contractName == "ProxySynthetix")
      return changetype<Address>(
        Address.fromHexString("0x218067172e9E0460A883458D44BD1f56ea609502")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x5A528e35165e19f3392c9631243dd04d1229D324")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xe318E4618E5684668992935d7231Cb837a44E670")
      );
    if (contractName == "ExchangeState")
      return changetype<Address>(
        Address.fromHexString("0x7EF87c14f50CFFe2e73d2C87916C3128c56593A8")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x8377b25B8564f6Be579865639776c5082CB37163")
      );
    if (contractName == "TradingRewards")
      return changetype<Address>(
        Address.fromHexString("0x2DcAD1A019fba8301b77810Ae14007cc88ED004B")
      );
    if (contractName == "EscrowChecker")
      return changetype<Address>(
        Address.fromHexString("0xcdb7D0a946223255d39A6e29B54f08f3291cc118")
      );
    if (contractName == "TokenStatesUSD")
      return changetype<Address>(
        Address.fromHexString("0x92bAc115d89cA17fd02Ed9357CEcA32842ACB4c2")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0xbecc58c6D7Ca71b6FCC4cC8c9c5294A0eA7A0397")
      );
    if (contractName == "ProxyERC20sUSD")
      return changetype<Address>(
        Address.fromHexString("0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xF2FF43DA7B6e5963059b7004df43b5c5870EEb18")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0xC8E91c926E04BE1cb94e51c5379d14774D51ae6C")
      );
    if (contractName == "EtherCollateralsUSD")
      return changetype<Address>(
        Address.fromHexString("0xC0c66470E766AE2026E6695966C56C90741811AA")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0x4D7186818daBFe88bD80421656BbD07Dffc979Cc")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0x70B21B422Dade467659522892A857F0Ee31cebb4")
      );
    if (contractName == "SynthUtil")
      return changetype<Address>(
        Address.fromHexString("0x87b1481c82913301Fc6c884Ac266a7c430F92cFA")
      );
    if (contractName == "DappMaintenance")
      return changetype<Address>(
        Address.fromHexString("0x54581A23F62D147AC76d454f0b3eF77F9D766058")
      );
  }
  if (network == "kovan") {
    if (contractName == "OneNetAggregatorsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xC3bbc96EC3Fe83A279Ca369E51Ba5608F007dB30")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x6377ED477E80DF86E111593D67ba184d9a9c8AE3")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xD008F1a6804001cb700Bb777aaF7161DAeEF68dA")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xc7B695F50CD76165D7B8d83D48C6C667B268AF30")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xA6B145cBCD9b530F2BD57D41A96c1768734d46Cd")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x558d7b931828E47F5F2C95c319dE8eA6EBB3c9F6")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xAE8A6BDF406a9Ed41f44D22E3fa7349AAB715acC")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xcE3f505Ab7E806E0eF80384CA5C9dbff637Af635")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x4bf55262c17388C13CDD9538A830b32191493667")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x1Da40F4D00109f71eA610a2Dc0bf2698E19034B8")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x86BE944F673D77B93dc5F19655C915b002d42beb")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x944E3E0cDE5daB927AB174bc22C4c0dA013436B6")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xb5741f2887e52Af151e8d2FE8A3046179bC57DBb")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0x42469Fb09F53080F33A3A0fbA97396f87B22b429")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xD802079Cbdd5E99c2E301079BC643B99B2cD05C9")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x2bAf929DBff85A8148D339EA122c8dcbd055F30a")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xb9713D033DF6190D941F169cDEDc1C69B5314e72")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x923F8f53c9BD1f0C84745394E47ea31c5949eF96")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x6d9edCbC275a3664f04E68d7fc1466858C683b90")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x47F08D263d759D150bc61BE5D72337EbD45Fb559")
      );
    if (contractName == "Liquidator")
      return changetype<Address>(
        Address.fromHexString("0x54a67c86994790DABde8D294E5C052863Ffe5Cd1")
      );
    if (contractName == "LiquidatorRewards")
      return changetype<Address>(
        Address.fromHexString("0x9c333F576BbAb9aC0F2585aaaa7A094EF72F5696")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x412c870daAb642aA87715e2EA860d20E48E73267")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x6b27e4554f2FEFc04F4bd9AE0D2A77f348d12cfA")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x8e08BF90B979698AdB6d722E9e27263f36366414")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x1991bEA1eB08a78701F3330934B2301Fc6520AbA")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x1FEdC443D6c05475310fC62E5d4bf5c431cd06B6")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0xc00E7C2Bd7B0Fb95DbBF10d2d336399A939099ee")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0xB023d49Fc98eB2f955fA1dF2B2868bFf62C671E6")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xAb6dA3A3C7428606851f2bd33C118B2a77183578")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xa090A311Aa4FEb1399D4463c44B357D05E41946c")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0x828d4F922E446c76E2D0e0582EAa38acc4d793a2")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x081158Dd1DE2B2128DD65eFFF67aA61b48dc7568")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xD9b6bAEc9847189bd4f9B0c8D5Bb2512e0368aBf")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x80a371e65dB3dD35b39d094AED82c28bafeA9A65")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xD63db8cD2dbFd7E0999D8D58C94d9ECF0004e180")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xc54369b816E162014a857075a56DE8226b08FfCC")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x79124c5EE8e279B9b8bD3cF576af6bA9b5957654")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x4c3aeC1499f5892D8C5880760E2b35ABB450C404")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x2eCC772049808092af01d95D4D4B87975E8A3B72")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x8F630b584765E30fF08A55BF436D84041674196E")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x42B340961496731B0c4337E2A600087A2368DfCF")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xaf103dFe9ADa5964E2cb3114B7bB8BC191CAF426")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x894235628D36aA617ad5EE49A3763b287F506204")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xdFd88Db048F5dBe7a42593556E607675C6D912f5")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xB26c16491869Eb115362CE6dd456C4786bf10B3E")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x7B7a1C2fD495d060dF95Be983A74B84B01ef5F56")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x151af739E74589320C3Db8852C806F28073928B1")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x9a6e96A0D9cDd4213BAd9101AB7c4d7Bd1Ea5226")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x821621D141584dB05aE9593f6E42BfC6ebA90462")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x23d4b4D2318aFAA26205c21192696aDb64BA86c2")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xA86F796336C821340619174dB7B46c4d492AF2A4")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xFFa5bEc38dF933E062e4BC890A04beA4c43f4378")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xCD783bEB541a410BF25329DcEBDeAa431c33dFEA")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x648727A32112e6C233c1c5d8d57A9AA736FfB18B")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xF7440b98b0DC9B54BFae68288a11C48dabFE7D07")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0x8f9D085D1bdfB6c05a4Cd82553e871B3e61e70CD")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0x5EA49De5ECD0183dCB95252ef252FE2C9e677c85")
      );
    if (contractName == "SignedSafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0xCEFd89A03BD594287316Da4B4f060104c8B271E0")
      );
    if (contractName == "OneNetAggregatorIssuedSynths")
      return changetype<Address>(
        Address.fromHexString("0x126576EB6B604D734621629Deea7F951E55Fcc00")
      );
    if (contractName == "OneNetAggregatorDebtRatio")
      return changetype<Address>(
        Address.fromHexString("0x1636e633fe03CAD6a0459b557D2C74A2210c5Cd6")
      );
    if (contractName == "ExchangeCircuitBreaker")
      return changetype<Address>(
        Address.fromHexString("0x4bd5B027679E630e11BE8F34a0354ee88c3e84db")
      );
    if (contractName == "FuturesMarketManager")
      return changetype<Address>(
        Address.fromHexString("0x012A86834cd1600dC405fa1C7022425a484E34ea")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x19669E19253c7B69C1ff0c03Ce6356c34EA354e6")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xE83C187915BE184950014db5413D93cd1A6900f7")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xa56d0366B6915B72965ECb283Cae449ffb28f4aC")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xABA3ef57C8262E38382DF99767aa66aAA1aC15BD")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xc099c530Dfdc834CA75BD228C72dE6B683A961af")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x90860C61E51081E6FC294Eaa95232CAD91Df6414")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x8dCAa0E48C186c3C1dBF81B3b73908Dc24A72F6a")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xb093d0dAe697A94eA2565C638B792005EF22b450")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x1C2cbB4019918bF518Bb0B59D56533ed3bB8563a")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x73e677A6cCc8Df157ffd0dd3830A0e6dC4B86621")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xF41351CC7Cd694520917ffBd737Ed2ab6a3e4D85")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x26d77072ffd0837Db05Cd0e0963cAA0ffF9dC913")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x8C64bd4371070B9476505816e6911ca6829f55FB")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xb5c4AE8116D41e4724A9b562C2ae07e0bed895e8")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x24398a935e9649EA212b7a05DCdcB7dadF640579")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x41EE9D25b1a72064892Dfb2F90ED451CAFFd0E55")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0xc500cb57A23bAC85e793691440114D35FA4Eda82")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0x461721B15CCF0Ab1a1Ae6BB4c65c1d43e7d0b9d2")
      );
    if (contractName == "SignedSafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x0D1faFBa5cabD7C77EA8194BA7bDAe9617C17477")
      );
    if (contractName == "ext:AggregatorIssuedSynths")
      return changetype<Address>(
        Address.fromHexString("0x815957a4B8c35FA25De5259DaA95489Bb441578D")
      );
    if (contractName == "ext:AggregatorDebtRatio")
      return changetype<Address>(
        Address.fromHexString("0x0fD4e2cFD3909247C9fdb00c631FeaE3420e94f9")
      );
    if (contractName == "ExchangeCircuitBreaker")
      return changetype<Address>(
        Address.fromHexString("0x88dB124f40c6E7CcBfeE655617250F00F9E5dd9b")
      );
    if (contractName == "FuturesMarketManager")
      return changetype<Address>(
        Address.fromHexString("0xBE7A6623752a4217045A62dc0fbe56db35757738")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xAa1Cc6433be4EB877a4b5C087c95f5004e640F19")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0xd30F2EB31348DD03FC7a77130BbF66318a195c1E")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x4bcA7fF0a1F9BE5c8c77C6855B0ED9Fce028098E")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x50FbF15D6ADA7106d2ced71D76d46CEea11dc28c")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x3cc158e3D4412311166D74e8BeE1411Cda58c8A3")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xD0B60E2FAb47e703ffa0da7364Efb9536C430912")
      );
    if (contractName == "SynthetixDebtShare")
      return changetype<Address>(
        Address.fromHexString("0x0f46148D93b52e2B503fE84897609913Cba42B7A")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xEb3A9651cFaE0eCAECCf8c8b0581A6311F6C5921")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x1c4811F6FDd6a8F7F26A1d11191Ab5F95Abf6E1E")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x47247c67E761d885965B880C0d6a42c350862c63")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x34305B62550E0c652e697736E0BC93e67aB9b67B")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x288cA161F9382d54dD27803AbF45C78Da95D19b0")
      );
    if (contractName == "WrapperFactory")
      return changetype<Address>(
        Address.fromHexString("0x6B4D3e213e10d9238c1a1A87E493687cc2eb1DD0")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xa2e1aD41D7603d57Fd8055b892dAFfa49e35d9d1")
      );
    if (contractName == "OwnerRelayOnEthereum")
      return changetype<Address>(
        Address.fromHexString("0x05e8467f623FA90FEfb99259e7e3283667f1A390")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x5DacE7bDF27509507cf03c4503b3da74299b11f7")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xE532C9336934DA37aacc0143D07314d7F9D2a8c0")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x2346860A4B189161187303B24442389C4363b4D1")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x0D9D97E38d19885441f8be74fE88C3294300C866")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xe2d39AB610fEe4C7FC591003553c7557C880eD04")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x67FbB70d887e8E493611D273E94aD12fE7a7Da4e")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x26b814c9fA4C0512D84373f80d4B92408CD13960")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x16A5ED828fD7F03B0c3F4E261Ea519112c4fa2f4")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x880477aE972Ca606cC7D47496E077514e978231B")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xB98c6031344EB6007e94A8eDbc0ee28C13c66290")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x56a8953C03FC8b859140D5C6f7e7f24dD611d419")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xa2aFD3FaA2b69a334DD5493031fa59B7779a3CBf")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x7fA8b2D1F640Ac31f08046d0502147Ed430DdAb2")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x52DCF4f0019E16455621De5f792C5e7BE4cdAA81")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x2Ef87CE145476A895ef2D442d826aED1CFaf5627")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xfDa54191F3C0999dbf4c193dEF1B83EDD3e3Ba39")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x0b6f83DB2dE6cDc3cB57DC0ED79D07267F6fdc2A")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0x376684744fb828D67B1659f6D3D754938dc1Ec4b")
      );
    if (contractName == "WrapperFactory")
      return changetype<Address>(
        Address.fromHexString("0xDE390c23De4cb2c9CC2e50c28f22A8b5f947b748")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xd6EA9A708a95FdaE3f6dAE49F3131e833e671108")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xC32FE0748564F750084C8f39167A71a91B425417")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x660F51083E8c8eC1aD2771bDAa4104B84b1A793E")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x9CAa994c1de15B13bb9b1C435305AE1e548E0721")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xe9bC4e7AE355c88724C5d43BD89fBDB118B95eb0")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x4e890A2aee91ddcaef97410cB45D4C6cBCA583B0")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x75dc07eF40b3fC1045E25EE2bf3FfDD9BE4cCD68")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xa7679E25A6DF152691AE8Dbd147E88f0974D6f5A")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x26a2356A295bEa8bCA0440a88Eec8605234FdC29")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x45545Ab4a249E93Bd204329b295AFbeDF94E1Fa8")
      );
    if (contractName == "SynthRedeemer")
      return changetype<Address>(
        Address.fromHexString("0xFa01a0494913b150Dd37CbE1fF775B08f108dEEa")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xBb812B05DAb7cF985986d25d75340fD3a72c64Ee")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xB83422243B95efFc80C3103161140C28c739c345")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xF0f1EC406363b2627E4d1439075046cAdFb2D495")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x38635D2501F9ca46106A22bE4aF9B8C08C2B4823")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x253E60880f7393B02ef963fB98DD28eaC6a0026E")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xce754192eE9265D71b6286Db05329a16F20291CD")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xd3655A8e0b163E5ae3Bad37c35354050aa7C7694")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x48079E5a2A9BE87676C84F52Fed2b02C376AdE17")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x3AD8366B716DEeA3F46730dEBFF537B713c76404")
      );
    if (contractName == "EtherWrapper")
      return changetype<Address>(
        Address.fromHexString("0x44Af736495544a726ED15CB0EBe2d87a6bCC1832")
      );
    if (contractName == "NativeEtherWrapper")
      return changetype<Address>(
        Address.fromHexString("0x5814d3c40a5A951EFdb4A37Bd93f4407450Cd424")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0xD134Db47DDF5A6feB245452af17cCAf92ee53D3c")
      );
    if (contractName == "SynthetixBridgeEscrow")
      return changetype<Address>(
        Address.fromHexString("0xFdB31235cDFe68bfFD1d687AC3A2b31E80eacf0d")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xf1D0Ee19af243bcbC140A2259290B490E4df92A9")
      );
    if (contractName == "VirtualSynthMastercopy")
      return changetype<Address>(
        Address.fromHexString("0x1f6b96d2e7a5D70777D2A9c52215044FB3f40D37")
      );
    if (contractName == "TokenStatesKRW")
      return changetype<Address>(
        Address.fromHexString("0x780476375FEE186824Bdabc9bDA71433017Fd591")
      );
    if (contractName == "ProxysKRW")
      return changetype<Address>(
        Address.fromHexString("0xb02C0F5D8fDAD1242dceca095328dc8213A8349C")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0xF7631453c32b8278a5c8bbcC9Fe4c3072d6c25B6")
      );
    if (contractName == "TokenStatesTSLA")
      return changetype<Address>(
        Address.fromHexString("0xaf4FE67f2e9f9faBf26691D55D0DB6A694f2f107")
      );
    if (contractName == "ProxysTSLA")
      return changetype<Address>(
        Address.fromHexString("0x53A14CdBCE36F870461Ffc2cB0C9D63b0f4a297a")
      );
    if (contractName == "SynthsTSLA")
      return changetype<Address>(
        Address.fromHexString("0xbf075BF30c5Fc4929785f0E50eC42078B92DF869")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x07aCC2B253218535c21a3E57BcB81eB13345a34A")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0xcf8B3d452A56Dab495dF84905655047BC1Dc41Bc")
      );
    if (contractName == "ShortingRewardssETH")
      return changetype<Address>(
        Address.fromHexString("0x945d2dfFEE2d478D3D32E0f42b9649D1cbAe5528")
      );
    if (contractName == "ShortingRewardssBTC")
      return changetype<Address>(
        Address.fromHexString("0xCEECB8D9c19Abe84E13a2B6De3F5aD6e2991FE6d")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xa0354C17832E34dAf2aEae968AF3Dc558d5c6Dc6")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x74A729c5EDc84b68c52A9198DDa9293Ca11B241B")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x2709b3568a79D7E00d6729E96b84a1996CDB89ef")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x596024E2F73532bDb75ff33c0bD515a70e2D11C9")
      );
    if (contractName == "CollateralStateErc20")
      return changetype<Address>(
        Address.fromHexString("0x04C3f6207BE48De777967eB1886469E4E268FE07")
      );
    if (contractName == "CollateralStateEth")
      return changetype<Address>(
        Address.fromHexString("0x4B58bbB4Ff947315b558904fDcEbbdA65b9523aD")
      );
    if (contractName == "CollateralStateShort")
      return changetype<Address>(
        Address.fromHexString("0xd74E3A605A1a7A8a83D25DF00D4057985E3CAC30")
      );
    if (contractName == "CollateralEth")
      return changetype<Address>(
        Address.fromHexString("0xdFd01d828D34982DFE882B9fDC6DC17fcCA33C25")
      );
    if (contractName == "CollateralErc20")
      return changetype<Address>(
        Address.fromHexString("0x5AD5469D8A1Eee2cF7c8B8205CbeD95A032cdff3")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0x9712DdCC43F42402acC483e297eeFf650d18D354")
      );
    if (contractName == "RewardEscrowV2")
      return changetype<Address>(
        Address.fromHexString("0x64ac15AB583fFfA6a7401B83E3aA5cf4Ad1aA92A")
      );
    if (contractName == "SynthetixBridgeToOptimism")
      return changetype<Address>(
        Address.fromHexString("0xE8Bf8fe5ce9e15D30F478E1647A57CB6B0271228")
      );
    if (contractName == "StakingRewardsiBTC")
      return changetype<Address>(
        Address.fromHexString("0x72Bfefac12fAbC2224fE66d7840E8134BEf95e39")
      );
    if (contractName == "StakingRewardsiETH2")
      return changetype<Address>(
        Address.fromHexString("0xbd700862ef238028E3C28D0670851eA1230ac7B1")
      );
    if (contractName == "StakingRewardsiETH")
      return changetype<Address>(
        Address.fromHexString("0x347E15f035B4645C6E330d758F73eC3AD2bFa5B5")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xDcB48E969E69Df65F72f77b2AAE145509733E5C0")
      );
    if (contractName == "CollateralManagerState")
      return changetype<Address>(
        Address.fromHexString("0x8D65Ed88D6162a2b3B5F71c45D433d4aeAc93065")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0x53baE964339e8A742B5b47F6C10bbfa8Ff138F34")
      );
    if (contractName == "CollateralStateErc20")
      return changetype<Address>(
        Address.fromHexString("0x8e6669A625c92279E137f887c0175de8C47a3622")
      );
    if (contractName == "CollateralStateEth")
      return changetype<Address>(
        Address.fromHexString("0xb0243A27b8c08B78B4d7Ae0730670Cf824345114")
      );
    if (contractName == "CollateralStateShort")
      return changetype<Address>(
        Address.fromHexString("0x153d4BE15626736B9208958d5796EED017aB766c")
      );
    if (contractName == "CollateralEth")
      return changetype<Address>(
        Address.fromHexString("0xbBe35b80B6F82F17Def6Ed6F76AC9DDf5029EC73")
      );
    if (contractName == "CollateralErc20")
      return changetype<Address>(
        Address.fromHexString("0x42e1B593178BC75e452e5C88A706C9d4cDeBeAF8")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0x0AC93512426e7D3C346E5a59B87504644f0780d0")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xC9985cAc4a69588Da66F74E42845B784798fe5aB")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x771FeFCe3706A38BD49F0Dea8eb53cCd1D8d8B59")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x87505821709A7fbfe3317CF622a5Df018D9d38E6")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x2a6BCfE6Ef91a7679053875a540737636Ec30E4f")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xa08868E26079c5e4c4334065a7E59192D6b3A33B")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x857f40aa756e93816a9Fa5ce378762ec8bD13278")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x0F126120C20A4d696D8D27516C579a605536ba16")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xeF71dd8EB832D574D35cCBD23cC9e5cde43f92De")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x88021D729298B0D8F59581388b49eAaA2A5CE1D2")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x57e4f1D434A59eBc0Bac64Adba0fbf7d56De91f6")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xA0544264Ea43FD5A536E5b8d43d7c76C3D6229a7")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0xc6Cd03C78f585076cdF8f6561B7D5FebeeBD9cC2")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x2fb33E35829D2bb04D8b5eB9531DA129E72BceD4")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xD6f913019bc26ab98911046FFE202141D9d7f2e6")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xEbCdeFe5F392eb16c71a4905fB2720f580e09B88")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x6F4a1312a48D9887Aa8a05c282C387663528Fe05")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xe9a2A90241f0474c460A1e6106b66F8DcB42c851")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x908b892d240220D9de9A21db4Fc2f66d0893FadE")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x75408bdC4647Ac7EC3ec5B94a86bA65a91519Bb2")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x9A71fC5AAa6716b66A44D11B4BBC04bD9F36AE8f")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x75bA0dB0934665E37f57fD0FF2b677cc433696d4")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x6A8a006786819D551eF4f0AbFA9264D2d2A7ff2f")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0xD3E46f5D15ED12f008C9E8727374A24A7F598605")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x550683599b2f8C031F1db911598d16C793B99E51")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0xC5301Eb1A4eD3552DFec9C21d966bD25dDe0aD40")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xf4435125fEAC75600d8CC502710A7c4F702E4180")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x130613411D53076923Af9bA1d830205b34126d76")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x95541c84A45d61Ff7aCf2912aa8cb3d7AdD1f6eE")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x07d1503D736B5a5Ef7b19686f34dF6Ca360ce917")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0xA8A2Ef65e6E5df51fe30620d639edDCd2dE32A89")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0xd748Fcbb98F1F1943C7d7b5D04e530d2040611FA")
      );
    if (contractName == "AddressResolver")
      return changetype<Address>(
        Address.fromHexString("0x84f87E3636Aa9cC1080c07E6C61aDfDCc23c0db6")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xF49528689234d46724383669BD8658bfB47f8575")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x9Fe11221CC742B05b541A31862b46D8FB57eacB4")
      );
    if (contractName == "SynthsEOS")
      return changetype<Address>(
        Address.fromHexString("0x63417fCE3a75eB4FA5Df2a26d8fD82BB952eE9C0")
      );
    if (contractName == "SynthsBCH")
      return changetype<Address>(
        Address.fromHexString("0xFc7E3fb8e54e11798a16403aeF0152651708B902")
      );
    if (contractName == "SynthsETC")
      return changetype<Address>(
        Address.fromHexString("0xD62933a82cDBba32b4CA51309CA2D7000445d0c5")
      );
    if (contractName == "SynthsDASH")
      return changetype<Address>(
        Address.fromHexString("0xCC200785cea662a7fA66E033AA1a4a054022a197")
      );
    if (contractName == "SynthsXMR")
      return changetype<Address>(
        Address.fromHexString("0xfFd76a5fE92Cfe681aEFDEA9FA5C22372D72B510")
      );
    if (contractName == "SynthsADA")
      return changetype<Address>(
        Address.fromHexString("0xEca41030226Ace8F54D0AF5DbD37C276E100055A")
      );
    if (contractName == "SynthiEOS")
      return changetype<Address>(
        Address.fromHexString("0x22f1E84c484132D48dF1848c1D13Ad247d0dc30C")
      );
    if (contractName == "SynthiBCH")
      return changetype<Address>(
        Address.fromHexString("0x4fC83F43AFd8194c3fb08042bbF7fEdbB52a05A1")
      );
    if (contractName == "SynthiETC")
      return changetype<Address>(
        Address.fromHexString("0xc13E77E4F1a1aF9dF03B26DADd51a31A45eEa5D9")
      );
    if (contractName == "SynthiDASH")
      return changetype<Address>(
        Address.fromHexString("0x99947fA8aeDD08838B4cBa632f590730dCDf808b")
      );
    if (contractName == "SynthiXMR")
      return changetype<Address>(
        Address.fromHexString("0xf796f60c5feE6dEfC55720aE09a1212D0A1d7707")
      );
    if (contractName == "SynthiADA")
      return changetype<Address>(
        Address.fromHexString("0x75928A56B81876eEfE2cE762E06B939648D775Ec")
      );
    if (contractName == "Liquidations")
      return changetype<Address>(
        Address.fromHexString("0x9880cfA7B81E8841e216ebB32687A2c9551ae333")
      );
    if (contractName == "BinaryOptionMarketFactory")
      return changetype<Address>(
        Address.fromHexString("0x16Aa67021fdDEa0f7E75bB54998Fa438832e9E5e")
      );
    if (contractName == "BinaryOptionMarketManager")
      return changetype<Address>(
        Address.fromHexString("0x95dCaDDaa40aC726BF4734754e6B75eAe6F5eb9F")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x27e886EA9C82980b4351878CF6459043F77126e7")
      );
    if (contractName == "TradingRewards")
      return changetype<Address>(
        Address.fromHexString("0xBBfAd9112203b943f26320B330B75BABF6e2aF2a")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x2dC79215005767c7A8cF1954586Dd804eA1a8685")
      );
    if (contractName == "CollateralManagerState")
      return changetype<Address>(
        Address.fromHexString("0x0D69b7f60dc6f26c1b5c0e424cD95A83d9FEFb3a")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0x057ee6230Fe8342ED627D99FB4E5169970f29b42")
      );
    if (contractName == "CollateralStateErc20")
      return changetype<Address>(
        Address.fromHexString("0x8D11865B2EfBeB9f73fa2621167e93690AE599af")
      );
    if (contractName == "CollateralStateEth")
      return changetype<Address>(
        Address.fromHexString("0xda2331Aa29486A8d3c2fF448c6B4f1E2194a6664")
      );
    if (contractName == "CollateralStateShort")
      return changetype<Address>(
        Address.fromHexString("0x8d08f82A1e76E43b78b0F64F1a9fbcA41f6fCf68")
      );
    if (contractName == "CollateralEth")
      return changetype<Address>(
        Address.fromHexString("0x9458436ccd294d0e465f9b4B6C0edC034F68145B")
      );
    if (contractName == "CollateralErc20")
      return changetype<Address>(
        Address.fromHexString("0xBca433dE144e375034F21e2DDf7e38E0dC820B31")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0x00fAaC0807a9928Bd84bD8958acAf8A2eA5DE14C")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x8EfAB91EAd9C4A89A83A7BB6E9f278aa916Eb4E1")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x953eAF38c30Aa8d358712Ca5606D1B6da8ca28D5")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x189B2f2F23cC264518129a61c556490E1b8FF7A0")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x0dfB3daf6108742309A856E72212C04eC6c59157")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xBaF7cB0B9640d313A095E4074d874264a3A24B34")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x9365b8875Fc4cC72cCb56A5BA16785F14c2436b2")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x6813955a3b7F3951ca60C59A5e78d2Aa7492c92c")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xfBb7B55A0588c1E3E05D4d3ac66918f0aa6a511B")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x8b6002e80C987eeFb781a968aEe019F4A8193233")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xA36f5A656c48EB0b43b63293E690DA746162d40B")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xa470Bc799c7011B39D32f105685080033Be6413a")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xFC37Ba057EbA689cb19479A77c5d291034E7cF46")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x55319032b03fA4e93905E5123aff59A3C4980B94")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xC6484ADCA44c3e524cdf82A3f293C77390272180")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xe8587f02e5299287e6BFaa127Dd54A011a140Ae9")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xcF5D771A6E3BaB15222771124c14c71013694DF3")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xe364063B7DD23cc3042B3494471D25D73c4f103a")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x3EC963b820427F83B4c1F8A8E549C4d50A59519a")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x5EFe8c7C561dEAb6ceC2DB9C40F5d0c7d4b4029E")
      );
    if (contractName == "EtherCollateralsUSD")
      return changetype<Address>(
        Address.fromHexString("0x62B66e664d68a0dd2494aE148C6c556d27af885F")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xD4fC8ac667Edb298B8F421F17d61020Ab610613e")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xE3871c056c3779DC19525C675f7dA7F306AEaFB0")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x5d2399cdA3Daedb92D0b9cde4F7B99Af75Ee408B")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x4390C5D8591A078eB20c0DdD346bC5071E3c9115")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x99Be578569F4D746377ce13fb7c50dB9d71094f1")
      );
    if (contractName == "Liquidations")
      return changetype<Address>(
        Address.fromHexString("0x155d432847CA737d025438E60FFCCeb3cC4B1Df6")
      );
    if (contractName == "FlexibleStorage")
      return changetype<Address>(
        Address.fromHexString("0xB1751e5EdE811288cE2fc4c65aaCA17A955366be")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x9E7c3fc61bdDD74E4E6Ba99B7e797EA09bb90253")
      );
    if (contractName == "TradingRewards")
      return changetype<Address>(
        Address.fromHexString("0xC7465779aDA35667515C92Eb8227F6b9f7EA8333")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xb169f410Da683c9782CCaE8339488c96d4397705")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x597ce21435E593776321a1B124237B40087eBec3")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x8F42e36710438F662C7F6212fcb4D3057fbB78bb")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x4E3d90e51979149B09E38A2B5A3F545F64F281B7")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x807773e7a5c9b644c690244f30b429fA4B6F384b")
      );
    if (contractName == "Liquidations")
      return changetype<Address>(
        Address.fromHexString("0x4A382522BEf4Ca3266eD9FF47ea1f50170D1bd77")
      );
    if (contractName == "FlexibleStorage")
      return changetype<Address>(
        Address.fromHexString("0xa142f3C819Dc24D5BC15695bC1eF5F9d137bf2cE")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xd155408E4D4C525259fB430DE76F4ae24ee22a5b")
      );
    if (contractName == "BinaryOptionMarketData")
      return changetype<Address>(
        Address.fromHexString("0xaEA08c2Eb990d5552c327353b310bFeB0a36463C")
      );
    if (contractName == "SynthUtil")
      return changetype<Address>(
        Address.fromHexString("0xC88AE3be40CAa09CD16Db5816e6145E0E929c93c")
      );
    if (contractName == "DappMaintenance")
      return changetype<Address>(
        Address.fromHexString("0x28B624Ef2284749AEBF3dA3c7f5E287F716D1935")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xE3b403cc2e6509Bc3Ef5520667A598291DbdA8eC")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0x1C300bb7CCd2Ad92514ad2C57317f6c95202c0ff")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xef23603Baf3AF24536F89ca9C0D2f893011ecABF")
      );
    if (contractName == "BinaryOptionMarketFactory")
      return changetype<Address>(
        Address.fromHexString("0xdA78C7356D6E087fb0e1F62365C9259DA1a6b298")
      );
    if (contractName == "BinaryOptionMarketManager")
      return changetype<Address>(
        Address.fromHexString("0x4176483150F667B2303C1eeF295431F0Cc593783")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x6d4e4821480B30082F8a1abE6c3cd294D9C40f32")
      );
    if (contractName == "BinaryOptionMarketFactory")
      return changetype<Address>(
        Address.fromHexString("0x14c049BDf3bcf46bc884e26ceBC130560C60D549")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xD79c83bd0A7B1e6d63a5394305552d73D1f1F6C7")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xcBd9a8E4b0d83EF55443f55373F092C23107a7f3")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x4B0833796E04DeBb063b30c73656eCFA6D5999fe")
      );
    if (contractName == "BinaryOptionMarketFactory")
      return changetype<Address>(
        Address.fromHexString("0xaf0B36698FB7dC5213d3E962A5de44633CAbe158")
      );
    if (contractName == "BinaryOptionMarketManager")
      return changetype<Address>(
        Address.fromHexString("0x9492eac3c8c6F1E768C71Fa2eAf04FB2F42104eC")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x60F424d2B2fC49c02DC557105F4f0ec591c15692")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xFC7E3D9797036164725623d7226cc791818Fb58e")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xabab1FbC0Eaea4a8c0d5e7e50246b8aA0a644533")
      );
    if (contractName == "AddressResolver")
      return changetype<Address>(
        Address.fromHexString("0x25ee175d78B22A55982c09e6A03D605aE5B5c17C")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x0FA8d4004d2CFB684EeB81b6f80919ce8d705D7f")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x3c0272bF8D2Bb287918D0fa27f02E8b78457c3EC")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x71Ff93Ba9aD81D97A33eC957b4350D641f489410")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x4c7Ce8f2d605B70Abc1485a72891B63940282DD1")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x57d6cfee7ED438AaE74a31a890DF22051EE35d49")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xf7AC3835769B8c692Abc305450d4fAb0c4c5698a")
      );
    if (contractName == "Liquidations")
      return changetype<Address>(
        Address.fromHexString("0xBde26A97eb38A74F171085fb4B77d524923EFdDB")
      );
    if (contractName == "EternalStorageLiquidations")
      return changetype<Address>(
        Address.fromHexString("0x5D4A4B51A824E2dD1C25aD16023Bf8FF3F648602")
      );
    if (contractName == "ReadProxyAddressResolver")
      return changetype<Address>(
        Address.fromHexString("0x242a3DF52c375bEe81b1c668741D7c63aF68FDD2")
      );
    if (contractName == "TokenStatesEOS")
      return changetype<Address>(
        Address.fromHexString("0x4cab7DB60Ba60E795Fe06De213F5d5483Aa25233")
      );
    if (contractName == "ProxysEOS")
      return changetype<Address>(
        Address.fromHexString("0x2fc23EfCDc06636DE7f9CFfB70a8a2A10C5b601e")
      );
    if (contractName == "SynthsEOS")
      return changetype<Address>(
        Address.fromHexString("0x1FeDE3529b8Cdb54DbbA4cE4996A76B195e3B0F9")
      );
    if (contractName == "TokenStatesBCH")
      return changetype<Address>(
        Address.fromHexString("0x78e7395Df87D890199d147AFb347351004aD5956")
      );
    if (contractName == "ProxysBCH")
      return changetype<Address>(
        Address.fromHexString("0x76c04f5025aae63cDf8b40c4296122d61572c353")
      );
    if (contractName == "SynthsBCH")
      return changetype<Address>(
        Address.fromHexString("0x62f43AA89b3050bBf080BbCA4b0ef798bf3cE0d5")
      );
    if (contractName == "TokenStatesETC")
      return changetype<Address>(
        Address.fromHexString("0xcc1fb912786Ca8447235d3c5Ab7c253f98AD4E22")
      );
    if (contractName == "ProxysETC")
      return changetype<Address>(
        Address.fromHexString("0x2De5Edf295c21FCBA340A4C4fa9F376F24282E73")
      );
    if (contractName == "SynthsETC")
      return changetype<Address>(
        Address.fromHexString("0x4A73356315E965724ee030d8AF1852C62647b786")
      );
    if (contractName == "TokenStatesDASH")
      return changetype<Address>(
        Address.fromHexString("0x2fe02b9445F20d2Aa49Bef93Ca201f81FD8A7461")
      );
    if (contractName == "ProxysDASH")
      return changetype<Address>(
        Address.fromHexString("0xE4bC13C29513e5D0BdD68258325f2D01a4B641A0")
      );
    if (contractName == "SynthsDASH")
      return changetype<Address>(
        Address.fromHexString("0x9c388A263889440033c18d92c6E15f6Ff2878A75")
      );
    if (contractName == "TokenStatesXMR")
      return changetype<Address>(
        Address.fromHexString("0x195721A55507bd3dfA65Ad1A8026A51Ad5aAD33D")
      );
    if (contractName == "ProxysXMR")
      return changetype<Address>(
        Address.fromHexString("0x4708C998e2979f77766258bE94526BAfa84b1270")
      );
    if (contractName == "SynthsXMR")
      return changetype<Address>(
        Address.fromHexString("0x62687aC6BA9260Af5A979D773aC674f883f71450")
      );
    if (contractName == "TokenStatesADA")
      return changetype<Address>(
        Address.fromHexString("0xb645c8c6ebfc1EE3B178998b780cEde91ca2f8Bf")
      );
    if (contractName == "ProxysADA")
      return changetype<Address>(
        Address.fromHexString("0xBA939808928b7a823D6F1Fc6522FC57A8000694b")
      );
    if (contractName == "SynthsADA")
      return changetype<Address>(
        Address.fromHexString("0xe15132582Bc814EAa4505B67A1965f29617fFD7B")
      );
    if (contractName == "TokenStateiEOS")
      return changetype<Address>(
        Address.fromHexString("0x98E250579F62F8F1096531C1aDCDF458D47cF105")
      );
    if (contractName == "ProxyiEOS")
      return changetype<Address>(
        Address.fromHexString("0xEe2d75e783df7c191012896BFf140fc2Bec08b3a")
      );
    if (contractName == "SynthiEOS")
      return changetype<Address>(
        Address.fromHexString("0x25bD93dE8023E190480b1597280409320191CdAF")
      );
    if (contractName == "TokenStateiBCH")
      return changetype<Address>(
        Address.fromHexString("0xD0aFb54012C0D80753Fa2315bbdfab22404c4F2C")
      );
    if (contractName == "ProxyiBCH")
      return changetype<Address>(
        Address.fromHexString("0xe8d362f82433af8C550436ABc767e3FeBa2C1297")
      );
    if (contractName == "SynthiBCH")
      return changetype<Address>(
        Address.fromHexString("0xE486e4d5A4b5942ACb4D5F040813E833574e0533")
      );
    if (contractName == "TokenStateiETC")
      return changetype<Address>(
        Address.fromHexString("0x5a78b68792607a5B6ccd7E86A8865DFb2C99DAa9")
      );
    if (contractName == "ProxyiETC")
      return changetype<Address>(
        Address.fromHexString("0xe7FcFd693dD77a083d0B38ad399f9b6b8B37A597")
      );
    if (contractName == "SynthiETC")
      return changetype<Address>(
        Address.fromHexString("0xD80D64bef374d75a76A71E59e35bDC252d89Da82")
      );
    if (contractName == "TokenStateiDASH")
      return changetype<Address>(
        Address.fromHexString("0x8a30035876Ff4e75FE68E9758A7A1ACc0a1f5fF4")
      );
    if (contractName == "ProxyiDASH")
      return changetype<Address>(
        Address.fromHexString("0x7A2354508041246F50d527081937C5CB872468c8")
      );
    if (contractName == "SynthiDASH")
      return changetype<Address>(
        Address.fromHexString("0x0d97D6E191cbBdB5D9d7a757Ebb603022B3776e5")
      );
    if (contractName == "TokenStateiXMR")
      return changetype<Address>(
        Address.fromHexString("0x93D8e930533a58c91729F2a72310748cDBbA2dCC")
      );
    if (contractName == "ProxyiXMR")
      return changetype<Address>(
        Address.fromHexString("0xCE532C4e0de97C43374E0e26D6134Aa33F297dBb")
      );
    if (contractName == "SynthiXMR")
      return changetype<Address>(
        Address.fromHexString("0xa6d10a36fC879D63a8fE1eAa9E22421f60b593d1")
      );
    if (contractName == "TokenStateiADA")
      return changetype<Address>(
        Address.fromHexString("0xce53Cd0C8A8f1C0E658E524DA3fdd11ea3097965")
      );
    if (contractName == "ProxyiADA")
      return changetype<Address>(
        Address.fromHexString("0x15697a9dc703FfB6dc6AC40f7A144284D3a73bEB")
      );
    if (contractName == "SynthiADA")
      return changetype<Address>(
        Address.fromHexString("0x0Dc2174Bcf9cd8cDAD5c99d51Cf305eF724e5E4E")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x19e736e02b5A2d268Eae7F9deD04bCEcCa17b153")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0x0E32712f3D49F5cf241D6dC085b0A7952F3f9DfB")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xfDC368787518de6183416fC8B68fe98840C77fdC")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xa3b8cb2CDbD8f0c29997878Ff6e4814f59015055")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x858f3B8d96F628d50078aa248E729ADd4989fF53")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x85eB7F5EC7857cb64A98bB00a5817411E5B09C0F")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x3ACf1827706e90ef757880755B2Fe2f88899D766")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xE00B50bE6867bDAfDf2f5de66d4E7b574E17D39a")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xb93f37421bB54c5acc8a923433d93FEF3140E294")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x8f44e277EBEd3fe2B835c01bB44BC26a1Fd27924")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x5645046F48950d14628568f4B05f16130C95Fb96")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x13C3936fDdcD90625deF20e070e896adEeB30bc8")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x9aF97DbF1B50D98E4d0501df97F74a9CD0165F9D")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x38456AbF37Ee61800069C9D22005984624f9b662")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x2340A05a100b503D12ae5497e0104D2cfa86E629")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xdb51CEa1AE234208F2886d6A1A7751f92451130C")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x4C691C4A9317696800Fc5c9921E63ECdb4ef03c5")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x0145755Cdc97DA0A2c0AB33C735FFF7Acd809FFb")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0x8B9b2c79466A6543e6748275c6d58aD63c802013")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x2a39cb9413090Ba80F72F330e2D96CB4404B735a")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x087C440D50f24B06a2e3EeE01Ffa0aA97f59D9fD")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0xC21040C50a8A54028A5d21F2194bCf999F2d2193")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0xaA64F037116bB4F6F0f3763955Fc40744ac8DD89")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x9cBC7947b5386ace8d672b1C755475D8D6996628")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x6A328D179fb400f2854fD442DfE3062c04233896")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x5E3BeF994ea83565C039d8B1b9d8F09D10221ABb")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x12E9e7eDe336D3a45D032C08b72FBF199eCfD7b8")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x8783665a344Bf09fe671210520D764c38131D056")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0xD60AB08B6D41e6d8e24435F3Fb09E6C93c12e2A7")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x02D9c1808a480602D0DBfDE8E091b24Fc1DB551C")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xdE0295d9F398f42a519492c711C92d8d1061Aad7")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x1662Cbe7F228eE055FbE683F50B33480816621F5")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x5e974a6bA783c00e796e761CeE78BE72f831E77e")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0x15bd15ba590BfEE07CD7dab393c3F7a84e4ccD76")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x5FdE598e1f4108692E6e0F73919B3EC173d9cE47")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xe4F784703BFbD6Bb2A96b4165Da79B3a03EDA377")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x3EecEDffF1286713e99D94C3483833B761ea42A2")
      );
    if (contractName == "DelegateApprovalsEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0x803706FC12b926C609714248C67535Bf4A431Bd9")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0xc8668617C25e8411FC87f2df68A5315cFEE19Ce0")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xE24A751CCcD1bd5AE441F453d11520c6131b5633")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x404469525f6Ab4023Ce829D8F627d424D3986675")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xdC44195a59f252b8d19B9adCaEf32c6DA218778f")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xB0A553cc14471747696D886d1A26C3C1B2bd5bEc")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x0f6a1dB50ab1cEDd64B2374a42BE6525c0b9AE6f")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x7d24C3E7A9a8F2488e13CbFC2186757427f23a46")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xEba0895647b049Bf27fe3C6267D44432b96AcA57")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x002a5D6e079FaEfDE7f5eD2A501EaFC1f66B42C3")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x8E20577D62D3Eab7BA9aC1b5e480d85B1A4B1D33")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x4d331b6677EF6Cf9F15Ca4Aa67684152aE053C33")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x2c40dB5e69DFD317557AE17838024EF7f962f1D8")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x8512bC3B2976A6f63e3D8ed1bf5B7d4cDCa139DE")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x64CA1E21e5b04f10399ab3Fa812B3e36a11fb7cb")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0x65967355770bc42353180c51ae366379fE557642")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x5470E57d61DE884fD009f26cf19ceC08cf120648")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x8b7293Fa69dA973b50F38800ecD341b81E27951f")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0xB8CFB40B4c66533cD8f760c1b15cc228452bB03E")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0xfEE13C7e622E031F3a749D8Afd152F1D31D8ADC3")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x022137415C1723e17AdE26C81F4639EeE7Dab4C4")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0xb32F29197848176eE087E13966959cE20e3550A8")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0xb3E2Bb2dF5b97E043Ef8bf5752C123390c4D6730")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x7Ea8E44FCD0489cC620fa0a53dC236C8c30CF0f9")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x3aeE3032007a91202dDb741a587DA060514c3a26")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x0a817fB19E07dA00c5Ad7DaECF8ccCc367D78396")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x6FB484C7F5D20fEDF9dCEf6ca5a58AD431b1E15f")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0xaf414371217Ad111bCc3853C45b9651A3b4888CC")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0xBEdAa9e65296B9Aa3581A346Dc292Da2CF29FcfC")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x2938EF1756ee5acFe01836AF3B78C65De8DB895b")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xb7c4997c1eebFB4D027Fa359C6464B4d63D3D2ba")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0xafd271972660c3BE60247eBc61a4ec262AB396e2")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x8261793AF6BD8E5e38250Bebc488729e9Afb8054")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0xbf707c4159Fb7df0e87Ae25b71760e917a8B8b32")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x998987aC1807b4649cb864A09D2219c75c46aA14")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xf890F2FAb2188Dd66da4F2c37836d6674DbBA3cC")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x23091d1237c9E8487de74C6C725bCD3048FeB8ef")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0xbc5658CeF24f221530eD8b418425a34Dd63c9b28")
      );
    if (contractName == "DelegateApprovalsEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0x3C11FE34E416eDA134D30f7550f2986BDF8B5c08")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x5b01D9f87080CABcA881A0Cf4e45C0E2ccB7Edde")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xbf740AD1AeA597a315546E15a7B8F40895fd59b2")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x75003E8BEf2997Da76a542aE54dab34BcB06De39")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x736DbDDdF626e23D02267148C5a365Da4fF0E59a")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x8b3a897DA42947f5096a3cE12FF4996FadA31e8f")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x3b8117bf1540cc93407F5b45B702F62d0e34bdDf")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x65a47Ba27B2D588f296d3d106aC2f745f6eCA3d1")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xBF199A503D023fe62F6EFe07D20bcbD46ecBCe5C")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xd2EDEcAf8974443e4EbBc8046ca3D0dfA9a4E603")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x9251D74C9eB5d53cD52C4Ec00d15f9be07E3fDED")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xB82808070e19CE1716D358E40BBDcA6cD558C319")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x454e9E8eF5d80df2245D2708fAf3A251dF0f4187")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x45e8Fc8C7B41905DC81C88982CFF97cB452D3C8f")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x4eb01Ba92d08474e10206e4c83FaDA472Dcc8b81")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xfE7C07F008712F3A9871022171E4B890294e8f98")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x514800b23F2775f62F6a9A579223DC079c2DB986")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x7a37E771a8F3ed5249a6196900e3EAB153fC721E")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x6A642a68007b7FD2708e999f9203B01A27e40cA1")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x93fFE7321dEBA55Db306163c94127890A5377AeD")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x026Ba0e141c6F30E7083ec72eE4706eb0f495f8b")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x491B16173694bd0D82Df4123EdEA07882D9E6100")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x7A18bDc0f4CE65770E4A6D0186ef31E09c706613")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x8DF74dB63B591d503a0f3C3bC1a9E85807b623aF")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x51EED824708e2e619F5f033977D25930f0B7a47a")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x6dB76B99f5d1b73A2B8Faa6Eb4aE34A8b463FF7b")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x4B3261272f7D6e9bF8c9BBE255E67ea9760F5141")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0xcB7A85f62343EE88423c401C170955B041667a49")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x37d103076d9332a84a6FFD52EE76e3FC9a844740")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xB71A6a49F960d29D1AfA84D786CD14208a7C8974")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x3d32e870533bc83Fe44a2E2f6be7eAE19df46f2C")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0xFF225475Fd76C0dB33973e97b8751B7f77c0f6cb")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0xbf7D21f7324f277EaEBdf4F8D5bd5848D7728b5a")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0xe6b5E054962F762bCd87e5A9E2DF679E4B9ff36b")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x8B4Fba594827aC1EE3497507E9283f45bbA88C08")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0xaA148Dd8E89CEeEb1AD2b76e729f6cf0Df281bc3")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x30f96F1A4065771B2820180FB6eBd09Fb3f8FAE1")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x3D76505Ae19D0fDd6614ccf3cDe22146e8851c74")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xe3624bc19Ad2133A8252d131E535b8d5B22B1034")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x00FCcBf813b26CD5F2e1ACA100bA0029763cCa4D")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xAeCc40DEC53Ad7889651bb2C2D71d66F883dDe20")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x19A7902F96c8dd2588B30cF8Fcb4b0f137FDC7A0")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xF2aC27d498CC3d4CE62D9d73a66eF63b353e9CCa")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xBD294e25d04A9E17f17B4e58ACB9411Ff9c210fC")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x153Faba5063eD6Fd5CC43aab74B071DdDaDC6b74")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xA34054012a4dd61AaE24aDb7262164fcE9a494C2")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xBBD8E1aff8E9cA3a5090d3126383CFBb9439E248")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0xE1A0C269b1c70E7b0ac41Bccd65636EDa06C44B9")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xF9045DF72192BE7A91B92FF4C03a5Aa15A2944fC")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x7B6090DB4b7650aF4F5B6af4245b5707AfE81425")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0x20A366934F9C5e82f756c6D5889D3F77c00E9f78")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x1c887EA195D28Ac598cC4179A0E8A23aeB4494b0")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x70488c0c7aB60bc79ca6F52Eb5135f8545FC30C1")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0x28415735383F43d3b15410cF6d33E974Ecae775d")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0xD5898Cc506b760a19f3856b80F22bC7BA439A1A8")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0xbb1f67651AB4afb3eF23BE1d62485750fbdF4A31")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x8d520a518C6c06f27655A16cBa716ccD7f0b6745")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x3A4Cd056eA71B6E897fcEc61aD7361D89FB38DdE")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0xA23a25631266aab7b77e9aA2f8fafF14399e10B3")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x9342Ec953051308DA6bdd1E25c656E44Eb627958")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x070698A2AEFd674B1432EBE5547Bc71da340fce8")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x0a1d4C736b499622E8b3d516D5b40F147929147F")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x13eF20a81Abc95577b883A8D92618679AA0DDB7e")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0x525aBf10b31D2Cc3ED4Af7b443Ae65D2542F623B")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x8507045685cB3a59160C68F68Cb30F0d45cFD0dc")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x4C404f873C5cA52F59029503b90908613b0f7086")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x5efCaAac2a99852cD29cC8e48De2e5d7f9323B09")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x3a22BA9cc007b40a3bee874Cc7Cadc6AC36649A5")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0x9cddBC34662F87C976589675aB81da278D5F70D6")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x5AF39e1C7bdf4E81179b7dF5BFd5dFe26853628E")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x475dB05B5ABc9c1CA7005777b8A390a1782dE257")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x316e6bDB6B38A8F41F2E0Fb3A3b7Fa1c4Ae74EFC")
      );
    if (contractName == "DelegateApprovalsEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0x5437e4Ea6770ddCD0Cb281A2F2136324A24c38F8")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x876C10C2e94f03e707EDF632cB95C5b2b108e97d")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0xC15bF975d40A2e077373a29AaD52bfC27c1BF8E5")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xacc97436adEcf2CB62e051B5464Aa54508B90d41")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xF799DE69AB4e3Fd91EBC004b0C3055919a76970D")
      );
    if (contractName == "IssuanceEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0xe66000ee63050461Fe930E6F5A3456A735dC86A1")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0xF92e70301E26AaDeCCEc5016b7D0167DAF416d72")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x7339019DC0C6d6B14bD66E662dbA66F3068Dea7a")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x6f11DA312c04f6EF822c8083aB51391D40734B08")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xb85BCf6B4c380433FC16227eB10b536D5D71aBdC")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x37Df8832a8aEef0cfFEDF8Fe0660C47CD720c872")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xCd64B6D8eE3eB3B9149adEB25B1067ce6e4aE228")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x0ff1B2FDA0b6eF2D16014dc01d9E52C9cDE0f010")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xCDB75d01ee35534620FCac3c09B205a612e3ac4d")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xc1EeC0fE3Ba7f7ca1620Ccb349C5537fAcbe8ccA")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x5cbA2F4Be0BD782280Ef46A8298592e63d026053")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x40495EdA979BBA6f9989620F570275032967d9F2")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x2106A59c56468C23DA29e69D41513911D43BaDc2")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x7C2f3449fAB45098886b50666cA271B6B724D2d2")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0x2557cf272a55aC294E6be440d0f007e68f41b230")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0xDb103c923C0D38f8490b21cf0fa86cfF7D050FEE")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x0985975b17676B37A0456aFC5CD80791f638A9F2")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x74e148070d54CA01554E2d329df08CD6c7B95537")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x50999Dc83C6970B0A622B1a2D2DBFeCc600bA68b")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0xBC17bfe5fC8c785924652E1dBf960eB44dbea813")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0xdbda401c423e74154aa0b0F64659BB3F2785F755")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x1AF67BdA0B3cDB4c28919A595E4c867DfD504e6e")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xC904D68651EcF899B90B5d71c782F4B366118fF9")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x90714b472b32E9B051F0c8d30E84F0d20536DEC2")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0xa079Ed64f3F287ea7c0Cf52F06a91dA4B2727028")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0xcCE03ce12f1C251E69577B76aCcED24858984508")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0x08459d49faF3383FAc619Ea20C2A0f6A45126616")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x3d89FF8c250d3819F2AB333ac5512059075D4e9C")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x9E50EFc0ad210450bb49e91495298265bc4e3931")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x3D09beD28A21941a0188Af4b9c68E1e9289C5462")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x045215aC5a526e197d38DdEF2D917FFb977A27Dd")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0x788eee207e2d94e82A4EbCF2C73757f19816CE8b")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0xA51815108c881C6Dd96c78bdB286460C56Ee75a2")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0x575D1238a011D19704f73C57eD3242fe92b5eE9a")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x29A74bBDFd3eBAE39BFF917AAF4dAE8D3d505cf0")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x39572Cad6090fc0D8908Ad90e186B002842Efc90")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xBF67A53d64987Eab7Bc2E2eE789Ba36D34710DF0")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x8fF233767A9e971ADBd7f8A01B49Bade49e1df54")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x7FC11a680A2c972d00B511bdf07D54815E7C3C99")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x1BC6e2bAfA7d72404Bf584FBC763116435a74792")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x2E05c9b908b392c0db0a4a93bdEbEbc3365fBFd8")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x15d2e6F7e504e82D55BeF4D8C85bD4331151e15B")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x5830147F8dc7c0384bDA52b056C39F851CBc512D")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xC122897dc0F276da46C2824881b3D0e7d6e3bBac")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x0d102770fE3319c5c7eBa32B65fe2C2757B0713c")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x8F399067c23572444A737D1Dc9798415a9f7f2A3")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xF86b65B42fE4BcCB530E817dFdA19eBfE6033757")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xA4e648f0F67e1f8844b848Cb963340194b7f77d2")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x3DA9819B1cF925628770574C1228e3000b1fc853")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0xC2861FfEBCC7E39bDe3588D8D38EE017F47E32a4")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x3493B1464412262d7C0b2AFE5dEc8Cd8909e4EB0")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x7b50153cA8DB21532eB8B1F0BB3Ea2A2564314e3")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x1b95C95430a6B0442aE162A9915eaAcfEC91aB03")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0x930f883A19180Cb57a7276985f4fD0E7d2737ea1")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x4A35e83D542793E4Abff52310d2012A53257A177")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x0f3212C4006B86d3e041207997292Bb47aF9e220")
      );
    if (contractName == "AddressResolver")
      return changetype<Address>(
        Address.fromHexString("0xee38902aFDA193c8d4EDA7F0216f645AD9350402")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xec7aE76d6d90E686c4dCC7a861491D3Df8AaA626")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xfA9B377D1999E110F7FD87A1a21297Da2E4C83b8")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0xc7CaaE48549dDcD94BFCC05DDBEfe97907504964")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0x66C3B6cc4808756e4EA40C314d9Bb6c891EE4996")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0x8F058332CdE72FEb4E062aAB521C5659A36E88b2")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x21C0adA634f5061A1ABa9d791e9d0f86efB7ebeB")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xd3431Dc2d830ECf861E7043B272628E0801cDe26")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xF7EB3eE9d5E385504d21785E9eFC2634B5b60c09")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x6508af036B5B80e93c79B70f7282832fc067770D")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xE2811B9cd005B8506C7a45d69329130D3B1561E3")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x36C16B0f9959a2FA164F00d8d356C246495738aF")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x807efc42190f8bF945064e0135D97575eE2372dc")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x483A0Ef4dC653832377c6418aD82023BF3F51333")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x7ba5388edE62316399E9f10166849df6c4c272eE")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x0bE2429C39C75A0bDdF65cD81BE3e918c455F0Fa")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xD175b77aAd9F5b9984AB32123bbc2Dfb746c49b6")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x503D0F7ed9bBd89b52490179a5Aa41A966C11b84")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x472dF20543f2222977134CD2b57aB8C727B68215")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x6eeC4acc3B166D3f94676FAe3267e5878Dc9B102")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xA04e5AF804c1eECfB0505063B775A99fA0Ba59D9")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xb73A6F99A2D3eC189901889164aa730C855d6ccd")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xd20f60d06b09158552A76540f0c29580995a7d6E")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0xE35cd8e9A58bFaa27bBFDA48c134CD5D4Ba19E26")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xFAa7a5316cd9fdC627eb2CF5F6A720827cb36603")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x3E7049CD28AB2918633d12d5e83DEFd421117821")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0xc0B8cefE1BFbFab02376e26b00DEa78a106B591E")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0xE069A09818347716F6F35e74440e9589b390F322")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0xA4cef1067133D325a432c1280B88F5fd471e3cDb")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x49e4EB6B0a4a2dE526f7198072C80D102a0e3EdB")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x01f50aB8381F36E908D820351800d8DF10eE48b8")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x82dEb8c93FfEFefBb7c63c97e5E4968E25E83cbC")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x783aC6Ba0DdA856a5aE48A18afC42032EF497A23")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x54614789386bbd21c009Cb93C5eBAd148CCCeBF5")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0xd48c4A783f9fb912cb38c6a9A2121F5764c20B62")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x549c880B0f1108f1C2521206ef9Ea583A07C8cF3")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x33db1fed642BEFD5b963E00e5dFee4e90F204D71")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x9e2316a9DC1D553840d5868844DDdF23a0f9621C")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0x21A4E1FAF3b9291847Bef93D7a342B6b3D31BAE5")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0xDEcC683c67ad64EF9778140fE10B5807685B5a77")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x306ef3ae41De9a18ffFAEdB9E886c5a5CdF28AD3")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xBD3bC8CA928cF3A7A898C8623329404dcc67ae3d")
      );
    if (contractName == "ExchangeState")
      return changetype<Address>(
        Address.fromHexString("0xa3F59b8E28cABC4411198dDa2e65C380BD5d6Dfe")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x97c25217Df47ebfC8A7e259c3f6b080BDF197376")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x65Dd03416371fdF93A4b9761586F10EAd2FB5A5A")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xc3299AAD8D1C2e9cDFBc485Dd9D8cf7Ca0e2CA8F")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x25BBBcE0754a563297d40dD5eCDbF4820309b51e")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xCDC84b306F1037d7DC6b2b0ACa1800ED9901b119")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x0E266E7399E342c6B369438B809efb0e59DE6a1c")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x6A37Bdf2FcF21C88044967C4f6c331752d75f7CE")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xA3b8E80E89cEEe37B0b174f01E8809f565643D7A")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xe66146e444faF400D7151E879041431c77C28417")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x13cfbDb7d453f145105086cbdA82Bfa7F4991f52")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x9e3B9c3Bbb010177A8d3c20731401658c49a5496")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xCC278e83F3Fb66CcBd9CF5C1B1657dd8DdDF7C5E")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x1eb17d6AB5B40F56756513A68E2C3aFe69E84A27")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x737b3c4f55e2eb20eEeD8f7c2b84d8CC995002AC")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xb3837Dcc1F630fd04Db2e56b7039b25cf387031D")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0x7dAC773aD869f1999DE4dbA25Da1a74aE8D371c2")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0xe13d6E66bA41A583673316ffBd1caf7f24aa53F4")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xa6936F668e4EC4343FBEaD6065ad60D023Ec1A1C")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x2ce7CFa81f8085Ec7c131FB9b05420c644D6CbA9")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x070eDa30eC1352A330E1739De962840752ae8380")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x8c3DD5beB8a166400cfc0B9cD5120b5233765481")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x37A45CB317DE1D403A0295D2bf851954a1216F6B")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x5B70D623CCa8f6fEA4c0e2820F1Dc672B3ea656c")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xfeaddE4eD0D3113208E03aDcD025160258B11DD2")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0xDec73c79Ffe63b5FFEF5cBa6d4aa0c513E7B5275")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x67d5c7a5a1648826500265f8ccEB646dE71fDE63")
      );
    if (contractName == "RewardsDistribution")
      return changetype<Address>(
        Address.fromHexString("0xD29160e4f5D2e5818041f9Cd9192853BA349c47E")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x8c819aF934Ea72B43B7437eAF7d4872B017d3433")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0x75331cCcD6dE0a5A27f444245ea7a405A547cCA7")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x1eE592e032F375E315452da6584398E23cC4E490")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0x4EC08EdeBba4d0D9A1E45101bBa41915dD83AD28")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x23Fb046E392Dc8cBF759f34281535be2a271FeeF")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0xF296f33E7cC31402a7CaadA418c62760d9B48A09")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0x2862B7d072E2937Bb04184330f5a6a877A83883E")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0xFE601DD3f856065F1Ba3E12A04f6948577A137A2")
      );
    if (contractName == "AddressResolver")
      return changetype<Address>(
        Address.fromHexString("0xFa6C9E27bcffd2118c991FdEd5CE5A1Ca71bd295")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x7052EBcE6171b3b2abdd378568BCE35057d4440e")
      );
    if (contractName == "ExchangeState")
      return changetype<Address>(
        Address.fromHexString("0xa4A9741BE20eCC69c5bf8Daf815aD2951484DbA9")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x9D68F495029c5700D4176404769CDb2a322Fb881")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0x2e9c827D0809bE7F6B9524d397CF4cDd1F037aFE")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x3E7696154D3eFc9c63C3422a0e2040A0caD33e58")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xbfDcc2cf9847798E34377263E2D3CF0f54a42C95")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xF65ca4C984A86e8dAC86D7a69a33AC29e21Ae20D")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xb891f45A0bABEcB28234D609AbcFcF3FDe9Cd06d")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xD9D308590E5321f6b900deC06986Cb97E45F7394")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x726163E99A7398d7fa2477A9FF8240619ed327b5")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x3B7890A13D97A10EEbf78dD141Cd42Dc8d7c6c9a")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xE310B247ffe5f9A59424C6dA4C02C026c7C11b06")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x62708619D9F7362e56942c34645095494eb12DdE")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x7629C334964F9cf1B4cF4Efe35B1660dD7599e96")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x852a385B32C2F226476500Cc303EB014448B66FB")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x5BDB6BdBDd7D03eDc0613e3cE82E7E8aeB52356A")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x3AD4b1275c900225d5ba947DECd680E6D70ADd0e")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xC48f41730D80e6c5207c05E321BE21A7e18e3916")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x473DC148FC5Ebe1F72873b56AD41D75eEa6900eD")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x42e8Df13Ee28E9977A147dAb837B1A2a2B52ae93")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0xe2fd57caF070A3F995D597a8B21cbF206E34Ff38")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x6070e7F24fC04D1830B807Ee75F2f04713BDBC59")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xC2982BeAeE5FD8421423c7526f58949Da8E8A7ac")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xbB53AFa777aE6Cd63d338Be1A6f62a8DCdef0A5B")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x416C94ad8693094FbFDFf83C00A1fAD5AC0513db")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x810C294cEc10CbC05b85a60FFd01D4850A02b543")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0xa50317975e863b208827Ae6C01Ef93D77B0B650C")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x4E660BAadC04ef3Bd642a6b55153dA26072661D1")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x775f6bC95d3D2d54De98D9D9Fc88b1FFc2Dd0b7a")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x57B42Ae280299A4c212e210fE859903FaBdc6648")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x56a6F3780bf519c6721CC13DE7afe4AB1F07a48a")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xd28b8edaF8DE69d8C3E2C29365214c802304d142")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x49a86AF4227adAb3C4240C9E1bd454C3Ad3E413C")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0xf5B112380292137a778d5b97D3C22322BFEA979E")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x9E80A9d63eC54BAE02EffC128Cd980BD8e6Cd003")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0xB40d85c4936a3276b564d2725460ba803329E30a")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xCA69180CF68de432607d444296E2feDaD138Ec0E")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xC7F83088481f64bF59bfd6183fc2A4e73132dc6e")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0x170dee2edAC2fE98aD563A4299f9aCEdcB33043a")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0xD6ee3c136dCf1755Ee5C8509e681b16f5ABc70bc")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0x30443FaeeB2CD41d204e4c97D86c06fb39AE49B2")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0xC33b9399Ac8909400d92c5F7DCd15Ec266551ff9")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x1ec58775e6169e475cCfC10168e5c945c6e56a4b")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x9fE591a41226932C1aDA235E2E647067e8F5C535")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0x3728543A1e0ca98FFC0A979cF817C95b6F8d9E7b")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x30f08f8ebBCF7f7fBeBDb7c0b785323cb8552641")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0x58F1De4D555eb1F22B73bcF5D224e053B86340e3")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x63Fe139d865801C523e94cd5b398EF336dbDBd93")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0xF66aa5B36C4e0A7c810965bc3d2D57BBE95224BE")
      );
    if (contractName == "Math")
      return changetype<Address>(
        Address.fromHexString("0x2cAaB90c2D4328E32baB3e2fAdf84cEd1DD229F6")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xaA4CfE09Eb79b6CaBa28fC2b432B604a03Fa4a05")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0xda7EAD6F8220e7Fe91Fa8Dc0fcFD301e447ed750")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x9c0685f15dFB037Aff45CA3dF63AbA19AB6460a9")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0xc40a4aeA75743A6Ce3f6E5E8a6e74cF47d456C7A")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xE15f59e3806787a1Ef621a3595511DF7999E97D2")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x61d40A06FC5194EcDbE24acB2cF913D0420dFa12")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x50984eBeD67b05273FdABAd3dc27DfdD47c51114")
      );
    if (contractName == "DappMaintenance")
      return changetype<Address>(
        Address.fromHexString("0x5e758C95f4B6A76dafDec3771ed429aEE844e3d9")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x72e741fAfa6C326CBf224D6433cDcFdd485a6c1F")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x7D5d7CC9Ea644E5D94916bFD4DA93aB50f145724")
      );
    if (contractName == "ProxyERC20sUSD")
      return changetype<Address>(
        Address.fromHexString("0x57Ab1ec28D129707052df4dF418D58a2D46d5f51")
      );
    if (contractName == "TokenStatesXRP")
      return changetype<Address>(
        Address.fromHexString("0xFA9bde8E5b503B3935Ea6cdE25d6afAc14e8070D")
      );
    if (contractName == "ProxysXRP")
      return changetype<Address>(
        Address.fromHexString("0xD32b23DB9aa03fd64fD67fD9325bD3Ce16DC8877")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xeD59cE6B53B43921fcd8Bffee118fB22921E58fd")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x1997b6B2403F6111F14B006AF8895F41136F5050")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x5B99a84942c0fA0CC0D43b6746259F67C3dfba36")
      );
    if (contractName == "ProxyERC20sUSD")
      return changetype<Address>(
        Address.fromHexString("0xC674ad732Dfd4E1359ec4B18fA5472c0747E480A")
      );
    if (contractName == "TokenStatesXRP")
      return changetype<Address>(
        Address.fromHexString("0xd632C73752944D1d999270d4e9c33099d7C302b1")
      );
    if (contractName == "ProxysXRP")
      return changetype<Address>(
        Address.fromHexString("0x5C59b3eFAE14Bb56c30319fbAF0413b543278382")
      );
    if (contractName == "SynthsXRP")
      return changetype<Address>(
        Address.fromHexString("0x3B23a97b147D2C1b13c3B2cbed703cd8c5Bf30e5")
      );
    if (contractName == "TokenStatesLTC")
      return changetype<Address>(
        Address.fromHexString("0x2E73aE701C3fd0c9856ed7fa5321938C9f753e36")
      );
    if (contractName == "ProxysLTC")
      return changetype<Address>(
        Address.fromHexString("0xCffb601E31D4f1D967Aac24f742DEEb2459a2e18")
      );
    if (contractName == "SynthsLTC")
      return changetype<Address>(
        Address.fromHexString("0xb3EE69bab9b54ab2f7561fC5970537f86D155401")
      );
    if (contractName == "TokenStatesLINK")
      return changetype<Address>(
        Address.fromHexString("0x89656EF0A87fD947A181189209F6525E91D91f46")
      );
    if (contractName == "ProxysLINK")
      return changetype<Address>(
        Address.fromHexString("0x3a4A90a2D8cBA26F2e32C4a6e6d01ffBfCE8DBB4")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xf1a9cdCf07CD0D01644c80015f19390040064C59")
      );
    if (contractName == "TokenStatesDEFI")
      return changetype<Address>(
        Address.fromHexString("0xa8eE3730031f28a4a4a3Ed28A3308d83cabd9Ce1")
      );
    if (contractName == "ProxysDEFI")
      return changetype<Address>(
        Address.fromHexString("0xf91b2d345838922b26c8899483be3f867eeaFAb5")
      );
    if (contractName == "SynthsDEFI")
      return changetype<Address>(
        Address.fromHexString("0xbfC741b419e6166aE04541AF56b8768C1323459E")
      );
    if (contractName == "TokenStateiXRP")
      return changetype<Address>(
        Address.fromHexString("0xF356b4Fa2ff124eff4ad4a707D740F1d22c8548a")
      );
    if (contractName == "ProxyiXRP")
      return changetype<Address>(
        Address.fromHexString("0x141A298596a25D86D0E6D4F8cC0eC0223ebaa938")
      );
    if (contractName == "SynthiXRP")
      return changetype<Address>(
        Address.fromHexString("0xcf0B54B346FE708111f5ef97230A8832aB1eC073")
      );
    if (contractName == "TokenStateiLINK")
      return changetype<Address>(
        Address.fromHexString("0xC33D4644B5c6F73F34B48ABBC566BF0b62e7D647")
      );
    if (contractName == "ProxyiLINK")
      return changetype<Address>(
        Address.fromHexString("0x21dc51Dd8BFfeCe537eFf6FbAB3D1C82340b0A40")
      );
    if (contractName == "SynthiLINK")
      return changetype<Address>(
        Address.fromHexString("0xa88fF7405C3763D4ba3b812302F6CB8deE55bD85")
      );
    if (contractName == "TokenStateiLTC")
      return changetype<Address>(
        Address.fromHexString("0xdA3D35Bd84155B01a1EccD8fa96367F90675eeDc")
      );
    if (contractName == "ProxyiLTC")
      return changetype<Address>(
        Address.fromHexString("0xcC72c855D4d5792938611Ca44Bd3A07860f64dd0")
      );
    if (contractName == "SynthiLTC")
      return changetype<Address>(
        Address.fromHexString("0x5b3B9FB97fB3B4Bb52293b6219bDfb18c7886BBB")
      );
    if (contractName == "TokenStateiDEFI")
      return changetype<Address>(
        Address.fromHexString("0xfB4B52980FbdA970fcb414CF70d412F618656d71")
      );
    if (contractName == "ProxyiDEFI")
      return changetype<Address>(
        Address.fromHexString("0x23Db12CF9Ad1fBBdE25650D4AAA6B46AC17EAA80")
      );
    if (contractName == "SynthiDEFI")
      return changetype<Address>(
        Address.fromHexString("0xa444D6F188068F98E39072fE51FEd8b7203F6e38")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x0D56A27b37e46C4EE01dA6BE9B44fEaffF61AB89")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xa2A16e539b1e79b538a159bc11216d9eB066F8Df")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x2a3D38CB0C1775072285C3462E6a45Bb2bC1500c")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x712C4fa35DD4B19c9879af9D374315beb936e1c0")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xffF44d5ac701166DD3B956b4907324b8d0956aAA")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xa0e2Fe6EEacDaCca1336Ec8456E8a70ac467Af2A")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xB0705Db71a9741CA82848fBC345Ce7bd392808F2")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x9D1b79eBCec24ac8CBa6b0353B9ff9401A1a9a8F")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xAEbC5bc420e96a706Afbc06Eb4E7173c44045bb3")
      );
    if (contractName == "SynthetixAirdropper")
      return changetype<Address>(
        Address.fromHexString("0x0da4be37F811a2Ce3138Bdaca65b6B23Eb85f0a4")
      );
    if (contractName == "ArbRewarder")
      return changetype<Address>(
        Address.fromHexString("0x46a6123DD50eF2F82AC15E2954D7790F2edCeDc9")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x767E5bDdfBd71f5086Cce6bE43721B1bAE8A9884")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x3E6a973fAf3B92F903B04B0a1F26eaE86361E524")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0xC674ad732Dfd4E1359ec4B18fA5472c0747E480A")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x4dc8AffB9DbfA8A171878d2F63B4205a9Bd96A70")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x2f449B8e7178368cf5Ea44Ff792dB4a39ee95e9B")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xc4d3b7c7D7f0D9Fd43B92121fB5a3DA06912986A")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x8cb11490DB6000b9D1ac385775572974164918a1")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x42512805C2870C341EaCe8C09fBDf17D7DbB3e80")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x6F4c097CB5BCCe6789A031cda69F39B044a0f6b4")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x4bD32D64b013cf7FA3c228569796c3f31Fac58Ca")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x1Df8A113eE40b687c69f0f42CF03ee2CDECc39c0")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x6d0F744eE02a991157B17284Dcd119aa06529D46")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x6F04eA783646541a41d63bDa1Dd54eAE50D50c68")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0xf5094E5Cc5e29D54cb5bD217c7E72e53726d344F")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x67F09952c797BC01407404E77953137f334fc7f7")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0xb781ED02ad040D504560653D9B849fc41Efef1dE")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xb18DEb66dEd91f37fAA18660980eD1F6620003a0")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0xb237d46c41929454255718F72aA774daA19D8756")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x2Ae24f9E009224B453DB82810504E3F6BF945184")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x9A5de3eedE10172DF5f34b185D4be1FDe044e685")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x1C8A3c8a3C962f58491552D76867498Ae3dD1dC6")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x7f6D5bdf1B7bA12BDc57d2d524Eee6Bb38AF2495")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x179E38bf56eB012dBa5ed58F02fA96fEF3EB962d")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x7137698159b05B9bf600D4183DcDA28C98de54b0")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x09eb62C5945c6e72504eeEa48fbf7f380e69cCd9")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0xb056B9498C89Df4a9D612BB2E1d5e69f458887DD")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0xe449B042Bd75Ac3022B346BB5b3924f6759cC985")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x76661E0441eCEfD0494DB501e013A82722bdDA6d")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xA4b58428E7Dc1B203a9f9Fc98eE651Ad9174EC26")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0xAfcBC491B67c01B40f6c077EF53488876a0a0D6E")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x6FfB1BdF1bD515e5724b115E2b0C96a152E44853")
      );
    if (contractName == "ProxysAUD")
      return changetype<Address>(
        Address.fromHexString("0x4e5D412141145767F7db90c22bd0240a85da0B73")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0x3Aa2d4A15aA7F50158DEEAE0208F862a461f19Cf")
      );
    if (contractName == "ProxysCHF")
      return changetype<Address>(
        Address.fromHexString("0x8E23100f9C9bd442f5bAc6A927f49B284E390Df4")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0x57E8Bd85F3d8De4557739bc3C5ee0f4bfC931528")
      );
    if (contractName == "ProxysGBP")
      return changetype<Address>(
        Address.fromHexString("0x41d49b1ac182C9d2c8dDf8b450342DE2Ac03aC19")
      );
    if (contractName == "ProxysJPY")
      return changetype<Address>(
        Address.fromHexString("0xCcC5c7625c90FC93D2508723e60281E6DE535166")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0x0e0Fd2fF7Fd2b13F24DB1D716AA52c8B2134d2c6")
      );
    if (contractName == "ProxysXAG")
      return changetype<Address>(
        Address.fromHexString("0x0Ae5a541ea8FD2e8E3b514D8706ac26e3a30272b")
      );
    if (contractName == "ProxysXAU")
      return changetype<Address>(
        Address.fromHexString("0xbc62e250AD0e6759FC104f09C4a7F8b83129346f")
      );
    if (contractName == "ProxyXDR")
      return changetype<Address>(
        Address.fromHexString("0x2506711aEB3A2aa998D3EBD3Dd949e12395A0EF3")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x68570A4877997cEb61DD7842099F2FF2f5D17EE0")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xf162D8c9B299B675a7B5c47F3dF4142dAaE27b28")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x18a2B55b07324d9A07Df1136B2b325477926085A")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x7Fd8B2497600efD6290eeB0D58BE0915C6aad3Cb")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x5C51548027110c6aa134C567B48B0746ac8E75b8")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x42D67dF1d4a2487bfD9F5b001d345c50eCCFC590")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x7920415894847ac46F3c33cC60683f955E503015")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x079004837762F9b37C6A18b024C32031654Aa684")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x5Ecd1Ba96C90892c81569BdaBB85d131B50C602D")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x3f08C3E318a74a4b2e8582cd89BC6C0b4d697926")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0xf43dc2A3176394cEf1d2D66808bEeD66C40C61B4")
      );
    if (contractName == "ProxysETH")
      return changetype<Address>(
        Address.fromHexString("0x54c4B5cb58C880DD1734123c8b588e49eDf442Fb")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x13BD0311540422E4605e7C9A3Df208c5E453B495")
      );
    if (contractName == "ProxysBNB")
      return changetype<Address>(
        Address.fromHexString("0x4D5C55a1046725a80B20296D0A98DcE02d8eAAc3")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x6dB7aa00976658d225F814439fC63778E0D3ba94")
      );
    if (contractName == "ProxyiBTC")
      return changetype<Address>(
        Address.fromHexString("0xF418D59792E4bd9ab8cC4b733Ea60edC01abc77c")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xf188D5B2cF34757d636167646FB5565770e07D65")
      );
    if (contractName == "ProxyiETH")
      return changetype<Address>(
        Address.fromHexString("0x498df32429693fE31685Da7fb9B4b65696a5508d")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x961aa09147bB276DB04774A5BCDE70346975A4CA")
      );
    if (contractName == "ProxyiBNB")
      return changetype<Address>(
        Address.fromHexString("0xdbB1D3B58D7e101588a44E642F8c442165730289")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xb17A18b618348AC1055a7c3596927228a743ddc6")
      );
    if (contractName == "ProxysMKR")
      return changetype<Address>(
        Address.fromHexString("0xEB644334B2Adab1b5b965e0a1aC794917f1DD712")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0xD70DB809bA92529C3686Dc50e777871C1Afcc1F5")
      );
    if (contractName == "ProxysTRX")
      return changetype<Address>(
        Address.fromHexString("0x0754bd514B7b41052777417217655fD7254F4528")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x1c8D2bF5e9B0e96367d12d509ca2c34A765055be")
      );
    if (contractName == "ProxysXTZ")
      return changetype<Address>(
        Address.fromHexString("0xd39bBa8F8049674152B5439A631eEd691436b92a")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x3938Dc982c0eaa002619F97d82e70485cdb4df51")
      );
    if (contractName == "ProxyiMKR")
      return changetype<Address>(
        Address.fromHexString("0xeEe13c7Df0Cd76d936E8477407b278C104DdBE43")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x5D620aed548C7813a13Fe35eddda491Bf751b9db")
      );
    if (contractName == "ProxyiTRX")
      return changetype<Address>(
        Address.fromHexString("0x4C3213Db129C528D97CBF48f451913071b094Af2")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0xa913b09617D70dc50F857C6746a8c58E88891652")
      );
    if (contractName == "ProxyiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x022E3dFfDeE42eE5C9d3335c1fbC1100b29Ab9ab")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x547f50C540ed5B8AB2F5B1e0100E9224642E2F2E")
      );
    if (contractName == "ProxysCEX")
      return changetype<Address>(
        Address.fromHexString("0xAE1101551c334Ed0f4c6238E7fD4Fc0fdB2b7C77")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0xFfeD11A2A4c24f665c91A578d5cA7e1289c825C5")
      );
    if (contractName == "ProxyiCEX")
      return changetype<Address>(
        Address.fromHexString("0x5047d4FeD0805632a6d84D16C08E9899d17ef3e2")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0xbb607Fbc2fA74953EFB561dbD8c857Dd8bD7d99B")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0x73a61f7D7401096ccB4AC883ebeb7bE7605c3955")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x97315c7CaE858f6A814A9ed8616b4aF713C01035")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x6671699fB349d2d9a0228FE53C48D4B31916D98C")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x1807E6460f6e5D6A11369Ae3849c5b5D547cBb03")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x566A5868eAaeD36741a88448Ba7B21968539DE5b")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x452a93108bAbd7245FAE90cFDe7Ee75A6C1c80D7")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x9504143dBDBc18795562022A2DC93702a5eE5033")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x3F810d842E8970Ffb756346F1Da87EE5EE5aa977")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0xC53F53dE567e288D1321f143c12A8EAE31406244")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x24B045f6FBafbEDA65F350304D3C39043D066445")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x9ffaE08817Bd33A0392C6Fe4CBB233999428468C")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xC43608eba6446A603A3f247E689bc831D39430B3")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0xca5FA8A912CB69ac631E1579e1D7E8A10743A1CF")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0xBaCB3A7DB3C417519B826cB22DD6E682EA5D59b6")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x3de635cD88B95BB00eF75fC555fA7065E0995B21")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xaf5B4eE52eE9DCC324f0eC7031d82C480b716fE2")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x95a9945fe2f7aD7C82eB7c70c54F7Db8B2399449")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xAfBaF15c5B866E640bf1785cB3e4707Ac189A920")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x52a3B148fa8680Cf5FfaeB94A7a9bADbdCc305F0")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0x1f9b44D7Fa69dA15648e882eff2a52e21e2b8FE5")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0xdd758D9535b06E80F4933196CbBaDfc68BA1c8B6")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x4da3B8fb742BC69531Ec7AdBAa06effDEd1A22BA")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x2455fAB5913c421e91AD6882617974cEA325560A")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xCDa6047B9a6C55c4e99cD16cCFDC9a0F95899c94")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0xFA8DeEB51c9447Fe0a81591089fC14ad53152eC6")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x879Eb8Eeb7D5F7448a7C5C412befaa0647fb6557")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x57004C35b6d775921D69C4372d62fc2269DB1088")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x73436303FFcbB4228Ad9feBD4816CD58c178cB97")
      );
    if (contractName == "RewardsDistribution")
      return changetype<Address>(
        Address.fromHexString("0xd05fE75B0059cbf5E5Ab87ba61b07893aA850a25")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x50c6a22f6fAB0840e574f22F7441E041F377f031")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xadc40E46ED2be5F59711443D6583f6A43516421A")
      );
    if (contractName == "RewardsDistribution")
      return changetype<Address>(
        Address.fromHexString("0x6E2BD9e4Ad66A16AAc5619D79493e4e748367B3E")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x457eec906f9Dcb609b9F2c7dC0f58E182F24C350")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0xc6b84783a79F5B921b4c86fF702AA6695004DFf7")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0x8423A960C19991D5c6d3c9aC6147224bAcb8bF56")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x9266CD4A69E62208F02E761f70A8F0dE411ed553")
      );
    if (contractName == "TokenStateiCEX")
      return changetype<Address>(
        Address.fromHexString("0xF1B4c2A03cd37d5B9c7B908f1BE66D2f098880Ca")
      );
    if (contractName == "ProxyiCEX")
      return changetype<Address>(
        Address.fromHexString("0xB27C283AD83835bD783E3E0183c5f2A46489d6Dc")
      );
    if (contractName == "SynthiCEX")
      return changetype<Address>(
        Address.fromHexString("0x189Dc0B0B3CE656777B18d2d17b7F5b4B413BA59")
      );
    if (contractName == "TokenStatesCEX")
      return changetype<Address>(
        Address.fromHexString("0x8F70d2d9a593e28c86Ae0f1B03600310B3491C43")
      );
    if (contractName == "ProxysCEX")
      return changetype<Address>(
        Address.fromHexString("0x985643f348F95DfFDbA710bFbfD2c6dc108Beab4")
      );
    if (contractName == "SynthsCEX")
      return changetype<Address>(
        Address.fromHexString("0xf39f983F7a0b92b93041D8413F4d16384c51B19d")
      );
    if (contractName == "ProxyERC20")
      return changetype<Address>(
        Address.fromHexString("0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x64903DDaEC496b4dd4d7F0E4C07Cad5658bDA915")
      );
    if (contractName == "ProxyERC20")
      return changetype<Address>(
        Address.fromHexString("0xA0fffcB122188bf2b861274e73aC5FD0ebCCD9b4")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x309f082d89Bd68c31dD879622E4B13aF4CAF584c")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x057057e481c783CAd5829481A58d165fC1Df0c02")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x1172B51b7C27cc9465612a0e22F82c8d9d0Bb3Ac")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x312a7da09C39840Cf91AdabA0096428407dC6a3E")
      );
    if (contractName == "TokenStatesMKR")
      return changetype<Address>(
        Address.fromHexString("0xF4c1EF59bd05Ea557BdeeDd2Be079765e395A745")
      );
    if (contractName == "ProxysMKR")
      return changetype<Address>(
        Address.fromHexString("0x0468B63e05db1240A187Ef7a318aA6dE8416d12B")
      );
    if (contractName == "SynthsMKR")
      return changetype<Address>(
        Address.fromHexString("0x78Dcc1fAa091e48F3c144016669b03D353D6C057")
      );
    if (contractName == "TokenStatesTRX")
      return changetype<Address>(
        Address.fromHexString("0xe34552e5E0CEBC83e742BCB11F426731EF05e34a")
      );
    if (contractName == "ProxysTRX")
      return changetype<Address>(
        Address.fromHexString("0x1ea79f5273FE52CbB78FD38a812bDa830d23c45F")
      );
    if (contractName == "SynthsTRX")
      return changetype<Address>(
        Address.fromHexString("0xBFEBd4DF606011d9421EdF1520188771c98aa8e2")
      );
    if (contractName == "TokenStatesXTZ")
      return changetype<Address>(
        Address.fromHexString("0x76870433F648ad4FDa62111381ACe0A9FAC6F413")
      );
    if (contractName == "ProxysXTZ")
      return changetype<Address>(
        Address.fromHexString("0xFD9f0a7fbE8A72ae9cab77fFC3F81156B5813560")
      );
    if (contractName == "SynthsXTZ")
      return changetype<Address>(
        Address.fromHexString("0x0C2dF26D2e09118398814b875531B37E0280626d")
      );
    if (contractName == "TokenStateiMKR")
      return changetype<Address>(
        Address.fromHexString("0x07EB4c1638e6b9fE56F90f3b9A99B0b5A74ac411")
      );
    if (contractName == "ProxyiMKR")
      return changetype<Address>(
        Address.fromHexString("0xce02E149D25Da93fEA77C6046af9E04385D27C4f")
      );
    if (contractName == "SynthiMKR")
      return changetype<Address>(
        Address.fromHexString("0x2F06097A7aB7e68F1363EC975c65163B7EC6d505")
      );
    if (contractName == "TokenStateiTRX")
      return changetype<Address>(
        Address.fromHexString("0x20bf23be496fA039F5a11358DE93F9417189659b")
      );
    if (contractName == "ProxyiTRX")
      return changetype<Address>(
        Address.fromHexString("0x3aFB838E8F826b344baB5582Fb210C440C472975")
      );
    if (contractName == "SynthiTRX")
      return changetype<Address>(
        Address.fromHexString("0x8E5c6cad78dc74803916556Ec623d59160A43258")
      );
    if (contractName == "TokenStateiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xc81CaC605D14d3eDF6BbC8ABcc3bb04B7bD96a7D")
      );
    if (contractName == "ProxyiXTZ")
      return changetype<Address>(
        Address.fromHexString("0x31886E9d07920e12E3EdEAfF189e3Cb4fB568994")
      );
    if (contractName == "SynthiXTZ")
      return changetype<Address>(
        Address.fromHexString("0xD32d48a9aD9aaC0c1A318742e642Ecf94b795f14")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xB7ad44681d9F26B73a18413f7B522820d5D699A3")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x10b7450427a271860506d9F0d215e4cDfAfE51c8")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xb20c158094531F2e92F74bDBf4b78743b15E2122")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0x8676602c8170854251164674f7513D8960f787F6")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xE1BbCC6a5e0261A343463b2e455016fd89EeA11B")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x00FaB721c06a3F77a4A6b2f76890Ae49458B5028")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x79211cceeE8647F44a0B581c9A6762f7DD27169d")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0xcB12d8702c5C562b7bAb681B2a55ab7C281eE90d")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xCC094d890BC4DCC1e0C9e778F873D1Bb27698e93")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x404d24eAede520a249F80054b68A6621374D769a")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xb80011FD874E56f4318406894FaEdea4Ad55f65C")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0xa9d7BDDee74Fb9F158412b886730c1F6cE0885BB")
      );
    if (contractName == "FeePoolEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0x7bB8B3Cc191600547b9467639aD397c05AF3ce8D")
      );
    if (contractName == "EscrowChecker")
      return changetype<Address>(
        Address.fromHexString("0xF778Ec504245EfE1eA010C5C3E50b6F5f5E117da")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0xb1988eA4EBDC846f44B7C36E5c8558fF459398AE")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xa7d7C761a07480233362A5753327D3e05De68Cfe")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x38E33EbC438782E3CA906A4E8C4DC53F7589C602")
      );
    if (contractName == "ProxyFeePool")
      return changetype<Address>(
        Address.fromHexString("0xc43b833F93C3896472dED3EfF73311f571e38742")
      );
    if (contractName == "ProxysAUD")
      return changetype<Address>(
        Address.fromHexString("0x55804a50cEF7278B5242A474715b5C55FdE04e8C")
      );
    if (contractName == "ProxysBRL")
      return changetype<Address>(
        Address.fromHexString("0x9972F7bF1e260E978B957fe54881E4E8a6798350")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0x9Db7ea2837cCb1340B92551feEFFbB1D9ae41BBC")
      );
    if (contractName == "ProxysCAD")
      return changetype<Address>(
        Address.fromHexString("0xB200f7b1391e336Fd334D1ae90Ab7bE32b7DeABb")
      );
    if (contractName == "ProxysCHF")
      return changetype<Address>(
        Address.fromHexString("0x89E21ed2EBd6c55C28aAC0aA856483E74682FE15")
      );
    if (contractName == "ProxysCNY")
      return changetype<Address>(
        Address.fromHexString("0xec98BB42C8F03485bf659378da694512a16f3482")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0xF4B702488cC0610BD602422Bb6f4cce79304E7c8")
      );
    if (contractName == "ProxysGBP")
      return changetype<Address>(
        Address.fromHexString("0x4aa10c5F36f500322A424E99c3B0cac370765718")
      );
    if (contractName == "ProxysINR")
      return changetype<Address>(
        Address.fromHexString("0xE5A2286Fd6dAd65d74CC10910f967415B1A0E2bE")
      );
    if (contractName == "ProxysJPY")
      return changetype<Address>(
        Address.fromHexString("0xA83AbFdC9E8Ee990C3C6C0f56a4B06e0faAd583C")
      );
    if (contractName == "ProxysKRW")
      return changetype<Address>(
        Address.fromHexString("0xd7adF1b5E31D1C40E08F16a2095338ce3aA8f2Fc")
      );
    if (contractName == "ProxysNZD")
      return changetype<Address>(
        Address.fromHexString("0x4726a8d18Ba47568064ac8b7F2d58e5861Ac67DD")
      );
    if (contractName == "ProxysPLN")
      return changetype<Address>(
        Address.fromHexString("0x634F6a7CAd7116c9880cf4c02E6f29Eca20c32CA")
      );
    if (contractName == "ProxysRUB")
      return changetype<Address>(
        Address.fromHexString("0xA46b98474F9D0458E3adE89e3482c04D280AF06e")
      );
    if (contractName == "ProxysSGD")
      return changetype<Address>(
        Address.fromHexString("0x148892d08C25C0AbF824C458Be9fc8C0D506Eb6b")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0x406555dbF02e9E4df9AdeAeC9DA76ABeED8C1BC3")
      );
    if (contractName == "ProxysXAG")
      return changetype<Address>(
        Address.fromHexString("0xC0D2899BbDf035Bed161CDD458fe5CB1FE27a2F6")
      );
    if (contractName == "ProxysXAU")
      return changetype<Address>(
        Address.fromHexString("0x28962321c6605F4e714ecc4776cb6d4dFEb53B8E")
      );
    if (contractName == "ProxySynthetix")
      return changetype<Address>(
        Address.fromHexString("0x22f1ba6dB6ca0A065e1b7EAe6FC22b7E675310EF")
      );
    if (contractName == "ProxyXDR")
      return changetype<Address>(
        Address.fromHexString("0xf53B56B6Fb98aaF514bcd28f6Fa6fd20C24E5c22")
      );
    if (contractName == "SafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x1A60E2E2A8BE0BC2B6381dd31Fd3fD5F9A28dE4c")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xaE7D62Fb6a305E6d9E9F8c43bbb41093c2bE52f6")
      );
    if (contractName == "SynthetixEscrow")
      return changetype<Address>(
        Address.fromHexString("0x548c18a49a66Ad1238e17824C18B0b9Be35fB604")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0xC64CdA66Bc1d026b984D6BEE6aDBf71eAc8A099d")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xEda85131b3FF2B90a0F236588ab4061699469943")
      );
    if (contractName == "SynthsBRL")
      return changetype<Address>(
        Address.fromHexString("0xd528D731dc0C3763A9064c9A5d56c6569bb65923")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x48D7f315feDcaD332F68aafa017c7C158BC54760")
      );
    if (contractName == "SynthsCAD")
      return changetype<Address>(
        Address.fromHexString("0x0Df1B6d92feBCA3B2793AfA3649868991CC4901D")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xf92b129ae126e2Fdb7a5812C9533eDE23f8AA36D")
      );
    if (contractName == "SynthsCNY")
      return changetype<Address>(
        Address.fromHexString("0xF37EbCDCBd5eD96fc66027069b570db9f9Dd185d")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x27861E4776D162743ccD78379aDe6A876caf2203")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x9bD2c9677492558c0eF2F30BB7c7aC694F8F62dC")
      );
    if (contractName == "SynthsINR")
      return changetype<Address>(
        Address.fromHexString("0x93516bE2862946798ee6a8a3a95350D3280B7B03")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x2a27a3113368836b2BE598a4BB9a0d4D7A734305")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0x466Fe3e03Cb951fdA6e91199632b8EC80D48616b")
      );
    if (contractName == "SynthsNZD")
      return changetype<Address>(
        Address.fromHexString("0x941ffA5A1D4DB8DD37adF6119bDDF0E7720963A7")
      );
    if (contractName == "SynthsPLN")
      return changetype<Address>(
        Address.fromHexString("0xBa0e5dc2D9e266802aBe62B29F88A218Ab854aaA")
      );
    if (contractName == "SynthsRUB")
      return changetype<Address>(
        Address.fromHexString("0x5fF1b87fBfDE943568C533f2a5f78F8d9C00539b")
      );
    if (contractName == "SynthsSGD")
      return changetype<Address>(
        Address.fromHexString("0xC1701AbD559FC263829CA3917d03045F95b5224A")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xB0eeaf49E986D624439a01423066528127F97B36")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x7D41587F18937199f70a3E235d5376CDECc98181")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x94dBa784e87A3F5F12e25EC98bF14233c1e69017")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0xA83dDce2F644E72EcD5b0fC4dC740575EC0d9BC7")
      );
    if (contractName == "TokenStatesAUD")
      return changetype<Address>(
        Address.fromHexString("0xDDEfe42790f2dEC7b0C37D4399884eFceA5361b1")
      );
    if (contractName == "TokenStatesBRL")
      return changetype<Address>(
        Address.fromHexString("0xE403013d6ac402ef5A70A4dE524d5894d0188e25")
      );
    if (contractName == "TokenStatesBTC")
      return changetype<Address>(
        Address.fromHexString("0x029E1687c7BB8ead5Ab02DB390eB82b87b2D54a2")
      );
    if (contractName == "TokenStatesCAD")
      return changetype<Address>(
        Address.fromHexString("0xC29fb527c26C527942C0891DF589dC0dB141177A")
      );
    if (contractName == "TokenStatesCHF")
      return changetype<Address>(
        Address.fromHexString("0xEf58E3aC7F34649B640fb04188642B5e062Fa3Be")
      );
    if (contractName == "TokenStatesCNY")
      return changetype<Address>(
        Address.fromHexString("0x11F8bF3229Cf6144F1B4bCB289EfdE89f74aFB31")
      );
    if (contractName == "TokenStatesEUR")
      return changetype<Address>(
        Address.fromHexString("0x4f719F0346636B9Dc23B092F637de2A66A254420")
      );
    if (contractName == "TokenStatesGBP")
      return changetype<Address>(
        Address.fromHexString("0x3DdF5dAd59F8F8e8f957709B044eE84e87B42e25")
      );
    if (contractName == "TokenStatesINR")
      return changetype<Address>(
        Address.fromHexString("0xC643789734f6b89f9114B7EB692E71EAF787B32a")
      );
    if (contractName == "TokenStatesJPY")
      return changetype<Address>(
        Address.fromHexString("0x310705B7FecA92C2445D7471706e058653D9f989")
      );
    if (contractName == "TokenStatesKRW")
      return changetype<Address>(
        Address.fromHexString("0x4BdDFda0E086983CD1fB400a62063aDDEBF2111B")
      );
    if (contractName == "TokenStatesNZD")
      return changetype<Address>(
        Address.fromHexString("0x9524b9a0Bf1C14B54Ecb283a8CbC835bc4B9954e")
      );
    if (contractName == "TokenStatesPLN")
      return changetype<Address>(
        Address.fromHexString("0x0d18E41bB76e5b6C72489CFA058E971AEE405906")
      );
    if (contractName == "TokenStatesRUB")
      return changetype<Address>(
        Address.fromHexString("0x356C6e925157b86d20d7a05f61074C903569A7B7")
      );
    if (contractName == "TokenStatesSGD")
      return changetype<Address>(
        Address.fromHexString("0xDa5eD43B9B6E36b4f27cc6D8c1974532cdBd55F9")
      );
    if (contractName == "TokenStatesUSD")
      return changetype<Address>(
        Address.fromHexString("0x9aF5763Dc180f388A5fd20Dd7BA4B2790566f2eF")
      );
    if (contractName == "TokenStatesXAG")
      return changetype<Address>(
        Address.fromHexString("0x1Aa58E7823E2a4acC9B4B2A18C1e946b01D78E25")
      );
    if (contractName == "TokenStatesXAU")
      return changetype<Address>(
        Address.fromHexString("0x7E7B920857Ffa8569A90a9a94A07877f2a81514c")
      );
    if (contractName == "TokenStateSynthetix")
      return changetype<Address>(
        Address.fromHexString("0x46824bFAaFd049fB0Af9a45159A88e595Bbbb9f7")
      );
    if (contractName == "TokenStateXDR")
      return changetype<Address>(
        Address.fromHexString("0x86Ca08306D3F2fB8b0f056776f36e157F81fE7CC")
      );
    if (contractName == "TokenStatesETH")
      return changetype<Address>(
        Address.fromHexString("0xFbB6526ed92DA8915d4843a86166020d0B7bAAd0")
      );
    if (contractName == "ProxysETH")
      return changetype<Address>(
        Address.fromHexString("0x9D7F70AF5DF5D5CC79780032d47a34615D1F1d77")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xAb16cE44e6FA10F3d5d0eC69EB439c6815f37a24")
      );
    if (contractName == "TokenStatesBNB")
      return changetype<Address>(
        Address.fromHexString("0x6289fd70d3Dce8DE61896959cdEfcFF3cE46A108")
      );
    if (contractName == "ProxysBNB")
      return changetype<Address>(
        Address.fromHexString("0x545973f28950f50fc6c7F52AAb4Ad214A27C0564")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x23Bf838AF72Ee8F43870A73947d8F4Edb63adAe3")
      );
    if (contractName == "TokenStateiBTC")
      return changetype<Address>(
        Address.fromHexString("0x04CFbc89F161EE33f4984490B1B73A2D1548fA3D")
      );
    if (contractName == "ProxyiBTC")
      return changetype<Address>(
        Address.fromHexString("0xf7CF1b31560CC12E4d950e12fcc39c0bC5fAa884")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xe0d6C0219E9e97b5C42bf35D6a57E80E592932e2")
      );
    if (contractName == "TokenStateiETH")
      return changetype<Address>(
        Address.fromHexString("0xe95134Cc50EADFE2C9dd950C8a86c0766a3C829F")
      );
    if (contractName == "ProxyiETH")
      return changetype<Address>(
        Address.fromHexString("0x4Ee0bF17978ca328dF569b3013B8CD2136A4e6F9")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x876006fa4f1261020A6De12EBf0B7e02dE44A7dD")
      );
    if (contractName == "TokenStateiBNB")
      return changetype<Address>(
        Address.fromHexString("0x7fefB90141c56fBE2D55f36181b26B3Dc514d256")
      );
    if (contractName == "ProxyiBNB")
      return changetype<Address>(
        Address.fromHexString("0x6382ca570d9A3ce60Eb08dE29F0FC17A8890C5AB")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xFa46FcA4e3c742f5Df9b983B89B07d6d95542a3b")
      );
    if (contractName == "RewardEscrow")
      return changetype<Address>(
        Address.fromHexString("0x8c6680412e914932A9abC02B6c7cbf690e583aFA")
      );
    if (contractName == "FeePoolState")
      return changetype<Address>(
        Address.fromHexString("0x78b70223d9Fa1a0abE6cD967472Fa04fEf3C7586")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0x51d1d0771d29d21F82b8592E327Cf9D66Cdd5b1E")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x1c270610e73188Bc06EFf86a093F8ef5D85eaF50")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x0B7e1DC538e1A8Db415Ab1D4c5107325Dd4BD705")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0x04896976c9Ea150501E97f2750Fe5f2e0C298dCF")
      );
    if (contractName == "EscrowChecker")
      return changetype<Address>(
        Address.fromHexString("0x05DD55C18999b4a2f905978C029B85dA37750170")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0x4B1cE9C42A381CB2d74ffeF20103e502e2fc619C")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xa824Bc501D213e03d120387b0D6d2D841cA3C357")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xaC343E29422fAF72651A2d829827235E7D88965e")
      );
    if (contractName == "ProxyFeePool")
      return changetype<Address>(
        Address.fromHexString("0xcBBb17D9767bD57FBF4Bbf8842E916bCb3826ec1")
      );
    if (contractName == "ProxysAUD")
      return changetype<Address>(
        Address.fromHexString("0x8731Ed67FC19B927bF7736296b78ca860fC1aaBF")
      );
    if (contractName == "ProxysBRL")
      return changetype<Address>(
        Address.fromHexString("0xB084d8dE870B98358aC45ddDa37A507AB28FD693")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0x4653Ec2Ac2A53135A22D0d33AD3B0d14B95fb6dd")
      );
    if (contractName == "ProxysCAD")
      return changetype<Address>(
        Address.fromHexString("0x183Af1Fc652f97ed9A72DFA782b98299bd26dd76")
      );
    if (contractName == "ProxysCHF")
      return changetype<Address>(
        Address.fromHexString("0x3447B651b00Eed7cC2558DDa1aa0998EecDA134d")
      );
    if (contractName == "ProxysCNY")
      return changetype<Address>(
        Address.fromHexString("0xCd696f8A5384A077f2D62d9Bb194cdC6ee74E5d7")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0xEcD284397334a403117f62F938428DAc354c631F")
      );
    if (contractName == "ProxysGBP")
      return changetype<Address>(
        Address.fromHexString("0x3f7190790Af79E0d630769A41A62573eE25CeB8B")
      );
    if (contractName == "ProxysINR")
      return changetype<Address>(
        Address.fromHexString("0x0D36FeccD3A060bF0F7003De186E1739e63fc480")
      );
    if (contractName == "ProxysJPY")
      return changetype<Address>(
        Address.fromHexString("0xee5cC6E5d4D1916df0A8Dc9A1863776eeFcD6D00")
      );
    if (contractName == "ProxysKRW")
      return changetype<Address>(
        Address.fromHexString("0x9D377791B8139E790E9BceE3B9fEf3F041B85Ae5")
      );
    if (contractName == "ProxysNZD")
      return changetype<Address>(
        Address.fromHexString("0x778ec2d9B4baE65C57a6436a6c37AFc135baD727")
      );
    if (contractName == "ProxysPLN")
      return changetype<Address>(
        Address.fromHexString("0xc7A3AE12685017fBd1DB5C335d5696a13F56Df66")
      );
    if (contractName == "ProxysRUB")
      return changetype<Address>(
        Address.fromHexString("0x3A74b862eCa046F550aAfa1873A4B8662714e99a")
      );
    if (contractName == "ProxysSGD")
      return changetype<Address>(
        Address.fromHexString("0xb0caA325f9E480A19A1D15E8537c9B705D1bF515")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0x08d2F9Ffed034aa71F4aD3Cb5d176EcC304F5437")
      );
    if (contractName == "ProxysXAG")
      return changetype<Address>(
        Address.fromHexString("0xC4Fc69013ce3FeC42A703d06B2BDD76B0305660E")
      );
    if (contractName == "ProxysXAU")
      return changetype<Address>(
        Address.fromHexString("0x0C940DfA14748C69F703E16ab008A5162D5F3396")
      );
    if (contractName == "ProxySynthetix")
      return changetype<Address>(
        Address.fromHexString("0x2d7aC061fc3db53c39fe1607fB8cec1B2C162B01")
      );
    if (contractName == "ProxyXDR")
      return changetype<Address>(
        Address.fromHexString("0x37b2751bc122486bB9cbdbc5DAeEa95Ab6069803")
      );
    if (contractName == "SafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0xd859C30e03b26FbC6c3008F8B13DEa8a9dE2479A")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x677E28C5d6e422Ec966bfBBdDea4c47260543494")
      );
    if (contractName == "SynthetixEscrow")
      return changetype<Address>(
        Address.fromHexString("0xa9d6aE0F9E9da6FFC357Cd155CCe18E3491e135D")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0x27269b3e45A4D3E79A3D6BFeE0C8fB13d0D711A6")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xF294ef6688244d095D1f4E9124CDcB0bbd098a1e")
      );
    if (contractName == "SynthsBRL")
      return changetype<Address>(
        Address.fromHexString("0x0C1bD22c3198b28C2ab561063E68Ee6597224225")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xd25b142A863ae0631C0A680A8169D44743871440")
      );
    if (contractName == "SynthsCAD")
      return changetype<Address>(
        Address.fromHexString("0xCD5fe8e419770f8d18Ef1acBdBDC8aD65b5d0916")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xC1b37C07820d612F941C0B8b344119300F904903")
      );
    if (contractName == "SynthsCNY")
      return changetype<Address>(
        Address.fromHexString("0x1D2230cd364a69984f66453F743F1e603942C2D0")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x96A59FC5DefB294785A623FCE906264fb96B2791")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x8c93BC66C35F53df014Fa1A425414dfbc283a5Cb")
      );
    if (contractName == "SynthsINR")
      return changetype<Address>(
        Address.fromHexString("0x3c3882E0A0e64BdBd5427830cf0d7a8DB881D431")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xaC02B9281C9831279ca55e3FD0340935e008d93a")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0x895ed2601428572f6781B3F63970733f1D3469A9")
      );
    if (contractName == "SynthsNZD")
      return changetype<Address>(
        Address.fromHexString("0x3b8BEcBe395969CDe9aE2eaCEF9D4ff8C31e8395")
      );
    if (contractName == "SynthsPLN")
      return changetype<Address>(
        Address.fromHexString("0x797c1242907A5B0E8b47546D1a09c1fe40E8fbC1")
      );
    if (contractName == "SynthsRUB")
      return changetype<Address>(
        Address.fromHexString("0xaEC05Ca799e76C7370b27b5638639A939f4b734B")
      );
    if (contractName == "SynthsSGD")
      return changetype<Address>(
        Address.fromHexString("0x7aC3eF3613c8995d26E678434449E3Fc6C2582E4")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x233B0D43715Fe24bC4de2fF260c9Dc9d85e2E36A")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x130Ba5e15157a71c5B6D6c6eD7432805286ccfa9")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x833f2Cb01c07EC24dE23843CD130E0FbFa3c1a05")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0x6E9BAC2827dBBa78D11b270115086CC357988928")
      );
    if (contractName == "TokenStatesAUD")
      return changetype<Address>(
        Address.fromHexString("0x511c74C96561fEb8Fc3d636B901225C0e1d869BE")
      );
    if (contractName == "TokenStatesBRL")
      return changetype<Address>(
        Address.fromHexString("0xf473EEB7a3B140eeBbadfbc2C754D21D69EeD632")
      );
    if (contractName == "TokenStatesBTC")
      return changetype<Address>(
        Address.fromHexString("0x265De3a4FD03283195d72895A1639a9cDa5a26c7")
      );
    if (contractName == "TokenStatesCAD")
      return changetype<Address>(
        Address.fromHexString("0xe9698B47613151590a42F1E8dad10F6Ed097954f")
      );
    if (contractName == "TokenStatesCHF")
      return changetype<Address>(
        Address.fromHexString("0xA8CB0B163cEfB21f22c72f6a7d243184bD688A5A")
      );
    if (contractName == "TokenStatesCNY")
      return changetype<Address>(
        Address.fromHexString("0x766cBCF6a31086a18DbD647d463C2a2D3D207CD1")
      );
    if (contractName == "TokenStatesEUR")
      return changetype<Address>(
        Address.fromHexString("0x0Ec9411d467F7d6092740bB5D2aa43FC7562000F")
      );
    if (contractName == "TokenStatesGBP")
      return changetype<Address>(
        Address.fromHexString("0xe505AeAA5937294205bC0e146F30a8C98F1D4072")
      );
    if (contractName == "TokenStatesINR")
      return changetype<Address>(
        Address.fromHexString("0x5Febb020877Fe8b3B1194aD68517961f72A0A9D2")
      );
    if (contractName == "TokenStatesJPY")
      return changetype<Address>(
        Address.fromHexString("0xa234cFd4Af502066BF61c49d47282b6a86840d3E")
      );
    if (contractName == "TokenStatesKRW")
      return changetype<Address>(
        Address.fromHexString("0x73789A0A03a2B81D4af9d3A720b606cAB34f0eAe")
      );
    if (contractName == "TokenStatesNZD")
      return changetype<Address>(
        Address.fromHexString("0x5dAbd09c694bDAB9D5Eb9860F62eac03aa3455E5")
      );
    if (contractName == "TokenStatesPLN")
      return changetype<Address>(
        Address.fromHexString("0xF4FCd6e14e502F0E9F09992DA7c36fC3ce78Dedc")
      );
    if (contractName == "TokenStatesRUB")
      return changetype<Address>(
        Address.fromHexString("0x6c40cE8a338De23948F037BFE4f1c3DB6cC59e6e")
      );
    if (contractName == "TokenStatesSGD")
      return changetype<Address>(
        Address.fromHexString("0xC39f63E0994E26f97Df03373506b239Ae2e0352d")
      );
    if (contractName == "TokenStatesUSD")
      return changetype<Address>(
        Address.fromHexString("0xd089bd91053Ca87d5062F2AF21EEed1e7D1f7D0D")
      );
    if (contractName == "TokenStatesXAG")
      return changetype<Address>(
        Address.fromHexString("0x28A8474AB5cAAeA80182ea5D08655CA905Fb30E0")
      );
    if (contractName == "TokenStatesXAU")
      return changetype<Address>(
        Address.fromHexString("0x69D7Ce07330cb0c99376c93B08E9373Fb640cb08")
      );
    if (contractName == "TokenStateSynthetix")
      return changetype<Address>(
        Address.fromHexString("0xEC114001D23eeFE6624Fb42cCbF4b3c793e295f1")
      );
    if (contractName == "TokenStateXDR")
      return changetype<Address>(
        Address.fromHexString("0xDd905c33120235A2CC4913433C9C304B73BC1E78")
      );
    if (contractName == "TokenStatesETH")
      return changetype<Address>(
        Address.fromHexString("0x30e50dE495E769acC36d885b1556396a8E035A8C")
      );
    if (contractName == "ProxysETH")
      return changetype<Address>(
        Address.fromHexString("0x641E5230c00B9f03A4a12D1992D036C80355EAd3")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x1f9e165C5aA3bD0E31E757D955fe04419781534A")
      );
    if (contractName == "TokenStatesBNB")
      return changetype<Address>(
        Address.fromHexString("0x750bF8B0c010AE8119c2350Ee629f317367962A6")
      );
    if (contractName == "ProxysBNB")
      return changetype<Address>(
        Address.fromHexString("0x0b004d043DEc5eb519cfcF979275079D79020C81")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x12D06c8992e0887fcc7a31f3aB3f800E0fD987B9")
      );
    if (contractName == "TokenStateiBTC")
      return changetype<Address>(
        Address.fromHexString("0xB5b4Df89727eEdc69Cd46cA303d8C5714fC497cF")
      );
    if (contractName == "ProxyiBTC")
      return changetype<Address>(
        Address.fromHexString("0x0b667134CEB6a00720e40038CA6a8F560B2aa105")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0xdD8C438057116bE9730CF3003841193BBe86707C")
      );
    if (contractName == "TokenStateiETH")
      return changetype<Address>(
        Address.fromHexString("0x1A29D482A4a6028D26C569307A30B28E7CFF7e26")
      );
    if (contractName == "ProxyiETH")
      return changetype<Address>(
        Address.fromHexString("0xE95Ef4e7a04d2fB05cb625c62CA58da10112c605")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0xeA7aBC7483cd2910b7bC54F7BF3e82b49293873E")
      );
    if (contractName == "TokenStateiBNB")
      return changetype<Address>(
        Address.fromHexString("0xC7a6e68BC9375047780C4F7B02B55722F8566e32")
      );
    if (contractName == "ProxyiBNB")
      return changetype<Address>(
        Address.fromHexString("0x6b4F028e0E2Fd98cEe9827297429EA1C90A992e3")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0x30A46E656CdcA6B401Ff043e1aBb151490a07ab0")
      );
    if (contractName == "RewardEscrow")
      return changetype<Address>(
        Address.fromHexString("0x73d609BF2B68681794abCbDa92f572a25464f2c1")
      );
    if (contractName == "FeePoolState")
      return changetype<Address>(
        Address.fromHexString("0x348eFCd844cbE3fB9A4a3d43293fB264Ffbe0Ff9")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0x3FdF819c3665D6866b5Bb0F56E1EDA0D7f69B714")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x42D03f506c2308ECd06aE81D8fA22352BC7A8F2b")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x50668b1C11F9E70fEfed0b9f14f554C79df46239")
      );
    if (contractName == "TokenStatesETH")
      return changetype<Address>(
        Address.fromHexString("0x727D1F0a3f221eD61Bf8893af7C43e90e87abe22")
      );
    if (contractName == "ProxysETH")
      return changetype<Address>(
        Address.fromHexString("0xD51AF14dEDB5531F79f8570904268F2ED455fdFE")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x6a4C8Bdd6b330B446be8Ad341f4e4AB5581B6B4F")
      );
    if (contractName == "TokenStatesBNB")
      return changetype<Address>(
        Address.fromHexString("0xc081f99151377E758f6a5fDb29040773aC49B243")
      );
    if (contractName == "ProxysBNB")
      return changetype<Address>(
        Address.fromHexString("0x65C6dd2Ac006a69bD3dBDB91E992Cb1C4bbEA588")
      );
    if (contractName == "SynthsBNB")
      return changetype<Address>(
        Address.fromHexString("0x93e8C4B01EEe53ecc0eF05071fA452a7F333001E")
      );
    if (contractName == "TokenStateiBTC")
      return changetype<Address>(
        Address.fromHexString("0x601db916E0531c6487FE2CEceE06012Ce05ec39d")
      );
    if (contractName == "ProxyiBTC")
      return changetype<Address>(
        Address.fromHexString("0xA7A42e798D03c090dFcceBd3C1Be1e8517bB5C7A")
      );
    if (contractName == "SynthiBTC")
      return changetype<Address>(
        Address.fromHexString("0x3fFe27DF3345b16C570E262696b27FCb05A22C6B")
      );
    if (contractName == "TokenStateiETH")
      return changetype<Address>(
        Address.fromHexString("0x51455570473CEfF430A22AF78683Cf063dD563db")
      );
    if (contractName == "ProxyiETH")
      return changetype<Address>(
        Address.fromHexString("0x41Bf7cB09A9619c29460bcb7Ff77eB45f8C52e9a")
      );
    if (contractName == "SynthiETH")
      return changetype<Address>(
        Address.fromHexString("0x098c064b0EDb6d704216C438E0Fc194B12D230e5")
      );
    if (contractName == "TokenStateiBNB")
      return changetype<Address>(
        Address.fromHexString("0xb211e3b026b6DB2f65F5C5ec03d44Bb97BB69fB8")
      );
    if (contractName == "ProxyiBNB")
      return changetype<Address>(
        Address.fromHexString("0x55F2Ec337059E6Ff2165C6037231dE44db1B2E9c")
      );
    if (contractName == "SynthiBNB")
      return changetype<Address>(
        Address.fromHexString("0xe4F195148C601892b1B108B62234d86B3b1E3315")
      );
    if (contractName == "EscrowChecker")
      return changetype<Address>(
        Address.fromHexString("0x004cc3839a66595729f63F59beD21EBC1cfFBE0E")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0x5Eb0eF1E9f2921f1a849cc5719A9708e461ef74d")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x2359aA1fdbB0E96107FA2f8E928272053b0D7a4d")
      );
    if (contractName == "ProxyFeePool")
      return changetype<Address>(
        Address.fromHexString("0x24d9c8aC6C8d4c42Ef5975244D6B87cc43e3e69A")
      );
    if (contractName == "ProxysAUD")
      return changetype<Address>(
        Address.fromHexString("0x07D5a867c87452e8DFb8D29819F75418F45bCc7C")
      );
    if (contractName == "ProxysBRL")
      return changetype<Address>(
        Address.fromHexString("0xBc5e9B021C2ce3B62B7f3Bc0fE9dfed1137a1081")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0xd7d23797Cd125DD84f4f86308F28498FEFbeF7F0")
      );
    if (contractName == "ProxysCAD")
      return changetype<Address>(
        Address.fromHexString("0x52f322a72d493CB66df77849c404503ec545FD94")
      );
    if (contractName == "ProxysCHF")
      return changetype<Address>(
        Address.fromHexString("0x95C56Dd52B79e4B1441F13164858CE8200252CDC")
      );
    if (contractName == "ProxysCNY")
      return changetype<Address>(
        Address.fromHexString("0x578F55F1a0c50F5CF4f009D68f91461bcA7Ca775")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0xbeED517a0763109D9fFa08FA6a257B7C47b0cA45")
      );
    if (contractName == "ProxysGBP")
      return changetype<Address>(
        Address.fromHexString("0x888235301627Cdb34494fD612be76486924B43B1")
      );
    if (contractName == "ProxysINR")
      return changetype<Address>(
        Address.fromHexString("0x2895EB5eEeB7C767E05144c27743093D38d2DFF4")
      );
    if (contractName == "ProxysJPY")
      return changetype<Address>(
        Address.fromHexString("0x5BE5cb8C0639071980950eCd06A471Ce306BFB40")
      );
    if (contractName == "ProxysKRW")
      return changetype<Address>(
        Address.fromHexString("0x71fEF56d0c45a7f0bAE6449c22E88708D2732e58")
      );
    if (contractName == "ProxysNZD")
      return changetype<Address>(
        Address.fromHexString("0x174cf8136B3A004fF3f7b09c04c822fc0aF896b6")
      );
    if (contractName == "ProxysPLN")
      return changetype<Address>(
        Address.fromHexString("0x78c20BCDF90890749B573E585612FBC12b1Cd8A7")
      );
    if (contractName == "ProxysRUB")
      return changetype<Address>(
        Address.fromHexString("0x8dc649E1c9c7F5174cB9Dc022aa414302902036c")
      );
    if (contractName == "ProxysSGD")
      return changetype<Address>(
        Address.fromHexString("0x86A82401d30345b84a51Ba657Bb2DaAc38f0fDD5")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0x933041998D12016b700173C2E01A120251dfC592")
      );
    if (contractName == "ProxysXAG")
      return changetype<Address>(
        Address.fromHexString("0x7b8f0fA965F4Ea5f6eEBC409c8a53a65d5c6f6e9")
      );
    if (contractName == "ProxysXAU")
      return changetype<Address>(
        Address.fromHexString("0x197449558d66dec421FfeAA675B23047E85Dbb6C")
      );
    if (contractName == "ProxySynthetix")
      return changetype<Address>(
        Address.fromHexString("0x0CBfAfdDD69c3b4fD1e1CC078272b634EE7Fb6F7")
      );
    if (contractName == "ProxyXDR")
      return changetype<Address>(
        Address.fromHexString("0x2C00177F20f3638E5ca66F992e813eA2aF42d88F")
      );
    if (contractName == "SafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x6E5Bc3e877CFaa06eF97dfA12e63EfbB8FCbb03e")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x701E1D199e59bCe46DEd7A252dc89729de717bEB")
      );
    if (contractName == "SynthetixEscrow")
      return changetype<Address>(
        Address.fromHexString("0x4ed25008D551c849876078b81d5E77bB30622278")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0x4FE66700Bbb5f56dB8676B6a89d17bBBeCE2055E")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x7c887A2E69B6D9f4eb60F69615Ed56F91cE2a61F")
      );
    if (contractName == "SynthsBRL")
      return changetype<Address>(
        Address.fromHexString("0xA778Dc7c04Ae54A1b7610B2b25007430537EB413")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xa934bCb3D5F0Ce533fb00099EEB650916a609596")
      );
    if (contractName == "SynthsCAD")
      return changetype<Address>(
        Address.fromHexString("0xFF291a4DC4e6d4dEDce54c0Af88cdcBa49C7C887")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x774d207619E8dc61905e35880086E37b1E42DdB1")
      );
    if (contractName == "SynthsCNY")
      return changetype<Address>(
        Address.fromHexString("0xF0C90A8e22EF883bA61605a1672f7Cb9c15A66BF")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x2CB7cf098ee46D58178d7EbffF2aF5BcFb618622")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x7D5Ed28ab9c04669D4e1dEcBb97B1Ff3ba6455F1")
      );
    if (contractName == "SynthsINR")
      return changetype<Address>(
        Address.fromHexString("0x4B70c2C08053e6755F907E86a9049d07FE3BA4cC")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x2268752E0834731c10C0b07330E1c7Dd3D74Ba15")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0xA1F487A26B97fd1244Afe1B637bD39FA9d74fF92")
      );
    if (contractName == "SynthsNZD")
      return changetype<Address>(
        Address.fromHexString("0xd97601b60cf932813030013033aeF0b8472c08e4")
      );
    if (contractName == "SynthsPLN")
      return changetype<Address>(
        Address.fromHexString("0x95fC3d4EDC923a79E10b52F957c1F3Dc637D8941")
      );
    if (contractName == "SynthsRUB")
      return changetype<Address>(
        Address.fromHexString("0x95d0dba9F6B0df3Ccf806e238231d88EE888E89D")
      );
    if (contractName == "SynthsSGD")
      return changetype<Address>(
        Address.fromHexString("0xa6b62Fed9Bee49ec18a8f4620148De33a4Ac6157")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xCF779D828cf478504f3419108925B122e482DE24")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x480cC7eD2A6b3F0389eb7548b45c71E0eDbf02a8")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0xD176fd25fbcc1F2b63E09A13585966B1f05195D3")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0x56a71Fe44D9516646d4719DfBeE94076B77b4b12")
      );
    if (contractName == "TokenStatesAUD")
      return changetype<Address>(
        Address.fromHexString("0x32C32E4710afD9C4C95B3EA21E8dE0819574ACa7")
      );
    if (contractName == "TokenStatesBRL")
      return changetype<Address>(
        Address.fromHexString("0x02A408b3f32fB86346d2f3AD0bdDc13B5BD89844")
      );
    if (contractName == "TokenStatesBTC")
      return changetype<Address>(
        Address.fromHexString("0xe1743319e4BF06FF51730385F957723Ca0D0C704")
      );
    if (contractName == "TokenStatesCAD")
      return changetype<Address>(
        Address.fromHexString("0xD651EFE690f6fe004FA9781D1D293d6576A019b3")
      );
    if (contractName == "TokenStatesCHF")
      return changetype<Address>(
        Address.fromHexString("0xEEbCA74246e2665065abc8985725F01616F8adE4")
      );
    if (contractName == "TokenStatesCNY")
      return changetype<Address>(
        Address.fromHexString("0xCA9f8e465750cE7aF139FfA3879b21d2F2a20343")
      );
    if (contractName == "TokenStatesEUR")
      return changetype<Address>(
        Address.fromHexString("0x5f24D012556e579bb6B1D71036625A3E152Dd35a")
      );
    if (contractName == "TokenStatesGBP")
      return changetype<Address>(
        Address.fromHexString("0x0a24864596C54D79C825e64b281645249C14590C")
      );
    if (contractName == "TokenStatesINR")
      return changetype<Address>(
        Address.fromHexString("0x662b137dcf979c7e3036D57F6b8a081525bCbcd6")
      );
    if (contractName == "TokenStatesJPY")
      return changetype<Address>(
        Address.fromHexString("0x6682b2D237Ad7513c14cD0a42119F5d24fa566a0")
      );
    if (contractName == "TokenStatesKRW")
      return changetype<Address>(
        Address.fromHexString("0x30b74Dd14cf5a7eD324E381D507a74B50aaad6af")
      );
    if (contractName == "TokenStatesNZD")
      return changetype<Address>(
        Address.fromHexString("0x5ab9B07f20CD191e191268f0b9438aA43e778FAE")
      );
    if (contractName == "TokenStatesPLN")
      return changetype<Address>(
        Address.fromHexString("0xFe35a196939702ed92c49B918674aDc69b05Ca5F")
      );
    if (contractName == "TokenStatesRUB")
      return changetype<Address>(
        Address.fromHexString("0x3167188Cb1e1F12052199a0187e44cBb828fF6Ea")
      );
    if (contractName == "TokenStatesSGD")
      return changetype<Address>(
        Address.fromHexString("0xa5Bb71dF8f3F431E1D5e1cfFEBC4BD26d95F4d6e")
      );
    if (contractName == "TokenStatesUSD")
      return changetype<Address>(
        Address.fromHexString("0x6A9975b87e189A6793f9108a14B4302c9f8A83Ad")
      );
    if (contractName == "TokenStatesXAG")
      return changetype<Address>(
        Address.fromHexString("0x75a329187B619736845163BE5B3e440213Cf2301")
      );
    if (contractName == "TokenStatesXAU")
      return changetype<Address>(
        Address.fromHexString("0xA70B3c3DcD4d3CDC55992DC5BEBED33dA92a259A")
      );
    if (contractName == "TokenStateSynthetix")
      return changetype<Address>(
        Address.fromHexString("0x0ce76ee62C134C1BCa7fa2820962AcE869B378aa")
      );
    if (contractName == "TokenStateXDR")
      return changetype<Address>(
        Address.fromHexString("0xe6529d9A50b1C16B946ca0C928Be9D41e047788a")
      );
    if (contractName == "FeePoolState")
      return changetype<Address>(
        Address.fromHexString("0xA9928b7fDe6E38aA365d12f8b2bD2D725a83C376")
      );
    if (contractName == "RewardEscrow")
      return changetype<Address>(
        Address.fromHexString("0x2c219A0563842b78D4B8F710e3f799BC3b7fd402")
      );
    if (contractName == "SupplySchedule")
      return changetype<Address>(
        Address.fromHexString("0xBEDbE8d6BF16a2b75639cf10aA2331c8b4613139")
      );
    if (contractName == "EscrowChecker")
      return changetype<Address>(
        Address.fromHexString("0x5B6B7f6AD36c799253Dc1e7FC81ccCCcC9091c9b")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0xa6e5DA838D3b8338783E0710E1D5F6C8e8E998CE")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x41B7BE5A411e73Baf5B2C82dCD1C110b0c177335")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xE90B0f0425b86E61633134466a8C97966C7D687c")
      );
    if (contractName == "ProxyFeePool")
      return changetype<Address>(
        Address.fromHexString("0xEc68bC0904B4a34B5F122DCbE3656F4F90bca1F6")
      );
    if (contractName == "ProxysAUD")
      return changetype<Address>(
        Address.fromHexString("0xFD8526ff182C6Abe60240D3b855ee14F51011010")
      );
    if (contractName == "ProxysBRL")
      return changetype<Address>(
        Address.fromHexString("0x4deab59983D120acfD535f35eE8d046AEE7cC87C")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0x292B7dE6Ec4b9930083677bD6F0295D2368aDcEC")
      );
    if (contractName == "ProxysCAD")
      return changetype<Address>(
        Address.fromHexString("0xE01F623Eaa2b08C4D558755BA880451cD7a72E9e")
      );
    if (contractName == "ProxysCHF")
      return changetype<Address>(
        Address.fromHexString("0x2Bf6Bed12D1733FD649676d482c3D6d2c1c3df33")
      );
    if (contractName == "ProxysCNY")
      return changetype<Address>(
        Address.fromHexString("0x0594a89913924F659b7FAf45CAa413FFF54EA908")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0x2904C6dc3d7117Cf737906748EE1296937FEb6B7")
      );
    if (contractName == "ProxysGBP")
      return changetype<Address>(
        Address.fromHexString("0xF6f4f3D2E06Af9BC431b8bC869A2B138a5175C26")
      );
    if (contractName == "ProxysINR")
      return changetype<Address>(
        Address.fromHexString("0x4A4b5f3B43DeEd79C376c19B392E773D5fdfcBc4")
      );
    if (contractName == "ProxysJPY")
      return changetype<Address>(
        Address.fromHexString("0xCC9DB35b10da7820C68957BDE488AFae1C1C12Ab")
      );
    if (contractName == "ProxysKRW")
      return changetype<Address>(
        Address.fromHexString("0xBfa8F1ca2a652f554da4B10D440bD272C61B29bD")
      );
    if (contractName == "ProxysNZD")
      return changetype<Address>(
        Address.fromHexString("0x26287aEF17239e9ae7a47e54C8D8205Ce88dcB49")
      );
    if (contractName == "ProxysPLN")
      return changetype<Address>(
        Address.fromHexString("0xda83b2eBF258D221E46be68933E8958Dc75117e2")
      );
    if (contractName == "ProxysRUB")
      return changetype<Address>(
        Address.fromHexString("0xa6C4299Ebe970AE5887FaEDc9357BF1F0c096170")
      );
    if (contractName == "ProxysSGD")
      return changetype<Address>(
        Address.fromHexString("0x3cBE43F192a22591a149bDBf4406C1AcE0bf4e1B")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0x0731E56eA5BF966e11E3BDdC2f82d964cb6fBDEE")
      );
    if (contractName == "ProxysXAG")
      return changetype<Address>(
        Address.fromHexString("0x964f3bFFD7B0Fa64DB02094764F05E58C2447a50")
      );
    if (contractName == "ProxysXAU")
      return changetype<Address>(
        Address.fromHexString("0xA56A15956be304c743497e5E2b02AEA7b3c46b5f")
      );
    if (contractName == "ProxySynthetix")
      return changetype<Address>(
        Address.fromHexString("0x082fbbaE20E472D1cEb9b51912d069C94A2b949b")
      );
    if (contractName == "ProxyXDR")
      return changetype<Address>(
        Address.fromHexString("0x2FBDbc71787dCeD95ac5744EcA8aacCc7f587b34")
      );
    if (contractName == "SafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x94B41091eB29b36003aC1C6f0E55a5225633c884")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x5a4aDe4f3E934a0885f42884F7077261C3F4f66F")
      );
    if (contractName == "SynthetixEscrow")
      return changetype<Address>(
        Address.fromHexString("0x25D0b662813D959cD0D03533Df4Da051765743AC")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0x23F608ACc41bd7BCC617a01a9202214EE305439a")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0x860267f2EAA970914c1Db5f5CD5E61080141eb2B")
      );
    if (contractName == "SynthsBRL")
      return changetype<Address>(
        Address.fromHexString("0xA1a598922449f8a75697594E46DC654500242740")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xC9Afa98831C51cB7331EbbDBf486c65069ede78D")
      );
    if (contractName == "SynthsCAD")
      return changetype<Address>(
        Address.fromHexString("0x237Eb06d67E9b0268bc8d14d2D4EACF2AFb0c8B5")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0xAE09aEc60d5e5cBb5B7442b96d8b992efBA2df61")
      );
    if (contractName == "SynthsCNY")
      return changetype<Address>(
        Address.fromHexString("0x3457F98cD2dFE8d0a6056F5e81f04bb1e2248444")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0xC37197Cf041b3884d08836786A30E11C0Da1f75e")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x3E88bFAbDCd2b336C4a430262809Cf4a0AC5cd57")
      );
    if (contractName == "SynthsINR")
      return changetype<Address>(
        Address.fromHexString("0xa22cf004eD5105608b39c48bE688BD9B9026a046")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0xE50f47ba6D0B7f506e8d27B2BD959Cf86c316398")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0x59954A19fC67C3bc55654332C48cF8Eb734F2636")
      );
    if (contractName == "SynthsNZD")
      return changetype<Address>(
        Address.fromHexString("0xce1e1472Ce6a33A0e83fC422651C74616ee93e7A")
      );
    if (contractName == "SynthsPLN")
      return changetype<Address>(
        Address.fromHexString("0x139AebCC3fd542a2272Aa3B77483F4C2Fa01584d")
      );
    if (contractName == "SynthsRUB")
      return changetype<Address>(
        Address.fromHexString("0x0370Eb7bB3bB100Ec13BF240729697617C1e5122")
      );
    if (contractName == "SynthsSGD")
      return changetype<Address>(
        Address.fromHexString("0x80bc73906827eC2a48b9f4E0Da6184Ed3a8E5995")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x0198c4037Dc6Ef6e2f8719b4502722812424c09e")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0x771Fb2E5633450c245FF5041E1E0Eb175Ac079aa")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0xac6093a4536f36FE671ac4487442923f2a5dfed3")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0xf6cAFF55D917C34851EeCA075a711081494Ae5dE")
      );
    if (contractName == "TokenStatesAUD")
      return changetype<Address>(
        Address.fromHexString("0x0c056325eD64C7382fC53Ef8327640de62E1Bf32")
      );
    if (contractName == "TokenStatesBRL")
      return changetype<Address>(
        Address.fromHexString("0x90b20fe01A3b7F2Ca0cf0fe7b3a48B42878D00Bb")
      );
    if (contractName == "TokenStatesBTC")
      return changetype<Address>(
        Address.fromHexString("0x2a34c139907Ed18Ea6B7197DDbBE9a43F1B2FfBF")
      );
    if (contractName == "TokenStatesCAD")
      return changetype<Address>(
        Address.fromHexString("0xb7dC999746074B0824E2e3041139991e33973d17")
      );
    if (contractName == "TokenStatesCHF")
      return changetype<Address>(
        Address.fromHexString("0x53052AEB9e1aeCD008687e631bc8910A1BB63064")
      );
    if (contractName == "TokenStatesCNY")
      return changetype<Address>(
        Address.fromHexString("0xCbB8dFa37244Ca887DE38b2E496e968fB0571f06")
      );
    if (contractName == "TokenStatesEUR")
      return changetype<Address>(
        Address.fromHexString("0x5a6Fa5A208932cb5B631bF6B89FcF8dE4FdA27bB")
      );
    if (contractName == "TokenStatesGBP")
      return changetype<Address>(
        Address.fromHexString("0x72d3315748e920F258F8491A37D5C02d7e418e1F")
      );
    if (contractName == "TokenStatesINR")
      return changetype<Address>(
        Address.fromHexString("0x3b60d2844F1221a54272B9512AD017DF5e3D700d")
      );
    if (contractName == "TokenStatesJPY")
      return changetype<Address>(
        Address.fromHexString("0x94C4D9770BFEDC6cFa97734fa63bfF6e7458Ca75")
      );
    if (contractName == "TokenStatesKRW")
      return changetype<Address>(
        Address.fromHexString("0x83A6793Aa9b9BAFf585051726E994f14259684E7")
      );
    if (contractName == "TokenStatesNZD")
      return changetype<Address>(
        Address.fromHexString("0x7603457726C15E2A2FD8130aE6C026f7b932e992")
      );
    if (contractName == "TokenStatesPLN")
      return changetype<Address>(
        Address.fromHexString("0xB12dB3B8CBdEC41d8945096cACe9FB0660d830dB")
      );
    if (contractName == "TokenStatesRUB")
      return changetype<Address>(
        Address.fromHexString("0x7C1754C0954310a24591F0351B3DECf86A791aEe")
      );
    if (contractName == "TokenStatesSGD")
      return changetype<Address>(
        Address.fromHexString("0x7c8Aeffdd9978fdcd0B406ffe4a82d50f0c9AC88")
      );
    if (contractName == "TokenStatesUSD")
      return changetype<Address>(
        Address.fromHexString("0xCA731366244C07221C07fC25d660b365A02bDcB7")
      );
    if (contractName == "TokenStatesXAG")
      return changetype<Address>(
        Address.fromHexString("0x9319D92f1b7C88188c79B9a6C3bB6B8B24519408")
      );
    if (contractName == "TokenStatesXAU")
      return changetype<Address>(
        Address.fromHexString("0xE97f746bcf7c777e100FD119133Ff86a1EEdAD0f")
      );
    if (contractName == "TokenStateSynthetix")
      return changetype<Address>(
        Address.fromHexString("0x6700dCBE086F965acbf1dBb80554642B28DF424A")
      );
    if (contractName == "TokenStateXDR")
      return changetype<Address>(
        Address.fromHexString("0xF32b32E81ED8430f0783a2CDBB007b1226b8cBb2")
      );
    if (contractName == "EscrowChecker")
      return changetype<Address>(
        Address.fromHexString("0x8E6734A7653175b3FDa62516A646709F547C8342")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xFcD4D688Fa40BD4ABC2F9c8db4e1735f14094c42")
      );
    if (contractName == "TokenStateXDR")
      return changetype<Address>(
        Address.fromHexString("0x6e9A07573FC918A92F5E77Aed08CFa24E22F727F")
      );
    if (contractName == "Depot")
      return changetype<Address>(
        Address.fromHexString("0x0ec3c77166C5f42d60Ef7AB8871c50A14A82fb8f")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xfcd4d688fa40bd4abc2f9c8db4e1735f14094c42")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x3720a2D52BAa5BB51D4db9e9C753603024EB1Eb6")
      );
    if (contractName == "ProxyFeePool")
      return changetype<Address>(
        Address.fromHexString("0x39A9bBBaBad927eBEf8932f9BF25fff8da73D39d")
      );
    if (contractName == "ProxysAUD")
      return changetype<Address>(
        Address.fromHexString("0xc6752DB1651dde8471e17B79A058BFf80c36f4F8")
      );
    if (contractName == "ProxysBRL")
      return changetype<Address>(
        Address.fromHexString("0x2F73a52828559ECA8aa4ba2Bc9194FB1fB6B936a")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0xc52084D522aDfc1B7e6f90e8d1e8C6805D29AD85")
      );
    if (contractName == "ProxysCAD")
      return changetype<Address>(
        Address.fromHexString("0x4A4155F0AdD37b715b2f83509fCc24128b44EAb0")
      );
    if (contractName == "ProxysCHF")
      return changetype<Address>(
        Address.fromHexString("0x2fbe9f09ae3fe9a4835990313E3696A799FCb762")
      );
    if (contractName == "ProxysCNY")
      return changetype<Address>(
        Address.fromHexString("0x3D8A4220acb7Bfb4Df352Eb1D3f678e84e58FDa7")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0x34865886F7F2bFc65b22A628f5176aB2167E52F6")
      );
    if (contractName == "ProxysGBP")
      return changetype<Address>(
        Address.fromHexString("0x958332ACb1F9dF866157EE47e36Cd6077249c664")
      );
    if (contractName == "ProxysINR")
      return changetype<Address>(
        Address.fromHexString("0xc6bF1A415aaB79DaA51c2f86f1F1c49f5516f736")
      );
    if (contractName == "ProxysJPY")
      return changetype<Address>(
        Address.fromHexString("0xdA9790250f188D97F89fB05d64A74947bb2B8689")
      );
    if (contractName == "ProxysKRW")
      return changetype<Address>(
        Address.fromHexString("0xAf2F7992987A8662b7f56a66C8563397b9A4EDE5")
      );
    if (contractName == "ProxysNZD")
      return changetype<Address>(
        Address.fromHexString("0x001Df8Af6c00462c81EB6818E66F3D1b99B552C5")
      );
    if (contractName == "ProxysPLN")
      return changetype<Address>(
        Address.fromHexString("0x6fa3A68760bBC83a24F541d2CA9495339c4FFEF8")
      );
    if (contractName == "ProxysRUB")
      return changetype<Address>(
        Address.fromHexString("0x907aAD44A8fb441d2CAA32055a4032201f941Be7")
      );
    if (contractName == "ProxysSGD")
      return changetype<Address>(
        Address.fromHexString("0x403c67B039bef1210Ea8169D06a5d806195116C5")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0x7EFDDAF6057FD1CfdE8227e199EACca12971c760")
      );
    if (contractName == "ProxysXAG")
      return changetype<Address>(
        Address.fromHexString("0x6e8BcDc6F127E1bc913624918cdE5358790E6449")
      );
    if (contractName == "ProxysXAU")
      return changetype<Address>(
        Address.fromHexString("0x31c67585D01a6c7926C0d7E1DC99F59f1F1f590a")
      );
    if (contractName == "ProxySynthetix")
      return changetype<Address>(
        Address.fromHexString("0xb5aD6f707dff298F56B4504d0001fcFCCA8c2ED6")
      );
    if (contractName == "ProxyXDR")
      return changetype<Address>(
        Address.fromHexString("0xAbAc34B51cc28A648Fe5BBF3087aeb24Bf7C24Ec")
      );
    if (contractName == "SafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x84D626B2BB4D0F064067e4BF80FCe7055d8F3E7B")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x11748b9Ff45d46430B0316df1dA8f78E62e770a2")
      );
    if (contractName == "SynthetixEscrow")
      return changetype<Address>(
        Address.fromHexString("0xd18bbD8C822a824366CC7712cbEc7B5B526D47ba")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0xe1ba8F67582976c8Be14C31304d5AD9A61f1E80b")
      );
    if (contractName == "SynthsAUD")
      return changetype<Address>(
        Address.fromHexString("0xef96513B126898c370d7e1c73e9A069202c0c18B")
      );
    if (contractName == "SynthsBRL")
      return changetype<Address>(
        Address.fromHexString("0x942337F160009E67E151db0b775dDc0BaDD49080")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x5227692b0c08bb75A1C6f62169AE489F898e180A")
      );
    if (contractName == "SynthsCAD")
      return changetype<Address>(
        Address.fromHexString("0x1c6E01a6C658b113B45b0791d7A043317350FbE4")
      );
    if (contractName == "SynthsCHF")
      return changetype<Address>(
        Address.fromHexString("0x939e6c08cdd77DBA2B6a6463790220c366E2Ba52")
      );
    if (contractName == "SynthsCNY")
      return changetype<Address>(
        Address.fromHexString("0xDbcB261d399E20897bC75b3f87Ac30E2493C3412")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x40e62f811a448f2fcE3bc276a47D2e3FfaEcFe77")
      );
    if (contractName == "SynthsGBP")
      return changetype<Address>(
        Address.fromHexString("0x5F9a6d7FEB19A78ECFda0F76AEb2C512D6b09fd7")
      );
    if (contractName == "SynthsINR")
      return changetype<Address>(
        Address.fromHexString("0x87a874A5721452cecd211b99F64CB9Bd8EfA0CAc")
      );
    if (contractName == "SynthsJPY")
      return changetype<Address>(
        Address.fromHexString("0x9a98aBF9Bc3ABB6381750131fBc10d1680bfb489")
      );
    if (contractName == "SynthsKRW")
      return changetype<Address>(
        Address.fromHexString("0x5bAc2A92DEbc9f4E8A9CC8Be37940DDe77A07063")
      );
    if (contractName == "SynthsNZD")
      return changetype<Address>(
        Address.fromHexString("0x0D8d985BDb82CC5976eCB18Fdc2BEAd4E74b3778")
      );
    if (contractName == "SynthsPLN")
      return changetype<Address>(
        Address.fromHexString("0xA7fD047d694dD0a2cAc799BA8f49098BA218f142")
      );
    if (contractName == "SynthsRUB")
      return changetype<Address>(
        Address.fromHexString("0xe681319a209e34E57AE6653E752bD852055E3572")
      );
    if (contractName == "SynthsSGD")
      return changetype<Address>(
        Address.fromHexString("0xf09Fb6257C8e91Cc217c91AEb0d3f7f3A4b7d054")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xdC703901cdc5a6BFCE0BaACae4FC5937C03AC247")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xa1F4AD87C3AAA5367bd92061FEa2919f5Ee75249")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0xf13f22E5e9505b21F6623c16aa4EeeD0EB62c741")
      );
    if (contractName == "SynthXDR")
      return changetype<Address>(
        Address.fromHexString("0xBFb0ae6e090662cD64B1913806023bA403b35D58")
      );
    if (contractName == "TokenStatesAUD")
      return changetype<Address>(
        Address.fromHexString("0xC9cAB39352420a5844963e075AE2c6c60F342B87")
      );
    if (contractName == "TokenStatesBRL")
      return changetype<Address>(
        Address.fromHexString("0x9aeD02415353749e32B39a3e190b7Af81A4c84eA")
      );
    if (contractName == "TokenStatesBTC")
      return changetype<Address>(
        Address.fromHexString("0x943C90b01D0BbE0799CEaA8Da85e3a845ee34861")
      );
    if (contractName == "TokenStatesCAD")
      return changetype<Address>(
        Address.fromHexString("0x7e6d512e464bbfbFacce426e8a289d0F532389FA")
      );
    if (contractName == "TokenStatesCHF")
      return changetype<Address>(
        Address.fromHexString("0x0f3a54b8D5D542eDa81A30515F218FD142532926")
      );
    if (contractName == "TokenStatesCNY")
      return changetype<Address>(
        Address.fromHexString("0xdBE2aCea6d9eAA297dA9b2C19912aa264F94E2f2")
      );
    if (contractName == "TokenStatesEUR")
      return changetype<Address>(
        Address.fromHexString("0xCE8eC36576B83D60e12E4c69FfC08A979b515692")
      );
    if (contractName == "TokenStatesGBP")
      return changetype<Address>(
        Address.fromHexString("0xeDe76a696Ab2Cae36bB6DF5eF0f79837FE04Bc6B")
      );
    if (contractName == "TokenStatesINR")
      return changetype<Address>(
        Address.fromHexString("0x30d4aaAd21A7F97C35901bf468bC7cCE6158e6ED")
      );
    if (contractName == "TokenStatesJPY")
      return changetype<Address>(
        Address.fromHexString("0xb817D6935f2127653A1A9D35B037930d375E60db")
      );
    if (contractName == "TokenStatesKRW")
      return changetype<Address>(
        Address.fromHexString("0xcFF638bc6C62b652dA29dAaa7858897e83d5401f")
      );
    if (contractName == "TokenStatesNZD")
      return changetype<Address>(
        Address.fromHexString("0x708236E4e37dB4A0c2fD2528766ac02C4fd3065c")
      );
    if (contractName == "TokenStatesPLN")
      return changetype<Address>(
        Address.fromHexString("0x0ADfA3Ef39adbcCE1918066becB686cf6fFbb6E0")
      );
    if (contractName == "TokenStatesRUB")
      return changetype<Address>(
        Address.fromHexString("0x6aC5371ae9D82f2CCc1cfe232203643d483f17b5")
      );
    if (contractName == "TokenStatesSGD")
      return changetype<Address>(
        Address.fromHexString("0xBeBDDbdADe3C588debAc3cC187BC1Cd79f6D5087")
      );
    if (contractName == "TokenStatesUSD")
      return changetype<Address>(
        Address.fromHexString("0x2e3E3b35112c3971fdf0F50b57Fc6BCf2F37c16b")
      );
    if (contractName == "TokenStatesXAG")
      return changetype<Address>(
        Address.fromHexString("0x7a1B0c13A778c1e4fB366717602fcf1E0CB532c2")
      );
    if (contractName == "TokenStatesXAU")
      return changetype<Address>(
        Address.fromHexString("0x77b0AD540e882cBd1DcbdDc281F8E47174dBaD60")
      );
    if (contractName == "TokenStateSynthetix")
      return changetype<Address>(
        Address.fromHexString("0x63912845ed7aF853B4F8E4a1DEB2E25341a5c5F8")
      );
    if (contractName == "TokenStateXDR")
      return changetype<Address>(Address.fromHexString("0x0"));
  }
  if (network == "optimism-kovan") {
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x75d83253021b7874DF52B1f954Eb70AcA918a537")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x1433512539954651cB95A73D4C551943fB723b48")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xbdb2Bf553b5f9Ca3327809F3748b86C106719C95")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xCB2A226c20f404d7fcFC3eC95B38D06877284527")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x9C570575586ba29ed8a2523639865fF131F59411")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x1f42bE0572fccf74356C8e28A68A2dd60E7c6454")
      );
    if (contractName == "SynthsUNI")
      return changetype<Address>(
        Address.fromHexString("0x2269411619c1FF9C02F251167d583450EB1E4847")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x7EFfe4DF5961471B48Bb3c65456ff97A594b0958")
      );
    if (contractName == "SynthsSOL")
      return changetype<Address>(
        Address.fromHexString("0x1a77afdFa733292C17975e83b08091674A8FF3B4")
      );
    if (contractName == "SynthsAVAX")
      return changetype<Address>(
        Address.fromHexString("0xDe64a263c044e193B50d5eafd5EDD330997EA39e")
      );
    if (contractName == "SynthsMATIC")
      return changetype<Address>(
        Address.fromHexString("0x042c26bBa8741B9b277695426861c09dD1c41366")
      );
    if (contractName == "SynthsWTI")
      return changetype<Address>(
        Address.fromHexString("0xc696eB9b1726256bd2039a322aBBd48bD389dEF4")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0xce57Aa68D326f75eB815FD3c0b18D093775Bc86B")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xe97b8152CB74ED9935d2f8b2C09331415A6ba856")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x92d4e5CAfbf3219E81f1c904068Fe7CD2d440F57")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x0E758fb217AFd27D282594f5bca1828985906f03")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0x65d3c950A30524D9f882cFf826040F3941D1ADAA")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x28CAb2c065bC0aAE84f6763e621B0b814C77922B")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x8567bBd72aE1639b8EA378eF108a9614e6Ce8081")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x01eBf544794F7f38d1e937BeA1c15F952ced7c62")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xfff685537fdbD9CA07BD863Ac0b422863BF3114f")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x638CCdbB9A014a73FA9b112962A754673582C7e7")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x6BB4D7603eAE01c5537D46084C675ae19740f41c")
      );
    if (contractName == "Liquidator")
      return changetype<Address>(
        Address.fromHexString("0xE50124A0C087EC06a273D0B9886902273B02d4D8")
      );
    if (contractName == "LiquidatorRewards")
      return changetype<Address>(
        Address.fromHexString("0xE45A27fd3ad929866CEFc6786d8360fF6665c660")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x218Cc3767CA033bcAc447D7522064670794B1007")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x37488De9A5Eaf311840D4B21a5B35A16bcb69603")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xFAB9B9350fD9b3F00E6e6332229C61ca3AcA487c")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xA76E33cec81a985033430df1A9f1786479Fb2c87")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xe964C44F4f2a2755BcC789743aD0566DE2994364")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0x5b643DFC67f9701929A0b55f23e0Af61df50E75D")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x59c8B5Ac52AC432217394f35B016F73Fcd2B26e3")
      );
    if (contractName == "TokenStatesEUR")
      return changetype<Address>(
        Address.fromHexString("0xB16748B76C430F7cC9d8dbE617A77f09e49B482B")
      );
    if (contractName == "ProxysEUR")
      return changetype<Address>(
        Address.fromHexString("0xafD28E395D2865862D06A3d9cb7d4189e09c4Df2")
      );
    if (contractName == "SynthsEUR")
      return changetype<Address>(
        Address.fromHexString("0x2eC164E5b91f9627193C0268F1462327e3D7EC68")
      );
    if (contractName == "FuturesMarketEUR")
      return changetype<Address>(
        Address.fromHexString("0xd33773480c9b05FDC22359d51992DCE704bDa1d2")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x61560Fd10fff898b7C35ba9a56DA0F03FCa6A319")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x1596A3bDf28A681D589a89Cd04dCFB9C4A763B00")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0xE61d388DD2AA9F79f4fC708b630bC24B661D6934")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x18682c60b9b0d01Bc4c73Bea8DB04284d14e065F")
      );
    if (contractName == "FuturesMarketAAVE")
      return changetype<Address>(
        Address.fromHexString("0x8C1D513188Cc86c1e8c9bE002F69f174016f1d17")
      );
    if (contractName == "FuturesMarketAPE")
      return changetype<Address>(
        Address.fromHexString("0x522aBb55e6f1e1E9E5Fccf5e8f3FeF3e31093530")
      );
    if (contractName == "FuturesMarketAXS")
      return changetype<Address>(
        Address.fromHexString("0x72CeE2960b65aa4d37DDb89b83b2adeB64d34d2E")
      );
    if (contractName == "FuturesMarketUNI")
      return changetype<Address>(
        Address.fromHexString("0xe6c5F1dBde6aB671c60E511c2dC064f5F43BF988")
      );
    if (contractName == "FuturesMarketLUNA")
      return changetype<Address>(
        Address.fromHexString("0x8e5691736079FebEfD8A634FC0d6eE0478Cc940b")
      );
    if (contractName == "TokenStatesXAU")
      return changetype<Address>(
        Address.fromHexString("0x3A008c909d505122668Ebc74980E2A222a9555Dd")
      );
    if (contractName == "ProxysXAU")
      return changetype<Address>(
        Address.fromHexString("0x9B2aFAa2b72C281d86f07d4DE41A16882A3c8470")
      );
    if (contractName == "SynthsXAU")
      return changetype<Address>(
        Address.fromHexString("0x8B1CC80c79025477Ab1665284ff08d731FcbC3cF")
      );
    if (contractName == "TokenStatesXAG")
      return changetype<Address>(
        Address.fromHexString("0x32bB37418b682aEC849fdb86e9947847BEe392e7")
      );
    if (contractName == "ProxysXAG")
      return changetype<Address>(
        Address.fromHexString("0x6e497a19f459c4D17B178539d7583553Ad9A9A90")
      );
    if (contractName == "SynthsXAG")
      return changetype<Address>(
        Address.fromHexString("0xf94f90B6BeEEb67327581Fe104a1A078B7AC8F89")
      );
    if (contractName == "FuturesMarketXAU")
      return changetype<Address>(
        Address.fromHexString("0x86BE944F673D77B93dc5F19655C915b002d42beb")
      );
    if (contractName == "FuturesMarketXAG")
      return changetype<Address>(
        Address.fromHexString("0x944E3E0cDE5daB927AB174bc22C4c0dA013436B6")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x4098C0fCDB3dc406D807b68498E0a567cfe3f9c3")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xC964D325096ba170bF34f7c267405467D9E48353")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xb205415386F4b1Da1A60Dd739BFf60761A99792f")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xE8d1bd4DE9A0aB4aF9197c13E6029c4Ea4E14de3")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0xEe026954B5B4B88A37894c46028a8079eBcE9fC6")
      );
    if (contractName == "TokenStatesWTI")
      return changetype<Address>(
        Address.fromHexString("0x412c870daAb642aA87715e2EA860d20E48E73267")
      );
    if (contractName == "ProxysWTI")
      return changetype<Address>(
        Address.fromHexString("0x6b27e4554f2FEFc04F4bd9AE0D2A77f348d12cfA")
      );
    if (contractName == "SynthsWTI")
      return changetype<Address>(
        Address.fromHexString("0x8e08BF90B979698AdB6d722E9e27263f36366414")
      );
    if (contractName == "FuturesMarketSOL")
      return changetype<Address>(
        Address.fromHexString("0x1991bEA1eB08a78701F3330934B2301Fc6520AbA")
      );
    if (contractName == "FuturesMarketAVAX")
      return changetype<Address>(
        Address.fromHexString("0xc00E7C2Bd7B0Fb95DbBF10d2d336399A939099ee")
      );
    if (contractName == "FuturesMarketMATIC")
      return changetype<Address>(
        Address.fromHexString("0x8e0df45f66E620F85dF1D0490Cd2b19E57a4232A")
      );
    if (contractName == "FuturesMarketWTI")
      return changetype<Address>(
        Address.fromHexString("0x929d8EC9A885cdCfdF28EA31B4A356532757DE5E")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x2a764Dd011E0142629183ef9Fec89dd5064Ec52A")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x5565fcd9739182cA5e474409b2685b4C0A4829E3")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0xE90F90DCe5010F615bEC29c5db2D9df798D48183")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x9FFB4aA93612c9681203118941F983Bb1bB59d20")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x6Bd33a593D27De9af7EBb5fCBc012BBe7541A456")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xCD203357dA8c641BA99765ba0583BE4Ccd8D2121")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x0D521f5320D754f0B844f88c0cA7c377a448edaf")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x723DE2CC925B273FfE66E1B1c94DfAE6b804a83a")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x360bc0503362130aBE0b3393aC078B03d73a9EcA")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0xED4f0C6DfE3235e9A93B808a60994C8697cC2236")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x9745E33Fa3151065568385f915C48d9E538B42a2")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x32FebC59E02FA5DaFb0A5e6D603a0693c53A0F34")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x5e719d22C6ad679B28FE17E9cf56d3ad613a6723")
      );
    if (contractName == "SynthsUNI")
      return changetype<Address>(
        Address.fromHexString("0x99Fd0EbBE8144591F75A12E3E0edcF6d51DfF877")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0xcDcD73dE9cc2B0A7285B75765Ef7b957963E57aa")
      );
    if (contractName == "SynthsSOL")
      return changetype<Address>(
        Address.fromHexString("0xBA097Fa1ABF647995154c8e9D77CEd04123b593f")
      );
    if (contractName == "SynthsAVAX")
      return changetype<Address>(
        Address.fromHexString("0xdA730bF21BA6360af34cF065B042978017f2bf49")
      );
    if (contractName == "SynthsMATIC")
      return changetype<Address>(
        Address.fromHexString("0xDbcfd6F265528d08FB7faA0934e18cf49A03AD65")
      );
    if (contractName == "SignedSafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0xAF5347b97159B3b8c9e0D98F0E1E9B80eB12EBd7")
      );
    if (contractName == "OneNetAggregatorIssuedSynths")
      return changetype<Address>(
        Address.fromHexString("0xD2Ed2062047f915A5a442f04DE1C9f0AAE30f8b9")
      );
    if (contractName == "OneNetAggregatorDebtRatio")
      return changetype<Address>(
        Address.fromHexString("0xE52A3aFe564427d206Ab776aC79F97b5C8E67d3C")
      );
    if (contractName == "ExchangeCircuitBreaker")
      return changetype<Address>(
        Address.fromHexString("0xe345a6eE3e7ED9ef3F394DB658ca69a2d7A614A8")
      );
    if (contractName == "FuturesMarketManager")
      return changetype<Address>(
        Address.fromHexString("0xA3e4c049dA5Fe1c5e046fb3dCe270297D9b2c6a9")
      );
    if (contractName == "FuturesMarketData")
      return changetype<Address>(
        Address.fromHexString("0x92CA72696B15b0F0C239E838148495016950af51")
      );
    if (contractName == "FuturesMarketSettings")
      return changetype<Address>(
        Address.fromHexString("0xEA567e05844ba0e257D80F6b579a1C2beB82bfCB")
      );
    if (contractName == "FuturesMarketBTC")
      return changetype<Address>(
        Address.fromHexString("0x6bF98Cf7eC95EB0fB90d277515e040D32B104e1C")
      );
    if (contractName == "FuturesMarketETH")
      return changetype<Address>(
        Address.fromHexString("0x698E403AaC625345C6E5fC2D0042274350bEDf78")
      );
    if (contractName == "FuturesMarketLINK")
      return changetype<Address>(
        Address.fromHexString("0x1e28378F64bC04E872a9D01Eb261926717346F98")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x343BC4b4195FE21D7797B9bb12FcA2C85B5619C8")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x0820dfBcbA966f2CE26a86A04b352E2f3655FB62")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x0b0Db6d9403dc56d918781dd74d9A1B7dfE59E7C")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xe8A28CbD4A1ED50C3Fb955cb5DE0cEf0538540dd")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xe2D65eD9dcE9581113B5dc3faA451d2D3b51ed85")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x9C1063A02195d2f0409CC9d3B2bab16fE0C75DEE")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x41fBD15327acFAf9Ab1416339f8e2C1B0b70eFe9")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0xf5F37379CfDff7CCc0DBB2CeBB496BC70a0A71D7")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x43465ddce92F81321a6e8aE7bf6E0EFb52A349C4")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x62aE6f77610896d60729dcf7a1514dE188E2E838")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x98b857df9913D97B5822ad6e9d82e4F71073FD1D")
      );
    if (contractName == "SynthsUNI")
      return changetype<Address>(
        Address.fromHexString("0xD9d31828c9fa04AEcfD41578b58dC44B82485326")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x3eF3722dAF184A73f4c9345e827919c7E12Eb6DA")
      );
    if (contractName == "SynthsSOL")
      return changetype<Address>(
        Address.fromHexString("0x07DD3cc86Af31085E3dA1924B9D47FF718F2afC1")
      );
    if (contractName == "SignedSafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x25576dBdcaD4306Faead0551ef5BE109C5B8C996")
      );
    if (contractName == "ext:AggregatorIssuedSynths")
      return changetype<Address>(
        Address.fromHexString("0xEb8bCa9AE662313a8A1f74c5BB4A7D1d67473543")
      );
    if (contractName == "ext:AggregatorDebtRatio")
      return changetype<Address>(
        Address.fromHexString("0x8e2Ed2F16238952f84DB07439073406213214799")
      );
    if (contractName == "ExchangeCircuitBreaker")
      return changetype<Address>(
        Address.fromHexString("0x71736002ca4fD4FE5E139815915520AE9Ea3428c")
      );
    if (contractName == "FuturesMarketManager")
      return changetype<Address>(
        Address.fromHexString("0x579E2F05309e77d50D3017f2b31A7B8390f6351f")
      );
    if (contractName == "FuturesMarketData")
      return changetype<Address>(
        Address.fromHexString("0x240922DDB83C2533C61110bf4EEC4B910649259a")
      );
    if (contractName == "FuturesMarketSettings")
      return changetype<Address>(
        Address.fromHexString("0xd8011A4fA51d059CCb2cE1173778c53958AD36A7")
      );
    if (contractName == "FuturesMarketBTC")
      return changetype<Address>(
        Address.fromHexString("0xab8f7f772E86c0f79b39b19feD29E573186BA9Bb")
      );
    if (contractName == "FuturesMarketETH")
      return changetype<Address>(
        Address.fromHexString("0x229B66319AFf2Cd9eE6A2E1dc834201906e77B0D")
      );
    if (contractName == "FuturesMarketLINK")
      return changetype<Address>(
        Address.fromHexString("0x9F86e37Ae14009a94Ece5cfcb5cc0e8129cC1C04")
      );
    if (contractName == "TokenStatesAVAX")
      return changetype<Address>(
        Address.fromHexString("0x8338011e46Db45f5cA0f06C4174a85280772dC85")
      );
    if (contractName == "ProxysAVAX")
      return changetype<Address>(
        Address.fromHexString("0x61760432A363399de4dDDFfD5925A4046c112594")
      );
    if (contractName == "SynthsAVAX")
      return changetype<Address>(
        Address.fromHexString("0xBc9F23b1AEf25e9a456F1973E9a9ef63830B8f49")
      );
    if (contractName == "TokenStatesMATIC")
      return changetype<Address>(
        Address.fromHexString("0x2cD1C77fA8cB3C4a76445DC7C8861e374c67A0F6")
      );
    if (contractName == "ProxysMATIC")
      return changetype<Address>(
        Address.fromHexString("0x8d651Be85f9f4c7322b789EA73DFfBbE501338B6")
      );
    if (contractName == "SynthsMATIC")
      return changetype<Address>(
        Address.fromHexString("0x5BC3b2B2dC40dC88ea227F7501F28D9D8167BB60")
      );
    if (contractName == "TokenStatesSOL")
      return changetype<Address>(
        Address.fromHexString("0x49460030a1801D38797D35F7ac4205a6212861aD")
      );
    if (contractName == "ProxysSOL")
      return changetype<Address>(
        Address.fromHexString("0x64Df80373eCD553CD48534A0542307178fF344DD")
      );
    if (contractName == "SynthsSOL")
      return changetype<Address>(
        Address.fromHexString("0x24f46A427E1cd91B4fEE1F47Fe7793eEFCb205b5")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xAe35A8BC0e190D4544579a331229e809B2f7ca7b")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xc7d4AF2B7c32ea13ea64911c672C89254251c652")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x7B49bAfad6d255880F7844a022DbdB1De5440Fe5")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x1Fdd3949B995950C2D247F688aAD6a78471d7C77")
      );
    if (contractName == "SynthetixDebtShare")
      return changetype<Address>(
        Address.fromHexString("0xEEc90126956e4de2394Ec6Bd1ce8dCc1097D32C9")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x0A40F66D5759236A2FE0058F2a47fD9A5FF198Ae")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0xF62Da62b5Af8B0cae27B1D9D8bB0Adb94EB4c1e2")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x65a200D47Ef8BABb624E4571b43981f56d6f7a64")
      );
    if (contractName == "SystemSettingsLib")
      return changetype<Address>(
        Address.fromHexString("0x415bE5d790F51fabF4321Be402917DB518a09Ef3")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x129fd2f3a799bD156e8c00599760AfC2f0f953dA")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x099B3881d63d3Eef0ec32783Aa64B726672213E2")
      );
    if (contractName == "CollateralEth")
      return changetype<Address>(
        Address.fromHexString("0xc7960401a5Ca5A201d41Cf6532C7d2803f8D5Ce4")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x752b2e77769a8832E657CB9f7318543e03c13627")
      );
    if (contractName == "WrapperFactory")
      return changetype<Address>(
        Address.fromHexString("0xb7469A575b7931532F09AEe2882835A0249064a0")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xC368ccE9aE3307E63145e70AddDC59EDE15Eb853")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x42d9ac3ebebb9479f24360847350b4F7EADECE50")
      );
    if (contractName == "OwnerRelayOnOptimism")
      return changetype<Address>(
        Address.fromHexString("0x7509FeAEE952F7dA93f746CF7134CFDE8f249C94")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x27346b8172e9C6559c71972a081bbC9113D86844")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x2F737bf6a32bf3AcBef4d5148DA507569204Fb61")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xFC6D35EB364951953FD86bb8A1a5b0ba8Cbb6Eb2")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xf01276e438D8043Dbc209fA65E1D8352EfFF85ef")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xD32c1443Dde2d248cE1bE42BacBb65Db0A4aAF10")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x6E6e2e9b7769CbA76aFC1e6CAd795CD3Ce0772a1")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x66C203BcF339460698c48a2B589eBD91de4984E7")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x1f99f5CbFC3b5Fd804dCc7F7780148F06423AC70")
      );
    if (contractName == "WrapperFactory")
      return changetype<Address>(
        Address.fromHexString("0xcc079BCb1dAe79C4494776f096BEff683Cd571CE")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xE73EB48B9E725E563775fF38cb67Ae09bF34c791")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x319D190584248280e3084A4692C6472A8dA5CA26")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xa412d4Bd786E6f25d2F6C711C9f4FDbf64C763AB")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x95C0fe15aBd9501A1B08e0Ede9A49e724F3871c2")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xCAA5c8e9E67BBa010D2D7F589F02d588Fb49f93D")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xCF4a31F3C7E245F8de884907aEFF1841C042cF41")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x15e7Aa4Cd2C74750b5DCaC9B8B21B9189552BBaD")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xc0a0770299202A0eAC59628e1514c250C76F78C7")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x2c91bBa7AeE2fBF210BDc42BA667ED0eB8Fa667C")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0xd98Ca2C4EFeFADC5Fe1e80ee4b872086E3Eac01C")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x404690642F2b22cc9cFEbFB604278F72B09C5890")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x85d338E30dedF6fC6B1813261561A762960f2944")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xe5671C038739F8D71b11A5F78888e520356BFCD5")
      );
    if (contractName == "SynthRedeemer")
      return changetype<Address>(
        Address.fromHexString("0x057Af46c8f48D9bc574d043e46DBF33fbaE023EA")
      );
    if (contractName == "CollateralUtil")
      return changetype<Address>(
        Address.fromHexString("0x5c9AD159E8fC9DC2dD081872dA56961e0B43d6AD")
      );
    if (contractName == "CollateralManagerState")
      return changetype<Address>(
        Address.fromHexString("0x295d99c1464f505eEE9DBFDBb1D1f0055d39212d")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0xD170549da4115c39EC42D6101eAAE5604F26150d")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xe7e074273A027Def0024A0900D40D643825b0c3D")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x10e77E4110e6E8730227F3b5b31eCb6aF44c62e1")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x498A2Cf6fdaf3c4be168e0Eda1017c8dCEA1C005")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x67D6478EcE5E467F2807fdF0Cfe860bE44ad690E")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xa7c787f74810B9146f6fB329CcF097966E142777")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xC6fcbF04DA77108fDc04a01DcFDF207F4470F7fa")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xD304dA888419bEAFc6C8E87835805e7BF388FAE8")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xA978CFAC09Db9013854f5E9C5778BCa2847d1990")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xeF19781279831107d29C36A3a2780E1fE38b2980")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xc2E43E7582155156323295aF01273bef771666c3")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xeD8879419bB20AeC4D619Ff3Fd842f987bf4496F")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0xf0d41d7679fb8c2f04CaF324075d0Ed724105F30")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xa57e8EaE3dd02d73951308068002A06fd0A2945D")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0xBC07D30743a9f9c840f02C739F0e6c651746cF6b")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x7282E5Bdd991B4F265c4bE6d217F14ee8cFB651a")
      );
    if (contractName == "SynthRedeemer")
      return changetype<Address>(
        Address.fromHexString("0xD6cf683e5e3D0fB48E0F06Ef44E14B77753eE9f2")
      );
    if (contractName == "CollateralUtil")
      return changetype<Address>(
        Address.fromHexString("0x7823DA94459d00154dAE6aA2740d5994E15e6470")
      );
    if (contractName == "CollateralManagerState")
      return changetype<Address>(
        Address.fromHexString("0x0B0DCfcB3Ee56379B03CcA9873af5B04684FEE85")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0xb36c99E9A86ff467BbF4312AE852874F7a6fe57D")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x3f1CCB8800FD8C51348478f898F552e816b10eb0")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x23ef16a1E0107358C6cf36fACCd95859DFe50347")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x22153604f8BF8348633cF54FeE2A91bC78760539")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x07E167caD6101C85732aC438Dd95691eE6DB6677")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0x4BfD237d0360F2484D2f2Cb2F334Fe8681d49D07")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0xe16405163A959677577A395896D058ECd534e729")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x8cAbC5744A35174A5F3834e4Bc176D2aaD1fB32A")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0xAE87BE0803d3Af9107c187F0353E67Fc88624784")
      );
    if (contractName == "SynthRedeemer")
      return changetype<Address>(
        Address.fromHexString("0xE708b7A1675C1644e5B3BF654894d6A895cccDD5")
      );
    if (contractName == "CollateralUtil")
      return changetype<Address>(
        Address.fromHexString("0x48C1B3A40416F75c738434F679C681104779aC0a")
      );
    if (contractName == "CollateralManagerState")
      return changetype<Address>(
        Address.fromHexString("0x79EefE01E4Aa8574cE78F553D4B44287A68e5978")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0x60dFd902737057A31c76B67dfAd3D370FDb8D6De")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0xBF3EDB3810EabfFD350C8A1adc739Ef66A8cF2C8")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x58d6dF6bA7920560d2Ea89549c24e1dE0B0688eF")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0x2A0fde259165Aafda287C63C504C74894A731444")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0xD3b981E24e121713240fF6f40A69C795464fe53F")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0x0d413953280BFfa8103e672b91AaD28768FF6315")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x736B4cECa1Ae698b880b49344Ce955eC67f6343e")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x98a3d02b03a4d7BEd69b77647e189a026721E9a6")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x9F725c12b7CeB106db565EA9ca3f639DB107B2F9")
      );
    if (contractName == "SynthsUNI")
      return changetype<Address>(
        Address.fromHexString("0x4d02d6540C789dF4464f4Bc6D8f0AA87a05a8F2b")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x2D77f2AFBa97C7b69d339294fb53dae8E6d99063")
      );
    if (contractName == "SynthRedeemer")
      return changetype<Address>(
        Address.fromHexString("0x1f52fc46f0dFE4AA10F202d675035F5e6CD327D6")
      );
    if (contractName == "CollateralUtil")
      return changetype<Address>(
        Address.fromHexString("0xA0404c89D75Fe5C98d38bAf28C0E1beb536DCc25")
      );
    if (contractName == "CollateralManagerState")
      return changetype<Address>(
        Address.fromHexString("0xC09CD84A42B6B3ef56C1615591207F9C8b0cE462")
      );
    if (contractName == "CollateralShort")
      return changetype<Address>(
        Address.fromHexString("0xa2e1aD41D7603d57Fd8055b892dAFfa49e35d9d1")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x177D78D74879Ff3B042FB0E3C3e6d32d10d9FCE1")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xEC929D0638Fe6DE68928487acCEfF73F70D8b7f1")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x331b338aa12E59b936E6273f7C754cae6fC715ce")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x712890eb501C2E7bB2f80D94326FF7ecF67ca7E4")
      );
    if (contractName == "EtherWrapper")
      return changetype<Address>(
        Address.fromHexString("0xc57207f9b20eC58600a674a3e9FE104B9c1caB61")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0xA6B255CB2Bd5Ad5f3EaE2D246ec1c2c3F7F79574")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0x35725C94f3B1aB6BbD533c0B6Df525537d422c5F")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0x3FAe35Cfea950Fada314589213BABC54A084d5Bf")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x0dde87714C3bdACB93bB1d38605aFff209a85998")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0x5C3f51CEd0C2F6157e2be67c029264D6C44bfe42")
      );
    if (contractName == "TokenStatesUNI")
      return changetype<Address>(
        Address.fromHexString("0xF6f4f3D2E06Af9BC431b8bC869A2B138a5175C26")
      );
    if (contractName == "ProxysUNI")
      return changetype<Address>(
        Address.fromHexString("0x3E88bFAbDCd2b336C4a430262809Cf4a0AC5cd57")
      );
    if (contractName == "SynthsUNI")
      return changetype<Address>(
        Address.fromHexString("0xa5D3600FF0fb98925f926f6E7C4DeEAb3ed8D004")
      );
    if (contractName == "TokenStatesAAVE")
      return changetype<Address>(
        Address.fromHexString("0x2Bf6Bed12D1733FD649676d482c3D6d2c1c3df33")
      );
    if (contractName == "ProxysAAVE")
      return changetype<Address>(
        Address.fromHexString("0x503e91fc2b9Ad7453700130d0825E661565E4c3b")
      );
    if (contractName == "SynthsAAVE")
      return changetype<Address>(
        Address.fromHexString("0x5D5D431159Ca065846DC38aeA5d146A541a8Ec27")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0x030B4af7E63993AA16150FB8b3A591E4473eAaE0")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xCA731366244C07221C07fC25d660b365A02bDcB7")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0x4AcC0Ba2948F8aB47a4fA734C57B0c3B5a8459f7")
      );
    if (contractName == "TokenStatesETH")
      return changetype<Address>(
        Address.fromHexString("0x8E6734A7653175b3FDa62516A646709F547C8342")
      );
    if (contractName == "ProxysETH")
      return changetype<Address>(
        Address.fromHexString("0x94B41091eB29b36003aC1C6f0E55a5225633c884")
      );
    if (contractName == "SynthsETH")
      return changetype<Address>(
        Address.fromHexString("0x41B7BE5A411e73Baf5B2C82dCD1C110b0c177335")
      );
    if (contractName == "TokenStatesBTC")
      return changetype<Address>(
        Address.fromHexString("0x0F73cf03DFD5595e862aa27E98914E70554eCf6d")
      );
    if (contractName == "ProxysBTC")
      return changetype<Address>(
        Address.fromHexString("0x23F608ACc41bd7BCC617a01a9202214EE305439a")
      );
    if (contractName == "SynthsBTC")
      return changetype<Address>(
        Address.fromHexString("0x082fbbaE20E472D1cEb9b51912d069C94A2b949b")
      );
    if (contractName == "TokenStatesLINK")
      return changetype<Address>(
        Address.fromHexString("0xbFD9DaF95246b6e21461f2D48aD1bE5984145FFE")
      );
    if (contractName == "ProxysLINK")
      return changetype<Address>(
        Address.fromHexString("0xe2B26511C64FE18Acc0BE8EA7c888cDFcacD846E")
      );
    if (contractName == "SynthsLINK")
      return changetype<Address>(
        Address.fromHexString("0x25D0b662813D959cD0D03533Df4Da051765743AC")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0x8c941ead543dcd6a617931FdEC173B8B0E9F4531")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0x381c19925E66e6117f990C74B8A3d56E5a184d2d")
      );
    if (contractName == "FeePoolState")
      return changetype<Address>(
        Address.fromHexString("0x2e542fA43A19F3F07230dD125f9f81411141362F")
      );
    if (contractName == "SafeDecimalMath")
      return changetype<Address>(
        Address.fromHexString("0x87A479D8433121E4583D45D37B4A349b4350B79F")
      );
    if (contractName == "Math")
      return changetype<Address>(
        Address.fromHexString("0xEA83b3192a8aB126BaCC2CFB0443F3A61ABe2D60")
      );
    if (contractName == "AddressResolver")
      return changetype<Address>(
        Address.fromHexString("0xb08b62e1cdfd37eCCd69A9ACe67322CCF801b3A6")
      );
    if (contractName == "ReadProxyAddressResolver")
      return changetype<Address>(
        Address.fromHexString("0x7a6f9eDDC03Db81927eA4131919343f93CA9b6a7")
      );
    if (contractName == "FlexibleStorage")
      return changetype<Address>(
        Address.fromHexString("0x2f4959375ae4a6C368859FB51AF0513745db265F")
      );
    if (contractName == "SystemSettings")
      return changetype<Address>(
        Address.fromHexString("0x756725D2c10D629b031Cb33AfEaB059Bc7f2B196")
      );
    if (contractName == "SystemStatus")
      return changetype<Address>(
        Address.fromHexString("0xf5305Eaaa72E73289593d90f2Cf5379B87e91932")
      );
    if (contractName == "ExchangeRates")
      return changetype<Address>(
        Address.fromHexString("0x686cbD15BBC680F8261c7502c360Aa44A2593de6")
      );
    if (contractName == "RewardEscrow")
      return changetype<Address>(
        Address.fromHexString("0x9952e42fF92149f48b3b7dee3f921A6DD106F79F")
      );
    if (contractName == "RewardEscrowV2")
      return changetype<Address>(
        Address.fromHexString("0xB613d148E47525478bD8A91eF7Cf2F7F63d81858")
      );
    if (contractName == "SynthetixEscrow")
      return changetype<Address>(
        Address.fromHexString("0xf545e539788AfEAA665B7d79568E306e37Ef05cC")
      );
    if (contractName == "SynthetixState")
      return changetype<Address>(
        Address.fromHexString("0x4d296Ec060d12B216a3D9dCe6A27a345026C4866")
      );
    if (contractName == "ProxyFeePool")
      return changetype<Address>(
        Address.fromHexString("0xd8c8887A629F98C56686Be6aEEDAae7f8f75D599")
      );
    if (contractName == "DelegateApprovalsEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0xF43B4931749139AB1e7a85d50df5762481d80bEC")
      );
    if (contractName == "DelegateApprovals")
      return changetype<Address>(
        Address.fromHexString("0xC9B552d3d395ae89646275C1591c40FA9EB950f6")
      );
    if (contractName == "Liquidations")
      return changetype<Address>(
        Address.fromHexString("0x20540E5EB1faff0DB6B1Dc5f0427C27f3852e2Ab")
      );
    if (contractName == "EternalStorageLiquidations")
      return changetype<Address>(
        Address.fromHexString("0x38a322dB8dBa2b78B622e5224611de33b8cf6480")
      );
    if (contractName == "FeePoolEternalStorage")
      return changetype<Address>(
        Address.fromHexString("0x0A1d3bde7751e92971891FB034AcDE4C271de408")
      );
    if (contractName == "FeePool")
      return changetype<Address>(
        Address.fromHexString("0xA50C668536616cde7d43D889F6Df29dD912Dc116")
      );
    if (contractName == "FeePoolState")
      return changetype<Address>(
        Address.fromHexString("0xA05738F1fe67e3DCcE51a6F0a7195FE31037a72E")
      );
    if (contractName == "RewardsDistribution")
      return changetype<Address>(
        Address.fromHexString("0x9147Cb9e5ef262bd0b1d362134C40948dC00C3EB")
      );
    if (contractName == "ProxyERC20")
      return changetype<Address>(
        Address.fromHexString("0x0064A673267696049938AA47595dD0B3C2e705A1")
      );
    if (contractName == "TokenStateSynthetix")
      return changetype<Address>(
        Address.fromHexString("0x22C9624c784214D53d43BDB4Bf56B3D3Bf2e773C")
      );
    if (contractName == "Synthetix")
      return changetype<Address>(
        Address.fromHexString("0xb671F2210B1F6621A2607EA63E6B2DC3e2464d1F")
      );
    if (contractName == "ProxySynthetix")
      return changetype<Address>(
        Address.fromHexString("0x11164F6a47C3f8472D19b9aDd516Fc780cb7Ee02")
      );
    if (contractName == "DebtCache")
      return changetype<Address>(
        Address.fromHexString("0xcCA368156B7DDe99ea7852BEcE3D8F1cC2989161")
      );
    if (contractName == "Exchanger")
      return changetype<Address>(
        Address.fromHexString("0xA3de830b5208851539De8e4FF158D635E8f36FCb")
      );
    if (contractName == "ExchangeState")
      return changetype<Address>(
        Address.fromHexString("0xEf8a2c1BC94e630463293F71bF5414d13e80F62D")
      );
    if (contractName == "Issuer")
      return changetype<Address>(
        Address.fromHexString("0xc9982C611C3bE471296144D215E518F2692D6982")
      );
    if (contractName == "TradingRewards")
      return changetype<Address>(
        Address.fromHexString("0xEC4075Ff2452907FCf86c8b7EA5B0B378e187373")
      );
    if (contractName == "EscrowChecker")
      return changetype<Address>(
        Address.fromHexString("0x23bB1e0975161077F16Dd34F28780720aC356C56")
      );
    if (contractName == "TokenStatesUSD")
      return changetype<Address>(
        Address.fromHexString("0x77e4837cc55a3CB32A33988Fb670c5bcF13bBD3f")
      );
    if (contractName == "ProxysUSD")
      return changetype<Address>(
        Address.fromHexString("0xFf6a235133dc1233B20c5AB4C86885eBe90a69ee")
      );
    if (contractName == "ProxyERC20sUSD")
      return changetype<Address>(
        Address.fromHexString("0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57")
      );
    if (contractName == "SynthsUSD")
      return changetype<Address>(
        Address.fromHexString("0x4305B0485aD00548a17473ada5b3bA8be98d283F")
      );
    if (contractName == "EtherCollateral")
      return changetype<Address>(
        Address.fromHexString("0x1F93B9a8d1F3582697F17471207D707f7C519E38")
      );
    if (contractName == "EtherCollateralsUSD")
      return changetype<Address>(
        Address.fromHexString("0x4c22BC6FC957efb8D6737982e522950e77F0F47f")
      );
    if (contractName == "SynthetixBridgeToBase")
      return changetype<Address>(
        Address.fromHexString("0xC2E4aB21D4d68B82bA71C2Fb449EC8aACc86133A")
      );
    if (contractName == "CollateralManager")
      return changetype<Address>(
        Address.fromHexString("0x212dD0505eDECA3947b07b86e0b0d44ba8eE81c4")
      );
    if (contractName == "SynthUtil")
      return changetype<Address>(
        Address.fromHexString("0x5DF689ea1FB350bcB177Ff5e66ED8Dfe28C6045D")
      );
    if (contractName == "DappMaintenance")
      return changetype<Address>(
        Address.fromHexString("0xCDe046E1c635d2D9F69E2081d46732d249c8465F")
      );
  }

  return null;
}
