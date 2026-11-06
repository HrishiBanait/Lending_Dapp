const hre = require("hardhat");

async function main() {
  const platform = await hre.ethers.deployContract("LendingPlatform");
  await platform.waitForDeployment();

  console.log("LendingPlatform deployed to:", await platform.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});