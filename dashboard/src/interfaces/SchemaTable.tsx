import { Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

function SchemaTable(
    entityData: {[x: string]: string},
    schemaName: string,
    setWarning: React.Dispatch<React.SetStateAction<{message: string, type: string}[]>>,
    dataFields: {[x: string]: string},
    warning: {message: string, type: string}[]
) {

    const issues: {message: string, type: string}[] = warning;

    if (!entityData) {
        return null;
    }
    const schema = Object.keys(entityData).map((entityField: string) => {
        console.log(entityField, entityData[entityField], typeof(entityData[entityField]))
        if (entityField === '__typename') {
            return null;
        }
        let value = entityData[entityField];
        if (value === null || value === '0'  || value === '') {
            const message = schemaName + "-" + entityField + " is " + value + ". Verify that this value is correct";
            if (issues.filter(x => x.message === message).length === 0) {
                issues.push({message, type: "VAL"});
            }
        }
        if (typeof(value) === 'boolean') {
            if (value) {
                value = 'True';
            } else {
                value = 'False';
            }
        }
        if (!isNaN(parseFloat(value)) && (dataFields[entityField].includes('Int') || dataFields[entityField].includes('Decimal') || dataFields[entityField].includes('umber'))) {
            value = parseFloat(value).toFixed(2);
        }
        if (typeof(value) !== 'string' && typeof(value) !== 'number') {
            value = JSON.stringify(value);
        }
        if (!value) {
            return null;
        }
        return (
            <TableRow key={entityField}>
                <TableCell component="th" scope="row">
                    {entityField}: <b>{dataFields[entityField]}</b>
                </TableCell>
                <TableCell align="right">
                    {value}
                </TableCell>
            </TableRow>);
    })
    if (issues.length > 0) {
        setWarning(issues);
    }

    return (<>
        <h3 style={{textAlign: "center"}}>{schemaName}:</h3>
        <TableContainer component={Paper} sx={{justifyContent:"center", display:"flex", alignItems:"center"}}>
            <Table sx={{ maxWidth: 800 }} aria-label="simple table">
                <TableBody>
                {schema}
                </TableBody>
            </Table>
        </TableContainer></>);
}

export default SchemaTable;