import { config } from "../package.json";
import { createVenueLiteService, type VenueLiteService } from "./modules/venue";
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
    venueService: VenueLiteService;
    locale?: {
      current: any;
    };
  };
  public hooks: typeof hooks;
  public api: {
    storage: WorkbenchStorage;
    venue: VenueLiteService;
  };

  constructor() {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);

    this.data = {
      alive: true,
      config,
      env: __env__,
      initialized: false,
      storage,
      venueService,
      ztoolkit: createZToolkit(),
      windowToolkits: new Map(),
    };
    this.hooks = hooks;
    this.api = {
      storage,
      venue: venueService,
    };
  }
}

export default Addon;
