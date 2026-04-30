import { Server } from "@modelcontextprotocol/sdk/server";
import { tools } from "./tools/index.js";

const server = new Server({
  name: "supabase-mcp",
  version: "1.0.0",
  tools
});

server.start();
