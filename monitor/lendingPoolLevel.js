import axios from "axios";

export const lendingPoolLevel = async (deployments) => {
    const endpointsList = [];
    Object.keys(deployments).forEach((depo) => {
        if (
            !deployments[depo].indexingError &&
            deployments[depo].protocolType.toUpperCase() === "LENDING"
        ) {
            endpointsList.push(deployments[depo].url);
        }
    });

    const baseQuery = `
    query MyQuery {
      markets(first: 10) {
        id
        name
        totalValueLockedUSD
        cumulativeSupplySideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        cumulativeTotalRevenueUSD
        cumulativeDepositUSD
        cumulativeBorrowUSD
        cumulativeLiquidateUSD
        totalBorrowBalanceUSD
        totalDepositBalanceUSD
        outputTokenSupply
        outputTokenPriceUSD
      }
    }`;

    const promiseArr = [];

    endpointsList.forEach((endpoint) => {
        promiseArr.push(
            axios.post(
                endpoint,
                { query: baseQuery },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
        );
    });

    let marketLevelData = [];
    await Promise.all(promiseArr)
        .then(
            (response) =>
            (marketLevelData = response.map((marketData) => {
                return {
                    markets: marketData?.data?.data?.markets || [],
                    url: marketData.config.url,
                    deployment: marketData.config.url.split("messari/")[1],
                };
            }))
        )
        .catch((err) => console.log(err));

    marketLevelData.forEach((protocol) => {
        if (!protocol?.markets) return;
        const data = protocol.markets;
        if (!data?.length) return;
        const url = protocol.url;
        // const dataFields = Object.keys(data)

        const idx = Math.floor(Math.random() * data.length);

        const instance = data[idx];
        const deploymentName = Object.keys(deployments).find(
            (depoName) => deployments[depoName].url === protocol.url
        );
        const deployment = { ...deployments[deploymentName] };

        const issuesArrays = { ...deployment.poolErrors };

        const buildIssue = (value) => protocol.deployment + "-" + instance.id + "-" + instance.name + "//" + value;

        if (
            !(
                parseFloat(instance.totalValueLockedUSD) > 1000 &&
                parseFloat(instance.totalValueLockedUSD) < 100000000000
            )
        ) {
            issuesArrays.totalValueLockedUSD.push(buildIssue(parseFloat(instance.totalValueLockedUSD).toFixed(2)));
        }

        if (
            !(
                parseFloat(instance.cumulativeSupplySideRevenueUSD) >= 100 &&
                parseFloat(instance.cumulativeSupplySideRevenueUSD) <= 10000000000
            )
        ) {
            issuesArrays.cumulativeSupplySideRevenueUSD.push(buildIssue(parseFloat(instance.cumulativeSupplySideRevenueUSD).toFixed(2)));
        }

        if (
            !(
                parseFloat(instance.cumulativeProtocolSideRevenueUSD) >= 100 &&
                parseFloat(instance.cumulativeProtocolSideRevenueUSD) <= 10000000000
            )
        ) {
            issuesArrays.cumulativeProtocolSideRevenueUSD.push(buildIssue(parseFloat(instance.cumulativeProtocolSideRevenueUSD).toFixed(2)));
        }

        if (
            (
                parseFloat(instance.cumulativeProtocolSideRevenueUSD) +
                parseFloat(instance.cumulativeSupplySideRevenueUSD)
            ).toFixed(2) !== parseFloat(instance.cumulativeTotalRevenueUSD).toFixed(2)
        ) {
            const value = ((parseFloat(instance.cumulativeProtocolSideRevenueUSD) +
                parseFloat(instance.cumulativeSupplySideRevenueUSD)) +
                "||" +
                parseFloat(data.cumulativeTotalRevenueUSD).toFixed(2) +
                "=" +
                parseFloat(data.cumulativeProtocolSideRevenueUSD).toFixed(2) +
                "+" +
                parseFloat(data.cumulativeProtocolSideRevenueUSD).toFixed(2))
            issuesArrays.cumulativeTotalRevenueUSD.push(buildIssue(value));
        }

        if (!(parseFloat(instance.cumulativeDepositUSD) > 100)) {
            issuesArrays.cumulativeDepositUSD.push(buildIssue(parseFloat(instance.cumulativeDepositUSD)));
        }

        if (
            !(
                parseFloat(instance.cumulativeDepositUSD) >=
                parseFloat(instance.cumulativeBorrowUSD)
            )
        ) {
            issuesArrays.cumulativeBorrowUSD.push(buildIssue(instance.cumulativeBorrowUSD + " > " + instance.cumulativeDepositUSD));
        }

        if (
            !(
                parseFloat(instance.cumulativeLiquidateUSD) <=
                parseFloat(instance.cumulativeBorrowUSD)
            )
        ) {
            issuesArrays.cumulativeLiquidateUSD.push(buildIssue(parseFloat(instance.cumulativeLiquidateUSD) + " > " + parseFloat(instance.cumulativeBorrowUSD)));
        }

        if (
            !(
                parseFloat(instance.totalBorrowBalanceUSD) <=
                parseFloat(instance.cumulativeBorrowUSD)
            )
        ) {
            issuesArrays.totalBorrowBalanceUSD.push(buildIssue(instance.totalBorrowBalanceUSD + " < " + instance.cumulativeBorrowUSD));
        }

        if (
            !(
                parseFloat(instance.totalDepositBalanceUSD) >=
                parseFloat(instance.totalBorrowBalanceUSD)
            )
        ) {
            issuesArrays.totalDepositBalanceUSD.push(buildIssue(instance.totalDepositBalanceUSD + " < " + instance.totalBorrowBalanceUSD));
        }

        if (!(parseFloat(instance.outputTokenSupply) >= 0)) {
            issuesArrays.outputTokenSupply.push(buildIssue(instance.outputTokenSupply));
        }

        if (
            !(
                parseFloat(instance.outputTokenPriceUSD) >= 0 &&
                parseFloat(instance.outputTokenPriceUSD) <= 100000
            )
        ) {
            issuesArrays.outputTokenPriceUSD.push(buildIssue(instance.outputTokenPriceUSD));
        }

        deployments[deploymentName].poolErrors = issuesArrays;
    });

    const depoHolder = {};
    Object.keys(deployments).forEach((x) => {
        depoHolder[x] = { ...deployments[x] };
        const key = depoHolder[x].poolErrors;
        Object.keys(key).forEach((y) => {
            if (key[y].length !== 0) {
                depoHolder[x].poolErrors[y] = key[y];
            }
        });
    });
    return depoHolder;
}
