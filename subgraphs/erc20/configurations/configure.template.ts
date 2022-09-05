import { getRegistryIpfsHash } from "./configurations";

let deploymentYear = {{ deploymentYear }};

export const IPFS_HASH = getRegistryIpfsHash(deploymentYear);
