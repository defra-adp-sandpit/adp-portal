/*
 * Copyright 2022 Parfümerie Douglas GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { InputError } from '@backstage/errors';
import {
  DefaultAzureDevOpsCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fetch from 'node-fetch';

export const createAzurePipelineFromGithubAction = (options: {
  integrations: ScmIntegrationRegistry;
}) => {
  const { integrations } = options;

  return createTemplateAction<{
    createApiVersion: string;
    server: string;
    organization: string;
    project: string;
    folder: string;
    name: string;
    repositoryId?: string;
    repositoryName: string;
    yamlPath?: string;
    token?: string;
    repositoryLocation?: string;
    serviceConnectionId?: string;
  }>({
    id: 'defra:azure:pipeline:create',
    description: 'Creates an Azure DevOps Pipeline.',
    schema: {
      input: {
        required: [
          'organization',
          'project',
          'folder',
          'name',
          'repositoryName',
        ],
        type: 'object',
        properties: {
          createApiVersion: {
            type: 'string',
            title: 'Create API version',
            description:
              'The Azure Create Pipeline API version to use. Defaults to 6.1-preview.1',
          },
          server: {
            type: 'string',
            title: 'Server hostname',
            description:
              'The hostname of the Azure DevOps service. Defaults to dev.azure.com',
          },
          organization: {
            type: 'string',
            title: 'Organization',
            description: 'The name of the Azure DevOps organization.',
          },
          project: {
            type: 'string',
            title: 'Project',
            description: 'The name of the Azure DevOps project.',
          },
          folder: {
            type: 'string',
            title: 'Folder',
            description: 'The name of the folder of the pipeline.',
          },
          name: {
            type: 'string',
            title: 'Name',
            description: 'The name of the pipeline.',
          },
          repositoryId: {
            type: 'string',
            title: 'Repository ID',
            description:
              'The ID of the repository. Required if Repository Location is azureReposGit.',
          },
          repositoryName: {
            type: 'string',
            title: 'Repository Name',
            description:
              'The name of the repository. If Repository Type is GitHub, this should be in the format owner-name/repo-name',
          },
          yamlPath: {
            type: 'string',
            title: 'Azure DevOps Pipelines Definition',
            description:
              'The location of the Azure DevOps Pipeline definition file. Defaults to /azure-pipelines.yaml',
          },
          token: {
            title: 'Authentication Token',
            type: 'string',
            description: 'The token to use for authorization.',
          },
          repositoryLocation: {
            title: 'Repository Location',
            type: 'string',
            description:
              'Location of the repository containing the pipeline. Allowed values: azureReposGit, gitHub. Defaults to azureReposGit',
          },
          serviceConnectionId: {
            title: 'Service Connection ID',
            type: 'string',
            description:
              'The ID of the service connection for the external repository. Required when Repository Location is gitHub',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          pipelineUrl: {
            title: 'Pipeline URL',
            type: 'string',
            description: 'A URL to the pipeline.',
          },
        },
      },
    },

    async handler(ctx) {
      const {
        createApiVersion,
        server,
        organization,
        project,
        folder,
        name,
        repositoryId,
        yamlPath,
        repositoryName,
        repositoryLocation,
        serviceConnectionId,
      } = ctx.input;

      // Handle inputs and validation
      const host = server ?? 'dev.azure.com';
      const apiVersion = createApiVersion ?? '6.1-preview.1';
      const type = integrations.byHost(host)?.type;

      if (!type) {
        throw new InputError(
          `No matching integration configuration for host ${host}, please check your integrations config`,
        );
      }

      if (
        repositoryLocation !== 'azureReposGit' &&
        repositoryLocation !== 'gitHub'
      ) {
        throw new InputError(
          'Repository Location must be either azureReposGit or gitHub',
        );
      }

      const url = `https://${host}/${organization}`;

      // Get credentials and access token
      const credentialProvider =
        DefaultAzureDevOpsCredentialsProvider.fromIntegrations(integrations);
      const credentials = await credentialProvider.getCredentials({ url: url });

      if (credentials === undefined && ctx.input.token === undefined) {
        throw new InputError(
          `No credentials provided ${url}, please check your integrations config`,
        );
      }

      const token = ctx.input.token ?? credentials!.token;

      let repository = {};
      if (repositoryLocation === 'gitHub') {
        repository = {
          fullName: repositoryName,
          connection: {
            id: serviceConnectionId,
          },
          type: 'gitHub',
        };
      } else {
        repository = {
          id: repositoryId,
          name: repositoryName,
          type: repositoryLocation || 'azureReposGit',
        };
      }

      var requestBody = {
        folder: folder,
        name: name,
        configuration: {
          type: 'yaml',
          path: yamlPath || '/azure-pipelines.yaml',
          repository: repository,
        },
      };

      ctx.logger.info(
        `Creating an Azure pipeline for the repository ${repositoryName}.`,
      );

      // See the Azure DevOps documentation for more information about the REST API:
      // https://docs.microsoft.com/en-us/rest/api/azure/devops/pipelines/pipelines/create?view=azure-devops-rest-6.1
      await fetch(
        `https://${host}/${organization}/${project}/_apis/pipelines?api-version=${apiVersion}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Basic ${Buffer.from(`PAT:${token}`).toString(
              'base64',
            )}`,
            'X-TFS-FedAuthRedirect': 'Suppress',
          },
          body: JSON.stringify(requestBody),
        },
      )
        .then(response => {
          if (response.ok) {
            ctx.logger.info(
              `Successfully created ${name} Azure pipeline in ${folder}.`,
            );
          } else {
            ctx.logger.error(
              `Failed to create Azure pipeline. Status code ${response.status}.`,
            );
          }

          return response.json();
        })
        .then(data => {
          ctx.logger.info(`The Azure pipeline ID is ${data.id}.`);
          ctx.output('pipelineId', data.id.toString());
          ctx.output('pipelineUrl', data._links.web.href);
        });
    },
  });
};
