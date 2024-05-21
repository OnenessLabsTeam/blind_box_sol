import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BlindModule = buildModule("BlindBoxModule", (m) => {
  const blindBox = m.contract("BlindBox");

  return { blindBox };
});

export default BlindModule;
