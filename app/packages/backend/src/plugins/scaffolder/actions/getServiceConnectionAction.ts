import { InputError } from '@backstage/errors';
import {
  DefaultAzureDevOpsCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fetch from 'node-fetch';

export const getAdoServiceConnectionAction = (options: {
  integrations: ScmIntegrationRegistry;
}) => {
  const { integrations } = options;

  return createTemplateAction<{
    createApiVersion: string;
    server: string;
    organization: string;
    project: string;
    serviceConnectionName: string;
    token?: string;
  }>({
    id: 'defra:azure:serviceconnection:get',
    description: 'Gets a service connection from an ADO organization',
    schema: {
      input: {
        required: ['organization', 'project', 'serviceConnectionName'],
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
          serviceConnectionName: {
            title: 'Service Connection Name',
            type: 'string',
            description:
              'The name of the service connection for the external repository. Required when Repository Location is gitHub',
          },
          token: {
            title: 'Authentication Token',
            type: 'string',
            description: 'The token to use for authorization.',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          serviceConnectionId: {
            title: 'Service Connection ID',
            type: 'string',
            description: 'The Service Connection ID from Azure DevOps',
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
        serviceConnectionName,
      } = ctx.input;

      const host = server ?? 'dev.azure.com';
      const apiVersion = createApiVersion ?? '6.1-preview.1';
      const type = integrations.byHost(host)?.type;
      var serviceConnectionId = '';

      if (!type) {
        throw new InputError(
          `No matching integration configuration for host ${host}, please check your integrations config`,
        );
      }

      const url = `https://${host}/${organization}`;

      const credentialProvider =
        DefaultAzureDevOpsCredentialsProvider.fromIntegrations(integrations);
      const credentials = await credentialProvider.getCredentials({ url: url });

      if (credentials === undefined && ctx.input.token === undefined) {
        throw new InputError(
          `No credentials provided ${url}, please check your integrations config`,
        );
      }

      const token = ctx.input.token ?? credentials!.token;
      const auth = Buffer.from(`PAT:${token}`).toString('base64');

      ctx.logger.info(
        `Looking for service connection named ${serviceConnectionName} in project ${project}`,
      );

      var endpoint = `https://${host}/${organization}/${project}/_apis/serviceendpoint/endpoints?endpointNames=${serviceConnectionName}&api-version=${apiVersion}`;

      await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
          'X-TFS-FedAuthRedirect': 'Suppress',
        },
      })
        .then(response => {
          if (response.ok) {
            ctx.logger.info(
              `Found Service Connection named ${serviceConnectionName}`,
            );
          } else {
            ctx.logger.error(
              `Could not find Service Connection. Status code ${response.status}`,
            );
          }

          return response.json();
        })
        .then(data => {
          serviceConnectionId = data[0].id;
          ctx.logger.info(`Service connection ID - ${serviceConnectionId}`);
          ctx.output('serviceConnectionId', serviceConnectionId);
        });
    },
  });
};
