import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';
import { Alert, Dashboard } from './types';
import { createApiRef, DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';

export interface GrafanaApi {
  listDashboards(query: string): Promise<Dashboard[]>;
  alertsForSelector(selector: string): Promise<Alert[]>;
}

interface AlertRuleGroupConfig {
  name: string;
  rules: AlertRule[];
}

interface GrafanaAlert {
  id: number;
  panelId: number;
  name: string;
  state: string;
  url: string;
}

interface UnifiedGrafanaAlert {
  uid: string;
  title: string;
}

interface AlertRule {
  labels: Record<string, string>;
  grafana_alert: UnifiedGrafanaAlert;
}

export const grafanaApiRef = createApiRef<GrafanaApi>({
  id: 'plugin.grafana.service',
});

export type Options = {
  discoveryApi: DiscoveryApi;
  identityApi: IdentityApi;

  /**
   * Domain used by users to access Grafana web UI.
   * Example: https://monitoring.my-company.com/
   */
  domain: string;

  /**
   * Path to use for requests via the proxy, defaults to /grafana/api
   */
  proxyPath?: string;
};

const DEFAULT_PROXY_PATH = '/grafana/api';

const isSingleWord = (input: string): boolean => {
  return input.match(/^[\w-]+$/g) !== null;
}

class Client {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;
  private readonly proxyPath: string;
  private readonly queryEvaluator: QueryEvaluator;

  constructor(opts: Options) {
    this.discoveryApi = opts.discoveryApi;
    this.identityApi = opts.identityApi;
    this.proxyPath = opts.proxyPath ?? DEFAULT_PROXY_PATH;
    this.queryEvaluator = new QueryEvaluator();
  }

  public async fetch<T = any>(input: string, init?: RequestInit): Promise<T> {
    const apiUrl = await this.apiUrl();
    const authedInit = await this.addAuthHeaders(init || {});

    const resp = await fetch(`${apiUrl}${input}`, authedInit);
    if (!resp.ok) {
      throw new Error(`Request failed with ${resp.status} ${resp.statusText}`);
    }

    return await resp.json();
  }

  async listDashboards(domain: string, query: string): Promise<Dashboard[]> {
    if (isSingleWord(query)) {
      return this.dashboardsByTag(domain, query);
    }

    return this.dashboardsForQuery(domain, query);
  }

  async dashboardsForQuery(domain: string, query: string): Promise<Dashboard[]> {
    const parsedQuery = this.queryEvaluator.parse(query);
    const response = await this.fetch<Dashboard[]>(`/api/search?type=dash-db`);
    const allDashboards = this.fullyQualifiedDashboardURLs(domain, response);

    return allDashboards.filter((dashboard) => {
      return this.queryEvaluator.evaluate(parsedQuery, dashboard) === true;
    });
  }

  async dashboardsByTag(domain: string, tag: string): Promise<Dashboard[]> {
    const response = await this.fetch<Dashboard[]>(`/api/search?type=dash-db&tag=${tag}`);

    return this.fullyQualifiedDashboardURLs(domain, response);
  }

  private fullyQualifiedDashboardURLs(domain: string, dashboards: Dashboard[]): Dashboard[] {
    return dashboards.map(dashboard => ({
      ...dashboard,
      url: domain + dashboard.url,
      folderUrl: domain + dashboard.folderUrl,
    }));
  }

  private async apiUrl() {
    const proxyUrl = await this.discoveryApi.getBaseUrl('proxy');
    return proxyUrl + this.proxyPath;
  }

  private async addAuthHeaders(init: RequestInit): Promise<RequestInit> {
    const { token } = await this.identityApi.getCredentials();
    const headers = init.headers || {};

    return {
      ...init,
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    };
  }
}

export class GrafanaApiClient implements GrafanaApi {
  private readonly domain: string;
  private readonly client: Client;

  constructor(opts: Options) {
    this.domain = opts.domain;
    this.client = new Client(opts);
  }

  async listDashboards(query: string): Promise<Dashboard[]> {
    return this.client.listDashboards(this.domain, query);
  }

  async alertsForSelector(dashboardTag: string): Promise<Alert[]> {
    const response = await this.client.fetch<GrafanaAlert[]>(`/api/alerts?dashboardTag=${dashboardTag}`);

    return response.map(alert => (
      {
        name: alert.name,
        state: alert.state,
        url: `${this.domain}${alert.url}?panelId=${alert.panelId}&fullscreen&refresh=30s`,
      }
    ));
  }
}

export class UnifiedAlertingGrafanaApiClient implements GrafanaApi {
  private readonly domain: string;
  private readonly client: Client;

  constructor(opts: Options) {
    this.domain = opts.domain;
    this.client = new Client(opts);
  }

  async listDashboards(query: string): Promise<Dashboard[]> {
    return this.client.listDashboards(this.domain, query);
  }

  async alertsForSelector(selector: string): Promise<Alert[]> {
    const response = await this.client.fetch<Record<string, AlertRuleGroupConfig[]>>('/api/ruler/grafana/api/v1/rules');
    const rules = Object.values(response).flat().map(ruleGroup => ruleGroup.rules).flat();
    const [label, labelValue] = selector.split('=');

    const matchingRules = rules.filter(rule => rule.labels && rule.labels[label] === labelValue);

    return matchingRules.map(rule => {
      return {
        name: rule.grafana_alert.title,
        url: `${this.domain}/alerting/grafana/${rule.grafana_alert.uid}/view`,
        state: "n/a",
      };
    })
  }
}


export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
];
