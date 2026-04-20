import { config } from "../package.json";
import hooks from "./hooks";
import {
  createWorkbenchStorage,
  type WorkbenchStorage,
} from "./modules/storage";
import { createZToolkit } from "./utils/ztoolkit";

class Addon {
  public data: {
    alive: boolean;
    config: typeof config;
    env: "development" | "production";
    initialized?: boolean;
    ztoolkit: ZToolkit;
    windowToolkits: Map<Window, ZToolkit>;
    storage: WorkbenchStorage;
    locale?: {
      current: any;
    };
  };
  public hooks: typeof hooks;
  public api: {
    storage: WorkbenchStorage;
  };

  constructor() {
    const storage = createWorkbenchStorage();

    this.data = {
      alive: true,
      config,
      env: __env__,
      initialized: false,
      storage,
      ztoolkit: createZToolkit(),
      windowToolkits: new Map(),
    };
    this.hooks = hooks;
    this.api = {
      storage,
    };
  }
}

export default Addon;
