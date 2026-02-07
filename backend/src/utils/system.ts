import { spawn } from "child_process";
import { existsSync } from "fs";

export const revealPath = (targetPath: string) => {
  if (!existsSync(targetPath)) {
    throw new Error("Path does not exist");
  }

  const command = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(command, [targetPath], { stdio: "ignore", detached: true }).unref();
};
