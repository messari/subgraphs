import os
changedFile = os.environ['CHANGED_FILES']
absolutePath = os.environ['ABSOLUTE_PATH']

def replace_str_index(text,index=0,replacement=''):
    return '%s%s%s'%(text[:index],replacement,text[index+1:])

# Parse a string by spaces and turn it into a list
changedFileList = changedFile.split(' ')
changedSrcFilesDict = {}

for item in changedFileList:
    # Check if the file contains the word "/src/"
    if "/src/" in item:
        # Get Subgraph Directory
        subgraphDir = item.split('subgraphs/')[1].split('/')[0]
        print(subgraphDir)

        if subgraphDir not in changedSrcFilesDict:
            changedSrcFilesDict[subgraphDir] = {}

        # if 2 directories before /src/ equals protocol include protocol in changed directories dictionary
        if "protocols" in item.split("/src/")[0].split('/')[-2]:
            protocol = item.split("/src/")[0].split('/')[-1]

            if protocol in changedSrcFilesDict[subgraphDir]:
                changedSrcFilesDict[subgraphDir][protocol].append(item)
            else:
                changedSrcFilesDict[subgraphDir][protocol] = [item]

        # Include if src directory that is common to all protocols is changed
        else: 
            changedSrcFilesDict[subgraphDir]["Common"] = [item]
    


# Increment the PROTOCOL_SUBGRAPH_VERSION if a file in the protoocl directory is changed
for subgraphDir, protocols in changedSrcFilesDict.items():
    for protocol in protocols.keys():
        print(protocol)
        if protocol == "Common":
            subgraphForksVersion = ''
            constantsData = ''

            with open(absolutePath + '/subgraphs/' + subgraphDir + '/src/common/constants.ts', 'r') as f:
                for line in f.readlines():
                    if line.find('SUBGRAPH_FORKS_VERSION') != -1:
                        subgraphForksVersion = line.strip()
            
            # Increment the subgraph forks version          
            newSubgraphForksVersion = replace_str_index(subgraphForksVersion, subgraphForksVersion.rfind('.') + 1, str(int(subgraphForksVersion[subgraphForksVersion.rfind('.') + 1]) + 1))
            constantsData = constantsData.replace(subgraphForksVersion, newSubgraphForksVersion)

            # Write out the new constants data
            # Write the file out again
            with open(absolutePath + '/subgraphs/' + subgraphDir + '/src/common/constants.ts', 'w') as file:
                file.write(constantsData)

        else:
            subgraphVersion = ''
            constantsData = ''

            # Read in constants data and extract versions
            with open(absolutePath + '/subgraphs/' + subgraphDir + '/protocols/' + protocol + '/src/common/constants.ts', 'r') as file:
                constantsData = file.read()
                file.seek(0)
                for line in file.readlines():
                    if line.find('PROTOCOL_SUBGRAPH_VERSION') != -1:
                        subgraphVersion = line.strip()
                
            # Increment the subgraph version          
            newSubgraphVersion = replace_str_index(subgraphVersion, subgraphVersion.rfind('.') + 1, str(int(subgraphVersion[subgraphVersion.rfind('.') + 1]) + 1))
            constantsData = constantsData.replace(subgraphVersion, newSubgraphVersion)

            # Write out the new constants data
            # Write the file out again
            with open(absolutePath + '/subgraphs/' + subgraphDir + '/protocols/' + protocol + '/src/common/constants.ts', 'w') as file:
                file.write(constantsData)