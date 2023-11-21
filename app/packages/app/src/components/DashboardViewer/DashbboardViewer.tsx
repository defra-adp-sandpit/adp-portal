import React from 'react';
import { MissingAnnotationEmptyState } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  GRAFANA_ANNOTATION_OVERVIEW_DASHBOARD,
  isOverviewDashboardAvailable,
  overviewDashboardFromEntity,
} from '../grafanaData';

export const DashboardViewer = ({ embedUrl }: { embedUrl: string }) => {
  return (
    <iframe
      title={embedUrl}
      src={embedUrl}
      width="100%"
      height="100%"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
};

export const EntityDashboardViewer = () => {
  const { entity } = useEntity();

  if (!isOverviewDashboardAvailable(entity)) {
    return <MissingAnnotationEmptyState annotation={GRAFANA_ANNOTATION_OVERVIEW_DASHBOARD} />;
  }

  return <DashboardViewer embedUrl={overviewDashboardFromEntity(entity)} />
};
