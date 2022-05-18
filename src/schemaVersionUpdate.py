import os
changedFile = os.environ['CHANGED_FILES']
absolutePath = os.environ['ABSOLUTE_PATH']

# Parse a string by spaces and turn it into a list
changedFileList = changedFile.split(' ')
changedSchemaFilesDict = {}

# Iterate through all changed files
for item in changedFileList:
    # Check if the file contains the word "/src/"
    if item.split('/')[-1] == "schema.graphql":
        # Get Subgraph Directories where the schema changed
        subgraphDir = item.split('subgraphs/')[1].split('/')[0]
        schemaVersion = ''

        with open(absolutePath + '/subgraphs/' + subgraphDir + 'schema.graphql', 'r') as f:
            for line in f.readlines():
                if line.find('# Version:') != -1:
                    schemaVersion = line.split(':')[1].strip()
        
        # Keep track of schema version per directory
        changedSchemaFilesDict[subgraphDir] = schemaVersion

# Increment the PROTOCOL_SUBGRAPH_VERSION if a file in the protoocl directory is changed
for subgraphDir, schemaVersion in changedSchemaFilesDict.items():
    constantsData = ''
    oldSchemaVerision = ''

    with open(absolutePath + '/subgraphs/' + subgraphDir + '/src/common/constants.ts', 'r') as f:
        constantsData = f.read()
        f.seek(0)
        for line in f.readlines():
            if line.find('PROTOCOL_SCHEMA_VERSION') != -1:
                oldSchemaVerision = line.strip()
                
    # Update constants data with new schema version
    constantsData = constantsData.replace(oldSchemaVerision, schemaVersion)

    # Write out the new constants data
    # Write the file out again
    with open(absolutePath + '/subgraphs/' + subgraphDir + '/src/common/constants.ts', 'w') as file:
        file.write(constantsData)