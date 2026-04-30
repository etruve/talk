import fs from "node:fs";
import path from "node:path";

export const writeEnvVar = {
  name: "writeEnvVar",
  description: "Write or update a key=value pair in the .env.local file",
  inputSchema: {
    type: "object",
    properties: {
      key: { type: "string" },
      value: { type: "string" }
    },
    required: ["key", "value"]
  },
  async handler({ key, value }) {
    const envPath = path.join(process.cwd(), ".env.local");

    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf8");
    }

    const lines = content.split("\n").filter(Boolean);
    const existingIndex = lines.findIndex((l) => l.startsWith(`${key}=`));

    if (existingIndex !== -1) {
      lines[existingIndex] = `${key}=${value}`;
    } else {
      lines.push(`${key}=${value}`);
    }

    fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf8");

    return { message: `Updated ${key} in .env.local` };
  }
};
