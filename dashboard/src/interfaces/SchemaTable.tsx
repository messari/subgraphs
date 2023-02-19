import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { useEffect } from "react";
import { negativeFieldList, percentageFieldList } from "../constants";
import { convertTokenDecimals, formatIntToFixed2 } from "../utils";
import { CopyLinkToClipboard } from "../common/utilComponents/CopyLinkToClipboard";

function checkValueFalsey(
  value: any,
  schemaName: string,
  fieldName: string,
  fieldDataType: string[],
  issues: { message: string; type: string; level: string; fieldName: string }[],
): { message: string; type: string; level: string; fieldName: string } | undefined {
  if (!fieldDataType || fieldDataType.length === 0) {
    return undefined;
  }
  if (fieldDataType[fieldDataType.length - 1] !== "!" && !value) {
    return undefined;
  }

  let valueMsg = "";
  let level = "warning";
  if (value === "" || value?.length === 0) {
    valueMsg = "empty";
  } else if (!value || Number(value) === 0) {
    valueMsg = value;
  } else if (Number(value) < 0 && !negativeFieldList.includes(fieldName)) {
    valueMsg = "negative";
    level = "critical";
  }

  const message = schemaName + "-" + fieldName + " is " + valueMsg + ". Verify that this data is correct";
  if (issues.filter((x) => x.message === message).length === 0 && valueMsg) {
    return { type: "VAL", message, level, fieldName: schemaName + "-" + fieldName };
  } else {
    return undefined;
  }
}

interface SchemaTableProps {
  entityData: { [x: string]: any };
  protocolType: string;
  schemaName: string;
  dataFields: { [x: string]: string };
  issuesProps: { message: string; type: string; level: string; fieldName: string }[];
  setIssues: React.Dispatch<
    React.SetStateAction<{ message: string; type: string; level: string; fieldName: string }[]>
  >;
}

function SchemaTable({ entityData, protocolType, schemaName, dataFields, issuesProps, setIssues }: SchemaTableProps) {
  const issues: { message: string; type: string; level: string; fieldName: string }[] = [];
  let schema: (JSX.Element | null)[] = [];
  if (entityData) {
    schema = Object.keys(entityData).map((fieldName: string) => {
      let additionalElement = null;
      if (fieldName === "__typename") {
        return null;
      }
      let dataType = dataFields[fieldName];
      let value = entityData[fieldName];
      try {
        const isPercentageField = percentageFieldList.find((x) => {
          return fieldName.toUpperCase().includes(x.toUpperCase());
        });
        const fieldDataTypeChars = dataFields[fieldName]?.split("");
        const issueReturned = checkValueFalsey(value, schemaName, fieldName, fieldDataTypeChars, issues);
        if (issueReturned) {
          issues.push(issueReturned);
        }
        if (!value && fieldDataTypeChars[fieldDataTypeChars.length - 1] !== "!") {
          return (
            <TableRow key={fieldName}>
              <TableCell component="th" scope="row" style={{ minWidth: "30vw", padding: "2px" }}>
                {fieldName}: <b>{dataType}</b>
              </TableCell>
              <TableCell align="right" style={{ maxWidth: "55vw", padding: "2px" }}>
                {value}
              </TableCell>
            </TableRow>
          );
        }

        if (typeof value === "boolean") {
          if (value) {
            value = "True";
          } else {
            value = "False";
          }
        }

        if (
          fieldName.toUpperCase() === "TOTALVALUELOCKEDUSD" &&
          issues.filter((x) => x.fieldName === `${schemaName}-${fieldName}` && x.type === "TVL+").length === 0 &&
          Number(value) > 1_000_000_000_000
        ) {
          issues.push({ type: "TVL+", message: "", level: "critical", fieldName: `${schemaName}-${fieldName}` });
        }

        if (
          fieldName.toUpperCase() === "TOTALVALUELOCKEDUSD" &&
          issues.filter((x) => x.fieldName === `${schemaName}-${fieldName}` && x.type === "TVL-").length === 0 &&
          Number(value) < 1_000
        ) {
          issues.push({ type: "TVL-", message: "", level: "critical", fieldName: `${schemaName}-${fieldName}` });
        }

        if (fieldName.toUpperCase().includes("OUTPUTTOKEN")) {
          if (fieldName === "outputTokenSupply" || fieldName === "stakedOutputTokenAmount") {
            value = convertTokenDecimals(value, entityData?.outputToken?.decimals).toString();
          }
          const issueReturned = checkValueFalsey(value, schemaName, fieldName, fieldDataTypeChars, issues);
          if (issueReturned) {
            issues.push(issueReturned);
          }
          dataType += " [" + (entityData?.outputToken?.name || "N/A") + "]";
        }

        if (fieldName.toUpperCase() === "INPUTTOKENBALANCES") {
          const tokenNames: string[] = [];
          const decimalMapped = value.map((val: string, idx: number) => {
            tokenNames.push(entityData.inputTokens[idx].name || "TOKEN [" + idx + "]");
            const issueReturned = checkValueFalsey(
              val,
              schemaName,
              fieldName + " [" + idx + "]",
              fieldDataTypeChars,
              issues,
            );
            if (issueReturned) {
              issues.push(issueReturned);
            }
            return convertTokenDecimals(val, entityData.inputTokens[idx].decimals).toString();
          });
          dataType += " [" + tokenNames.join(",") + "]";
          value = "[ " + decimalMapped.join(", ") + " ]";
        } else if (fieldName.toUpperCase() === "INPUTTOKENBALANCE" || fieldName.toUpperCase() === "DEPOSITLIMIT") {
          value = convertTokenDecimals(value, entityData.inputToken.decimals);
          dataType += " [" + entityData.inputToken.name + "]";
          const issueReturned = checkValueFalsey(value, schemaName, fieldName, fieldDataTypeChars, issues);
          if (issueReturned) {
            issues.push(issueReturned);
          }
        } else if (fieldName.toUpperCase() === "PRICEPERSHARE") {
          value = convertTokenDecimals(value, entityData.outputToken.decimals);
          dataType += " [" + entityData.outputToken.name + "]";
          const issueReturned = checkValueFalsey(value, schemaName, fieldName, fieldDataTypeChars, issues);
          if (issueReturned) {
            issues.push(issueReturned);
          }
        } else if (fieldName.toUpperCase() === "INPUTTOKENPRICEUSD") {
          dataType += " [" + entityData.inputToken.name + "]";
        } else if (fieldName.toUpperCase().includes("REWARDTOKENEMISSIONS")) {
          const tokenNames: string[] = [];
          const decimalMapped = value.map((val: string, idx: number) => {
            let decimals = 18;
            if (entityData?.rewardTokens[idx]?.token?.decimals) {
              decimals = entityData?.rewardTokens[idx]?.token?.decimals;
              tokenNames.push(entityData.rewardTokens[idx]?.token?.name || "TOKEN [" + idx + "]");
            }
            return formatIntToFixed2(convertTokenDecimals(val, decimals));
          });
          dataType += " [" + tokenNames.join(",") + "]";
          if (fieldName.toUpperCase() === "REWARDTOKENEMISSIONSAMOUNT") {
            value = "[ " + decimalMapped.join(", ") + " ]";
            const rewardFactors: string[] = [];
            let rewardFactorsStr = "N/A";
            let rewardAPRs: string[] = entityData?.rewardTokenEmissionsUSD?.map((val: string, idx: number) => {
              let apr = 0;
              if (protocolType === "LENDING" && (entityData.rewardTokens[idx]?.type?.includes("BORROW") || entityData.rewardTokens[idx]?.token?.type?.includes("BORROW"))) {
                if (
                  !Number(entityData.totalBorrowBalanceUSD) &&
                  issues.filter(
                    (x) => x.fieldName === `${entityData.name}-totalBorrowBalanceUSD-pool value`,
                  ).length === 0
                ) {
                  issues.push({
                    type: "VAL",
                    message: `${entityData.name
                      } does not have a valid 'totalBorrowBalanceUSD' value. Reward APR (BORROWER) could not be properly calculated.`,
                    level: "critical",
                    fieldName: `${entityData.name}-totalBorrowBalanceUSD-pool value`,
                  });
                } else if (Number(entityData.totalBorrowBalanceUSD)) {
                  apr = (Number(val) / Number(entityData.totalBorrowBalanceUSD)) * 100 * 365;
                  rewardFactorsStr = `(${Number(val).toFixed(2)} (Daily Reward Emissions) / ${Number(
                    entityData.totalBorrowBalanceUSD,
                  ).toFixed(2)} (Borrow balance)) * 100 * 365 = ${apr.toFixed(2)}%`;
                }
              } else if (protocolType === "LENDING") {
                if (
                  !Number(entityData.totalDepositBalanceUSD) &&
                  !Number(entityData.totalValueLockedUSD) &&
                  issues.filter(
                    (x) =>
                      x.fieldName ===
                      `${entityData.name} - totalDepositBalanceUSD / totalValueLockedUSD - pool value`,
                  ).length === 0
                ) {
                  issues.push({
                    type: "VAL",
                    message: `${entityData.name
                      } does not have a valid 'totalDepositBalanceUSD' nor 'totalValueLockedUSD' value. Neither Reward APR (DEPOSITOR) nor Base Yield could be properly calculated.`,
                    level: "critical",
                    fieldName: `${entityData.name
                      } - totalDepositBalanceUSD / totalValueLockedUSD - pool value`,
                  });
                } else if (entityData.totalDepositBalanceUSD) {
                  apr = (Number(val) / Number(entityData.totalDepositBalanceUSD)) * 100 * 365;
                  rewardFactorsStr = `(${Number(val).toFixed(2)}(Daily Reward Emissions) / ${Number(
                    entityData.totalDepositBalanceUSD,
                  ).toFixed(2)} (Deposit balance)) * 100 * 365 = ${apr.toFixed(2)}% `;
                } else if (Number(entityData.totalValueLockedUSD)) {
                  apr = (Number(val) / Number(entityData.totalValueLockedUSD)) * 100 * 365;
                  rewardFactorsStr = `(${Number(val).toFixed(2)}(Daily Reward Emissions) / ${Number(
                    entityData.totalValueLockedUSD,
                  ).toFixed(2)} (TVL)) * 100 * 365 = ${apr.toFixed(2)}% `;
                }
              } else {
                let outputStakedFactor = Number(entityData?.stakedOutputTokenAmount) / Number(entityData?.outputTokenSupply);
                if (!outputStakedFactor) {
                  outputStakedFactor = 1;
                }
                apr = (Number(val) / (Number(entityData.totalValueLockedUSD) * outputStakedFactor)) * 100 * 365;
                rewardFactorsStr = `(${Number(val).toFixed(2)}(Daily Reward Emissions) / (${Number(
                  entityData.totalValueLockedUSD,
                ).toFixed(2)} (TVL) * (${Number(entityData?.stakedOutputTokenAmount)} (Staked Output Token) / ${Number(
                  entityData?.outputTokenSupply,
                )} (Output Token Supply)))) * 100 * 365 = ${apr.toFixed(2)}% `;
              }
              if (
                Number(apr) === 0 &&
                issues.filter(
                  (x) =>
                    x.fieldName ===
                    `${entityData.name} ${entityData.rewardTokens[idx]?.symbol || entityData.rewardTokens[idx]?.token?.symbol} RewardAPR`,
                ).length === 0
              ) {
                issues.push({
                  type: "RATEZERO",
                  message: "",
                  level: "warning",
                  fieldName: `${entityData.name} ${entityData.rewardTokens[idx]?.symbol || entityData.rewardTokens[idx]?.token?.symbol} RewardAPR`,
                });
              }
              if (
                isNaN(apr) &&
                issues.filter(
                  (x) =>
                    x.fieldName ===
                    `${entityData.name} ${entityData.rewardTokens[idx]?.symbol || entityData.rewardTokens[idx]?.token?.symbol} RewardAPR`,
                ).length === 0
              ) {
                issues.push({
                  type: "NAN",
                  message: "",
                  level: "critical",
                  fieldName: `${entityData.name} ${entityData.rewardTokens[idx]?.symbol || entityData.rewardTokens[idx]?.token?.symbol} RewardAPR`,
                });
              }
              if (
                Number(apr) < 0 &&
                issues.filter(
                  (x) =>
                    x.fieldName ===
                    `${entityData.name} ${entityData.rewardTokens[idx]?.symbol || entityData.rewardTokens[idx]?.token?.symbol} RewardAPR`,
                ).length === 0
              ) {
                issues.push({
                  type: "RATENEG",
                  message: "",
                  level: "critical",
                  fieldName: `${entityData.name} ${entityData.rewardTokens[idx]?.symbol || entityData.rewardTokens[idx]?.token?.symbol} RewardAPR`,
                });
              }
              rewardFactors.push("Token [" + idx + "] " + rewardFactorsStr);
              return Number(apr).toFixed(2) + "%";
            });
            if (rewardAPRs.length >= 1) {
              const dataType = rewardAPRs.map((x, idx) => `${entityData.rewardTokens[idx]?.token?.name} (${entityData.rewardTokens[idx]?.type}) APR%`)
              additionalElement = (
                <TableRow key="reward-APRs">
                  <TableCell component="th" scope="row" style={{ minWidth: "30vw", padding: "2px" }}>
                    reward APRs: <b>[{dataType.join(', ')}]</b>
                  </TableCell>
                  <TableCell align="right" style={{ maxWidth: "55vw", padding: "2px" }}>
                    [{rewardAPRs.join(', ')}]
                  </TableCell>
                </TableRow>
              );
            }
          } else if (fieldName.toUpperCase() === "REWARDTOKENEMISSIONSUSD") {
            value = value.map((val: string) => {
              return "$" + formatIntToFixed2(Number(val));
            });
            value = "[" + value.join(", ") + "]";
          }
        } else if (fieldName.toUpperCase() === "MINTEDTOKENSUPPLIES") {
          const decimalMapped = entityData[fieldName].map((val: string, idx: number) => {
            const issueReturned = checkValueFalsey(
              val,
              schemaName,
              fieldName + " [" + idx + "]",
              fieldDataTypeChars,
              issues,
            );
            const issueReturnedToken = checkValueFalsey(
              entityData.mintedTokens[idx]?.decimals,
              schemaName,
              "MintedTokens [" + idx + "]",
              fieldDataTypeChars,
              issues,
            );
            const label = schemaName + "-" + fieldName + " [" + idx + "]";
            if (issueReturned) {
              issues.push(issueReturned);
            }
            if (issueReturnedToken || !entityData.mintedTokens || entityData.mintedTokens.length === 0) {
              const message =
                "MintedTokenSupplies could not properly convert decimals, invalid decimals property on MintedTokens [" +
                idx +
                "].";
              if (issues.filter((x) => x.fieldName === label).length === 0) {
                issues.push({ message, type: "VAL", level: "warning", fieldName: label });
              }
              return val;
            }
            return convertTokenDecimals(val, entityData.mintedTokens[idx].decimals).toString();
          });
          value = "[ " + decimalMapped.join(", ") + " ]";
        } else if (typeof value === "object" && !Array.isArray(value)) {
          const label = schemaName + "-" + fieldName;
          if (fieldName.toUpperCase() === "INPUTTOKEN" || fieldName.toUpperCase() === "OUTPUTTOKEN") {
            if (!Number(value.decimals) && issues.filter((x) => x.fieldName === label).length === 0) {
              issues.push({ message: "", type: "DEC", level: "critical", fieldName: label });
            }
            value = {
              id: value.id || "N/A",
              name: value.name || "N/A",
              symbol: value.symbol || "N/A",
              decimals: value.decimals || 0,
            };
          } else if (fieldName.toUpperCase().includes("INPUTTOKEN")) {
            dataType += " [" + entityData.inputToken.name + "]";
          }
          value = JSON.stringify(value);
          value = value.split(", ").join(",").split(",").join(", ").split('"').join("");
        } else if (Array.isArray(value)) {
          if (fieldName.toUpperCase() === "INPUTTOKENS") {
            value = value.map((val: { [x: string]: string }, idx: number) => {
              const label = schemaName + "-" + fieldName + " " + (val.symbol || idx);
              if (
                !Number(val.decimals) &&
                Number(val.decimals) !== 0 &&
                issues.filter((x) => x.fieldName === label)?.length === 0
              ) {
                issues.push({ message: "", type: "DEC", level: "critical", fieldName: label });
              }
              return {
                id: val.id || "N/A",
                name: val.name || "N/A",
                symbol: val.symbol || "N/A",
                decimals: val.decimals || 0,
              };
            });
          } else if (fieldName.toUpperCase() === "REWARDTOKENS") {
            value = value.map((val: { [x: string]: any }, idx: number) => {
              if (val?.token) {
                const label = schemaName + "-" + fieldName + " " + (val.token?.symbol || idx);

                if (!Number(val.token?.decimals) && issues.filter((x) => x.fieldName === label).length === 0) {
                  issues.push({ message: "", type: "DEC", level: "critical", fieldName: label });
                }
                return {
                  id: val.id || "N/A",
                  name: val.token?.name || "N/A",
                  symbol: val.token?.symbol || "N/A",
                  decimals: val.token?.decimals || 0,
                };
              } else {
                const label = schemaName + "-" + fieldName + " " + (val.symbol || idx);

                if (!Number(val.decimals) && issues.filter((x) => x.fieldName === label).length === 0) {
                  issues.push({ message: "", type: "DEC", level: "critical", fieldName: label });
                }
                return {
                  id: val.id || "N/A",
                  name: val.name || "N/A",
                  symbol: val.symbol || "N/A",
                  decimals: val.decimals || 0,
                };
              }
            });
          } else if (fieldName.toUpperCase().includes("INPUTTOKEN")) {
            const tokenNames = value.map((val, idx) => {
              return entityData.inputTokens[idx].name || "TOKEN [" + idx + "]";
            });
            dataType += " [" + tokenNames.join(",") + "]";
          } else if (fieldName.toUpperCase() === "ROUTES") {
            value = value.map((val: { [x: string]: any }) => {
              return {
                id: val.id,
                network: val.crossToken.network
              };
            });
          } else if (fieldName.toUpperCase() === "POSITIONS") {
            // ignore positions
            return null;
          }

          if (isPercentageField) {
            value = value.map((val: any) => {
              if (!isNaN(Number(val))) {
                return val + "%";
              } else {
                return val;
              }
            });
          }

          value = JSON.stringify(value);
          value = value.split(", ").join(",").split(",").join(", ").split('"').join("");
        }
        if (!isNaN(Number(value))) {
          if (fieldName.includes("USD")) {
            value = Number(value).toFixed(2);
            value = "$" + Number(value).toLocaleString();
          }
          if (isPercentageField) {
            value = Number(value).toFixed(2) + "%";
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log("CATCH,", Object.keys(err), Object.values(err), err);
          if (issues.filter((x) => x.fieldName === schemaName + "-" + fieldName && x.type === "JS")?.length === 0) {
            issues.push({
              type: "JS",
              message: err.message,
              level: "critical",
              fieldName: schemaName + "-" + fieldName,
            });
          }
          return (
            <TableRow key={fieldName} style={{ borderTop: "2px solid #B8301C", borderBottom: "2px solid #B8301C" }}>
              <TableCell component="th" scope="row" style={{ minWidth: "30vw", padding: "2px" }}>
                {fieldName}: <b>{dataType}</b>
              </TableCell>
              <TableCell align="right" style={{ maxWidth: "55vw", padding: "2px" }}>
                JavaScript Error - {err?.message}
              </TableCell>
            </TableRow>
          );
        } else {
          return <h3>JAVASCRIPT ERROR</h3>;
        }
      }
      return (
        <>{additionalElement}
          <TableRow key={fieldName}>
            <TableCell component="th" scope="row" style={{ minWidth: "30vw", padding: "2px" }}>
              {fieldName}: <b>{dataType}</b>
            </TableCell>
            <TableCell align="right" style={{ maxWidth: "55vw", padding: "2px" }}>
              {value}
            </TableCell>
          </TableRow>
        </>);
    });
  }

  useEffect(() => {
    console.log("SCHEMATABLE ISSUE TO SET", issues, issuesProps);
    if (JSON.stringify(issues) !== JSON.stringify(issuesProps)) {
      setIssues(issues);
    }
  });

  let schemaHeader = null;
  if (schema && entityData) {
    schemaHeader = (
      <Box my={3}>
        <CopyLinkToClipboard link={window.location.href}>
          <Typography variant="h4">{schemaName} schema</Typography>
        </CopyLinkToClipboard>
      </Box>
    );
  }

  return (
    <>
      {schemaHeader}
      <TableContainer component={Paper} sx={{ justifyContent: "center", display: "flex", alignItems: "center" }}>
        <Table key="Table" sx={{ maxWidth: 800 }} aria-label="simple table">
          <TableBody>{schema}</TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default SchemaTable;
