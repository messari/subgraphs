import { Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import { convertTokenDecimals } from "../utils";

function checkValueFalsey(value: any, schemaName: string, entityField: string, fieldDataType: string, issues: { message: string, type: string }[]): { message: string, type: string } | undefined {
    const fieldDataTypeChars = fieldDataType.split("");
    if (fieldDataTypeChars[fieldDataTypeChars.length - 1] !== "!") {
        return undefined;
    }
    if (value === null || value === '0' || value?.length === 0 || value === '') {
        let valueMsg = value;
        if (valueMsg === '' || valueMsg?.length === 0) {
            valueMsg = 'empty'
        }
        const message = schemaName + "-" + entityField + " is " + valueMsg + ". Verify that this value is correct";
        if (issues.filter(x => x.message === message).length === 0) {
            return ({ message, type: "VAL" });
        } else {
            return undefined;
        }
    }
}

function SchemaTable(
    entityData: { [x: string]: any },
    schemaName: string,
    setWarning: React.Dispatch<React.SetStateAction<{ message: string, type: string }[]>>,
    dataFields: { [x: string]: string },
    warning: { message: string, type: string }[]
) {

    const issues: { message: string, type: string }[] = warning;

    if (!entityData) {
        return null;
    }
    let schema = [];
    try {
        schema = Object.keys(entityData).map((entityField: string) => {
            if (entityField === '__typename') {
                return null;
            }
            let value = entityData[entityField];
            const issueReturned = checkValueFalsey(value, schemaName, entityField, dataFields[entityField], issues);
            if (issueReturned) {
                issues.push(issueReturned);
            }
            if (typeof (value) === 'boolean') {
                if (value) {
                    value = 'True';
                } else {
                    value = 'False';
                }
            }
            if (!isNaN(parseFloat(value)) && !Array.isArray(value) && (dataFields[entityField].includes('Int') || dataFields[entityField].includes('Decimal') || dataFields[entityField].includes('umber'))) {
                value = parseFloat(value).toFixed(2);
            }
            if (entityField === "outputTokenSupply") {
                value = convertTokenDecimals(value, entityData.outputToken.decimals).toString();
                const issueReturned = checkValueFalsey(value, schemaName, entityField, dataFields[entityField], issues);
                if (issueReturned) {
                    issues.push(issueReturned);
                }
            }
            if (entityField === 'inputTokenBalances') {
                // if array 
                const decimalMapped = entityData[entityField].map((val: string, idx: number) => {
                    const issueReturned = checkValueFalsey(val, schemaName, entityField + ' [' + idx + ']', dataFields[entityField], issues);
                    if (issueReturned) {
                        issues.push(issueReturned);
                    }
                    return convertTokenDecimals(val, entityData.inputTokens[idx].decimals).toString();
                });
                value = '[ ' + decimalMapped.join(", ") + " ]"
            } else if (entityField === 'inputTokenBalance') {
                value = convertTokenDecimals(value, entityData.inputToken.decimals);
                const issueReturned = checkValueFalsey(value, schemaName, entityField, dataFields[entityField], issues);
                if (issueReturned) {
                    issues.push(issueReturned);
                }
            } else if (entityField === 'mintedTokenSupplies') {
                const decimalMapped = entityData[entityField].map((val: string, idx: number) => {
                    const issueReturned = checkValueFalsey(val, schemaName, entityField + ' [' + idx + ']', dataFields[entityField], issues);
                    const issueReturnedToken = checkValueFalsey(entityData.mintedTokens[idx]?.decimals, schemaName, "MintedTokens [" + idx + "]", dataFields[entityField], issues);
                    if (issueReturned) {
                        issues.push(issueReturned);
                    }
                    if (issueReturnedToken || !entityData.mintedTokens || entityData.mintedTokens.length === 0) {
                        const message = "MintedTokenSupplies could not properly convert decimals, invalid decimals property on MintedTokens [" + idx + "].";
                        if (issues.filter((x) => x.message === message).length === 0) {
                            issues.push({ message, type: "VAL" });
                        }
                        return val;
                    }
                    return convertTokenDecimals(val, entityData.mintedTokens[idx].decimals).toString();
                });
                value = '[ ' + decimalMapped.join(", ") + " ]"
            } else if (typeof (value) === 'object' || Array.isArray(value)) {
                value = JSON.stringify(value);
                value = value.split(", ").join(",").split(',').join(', ');
            }
            console.log(value, Number(value).toLocaleString(), !isNaN(Number(value)))
            if (!isNaN(Number(value)) && entityField.includes("USD")) {
                value = '$' + Number(value).toLocaleString();
            }
            return (
                <TableRow key={entityField}>
                    <TableCell component="th" scope="row" style={{ minWidth: "30vw", padding: "2px" }}>
                        {entityField}: <b>{dataFields[entityField]}</b>
                    </TableCell>
                    <TableCell align="right" style={{ maxWidth: "60vw", padding: "2px" }}>
                        {value}
                    </TableCell>
                </TableRow>);
        })
    } catch (err) {
        if (err instanceof Error) {
            console.log('CATCH,', Object.keys(err), Object.values(err), err)
            return <h3>JAVASCRIPT ERROR - RENDERING SCHEMA TABLE - {err.message}</h3>

        } else {
            return <h3>JAVASCRIPT ERROR - RENDERING SCHEMA TABLE</h3>
        }
    }

    if (issues.length > 0) {
        setWarning(issues);
    }

    return (<>
        <h3 style={{ textAlign: "center" }}>{schemaName}:</h3>
        <TableContainer component={Paper} sx={{ justifyContent: "center", display: "flex", alignItems: "center" }}>
            <Table sx={{ maxWidth: 800 }} aria-label="simple table">
                <TableBody>
                    {schema}
                </TableBody>
            </Table>
        </TableContainer></>);
}

export default SchemaTable;