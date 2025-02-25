import { TableCell, TableRow, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { NetworkLogo } from "../common/NetworkLogo";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { latestSchemaVersions } from "../constants";
import { convertTokenDecimals, formatIntToFixed2, toPercent } from "../utils";

interface ProtocolSection {
  protocol: { [x: string]: any };
  issuesMapping: any;
  schemaType: string;
  subgraphName: string;
  decenDeposToSubgraphIds: { [x: string]: any };
  tableExpanded: boolean;
  validationSupported: boolean;
}

// Utility function to format large numbers with K, M, B notation
export const formatLargeNumber = (num: number | string | undefined): { formattedValue: string, fullValue: string } => {
  if (num === undefined || num === null) {
    return { formattedValue: "N/A", fullValue: "N/A" };
  }
  
  // Convert string to number if needed
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  // Format the full value with commas for tooltip
  const fullValue = typeof numValue === 'number' ? numValue.toLocaleString() : String(num);
  
  // Early return for small numbers or non-numbers
  if (typeof numValue !== 'number' || isNaN(numValue)) {
    return { formattedValue: String(num), fullValue };
  }
  
  // Format with abbreviations based on magnitude
  if (numValue >= 1_000_000_000) {
    return { 
      formattedValue: (numValue / 1_000_000_000).toFixed(1) + 'B', 
      fullValue 
    };
  } else if (numValue >= 1_000_000) {
    return { 
      formattedValue: (numValue / 1_000_000).toFixed(1) + 'M', 
      fullValue 
    };
  } else if (numValue >= 1_000) {
    return { 
      formattedValue: (numValue / 1_000).toFixed(1) + 'K', 
      fullValue 
    };
  }
  
  return { formattedValue: fullValue, fullValue };
};

// Component to display a number with formatting and tooltip
export const FormattedNumber = ({ value }: { value: number | string | undefined }) => {
  const { formattedValue, fullValue } = formatLargeNumber(value);
  
  return (
    <Tooltip title={fullValue} placement="top">
      <span>{formattedValue}</span>
    </Tooltip>
  );
};

// Utility function to safely display health metrics with fallback values
const safeDisplayMetric = (value: any, defaultValue: string = "N/A"): string => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  
  return String(value);
};

// Helper function to safely access depoObject properties
const getSafeMetric = (depoObject: any, property: string, defaultValue: string = "N/A"): string => {
  if (!depoObject || depoObject[property] === undefined || depoObject[property] === null) {
    return defaultValue;
  }
  
  if (typeof depoObject[property] === 'number') {
    return depoObject[property].toLocaleString();
  }
  
  return String(depoObject[property]);
};

function ProtocolSection({
  protocol,
  issuesMapping,
  schemaType,
  subgraphName,
  decenDeposToSubgraphIds,
  tableExpanded,
  validationSupported,
}: ProtocolSection) {
  // NOTE: We now ONLY show decentralized network deployments as the hosted service is being deprecated
  
  const navigate = useNavigate();

  const [showDeposDropDown, toggleShowDeposDropDown] = useState<boolean>(false);
  useEffect(() => {
    toggleShowDeposDropDown(tableExpanded);
  }, [tableExpanded]);

  const issuesTitles = Object.keys(issuesMapping);
  const subNameUpper = subgraphName.toUpperCase();

  // Filter to only show networks with decentralizedNetworkId
  const decentralizedNetworks = protocol.networks.filter((depo: any) => 
    !!depo?.decentralizedNetworkId
  );
  
  // If no networks have decentralizedNetworkId, don't render this protocol
  if (decentralizedNetworks.length === 0) {
    return null;
  }
  
  let hasDecentralizedDepo = decentralizedNetworks.length > 0;
  let prodStatusIcon = "https://images.emojiterra.com/twitter/v13.1/512px/2705.png";
  let prodStatusHover = "Subgraph is frozen";
  
  decentralizedNetworks.forEach((depo: any) => {
    if (Array.isArray(issuesTitles)) {
      const openRepoIssue = issuesTitles.find((x: any) => {
        if (issuesMapping[x].includes("/pull/")) {
          return false;
        }
        const title = x.toUpperCase();
        const depoSpecificIssue = title.includes(subNameUpper) && title.includes(depo.chain.toUpperCase());
        const protocolWideIssue = title.includes(subNameUpper + " ALL");
        return depoSpecificIssue || protocolWideIssue;
      });
      if (!!openRepoIssue) {
        prodStatusIcon =
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoseJ8t1vi2kPFznJJSyeIHGYxgvCvbCMgs6a9TMI&s";
        prodStatusHover = "Deployed but with Changes in Progress";
      }
    }
  });

  if (showDeposDropDown) {
    // Initialize schemaCell before using it
    let schemaCell = <span>N/A</span>;
    try {
      if (protocol?.schemaVersions?.length > 0) {
        let schemaColored = {};
        const schemaVersOnProtocol = protocol?.schemaVersions?.map((x: string) => {
          if (!(latestSchemaVersions(schemaType, x) || schemaType === "governance")) {
            schemaColored = { color: "#FFA500" };
          }
          return x;
        });
        
        schemaCell = (
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            justifyContent: "flex-end",
            maxWidth: "180px",
            gap: "4px"
          }}>
            {schemaVersOnProtocol.map((version: string, index: number) => (
              <span key={index} style={{ 
                backgroundColor: "#2D3142", 
                padding: "2px 4px", 
                borderRadius: "4px",
                fontSize: "12px",
                whiteSpace: "nowrap",
                ...(!(latestSchemaVersions(schemaType, version) || schemaType === "governance") ? { color: "#FFA500" } : {})
              }}>
                {version}
              </span>
            ))}
          </div>
        );
      }
    } catch (err: any) {
      console.error(err.message);
    }
    
    const depoRowsOnProtocol = decentralizedNetworks.map((depo: any) => {
      let chainLabel = depo.chain;
      if (decentralizedNetworks.filter((x: any) => x.chain === depo.chain).length > 1) {
        chainLabel = depo.deploymentName;
      }
      let depoLevelStatusIcon = "https://images.emojiterra.com/twitter/v13.1/512px/2705.png";
      let depoLevelStatusHover = "Subgraph is frozen";
      let depoLevelStatusLink = "";

      let decenRow = null;
      try {
        if (depo.decentralizedIndexStatus) {
          let highlightColor = "#3f51b5";
          const depoObject = depo.decentralizedIndexStatus;
          let synced = depoObject ? depoObject["synced"] : false;
          let indexedPercentage = depoObject && typeof depoObject["indexed-percentage"] === "number"
            ? formatIntToFixed2(depoObject["indexed-percentage"])
            : "0.00";

          if (synced && Number(indexedPercentage) > 99) {
            highlightColor = "#58BC82";
            indexedPercentage = formatIntToFixed2(100);
          }

          const decenSubgraphKey = Object.keys(decenDeposToSubgraphIds)?.find(
            (x) => x.includes(subgraphName + "-" + depo?.chain) || x.includes(depo?.decentralizedNetworkId),
          );
          let decenSubgraphId;
          if (decenSubgraphKey) {
            decenSubgraphId = decenDeposToSubgraphIds[decenSubgraphKey]?.id;
          }
          
          // Get the deployment ID from the decentralized network service
          // This retrieves the actual deployment ID from the API response
          const deploymentId = depo.decentralizedIndexStatus && 
            depo.decentralizedIndexStatus["deployment-id"] ? 
            depo.decentralizedIndexStatus["deployment-id"] : 
            depo.decentralizedNetworkId || "";
          
          // Use the deployment ID directly as the endpoint URL
          let endpointURL = deploymentId;
          
          // Keep a reference to the old URL construction for logging/debugging purposes
          /*
          let oldEndpointURL =
            process.env.REACT_APP_GRAPH_DECEN_URL! +
            "/api/" +
            process.env.REACT_APP_GRAPH_API_KEY +
            "/subgraphs/id/" +
            decenSubgraphId;
          */

          let decenDeposBySubgraphId = decenDeposToSubgraphIds[depo?.decentralizedNetworkId];

          let curationElement = null;
          if (!decenDeposBySubgraphId?.id) {
            // Warning indicator removed as requested
          } else if (decenDeposBySubgraphId?.signal > 0) {
            let convertedSignalAmount = convertTokenDecimals(decenDeposBySubgraphId?.signal, 21).toFixed(1);
            curationElement = (
              <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                <Tooltip title="Current Curation Signal" placement="top">
                  <span style={{ padding: "0", cursor: "default", fontWeight: "800" }}>
                    {convertedSignalAmount}K GRT
                  </span>
                </Tooltip>
              </span>
            );
          }
          let decenDepoStatusIcon = "https://images.emojiterra.com/twitter/v13.1/512px/2705.png";
          let decenStatusLink = depoLevelStatusLink;
          const openDecenIssue = issuesTitles.find((x: any) => {
            if (issuesMapping[x].includes("/pull/")) {
              return false;
            }
            const title = x.toUpperCase();
            const titleIsDecen = title.includes("DECEN");
            let depoSpecificIssue = false;
            const protocolWideIssue = title.includes(subNameUpper + " ALL");
            depoSpecificIssue =
              title.includes(subNameUpper) && title.includes(depo.chain.toUpperCase()) && titleIsDecen;
            return protocolWideIssue || depoSpecificIssue;
          });
          if (!!openDecenIssue) {
            decenDepoStatusIcon =
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoseJ8t1vi2kPFznJJSyeIHGYxgvCvbCMgs6a9TMI&s";
            decenStatusLink = issuesMapping[openDecenIssue] || "";
          }
          decenRow = (
            <TableRow
              onClick={(event) => {
                if (event.ctrlKey) {
                  if (!validationSupported) {
                    window.open(
                      process.env.REACT_APP_GRAPH_EXPLORER_URL! + "/subgraphs/" + depo.decentralizedNetworkId,
                      "_blank"
                    );
                    return;
                  }
                  if (depoObject["is-healthy"]) {
                    window.open(`${window.location.href}subgraph?endpoint=${endpointURL}&tab=protocol`, "_blank");
                  } else {
                    window.open(
                      process.env.REACT_APP_OKGRAPH_BASE_URL! + "/?q=" + depo.decentralizedNetworkId,
                      "_blank",
                    );
                  }
                } else {
                  if (!validationSupported) {
                    window.location.href = process.env.REACT_APP_GRAPH_EXPLORER_URL! + "/subgraphs/" + depo.decentralizedNetworkId;
                    return;
                  }
                  if (depoObject["is-healthy"]) {
                    navigate(`/subgraph?endpoint=${endpointURL}&tab=protocol`);
                  } else {
                    window.location.href =
                      process.env.REACT_APP_OKGRAPH_BASE_URL! + "/?q=" + depo.decentralizedNetworkId;
                  }
                }
                return;
              }}
              key={subgraphName + depo.decentralizedNetworkId + "DepInDevRow-DECEN"}
              sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}
            >
              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0",
                  paddingLeft: "6px",
                  verticalAlign: "middle",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <SubgraphLogo name={subgraphName} size={30} />
                <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                  {chainLabel}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "10px" }}>
                  <Tooltip title="This deployment is hosted on the decentralized network" placement="top">
                    <span
                      style={{
                        padding: "4px 6px 2px 7px",
                        borderRadius: "50%",
                        backgroundColor: "rgb(102,86,248)",
                        cursor: "default",
                        fontWeight: "800",
                      }}
                    >
                      D
                    </span>
                  </Tooltip>
                </span>
                {curationElement}
              </TableCell>
              <TableCell
                sx={{ backgroundColor: "rgb(55, 55, 55)", padding: "0", paddingRight: "16px", textAlign: "right" }}
              ></TableCell>
              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0 16px 0 30px",
                  textAlign: "right",
                  display: "flex",
                }}
              >
                <NetworkLogo
                  tooltip={depo.chain}
                  key={subgraphName + depo.chain + "Logo-DECEN"}
                  size={30}
                  network={depo.chain}
                />
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0",
                  paddingRight: "16px",
                  textAlign: "right",
                }}
              >
                {depo?.status === "prod" ? (
                  <Tooltip title={depoLevelStatusHover}>
                    <img
                      className="round-image"
                      onClick={(e) => {
                        if (decenStatusLink?.length > 0) {
                          e.stopPropagation();
                          window.location.href = decenStatusLink;
                        }
                      }}
                      src={decenDepoStatusIcon}
                      height="24px"
                      width="24px"
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="In Development">
                    <img
                      src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png"
                      height="24px"
                      width="24px"
                    />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0",
                  paddingRight: "16px",
                  textAlign: "right",
                }}
              >
                {depo.decentralizedIndexStatus && typeof depo.decentralizedIndexStatus["indexed-percentage"] === "number" 
                  ? formatIntToFixed2(depo.decentralizedIndexStatus["indexed-percentage"]) + "%" 
                  : "N/A"}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0",
                  paddingRight: "16px",
                  textAlign: "right",
                }}
              >
                {depo.decentralizedIndexStatus ? 
                  <FormattedNumber value={depo.decentralizedIndexStatus["start-block"]} /> : "N/A"}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0",
                  paddingRight: "16px",
                  textAlign: "right",
                }}
              >
                {depo.decentralizedIndexStatus ? 
                  <FormattedNumber value={depo.decentralizedIndexStatus["latest-block"]} /> : "N/A"}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0",
                  paddingRight: "16px",
                  textAlign: "right",
                }}
              >
                {depo.decentralizedIndexStatus ? 
                  <FormattedNumber value={depo.decentralizedIndexStatus["chain-head-block"]} /> : "N/A"}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0",
                  paddingRight: "16px",
                  textAlign: "right",
                }}
              >
                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                  {schemaCell}
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0",
                  paddingRight: "16px",
                  textAlign: "right",
                }}
              >
                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                  {depo?.versions?.subgraph ? (
                    <span style={{ 
                      backgroundColor: "#2D3142", 
                      padding: "2px 4px", 
                      borderRadius: "4px",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      display: "inline-block"
                    }}>
                      {depo?.versions?.subgraph}
                    </span>
                  ) : "N/A"}
                </Typography>
              </TableCell>

              <TableCell
                sx={{
                  backgroundColor: "rgb(55, 55, 55)",
                  color: "white",
                  padding: "0",
                  paddingRight: "16px",
                  textAlign: "right",
                }}
              >
                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                  {depo.decentralizedIndexStatus ? 
                    <FormattedNumber value={depo.decentralizedIndexStatus["entity-count"]} /> : "N/A"}
                </Typography>
              </TableCell>
            </TableRow>
          );
        }
      } catch (err: any) {
        decenRow = null;
      }

      return decenRow;
    });

    return (
      <>
        <TableRow
          onClick={() => {
            toggleShowDeposDropDown(!showDeposDropDown);
          }}
          key={subgraphName + "DepInDevRow"}
          sx={{ 
            cursor: "pointer", 
            height: "10px", 
            width: "100%", 
            backgroundColor: "rgba(22,24,29,0.9)"
          }}
        >
          <TableCell sx={{ padding: "0 0 0 6px", verticalAlign: "middle", display: "flex", alignItems: "center", height: "35px" }}>
            <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
              <SubgraphLogo name={subgraphName} size={30} />
            </Tooltip>
            <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
              <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                {subgraphName}
              </span>
            </Tooltip>
          </TableCell>
          <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
            <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
              <img
                height="24px"
                width="24px"
                src="https://cdn2.iconfinder.com/data/icons/50-material-design-round-corner-style/44/Dropdown_2-512.png"
              />
            </Tooltip>
          </TableCell>
          <TableCell sx={{ padding: "0 6px 1px 0", textAlign: "right", display: "flex", alignItems: "center" }}>
            {decentralizedNetworks.map((x: { [x: string]: any }) => {
              let borderColor = "#EFCB68";
              let indexedPercentage = formatIntToFixed2(0);

              const depoObject = x.decentralizedIndexStatus;
              if (depoObject) {
                let synced = depoObject["synced"];
                indexedPercentage = typeof depoObject["indexed-percentage"] === "number"
                  ? formatIntToFixed2(depoObject["indexed-percentage"])
                  : "0.00";
                
                if (!depoObject["is-healthy"]) {
                  borderColor = "#B8301C";
                } else {
                  if (synced && Number(indexedPercentage) > 99) {
                    borderColor = "#58BC82";
                    indexedPercentage = formatIntToFixed2(100);
                  }
                }
              }

              return (
                <a
                  key={subgraphName + x.decentralizedNetworkId + "Logo"}
                  style={{ 
                    height: "100%", 
                    border: borderColor + " 4px solid", 
                    borderRadius: "50%"
                  }}
                  href={process.env.REACT_APP_GRAPH_EXPLORER_URL! + "/subgraphs/" + x.decentralizedNetworkId}
                >
                  <NetworkLogo tooltip={`${x.chain} (${indexedPercentage}%)`} size={28} network={x.chain} />
                </a>
              );
            })}
          </TableCell>
          <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
            {protocol?.status ? (
              <Tooltip title={prodStatusHover}>
                <img className="round-image" src={prodStatusIcon} height="24px" width="24px" />
              </Tooltip>
            ) : (
              <Tooltip title="In Development">
                <img
                  src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png"
                  height="24px"
                  width="24px"
                />
              </Tooltip>
            )}
          </TableCell>
          <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
          <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
          <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
          <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
          <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
            <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
              <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                {schemaCell}
              </Typography>
            </Tooltip>
          </TableCell>
          <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
            <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
              <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                {protocol?.subgraphVersions?.length > 0 ? (
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    justifyContent: "flex-end",
                    maxWidth: "180px",
                    gap: "4px"
                  }}>
                    {protocol?.subgraphVersions.map((version: string, index: number) => (
                      <span key={index} style={{ 
                        backgroundColor: "#2D3142", 
                        padding: "2px 4px", 
                        borderRadius: "4px",
                        fontSize: "12px",
                        whiteSpace: "nowrap"
                      }}>
                        {version}
                      </span>
                    ))}
                  </div>
                ) : "N/A"}
              </Typography>
            </Tooltip>
          </TableCell>

          <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
        </TableRow>
        {depoRowsOnProtocol}
      </>
    );
  }

  let schemaCell = <span>N/A</span>;
  let decenDepoElement = null;

  try {
    if (protocol?.schemaVersions?.length > 0) {
      let schemaColored = {};
      const schemaVersOnProtocol = protocol?.schemaVersions?.map((x: string) => {
        if (!(latestSchemaVersions(schemaType, x) || schemaType === "governance")) {
          schemaColored = { color: "#FFA500" };
        }
        return x;
      });
      
      schemaCell = (
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          justifyContent: "flex-end",
          maxWidth: "180px",
          gap: "4px"
        }}>
          {schemaVersOnProtocol.map((version: string, index: number) => (
            <span key={index} style={{ 
              backgroundColor: "#2D3142", 
              padding: "2px 4px", 
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap",
              ...(!(latestSchemaVersions(schemaType, version) || schemaType === "governance") ? { color: "#FFA500" } : {})
            }}>
              {version}
            </span>
          ))}
        </div>
      );
    }

    if (hasDecentralizedDepo) {
      // Removing decenDepoElement to remove "D" badge from main table
      // decenDepoElement = (
      //   <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "10px" }}>
      //     <Tooltip title="This protocol has deployments hosted on the decentralized network" placement="top">
      //       <span
      //         style={{
      //           padding: "4px 6px 2px 7px",
      //           borderRadius: "50%",
      //           backgroundColor: "rgb(102,86,248)",
      //           cursor: "default",
      //           fontWeight: "800",
      //         }}
      //       >
      //         D
      //       </span>
      //     </Tooltip>
      //   </span>
      // );
      // Set to null to ensure it doesn't display
      decenDepoElement = null;
    }
  } catch (err: any) {
    console.error(err.message);
  }

  return (
    <TableRow
      onClick={() => {
        toggleShowDeposDropDown(!showDeposDropDown);
      }}
      key={subgraphName + "DepInDevRow"}
      sx={{ 
        cursor: "pointer", 
        height: "10px", 
        width: "100%", 
        backgroundColor: "rgba(22,24,29,0.9)"
      }}
    >
      <TableCell sx={{ padding: "0 0 0 6px", verticalAlign: "middle", display: "flex", alignItems: "center", height: "35px" }}>
        <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
          <SubgraphLogo name={subgraphName} size={30} />
        </Tooltip>
        <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
          <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
            {subgraphName}
          </span>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
        <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
          <img
            height="24px"
            width="24px"
            src="https://cdn2.iconfinder.com/data/icons/50-material-design-round-corner-style/44/Dropdown_2-512.png"
          />
        </Tooltip>
      </TableCell>
      <TableCell sx={{ padding: "0 6px 1px 0", textAlign: "right", display: "flex", alignItems: "center" }}>
        <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
          <>
            {decentralizedNetworks.map((x: { [x: string]: any }) => {
              let borderColor = "#EFCB68";
              let indexedPercentage = formatIntToFixed2(0);

              const depoObject = x.decentralizedIndexStatus;
              if (depoObject) {
                let synced = depoObject["synced"];
                indexedPercentage = typeof depoObject["indexed-percentage"] === "number"
                  ? formatIntToFixed2(depoObject["indexed-percentage"])
                  : "0.00";
                
                if (!depoObject["is-healthy"]) {
                  borderColor = "#B8301C";
                } else {
                  if (synced && Number(indexedPercentage) > 99) {
                    borderColor = "#58BC82";
                    indexedPercentage = formatIntToFixed2(100);
                  }
                }
              }

              return (
                <a
                  key={subgraphName + x.decentralizedNetworkId + "Logo"}
                  style={{ 
                    height: "100%", 
                    border: borderColor + " 4px solid", 
                    borderRadius: "50%"
                  }}
                  href={process.env.REACT_APP_GRAPH_EXPLORER_URL! + "/subgraphs/" + x.decentralizedNetworkId}
                >
                  <NetworkLogo tooltip={`${x.chain} (${indexedPercentage}%)`} size={28} network={x.chain} />
                </a>
              );
            })}
          </>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
        {protocol?.status ? (
          <Tooltip title={prodStatusHover}>
            <img className="round-image" src={prodStatusIcon} height="24px" width="24px" />
          </Tooltip>
        ) : (
          <Tooltip title="In Development">
            <img
              src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png"
              height="24px"
              width="24px"
            />
          </Tooltip>
        )}
      </TableCell>
      <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
      <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
      <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
      <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
      <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
        <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
          <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
            {schemaCell}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
        <Tooltip title="Click To View All Deployments On This Protocol" placement="top">
          <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
            {protocol?.subgraphVersions?.length > 0 ? (
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                justifyContent: "flex-end",
                maxWidth: "180px",
                gap: "4px"
              }}>
                {protocol?.subgraphVersions.map((version: string, index: number) => (
                  <span key={index} style={{ 
                    backgroundColor: "#2D3142", 
                    padding: "2px 4px", 
                    borderRadius: "4px",
                    fontSize: "12px",
                    whiteSpace: "nowrap"
                  }}>
                    {version}
                  </span>
                ))}
              </div>
            ) : "N/A"}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}></TableCell>
    </TableRow>
  );
}

export default ProtocolSection;

