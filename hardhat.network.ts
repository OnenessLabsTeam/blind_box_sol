import { NetworksUserConfig } from 'hardhat/types'
import dotenv from 'dotenv';

dotenv.config();

const networkConfig: NetworksUserConfig = {
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
    accounts: [process.env.PRIVATE_LOCALHOST!]
  },
  polygon: {
    url: "https://polygon-rpc.com",
    accounts: [process.env.PRIVATE_POLYGON!],
    chainId: 137
  },
}

export default networkConfig