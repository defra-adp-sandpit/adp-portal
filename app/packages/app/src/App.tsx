import React, { useEffect, useState } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import { TechRadarPage } from '@backstage/plugin-tech-radar';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import { AlertDisplay, OAuthRequestDialog } from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';

import { microsoftAuthApiRef } from '@backstage/core-plugin-api';
import { SignInPage } from '@backstage/core-components';

import LightIcon from  '@material-ui/icons/WbSunnyRounded';
import NightIcon from '@material-ui/icons/Brightness2Rounded';

import {
  UnifiedThemeProvider,
  createUnifiedTheme,
  palettes,
  genPageTheme,                  
} from '@backstage/theme';

import styles from 'style-loader!css-loader?{"modules": {"auto": true}}!sass-loader?{"sassOptions": {"quietDeps": true}}!./style.module.scss';

const lightTheme = createUnifiedTheme({
  palette: {
    ...palettes.light,
    navigation: {
      background: '#171717',
      indicator: '#005EA5',
      color: '#b5b5b5',
      selectedColor: '#FFF',
      navItem: {
        hoverBackground: '#404040',
      },
    },
    primary:{
      main: styles.primaryColour,
    },
    link: styles.linkColour,
    linkHover: styles.linkHoverColour,
    errorText: styles.errorColour,
  },
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({ colors: ['#171717'], shape: 'none' }),
  },
  components: {
    BackstageHeader: {
      styleOverrides: {
        header: {
          borderBottom: `4px solid ${styles.primaryColour}`, //needs to be $govuk-blue
        },
      },
    },
  },
  fontFamily: "'GDS Transport',arial, sans-serif"
});


const darkTheme = createUnifiedTheme({
  palette: {
    ...palettes.dark,
    link: styles.linkColour,
    linkHover: styles.linkHoverColour,
    errorText: styles.errorColour,
  },
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({ colors: ['#424242'], shape: 'none' }),
  },
  fontFamily: "'GDS Transport',arial, sans-serif"
});

const app = createApp({
  components: {
    SignInPage: props => (
      <SignInPage
        {...props}
        auto
        provider={{
          id: 'aad-auth-provider',
          title: 'Azure AD',
          message: 'Sign in using Azure AD',
          apiRef: microsoftAuthApiRef
        }}
        />
    )
  },
  apis,
  themes: [
    {
      id: 'default-light',
      title: 'Default Light',
      variant: 'light',
      icon: <LightIcon />,
      Provider: ({ children }) => <UnifiedThemeProvider theme={lightTheme} children={children} />,
    },
    {
      id: 'default-dark',
      title: 'Default Dark',
      variant: 'dark',
      icon: <NightIcon />,
      Provider: ({ children }) => <UnifiedThemeProvider theme={darkTheme} children={children} />,
    },
  ],
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
});

const routes = (
  <FlatRoutes>
    <Route path="/" element={<Navigate to="catalog" />} />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/create" element={<ScaffolderPage />} />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/tech-radar"
      element={<TechRadarPage width={1500} height={800} />}
    />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);