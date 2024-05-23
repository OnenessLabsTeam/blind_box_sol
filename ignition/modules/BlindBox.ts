import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BlindModule = buildModule("BlindBoxModule", (m) => {
  const blindBox = m.contract("BlindBox", ['0xec0Ed46f36576541C75739E915ADbCb3DE24bD77', '47225420270030672331877805671259471483971290922317966095933368978776459192708']);

  return { blindBox };
});

export default BlindModule;
