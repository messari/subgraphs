import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import { Chart } from "../../chartComponents/Chart";
import { TableChart } from "../../chartComponents/TableChart";
import { poolDropDown } from "../../utilComponents/PoolDropDown";
import { PoolName, PoolNames, Versions } from "../../constants";
import SchemaTable from "../SchemaTable";

function PoolTab(
  data: any,
  entities: string[],
  entitiesData: {[x: string]: {[x: string]: string}},
  poolId: string,
  setPoolId: React.Dispatch<React.SetStateAction<string>>,
  poolData: {[x: string]: string},
  parseMetaData: any,
  setWarning: React.Dispatch<React.SetStateAction<{message: string, type: string}[]>>
) {

    const issues: {message: string, type: string}[] = [];
    const excludedEntities = [
        "financialsDailySnapshots",
        "usageMetricsDailySnapshots",
        "usageMetricsHourlySnapshots"
    ]
    const poolEntityElements = entities.map((entityName: string) => {
        if (!poolId) {
          return null;
        }
        if (excludedEntities.includes(entityName)) {
          return null;
        }
        const currentEntityData = data[entityName];
        if (currentEntityData.length === 0) {
          return <Grid key={entityName} style={{borderTop: "black 2px solid"}}><h2>ENTITY: {entityName}</h2><h3 style={{color: "red"}}>{entityName} HAS NO INSTANCES.</h3></Grid>
        }
        const dataFields: {[dataField: string]: [{date: number, value: number}]} = {};
        // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
        const dataFieldMetrics: {[dataField: string]: {[metric: string]: number}} = {}
        currentEntityData.forEach((entityInstance: {[x: string]: any }) => {
          Object.keys(entityInstance).forEach((entityFieldName: string) => {
            if (entityFieldName === 'timestamp') {
              return;
            }
            const currentInstanceField = entityInstance[entityFieldName];
            if (!isNaN(currentInstanceField)) {
              if (!dataFields[entityFieldName]) {
                dataFields[entityFieldName] = [{value: Number(currentInstanceField), date: Number(entityInstance.timestamp)}];
                dataFieldMetrics[entityFieldName] = {sum: Number(currentInstanceField)};
              } else {
                dataFields[entityFieldName].push({value: Number(currentInstanceField), date: Number(entityInstance.timestamp)});
                dataFieldMetrics[entityFieldName].sum += Number(currentInstanceField);
              }
            } else if (Array.isArray(currentInstanceField)) {
              currentInstanceField.forEach((val: string, arrayIndex: number) => {
                const dataFieldKey = entityFieldName + ' [' + arrayIndex + ']';
                if (!dataFields[dataFieldKey]) {
                  dataFields[dataFieldKey] = [{value: Number(val), date: Number(entityInstance.timestamp)}];
                  dataFieldMetrics[dataFieldKey] = {sum: Number(val)};
                } else {
                  dataFields[dataFieldKey].push({value: Number(val), date: Number(entityInstance.timestamp)});
                  dataFieldMetrics[dataFieldKey].sum += Number(val);
                }
              });
            }
          });
        });

        return ( <Grid key={entityName} style={{borderTop: "black 2px solid"}} container><h2>ENTITY: {entityName} - {poolId}</h2>{          
          Object.keys(dataFields).map((field: string) => {
            const fieldName = field.split(' [')[0]
            const schemaFieldTypeString = entitiesData[entityName][fieldName].split("");
            console.log('schemaFieldTypeString', schemaFieldTypeString)
            if (schemaFieldTypeString[schemaFieldTypeString.length - 1] !== '!') {
              return null;
            }
            const label = entityName + '-' + field;
            if (dataFieldMetrics[field].sum === 0) {
              // The error message is more to be used as data on how to handle the error. Syntax is ERRORTYPE%%ENTITY--FIELD
              issues.push({type: "SUM", message: label});
            }
            return (<>
              <Grid key={label + '1'} id={label} item xs={8}>
                {Chart(label, dataFields[field], currentEntityData.length)}
              </Grid>
              <Grid key={label + '2'} item xs={4} marginY={4}>
                {TableChart(label, dataFields[field], currentEntityData.length)}
              </Grid>
            </>)
          })
        }</Grid>)
      })

    if (issues.length > 0) {
      setWarning(issues);
    }

    const schemaDisplayObj: {[x: string]: any} = {};
    if (data.protocols[0].type === "LENDING") {
      schemaDisplayObj.Market = poolData;
    } else if (data.protocols[0].type === "EXCHANGE") {
      schemaDisplayObj.LiquidityPool = poolData;
    } else if (data.protocols[0].type === "YIELD") {
      schemaDisplayObj.Vault = poolData;
    }
  
    const poolSchema = SchemaTable(schemaDisplayObj, []);

    return (
      <div>
        {poolSchema}
        {poolDropDown(poolId, setPoolId, data.markets, PoolNames)}
          {poolId
            ?
            <TableContainer component={Paper} sx={{justifyContent:"center", display:"flex", alignItems:"center"}}>
              <Table sx={{ maxWidth: 800 }} aria-label="simple table">
                <TableBody>

                  {
                    Object.keys(poolData).map((item) => {
                      const val = String(data.protocols[0].type);
                      const poolName = PoolName[val];
                      const poolValues = data[poolName];
                      let value = poolValues[item];
                      if (value === "" || !value) {
                        return null;
                      }
      
                      return (
                        <TableRow key={item}>
                          <TableCell component="th" scope="row">
                            {item}
                          </TableCell>
                          <TableCell align="right">{parseMetaData(value, item,poolValues)}</TableCell>
                        </TableRow>
                      );
                    })
                  }
                </TableBody>
              </Table>
            </TableContainer>

          : null}
      {poolEntityElements}
    </div>)
}

export default PoolTab;