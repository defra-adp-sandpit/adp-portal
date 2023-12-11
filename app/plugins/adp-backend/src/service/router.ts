import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { addDeliveryProgramme, getAllDeliveryProgrammes, updateDeliveryProgramme } from './deliveryProgrammes';
import { InputError } from '@backstage/errors';
import { IdentityApi } from '@backstage/plugin-auth-node';

export interface RouterOptions {
  logger: Logger;
  identity: IdentityApi;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, identity } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/deliveryProgrammes', async (_req, res) => {
    res.json(getAllDeliveryProgrammes());
  });

  router.post('/deliveryProgrammes', async (req, res) => {
    let author: string | undefined = undefined;

    const user = await identity.getIdentity({ request: req });
    author = user?.identity.userEntityRef;

    if (!isDeliveryProgrammeCreateRequest(req.body)) {
      throw new InputError('Invalid payload');
    }

    //const deliveryProgramme = addDeliveryProgramme({ name: req.body.name, title: req.body.title, armLengthBody: req.body.armLengthBody, deliveryProgrammeCode: req.body.deliveryProgrammeCode, description: req.body.description });
    const deliveryProgramme = addDeliveryProgramme(req.body);
    res.json(deliveryProgramme);
  });

  router.put('/deliveryProgrammes', async (req, res) => {
    if (!isDeliveryProgrammeUpdateRequest(req.body)) {
      throw new InputError('Invalid payload');
    }
    res.json(updateDeliveryProgramme(req.body));
  });


  router.use(errorHandler());
  return router;
}


function isDeliveryProgrammeCreateRequest(request: any): request is { name: string; title: string; armLengthBody: string; deliveryProgrammeCode: number; description?: string; } {
  return typeof request?.name === 'string';
}

function isDeliveryProgrammeUpdateRequest(
  request: any,
): request is { id: string; name: string; title: string; armLengthBody: string; deliveryProgrammeCode: number; description?: string; } {
  return typeof request?.id === 'string' && isDeliveryProgrammeCreateRequest(request);
}