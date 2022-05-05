function SchemaTable(entitiesData: {[x: string]: {[x: string]: string}}, excludedEntities: string[]) {

  const schema = Object.keys(entitiesData).map((entityName: string) => {
    if (excludedEntities.includes(entityName)) {
        return null;
    }
    const entityFields = Object.keys(entitiesData[entityName]).map((entityField: string) => {
        const value = entitiesData[entityName][entityField];
        return (
            <li style={{fontSize: "12px", display: "flex", justifyContent: "space-between"}}>
                <span style={{flexDirection: "row"}}>{entityField}:</span>
                <span style={{flexDirection: "row"}}>   {value}</span>
            </li>);
    });
    return (
        <div style={{flexDirection: "row"}}>
            <h3>{entityName} PROTOCOL:</h3>
            <ul style={{padding: "0"}}>
                {entityFields}
            </ul>
        </div>
    )
  })
  return <div style={{display: "flex", justifyContent: "space-evenly"}}>{schema}</div>
}

export default SchemaTable;