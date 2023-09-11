# Configurations

- This folder contains the general configurations to use for the deployed networks/protocols

## deploy.ts

- Include a nameswap value for each protocol/network deployement. Structure these values as `PROTOCOL_NETWORK` as seen in the file as an example.
- Set the namespace value to a number. This is so the namespace value works in the case/switch in the configurations.ts file
- Also, add the to the `PROTOCOL_NETWORK` like "deployment": "PROTOCOL_NETWORK" in the network specific conficuration .json file.

## interface.ts

- The interface contains all of the fields and data types that will be stored in the Configurations class for use in the program

## configurations.ts

- This file is just used to select the proper configurations per protocol/network.
