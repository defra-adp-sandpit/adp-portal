import React from 'react';
import { render } from '@testing-library/react';
import { DashboardsTable } from './DashboardsCard';

describe('DashboardsTable', () => {
  const entityMock = {
    metadata: {
      namespace: 'default',
      annotations: {},
      name: 'mocked-service',
    },
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    spec: {
      type: 'service',
      owner: 'John Doe',
      lifecycle: 'experimental',
    },
  }

  it('should render even with no dashboards', async () => {
    const rendered = render(<DashboardsTable dashboards={[]} entity={entityMock} opts={{}} />);

    expect(await rendered.findByText('No records to display')).toBeInTheDocument();
  });
});
