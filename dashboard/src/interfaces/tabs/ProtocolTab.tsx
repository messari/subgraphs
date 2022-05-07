import { Grid } from "@mui/material";
import { Chart } from "../../chartComponents/Chart";
import { TableChart } from "../../chartComponents/TableChart";
import { ProtocolTypeEntity } from "../../constants";
import SchemaTable from "../SchemaTable";

function ProtocolTab(
  data: any,
  entities: string[],
  entitiesData: {[x: string]: {[x: string]: string}},
  protocolFields: {[x: string]: string},
  setWarning: React.Dispatch<React.SetStateAction<{message: string, type: string}[]>>,
  warning: {message: string, type: string}[]
) {

  const issues: {message: string, type: string}[] = warning;

  console.log(entitiesData)
  const excludedEntities = [
    "liquidityPoolHourlySnapshots", 
    "liquidityPoolDailySnapshots", 
    "marketHourlySnapshots", 
    "marketDailySnapshots", 
    "vaultHourlySnapshots",
    "vaultDailySnapshots"
  ]
  const protocolData = entities.map((entityName: string) => {
    // Exclude the following entities because they are not on the protocol tab
    if (excludedEntities.includes(entityName)) {
      return null;
    }
    const currentEntityData = data[entityName];
    // If the current entity has no instances, return the following
    if (currentEntityData.length === 0) {
      return <Grid key={entityName} style={{borderTop: "black 2px solid"}}><h2>ENTITY: {entityName}</h2><h3 style={{color: "red"}}>{entityName} HAS NO INSTANCES.</h3></Grid>
    }
    // dataFields object has corresponding key:value pairs. Key is the field name and value is an array with an object holding the coordinates to be plotted on the chart for that entity field.
    const dataFields: {[dataField: string]: [{date: number, value: number}]} = {};
    // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
    const dataFieldMetrics: {[dataField: string]: {[metric: string]: any}} = {}
    // For the current entity, loop through all instances of that entity
    for (let x = currentEntityData.length - 1; x > 0; x--) {
      const entityInstance: {[x: string]: any } = currentEntityData[x];
      // On the entity instance, loop through all of the entity fields within it
      Object.keys(entityInstance).forEach((entityFieldName: string) => {
        // skip the timestamp field on each entity instance
        if (entityFieldName === 'timestamp') {
          return;
        }
        // The following section determines whether or not the current field on the entity is a numeric value or an array that contains numeric values
        const currentInstanceField = entityInstance[entityFieldName];
        if (!isNaN(currentInstanceField)) {
          // If the entity field is a numeric value, push it to the array corresponding to the field name in the dataFields array
          // Add the value to the sum field on the entity field name in the dataFieldMetrics obj
          if (!dataFields[entityFieldName]) {
            dataFields[entityFieldName] = [{value: Number(currentInstanceField), date: Number(entityInstance.timestamp)}];
            dataFieldMetrics[entityFieldName] = {sum: Number(currentInstanceField)};
          } else {
            dataFields[entityFieldName].push({value: Number(currentInstanceField), date: Number(entityInstance.timestamp)});
            dataFieldMetrics[entityFieldName].sum += Number(currentInstanceField);
          }
          if (entityFieldName.includes('umulative')) {
            if (!Object.keys(dataFieldMetrics[entityFieldName]).includes('cumulative')) {
              dataFieldMetrics[entityFieldName].cumulative = {prevVal: 0, hasLowered: 0}
            }
            if (Number(currentInstanceField) < dataFieldMetrics[entityFieldName].cumulative.prevVal) {
              dataFieldMetrics[entityFieldName].cumulative.hasLowered = Number(entityInstance.timestamp);
            }
            dataFieldMetrics[entityFieldName].cumulative.prevVal = Number(currentInstanceField);
          }
        } else if (Array.isArray(currentInstanceField)) {
          // if the current entity field is an array, loop through it and create separate dataField keys for each index of the array
          // This way, each index on the field will have its own chart (ie rewardTokenEmissions[0] and rewardTokenEmissions[1] have their own charts)
          currentInstanceField.forEach((val: string, arrayIndex: number) => {
            const dataFieldKey = entityFieldName + ' [' + arrayIndex + ']';
            if (!dataFields[dataFieldKey]) {
              dataFields[dataFieldKey] = [{value: Number(val), date: Number(entityInstance.timestamp)}];
              dataFieldMetrics[dataFieldKey] = {sum: Number(val)};
            } else {
              dataFields[dataFieldKey].push({value: Number(val), date: Number(entityInstance.timestamp)});
              dataFieldMetrics[dataFieldKey].sum += Number(val);
            }
            if (dataFieldKey.includes('umulative')) {
              if (!Object.keys(dataFieldMetrics[dataFieldKey]).includes('cumulative')) {
                dataFieldMetrics[dataFieldKey].cumulative = {prevVal: 0, hasLowered: 0}
              }
              if (Number(val) < dataFieldMetrics[dataFieldKey].cumulative.prevVal) {
                dataFieldMetrics[dataFieldKey].cumulative.hasLowered = Number(entityInstance.timestamp);
              }
              dataFieldMetrics[dataFieldKey].cumulative.prevVal = Number(val);
            }
          });
        }
      });
    };

    // For each entity field/key in the dataFields object, create a chart and tableChart component
    // If the sum of all values for a chart is 0, display a warning that the entity is not properly collecting data
    console.log(dataFields)
    return (<>
    <h2 style={{borderTop: "black 2px solid", width: "100%"}}>ENTITY: {entityName}</h2>
    <Grid key={entityName}container>{
      Object.keys(dataFields).map((field: string) => {
        // The following checks if the field is required or can be null
        const schemaFieldTypeString = entitiesData[entityName][field].split("");
        if (schemaFieldTypeString[schemaFieldTypeString.length - 1] !== '!') {
          return null;
        }
        const label = entityName + '-' + field;
        if (issues.filter(x => x.message === label && x.type === "SUM").length === 0 && dataFieldMetrics[field].sum === 0) {
          // Create a warning for the 0 sum of all snapshots for this field
          issues.push({type: "SUM", message: label});
        }        
        if (issues.filter(x => x.message === label && x.type === "CUMULATIVE").length === 0 && dataFieldMetrics[field]?.cumulative?.hasLowered > 0) {
          issues.push({type: "CUMULATIVE", message: label + '++' + dataFieldMetrics[field].cumulative.hasLowered});
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
    }</Grid></>)
  });

  const protTypeEntity = ProtocolTypeEntity[data.protocols[0].type]
  const protocolLevelTVL = parseFloat(data[protTypeEntity][0]?.totalValueLockedUSD)
  if (issues.filter(x => x.message === protTypeEntity && x.type === "TVL-").length === 0 && protocolLevelTVL < 1000) {
    issues.push({type: "TVL-", message: protTypeEntity});
  } else if (issues.filter(x => x.message === protTypeEntity && x.type === "TVL+").length === 0 && protocolLevelTVL > 1000000000000) {
    issues.push({type: "TVL+", message: protTypeEntity});
  }

  const protocolSchema = SchemaTable(data[protTypeEntity][0], protTypeEntity, setWarning, protocolFields, warning);

  if (issues.length > 0) {
    setWarning(issues);
  }

  return (<>
    {protocolSchema}
    {protocolData}
    </>)
}

export default ProtocolTab;