import { Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { convertTokenDecimals } from "../utils";

function checkValueFalsey(
  value: any,
  schemaName: string,
  entityField: string,
  fieldDataType: string[],
  issues: { message: string; type: string }[],
): { message: string; type: string } | undefined {
  if (!fieldDataType || fieldDataType.length === 0) {
    return undefined;
  }
  if (fieldDataType[fieldDataType.length - 1] !== "!") {
    return undefined;
  }
  if (value === null || value === "0" || value?.length === 0 || value === "") {
    let valueMsg = value;
    if (valueMsg === "" || valueMsg?.length === 0) {
      valueMsg = "empty";
    }
    const message = schemaName + "-" + entityField + " is " + valueMsg + ". Verify that this value is correct";
    if (issues.filter((x) => x.message === message).length === 0) {
      return { message, type: "VAL" };
    } else {
      return undefined;
    }
  }
}

function SchemaTable(
  entityData: { [x: string]: any },
  schemaName: string,
  setWarning: React.Dispatch<React.SetStateAction<{ message: string; type: string }[]>>,
  dataFields: { [x: string]: string },
  warning: { message: string; type: string }[],
) {
  const issues: { message: string; type: string }[] = warning;

  if (!entityData) {
    return null;
  }
  let schema = [];
  try {
    schema = Object.keys(entityData).map((entityField: string) => {
      if (entityField === "__typename") {
        return null;
      }
      let dataType = dataFields[entityField];
      let value = entityData[entityField];
      const fieldDataTypeChars = dataFields[entityField].split("");
      const issueReturned = checkValueFalsey(value, schemaName, entityField, fieldDataTypeChars, issues);
      if (issueReturned) {
        issues.push(issueReturned);
      }
      if (!value && fieldDataTypeChars[fieldDataTypeChars.length - 1] !== "!") {
        return (
          <TableRow key={entityField}>
            <TableCell component="th" scope="row" style={{ minWidth: "30vw", padding: "2px" }}>
              {entityField}: <b>{dataType}</b>
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
        entityField === "outputTokenSupply" ||
        entityField === "outputTokenPriceUSD" ||
        entityField === "stakedOutputTokenAmount"
      ) {
        value = convertTokenDecimals(value, entityData.outputToken.decimals).toString();
        const issueReturned = checkValueFalsey(value, schemaName, entityField, fieldDataTypeChars, issues);
        if (issueReturned) {
          issues.push(issueReturned);
        }
        dataType += " [" + entityData.outputToken.name + "]";
      }
      if (entityField === "inputTokenBalances") {
        const tokenNames: string[] = [];
        const decimalMapped = value.map((val: string, idx: number) => {
          tokenNames.push(entityData.inputTokens[idx].name || "TOKEN [" + idx + "]");
          const issueReturned = checkValueFalsey(
            val,
            schemaName,
            entityField + " [" + idx + "]",
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
      } else if (entityField === "inputTokenBalance") {
        value = convertTokenDecimals(value, entityData.inputToken.decimals);
        dataType += " [" + entityData.inputToken.name + "]";
        const issueReturned = checkValueFalsey(value, schemaName, entityField, fieldDataTypeChars, issues);
        if (issueReturned) {
          issues.push(issueReturned);
        }
      } else if (entityField === "inputTokenPriceUSD") {
        dataType += " [" + entityData.inputToken.name + "]";
      } else if (entityField.toUpperCase().includes("REWARDTOKENEMISSIONS")) {
        const tokenNames: string[] = [];
        const decimalMapped = value.map((val: string, idx: number) => {
          let decimals = 18;
          if (entityData?.rewardTokens[idx]?.token?.decimals) {
            decimals = entityData?.rewardTokens[idx]?.token?.decimals;
            tokenNames.push(entityData.rewardTokens[idx]?.token?.name || "TOKEN [" + idx + "]");
          } else if (entityData?.rewardTokens[idx]?.decimals) {
            decimals = entityData?.rewardTokens[idx]?.decimals;
            tokenNames.push(entityData.rewardTokens[idx]?.name || "TOKEN [" + idx + "]");
          }
          return convertTokenDecimals(val, decimals).toString();
        });
        dataType += " [" + tokenNames.join(",") + "]";
        if (entityField === "rewardTokenEmissionsAmount") {
          value = "[ " + decimalMapped.join(", ") + " ]";
        } else if (entityField === "rewardTokenEmissionsUSD") {
          value = value.map((val: string) => {
            return "$" + Number(Number(val).toFixed(2)).toLocaleString();
          });
          // value = JSON.stringify(value);
          // value = value.split(", ").join(",").split(',').join(', ').split('"').join('');
          value = "[" + value.join(", ") + "]";
        }
      } else if (entityField === "mintedTokenSupplies") {
        const decimalMapped = entityData[entityField].map((val: string, idx: number) => {
          const issueReturned = checkValueFalsey(
            val,
            schemaName,
            entityField + " [" + idx + "]",
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
          if (issueReturned) {
            issues.push(issueReturned);
          }
          if (issueReturnedToken || !entityData.mintedTokens || entityData.mintedTokens.length === 0) {
            const message =
              "MintedTokenSupplies could not properly convert decimals, invalid decimals property on MintedTokens [" +
              idx +
              "].";
            if (issues.filter((x) => x.message === message).length === 0) {
              issues.push({ message, type: "VAL" });
            }
            return val;
          }
          return convertTokenDecimals(val, entityData.mintedTokens[idx].decimals).toString();
        });
        value = "[ " + decimalMapped.join(", ") + " ]";
      } else if (typeof value === "object" && !Array.isArray(value)) {
        if (entityField === "inputToken" || entityField === "outputToken") {
          value = {
            id: value.id || "N/A",
            name: value.name || "N/A",
            symbol: value.symbol || "N/A",
            decimals: value.decimals || 0,
          };
        } else if (entityField.toUpperCase().includes("INPUTTOKEN")) {
          dataType += " [" + entityData.inputToken.name + "]";
        }
        value = JSON.stringify(value);
        value = value.split(", ").join(",").split(",").join(", ").split('"').join("");
      } else if (Array.isArray(value)) {
        if (entityField === "inputTokens") {
          value = value.map((val: { [x: string]: string }) => {
            return {
              id: val.id || "N/A",
              name: val.name || "N/A",
              symbol: val.symbol || "N/A",
              decimals: val.decimals || 0,
            };
          });
        } else if (entityField === "rewardTokens") {
          value = value.map((val: { [x: string]: any }) => {
            if (val?.token) {
              return {
                id: val.id || "N/A",
                name: val.token?.name || "N/A",
                symbol: val.token?.symbol || "N/A",
                decimals: val.token?.decimals || 0,
              };
            } else {
              return {
                id: val.id || "N/A",
                name: val.name || "N/A",
                symbol: val.symbol || "N/A",
                decimals: val.decimals || 0,
              };
            }
          });
        } else if (entityField.toUpperCase().includes("INPUTTOKEN")) {
          const tokenNames = value.map((val, idx) => {
            return entityData.inputTokens[idx].name || "TOKEN [" + idx + "]";
          });
          dataType += " [" + tokenNames.join(",") + "]";
        }
        value = JSON.stringify(value);
        value = value.split(", ").join(",").split(",").join(", ").split('"').join("");
      }
      if (!isNaN(Number(value)) && entityField.includes("USD")) {
        value = Number(value).toFixed(2);
        value = "$" + Number(value).toLocaleString();
      }

      return (
        <TableRow key={entityField}>
          <TableCell component="th" scope="row" style={{ minWidth: "30vw", padding: "2px" }}>
            {entityField}: <b>{dataType}</b>
          </TableCell>
          <TableCell align="right" style={{ maxWidth: "55vw", padding: "2px" }}>
            {value}
          </TableCell>
        </TableRow>
      );
    });
  } catch (err) {
    if (err instanceof Error) {
      console.log("CATCH,", Object.keys(err), Object.values(err), err);
      return <h3>JAVASCRIPT ERROR - RENDERING SCHEMA TABLE - {err.message}</h3>;
    } else {
      return <h3>JAVASCRIPT ERROR - RENDERING SCHEMA TABLE</h3>;
    }
  }

  if (issues.length > 0) {
    setWarning(issues);
  }

  return (
    <>
      <Typography variant="h5" id={schemaName} sx={{ mb: 2 }}>
        {schemaName} schema:
      </Typography>
      <TableContainer component={Paper} sx={{ justifyContent: "center", display: "flex", alignItems: "center" }}>
        <Table sx={{ maxWidth: 800 }} aria-label="simple table">
          <TableBody>{schema}</TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default SchemaTable;
