import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
   http: {
      port: 3420,
   },
  experimental: {
    adapter: "nextjs",
  },
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
};

export default config;
