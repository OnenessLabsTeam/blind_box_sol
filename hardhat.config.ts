import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

import networkConfig from './hardhat.network'

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "hardhat",
  networks: networkConfig,
  mocha: {
    timeout: 20000,
  },


  etherscan: {

    apiKey: process.env.ETHERSCAN_API_KEY
  }, 

  sourcify: {

    enabled: true
  }
};

export default config;
