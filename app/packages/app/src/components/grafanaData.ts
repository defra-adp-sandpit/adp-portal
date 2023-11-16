import { Entity } from '@backstage/catalog-model';

// @deprecated Use GRAFANA_ANNOTATION_DASHBOARD_SELECTOR instead.
export const GRAFANA_ANNOTATION_TAG_SELECTOR = 'grafana/tag-selector';
export const GRAFANA_ANNOTATION_DASHBOARD_SELECTOR = 'grafana/dashboard-selector';
export const GRAFANA_ANNOTATION_ALERT_LABEL_SELECTOR = 'grafana/alert-label-selector';
export const GRAFANA_ANNOTATION_OVERVIEW_DASHBOARD = 'grafana/overview-dashboard';

export const isDashboardSelectorAvailable = (entity: Entity) => entity?.metadata.annotations?.[GRAFANA_ANNOTATION_DASHBOARD_SELECTOR] || entity?.metadata.annotations?.[GRAFANA_ANNOTATION_TAG_SELECTOR];
export const isAlertSelectorAvailable = (entity: Entity) => Boolean(entity?.metadata.annotations?.[GRAFANA_ANNOTATION_ALERT_LABEL_SELECTOR]);
export const isOverviewDashboardAvailable = (entity: Entity) => Boolean(entity?.metadata.annotations?.[GRAFANA_ANNOTATION_OVERVIEW_DASHBOARD]);

export const dashboardSelectorFromEntity = (entity: Entity) => entity?.metadata.annotations?.[GRAFANA_ANNOTATION_DASHBOARD_SELECTOR] ?? entity?.metadata.annotations?.[GRAFANA_ANNOTATION_TAG_SELECTOR] ?? '';
export const alertSelectorFromEntity = (entity: Entity) => entity?.metadata.annotations?.[GRAFANA_ANNOTATION_ALERT_LABEL_SELECTOR] ?? '';
export const overviewDashboardFromEntity = (entity: Entity) => entity?.metadata.annotations?.[GRAFANA_ANNOTATION_OVERVIEW_DASHBOARD] ?? '';

// @deprecated Use dashboardSelectorFromEntity instead
export const tagSelectorFromEntity = dashboardSelectorFromEntity;
