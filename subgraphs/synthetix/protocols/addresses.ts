import { Address } from "@graphprotocol/graph-ts";

export function getContractDeployment(
  contractName: string,
  network: string
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

  return null;
}
