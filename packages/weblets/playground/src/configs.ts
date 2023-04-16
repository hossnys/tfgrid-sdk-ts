import * as bip39 from "bip39";
import * as buffer from "buffer";
import * as grid3_client from "@threefold/grid_client";

(window as any).configs = (window as any).configs || {};
(window as any).configs = {
  ...(window as any).configs,
  grid3_client,
  buffer,
  bip39,
};
