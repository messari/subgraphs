import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import { useEffect } from "react";
import { JsxElement } from "typescript";
import { StackedChart } from "../common/chartComponents/StackedChart";
import ScrollToElement from "../common/utilComponents/ScrollToElement";
import { percentageFieldList } from "../constants";
import { convertTokenDecimals } from "../utils";

function checkValueFalsey(
    value: any,
    schemaName: string,
    entityField: string,
    fieldDataType: string[],
    issues: { message: string, type: string, level: string, fieldName: string }[]
): { message: string, type: string, level: string, fieldName: string } | undefined {

    if (!fieldDataType || fieldDataType.length === 0) {
        return undefined;
    }
    if (fieldDataType[fieldDataType.length - 1] !== "!") {
        return undefined;
    }
    if (value === null || value === '0' || value?.length === 0 || value === '') {
        let valueMsg = value;
        if (valueMsg === '' || valueMsg?.length === 0) {
            valueMsg = 'empty'
        }
        const message = schemaName + "-" + entityField + " is " + valueMsg + ". Verify that this value is correct";
        if (issues.filter(x => x.message === message).length === 0) {
            return ({ type: "VAL", message, level: 'warning', fieldName: schemaName });
        } else {
            return undefined;
        }
    }
}

interface SchemaTableProps {
    entityData: { [x: string]: any },
    schemaName: string,
    setIssues: React.Dispatch<React.SetStateAction<{ message: string, type: string, level: string, fieldName: string }[]>>,
    dataFields: { [x: string]: string },
    issuesProps: { message: string, type: string, level: string, fieldName: string }[],
    poolId: string,
    tabName: string
}

function SchemaTable({
    entityData,
    schemaName,
    setIssues,
    dataFields,
    issuesProps,
    poolId,
    tabName
}: SchemaTableProps) {

    const issues = issuesProps;

    let schema: (JSX.Element | null)[] = [];
    if (entityData) {
        schema = Object.keys(entityData).map((entityField: string) => {
            try {
                if (entityField === '__typename') {
                    return null;
                }
                let dataType = dataFields[entityField];
                let value = entityData[entityField];
                const isPercentageField = percentageFieldList.find(x => { return entityField.toUpperCase().includes(x.toUpperCase()) })
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
                        </TableRow>);
                }
                if (typeof (value) === 'boolean') {
                    if (value) {
                        value = 'True';
                    } else {
                        value = 'False';
                    }
                }

                if (entityField === "outputTokenSupply" || entityField === "outputTokenPriceUSD" || entityField === "stakedOutputTokenAmount") {
                    value = convertTokenDecimals(value, entityData.outputToken.decimals).toString();
                    const issueReturned = checkValueFalsey(value, schemaName, entityField, fieldDataTypeChars, issues);
                    if (issueReturned) {
                        issues.push(issueReturned);
                    }
                    dataType += ' [' + entityData.outputToken.name + ']';
                }
                if (entityField === 'inputTokenBalances') {
                    const tokenNames: string[] = [];
                    const decimalMapped = value.map((val: string, idx: number) => {
                        tokenNames.push(entityData.inputTokens[idx].name || 'TOKEN [' + idx + ']');
                        const issueReturned = checkValueFalsey(val, schemaName, entityField + ' [' + idx + ']', fieldDataTypeChars, issues);
                        if (issueReturned) {
                            issues.push(issueReturned);
                        }
                        return convertTokenDecimals(val, entityData.inputTokens[idx].decimals).toString();
                    });
                    dataType += ' [' + tokenNames.join(',') + ']';
                    value = '[ ' + decimalMapped.join(", ") + " ]";
                } else if (entityField === 'inputTokenBalance' || entityField === 'pricePerShare') {
                    value = convertTokenDecimals(value, entityData.inputToken.decimals);
                    dataType += ' [' + entityData.inputToken.name + ']';
                    const issueReturned = checkValueFalsey(value, schemaName, entityField, fieldDataTypeChars, issues);
                    if (issueReturned) {
                        issues.push(issueReturned);
                    }
                } else if (entityField === 'inputTokenPriceUSD') {
                    dataType += ' [' + entityData.inputToken.name + ']';
                } else if (entityField.toUpperCase().includes('REWARDTOKENEMISSIONS')) {
                    const tokenNames: string[] = [];
                    const decimalMapped = value.map((val: string, idx: number) => {
                        let decimals = 18;
                        if (entityData?.rewardTokens[idx]?.token?.decimals) {
                            decimals = entityData?.rewardTokens[idx]?.token?.decimals;
                            tokenNames.push(entityData.rewardTokens[idx]?.token?.name || 'TOKEN [' + idx + ']');
                        } else if (entityData?.rewardTokens[idx]?.decimals) {
                            decimals = entityData?.rewardTokens[idx]?.decimals;
                            tokenNames.push(entityData.rewardTokens[idx]?.name || 'TOKEN [' + idx + ']');
                        }
                        return convertTokenDecimals(val, decimals).toString();
                    });
                    dataType += ' [' + tokenNames.join(',') + ']';
                    if (entityField === 'rewardTokenEmissionsAmount') {
                        value = '[ ' + decimalMapped.join(", ") + " ]";
                    } else if (entityField === 'rewardTokenEmissionsUSD') {
                        value = value.map((val: string) => {
                            return '$' + Number(Number(val).toFixed(2)).toLocaleString();
                        })
                        value = '[' + value.join(', ') + ']';
                    }
                } else if (entityField === 'mintedTokenSupplies') {
                    const decimalMapped = entityData[entityField].map((val: string, idx: number) => {
                        const issueReturned = checkValueFalsey(val, schemaName, entityField + ' [' + idx + ']', fieldDataTypeChars, issues);
                        const issueReturnedToken = checkValueFalsey(entityData.mintedTokens[idx]?.decimals, schemaName, "MintedTokens [" + idx + "]", fieldDataTypeChars, issues);
                        const label = schemaName + '-' + entityField + ' [' + idx + ']';
                        if (issueReturned) {
                            issues.push(issueReturned);
                        }
                        if (issueReturnedToken || !entityData.mintedTokens || entityData.mintedTokens.length === 0) {
                            const message = "MintedTokenSupplies could not properly convert decimals, invalid decimals property on MintedTokens [" + idx + "].";
                            if (issues.filter((x) => x.fieldName === label).length === 0) {
                                issues.push({ message, type: "VAL", level: 'warning', fieldName: label });
                            }
                            return val;
                        }
                        return convertTokenDecimals(val, entityData.mintedTokens[idx].decimals).toString();
                    });
                    value = '[ ' + decimalMapped.join(", ") + " ]"
                } else if (typeof (value) === 'object' && !Array.isArray(value)) {
                    const label = schemaName + '-' + entityField;
                    if (entityField === "inputToken" || entityField === 'outputToken') {
                        if (!Number(value.decimals) && issues.filter((x) => x.fieldName === label).length === 0) {
                            issues.push({ message: '', type: "DEC", level: 'critical', fieldName: label });
                        }
                        value = { id: value.id || 'N/A', name: value.name || 'N/A', symbol: value.symbol || 'N/A', decimals: value.decimals || 0 }
                    } else if (entityField.toUpperCase().includes("INPUTTOKEN")) {
                        dataType += ' [' + entityData.inputToken.name + ']';
                    }
                    value = JSON.stringify(value);
                    value = value.split(", ").join(",").split(',').join(', ').split('"').join('');
                } else if (Array.isArray(value)) {

                    if (entityField === "inputTokens") {
                        value = value.map((val: { [x: string]: string }, idx: number) => {
                            const label = schemaName + '-' + entityField + ' ' + (val.symbol || idx);
                            if (!Number(val.decimals) && issues.filter((x) => x.fieldName === label).length === 0) {
                                issues.push({ message: "", type: "DEC", level: 'critical', fieldName: label });
                            }
                            return { id: val.id || 'N/A', name: val.name || 'N/A', symbol: val.symbol || 'N/A', decimals: val.decimals || 0 }
                        });
                    } else if (entityField === "rewardTokens") {
                        value = value.map((val: { [x: string]: any }, idx: number) => {
                            if (val?.token) {
                                const label = schemaName + '-' + entityField + ' ' + (val.token?.symbol || idx);

                                if (!Number(val.token?.decimals) && issues.filter((x) => x.fieldName === label).length === 0) {
                                    issues.push({ message: "", type: "DEC", level: 'critical', fieldName: label });
                                }
                                return { id: val.id || 'N/A', name: val.token?.name || 'N/A', symbol: val.token?.symbol || 'N/A', decimals: val.token?.decimals || 0 }
                            } else {
                                const label = schemaName + '-' + entityField + ' ' + (val.symbol || idx);

                                if (!Number(val.decimals) && issues.filter((x) => x.fieldName === label).length === 0) {
                                    issues.push({ message: "", type: "DEC", level: 'critical', fieldName: label });
                                }
                                return { id: val.id || 'N/A', name: val.name || 'N/A', symbol: val.symbol || 'N/A', decimals: val.decimals || 0 }
                            }
                        });
                    } else if (entityField.toUpperCase().includes("INPUTTOKEN")) {
                        const tokenNames = value.map((val, idx) => { return entityData.inputTokens[idx].name || 'TOKEN [' + idx + ']' });
                        dataType += ' [' + tokenNames.join(',') + ']';
                    }

                    if (isPercentageField) {
                        value = value.map((val: any) => {
                            if (!isNaN(Number(val))) {
                                return val + '%'
                            } else {
                                return val;
                            }
                        });
                    }

                    value = JSON.stringify(value);
                    value = value.split(", ").join(",").split(',').join(', ').split('"').join('');
                }
                if (!isNaN(Number(value))) {
                    if (entityField.includes("USD")) {
                        value = Number(value).toFixed(2);
                        value = '$' + Number(value).toLocaleString();
                    }
                    if (isPercentageField) {
                        value = Number(value).toFixed(2) + '%';
                    }
                }

                return (
                    <TableRow key={entityField}>
                        <TableCell component="th" scope="row" style={{ minWidth: "30vw", padding: "2px" }}>
                            {entityField}: <b>{dataType}</b>
                        </TableCell>
                        <TableCell align="right" style={{ maxWidth: "55vw", padding: "2px" }}>
                            {value}
                        </TableCell>
                    </TableRow>);
            } catch (err) {
                if (err instanceof Error) {
                    console.log('CATCH,', Object.keys(err), Object.values(err), err)
                    return <h3>JAVASCRIPT ERROR - RENDERING SCHEMA TABLE - {err.message}</h3>
                } else {
                    return <h3>JAVASCRIPT ERROR - RENDERING SCHEMA TABLE</h3>
                }
            }
        })
    }

    useEffect(() => {
        console.log('SCHEMATABLE ISSUE TO SET', issues, issuesProps)
        setIssues(issues);
    }, [issuesProps])

    let tableHeader = null;
    if (poolId && entityData) {
        tableHeader = (<>
            <div style={{ width: "100%", textAlign: "center" }}>
                <ScrollToElement label={schemaName} elementId={schemaName} poolId={poolId} tab={tabName} />
            </div>
            <h3 id={schemaName} style={{ textAlign: "center" }}>{schemaName}:</h3>
        </>)
    }

    return (<>
        {tableHeader}
        <TableContainer component={Paper} sx={{ justifyContent: "center", display: "flex", alignItems: "center" }}>
            <Table sx={{ maxWidth: 800 }} aria-label="simple table">
                <TableBody>
                    {schema}
                </TableBody>
            </Table>
        </TableContainer></>);
}

export default SchemaTable;