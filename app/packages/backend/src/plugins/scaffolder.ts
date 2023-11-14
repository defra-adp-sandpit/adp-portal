import { CatalogClient } from '@backstage/catalog-client';
import {
  createBuiltinActions,
  createRouter,
} from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { ScmIntegrations } from '@backstage/integration';
import {
  permitAzurePipelineAction,
  runAzurePipelineAction,
} from '@antoniobergas/scaffolder-backend-module-azure-pipelines';
import { createAzurePipelineFromGithubAction } from './scaffolder/actions/createAzurePipelineAction';
import { getAdoServiceConnectionAction } from './scaffolder/actions/getServiceConnectionAction';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });

  const integrations = ScmIntegrations.fromConfig(env.config);

  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: env.config,
    reader: env.reader,
  });

  const actions = [
    ...builtInActions,
    permitAzurePipelineAction({ integrations }),
    runAzurePipelineAction({ integrations }),
    createAzurePipelineFromGithubAction({ integrations }),
    getAdoServiceConnectionAction({ integrations }),
  ];

  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    catalogClient,
    identity: env.identity,
    permissions: env.permissions,
    actions: actions,
  });
}
