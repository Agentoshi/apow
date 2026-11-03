import { Fleet } from "./fleet";
import { startAcpSeller } from "./acp";

async function main(): Promise<void> {
  console.log("APoW Mining Pool — Starting...\n");

  // Initialize fleet
  const fleet = new Fleet();
  await fleet.initialize();
  console.log();

  // Start ACP seller
  await startAcpSeller(fleet);

  // Keep alive
  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down...");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
