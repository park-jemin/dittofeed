import { unwrap } from "isomorphic-lib/src/resultHandling/resultUtils";
import { schemaValidateWithErr } from "isomorphic-lib/src/resultHandling/schemaValidation";
import { err, ok, Result } from "neverthrow";
import { pick } from "remeda";

import prisma from "./prisma";
import {
  EnrichedIntegration,
  Integration,
  IntegrationDefinition,
  IntegrationResource,
  UpsertIntegrationResource,
} from "./types";

export function enrichIntegration(
  integration: Integration
): Result<EnrichedIntegration, Error> {
  const definitionResult = schemaValidateWithErr(
    integration.definition,
    IntegrationDefinition
  );
  if (definitionResult.isErr()) {
    return err(definitionResult.error);
  }
  return ok({
    ...integration,
    definition: definitionResult.value,
  });
}

export async function findAllEnrichedIntegrations(
  workspaceId: string
): Promise<Result<EnrichedIntegration[], Error>> {
  const dbVals = await prisma().integration.findMany({
    where: { workspaceId, enabled: true },
  });

  const enriched: EnrichedIntegration[] = [];
  for (const val of dbVals) {
    const integrationResult = enrichIntegration(val);
    if (integrationResult.isErr()) {
      return err(integrationResult.error);
    }
    enriched.push(integrationResult.value);
  }
  return ok(enriched);
}

export async function findEnrichedIntegration({
  workspaceId,
  name,
}: {
  workspaceId: string;
  name: string;
}): Promise<Result<EnrichedIntegration | null, Error>> {
  const integration = await prisma().integration.findUnique({
    where: {
      workspaceId_name: {
        name,
        workspaceId,
      },
    },
  });
  if (!integration) {
    return ok(null);
  }
  return enrichIntegration(integration);
}

export async function upsertIntegration({
  name,
  workspaceId,
  definition,
  enabled,
}: UpsertIntegrationResource): Promise<IntegrationResource> {
  let integration: Integration;
  if (definition) {
    integration = await prisma().integration.upsert({
      where: {
        workspaceId_name: {
          name,
          workspaceId,
        },
      },
      create: {
        name,
        workspaceId,
        definition,
        enabled,
      },
      update: {
        definition,
        enabled,
      },
    });
  } else {
    integration = await prisma().integration.update({
      where: {
        workspaceId_name: {
          name,
          workspaceId,
        },
      },
      data: {
        enabled,
      },
    });
  }
  const enriched = unwrap(enrichIntegration(integration));
  return pick(enriched, ["id", "name", "workspaceId", "definition", "enabled"]);
}
