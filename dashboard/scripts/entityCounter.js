import https from "https";
const url = "https://subgraphs.messari.io/deployments.json";

https.get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => {
        data += chunk;
    });
    res.on("end", () => {
        data = JSON.parse(data);
        let deployments = [];

        Object.values(data).forEach((protocolsOnType) => {
            Object.values(protocolsOnType).forEach((protocolObj) => {
                deployments = [
                    ...deployments,
                    ...Object.values(protocolObj).map((deploymentString) => deploymentString.split("name/")[1].split("/")[1])
                ];
            });
        });

        const fullCurrentQueryArray = ["query Status {"];
        const queryContents = `entityCount`;
        deployments.forEach((name) => {
            fullCurrentQueryArray[fullCurrentQueryArray.length - 1] += `${name
                .split("-")
                .join("_")}: indexingStatusForCurrentVersion(subgraphName: "messari/${name}") {${queryContents}}`;
            if (fullCurrentQueryArray[fullCurrentQueryArray.length - 1].length > 80000) {
                fullCurrentQueryArray[fullCurrentQueryArray.length - 1] += "}";
                fullCurrentQueryArray.push(" query Status {");
            }
        });
        fullCurrentQueryArray[fullCurrentQueryArray.length - 1] += "}";
        const indexingStatusQueries = [...fullCurrentQueryArray];

        const statusQueryPromiseArr = indexingStatusQueries.map((query) => {
            const options = {
                hostname: "api.thegraph.com",
                path: "/index-node/graphql",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            };
            const dataQuery = JSON.stringify({
                query,
            });
            return getData(dataQuery, options);
        });

        let entityCount = 0;

        Promise.all(statusQueryPromiseArr).then((val) => {
            val.forEach((dep) => {
                Object.values(dep).forEach((obj) => {
                    if (obj?.entityCount) {
                        entityCount += parseInt(obj?.entityCount);
                    }
                });
            });
            console.log("TOTAL ENTITY COUNT:", entityCount.toLocaleString());
        });
    });
}).on("error", (err) => {
    console.log(err.message);
}).end();

async function getData(dataQuery, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (d) => {
                data += d;
            });
            res.on("end", () => {
                try {
                    const parsedData = { ...JSON.parse(data).data };
                    resolve(parsedData);
                } catch (e) {
                    reject(e.message);
                }
            });
        });
        req.write(dataQuery);
        req.end();
    });
}
