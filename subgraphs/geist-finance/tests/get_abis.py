import requests
import json
import time
import os

# Deployment addresses
deployment_addresses = {
    "LendingPoolAddressesProviderRegistry": "0x4CF8E50A5ac16731FA2D8D9591E195A285eCaA82",
    "LendingPoolAddressesProvider": "0x6c793c628Fe2b480c5e6FB7957dDa4b9291F9c9b",
    "LendingPool": "0x9FAD24f572045c7869117160A571B2e50b10d068",
    "LendingPoolConfigurator": "0xb7C10e5089d3fd281F51998543510675A52B6aa8",
    "GeistToken": "0xd8321AA83Fb0a4ECd6348D4577431310A6E0814d",
    "AaveOracle": "0xC466e3FeE82C6bdc2E17f2eaF2c6F1E91AD10FD3",
    "LendingRateOracle": "0xFCef135eB981CDD798a2C0Cfd4149ef534fD6eea",
    "AaveProtocolDataProvider": "0xf3B0611e2E4D2cd6aB4bb3e01aDe211c3f42A8C3",
    "WETHGateway": "0x47102245FEa0F8D35a6b28E54505e9FfD83d0704",
    "MultiFeeDistribution": "0x49c93a95dbcc9A6A4D8f77E59c038ce5020e82f8",
    "TimeLock": "0x7FB9a7cBc6689C1C79e37BF8f852adA44b10EfFC",
    "SpookySwapGEISTFTM": "0x668AE94D0870230AC007a01B471D02b2c94DDcB9",
    "LendingPoolConfiguratorProxy": "0x7a0d50E55ffcBF3E2313BB4460E86dBBF8e8c25B",
    "GToken": "0xA2D7357c069b0cBC0F2B75487fa4045208b6F919",
    "AaveIncentivesController": "0x297FddC5c33Ef988dd03bd13e162aE084ea1fE57"
}

if __name__ == "__main__":
    """
        Helper script to pull all relevant ABIs from FTMScan
    """
    for name, address in deployment_addresses.items():
        # Query ABIs from ftmscan.com
        url = f"https://api.ftmscan.com/api?module=contract&action=getabi&address={address}&format=raw"
        data = requests.get(url=url).json()

        print(f"Fetching {name}...")

        current_dirname = os.path.dirname(__file__)

        # Write ABIs to file, make it look pretty too
        filepath = os.path.join(current_dirname, "..", "abis", f"{name}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Saved {name} to '../abis/{name}.json'")

        # Delay to prevent getting rate limited
        time.sleep(5)
