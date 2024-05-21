import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import networkConfig from './hardhat.network'

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "hardhat",
  networks: networkConfig,
  mocha: {
    timeout: 20000,
  }
};

export default config;
