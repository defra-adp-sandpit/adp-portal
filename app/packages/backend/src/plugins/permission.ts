import { createRouter } from '@backstage/plugin-permission-backend';
import {
    BackstageIdentityResponse,
    //IdentityClient
} from '@backstage/plugin-auth-node';
import {
    AuthorizeResult,
    PolicyDecision,
    isResourcePermission
} from '@backstage/plugin-permission-common';
import {
    PermissionPolicy,
    PolicyQuery,
} from '@backstage/plugin-permission-node';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import {
    catalogConditions,
    createCatalogConditionalDecision,
} from '@backstage/plugin-catalog-backend/alpha';

class TestPermissionPolicy implements PermissionPolicy {
    async handle(
        request: PolicyQuery,
        user?: BackstageIdentityResponse,
    ): Promise<PolicyDecision> {
        if (isResourcePermission(request.permission, 'catalog-entity')) {
            return createCatalogConditionalDecision(
                request.permission,
                catalogConditions.isEntityOwner({
                    claims: user?.identity.ownershipEntityRefs ?? [],
                }),
            );
        }
        return { result: AuthorizeResult.ALLOW };
    }
}

export default async function createPlugin(
    env: PluginEnvironment,
): Promise<Router> {
    return await createRouter({
        config: env.config,
        logger: env.logger,
        discovery: env.discovery,
        policy: new TestPermissionPolicy(),
        identity: env.identity,
    });
}