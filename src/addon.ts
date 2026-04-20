import { config } from "../package.json";
import {
  createArtifactHubService,
  type ArtifactHubService,
} from "./modules/artifact";
import {
  createReadingNoteTemplateService,
  type ReadingNoteTemplateService,
} from "./modules/notes";
import {
  createRelatedWorkExportService,
  type RelatedWorkExportService,
} from "./modules/relatedWork";
import {
  createStructuredTagService,
  type StructuredTagService,
} from "./modules/tags";
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
    artifactService: ArtifactHubService;
    readingNoteService: ReadingNoteTemplateService;
    relatedWorkService: RelatedWorkExportService;
    registeredColumnKeys: string[];
    registeredMenuIDs: string[];
    registeredSectionIDs: string[];
    tagService: StructuredTagService;
    venueService: VenueLiteService;
    locale?: {
      current: any;
    };
  };
  public hooks: typeof hooks;
  public api: {
    artifact: ArtifactHubService;
    readingNotes: ReadingNoteTemplateService;
    relatedWork: RelatedWorkExportService;
    storage: WorkbenchStorage;
    tags: StructuredTagService;
    venue: VenueLiteService;
  };

  constructor() {
    const storage = createWorkbenchStorage();
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);
    const venueService = createVenueLiteService(storage);
    const readingNoteService = createReadingNoteTemplateService(
      venueService,
      artifactService,
    );
    const relatedWorkService = createRelatedWorkExportService(
      venueService,
      artifactService,
      tagService,
    );

    this.data = {
      alive: true,
      config,
      env: __env__,
      initialized: false,
      artifactService,
      readingNoteService,
      relatedWorkService,
      registeredColumnKeys: [],
      registeredMenuIDs: [],
      registeredSectionIDs: [],
      storage,
      tagService,
      venueService,
      ztoolkit: createZToolkit(),
      windowToolkits: new Map(),
    };
    this.hooks = hooks;
    this.api = {
      artifact: artifactService,
      readingNotes: readingNoteService,
      relatedWork: relatedWorkService,
      storage,
      tags: tagService,
      venue: venueService,
    };
  }
}

export default Addon;
