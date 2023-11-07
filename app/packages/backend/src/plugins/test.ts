import {
    AuthorizeResult,
    PolicyDecision,
    isPermission,
    isResourcePermission,
  } from '@backstage/plugin-permission-common';
  import {
    catalogConditions,
    createCatalogConditionalDecision,
  } from '@backstage/plugin-catalog-backend/alpha';
  import {
    catalogEntityDeletePermission,
  } from '@backstage/plugin-catalog-common/alpha';
  
  class TestPermissionPolicy implements PermissionPolicy {
    async handle(
      request: PolicyQuery,
      user?: BackstageIdentityResponse,
    ): Promise<PolicyDecision> {
      if (isPermission(request.permission, catalogEntityDeletePermission)) {
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