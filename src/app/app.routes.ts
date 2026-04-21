import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing',
  },
  {
    path: 'landing',
    loadComponent: () =>
      import('./pages/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent,
      ),
  },
  {
    path: 'workspace',
    loadComponent: () =>
      import('./pages/workspace-page/workspace-page.component').then(
        (m) => m.WorkspacePageComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then(
        (m) => m.SettingsPageComponent,
      ),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/privacy-page/privacy-page.component').then(
        (m) => m.PrivacyPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'landing',
  },
];
