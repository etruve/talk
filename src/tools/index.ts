import { writeEnvVar } from "./writeEnvVar.js";
import { createRlsPolicy } from "./createRlsPolicy.js";
import { applyMigration } from "./applyMigration.js";

export const tools = [
  writeEnvVar,
  createRlsPolicy,
  applyMigration
];
