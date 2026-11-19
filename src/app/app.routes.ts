import { Routes } from '@angular/router';

export type ShellKind = 'marketing' | 'app';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing',
  },
  {
    path: 'landing',
    data: { shell: 'marketing' satisfies ShellKind },
    title: 'QueryLens',
    loadComponent: () =>
      import('./pages/landing-page/landing-page.component').then((m) => m.LandingPageComponent),
  },
  {
    path: 'workspace',
    data: { shell: 'app' satisfies ShellKind },
    title: 'Workspace · QueryLens',
    loadComponent: () =>
      import('./pages/workspace-page/workspace-page.component').then((m) => m.WorkspacePageComponent),
  },
  {
    path: 'settings',
    data: { shell: 'app' satisfies ShellKind },
    title: 'Settings · QueryLens',
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then((m) => m.SettingsPageComponent),
  },
  {
    path: 'privacy',
    data: { shell: 'marketing' satisfies ShellKind },
    title: 'Privacy · QueryLens',
    loadComponent: () =>
      import('./pages/privacy-page/privacy-page.component').then((m) => m.PrivacyPageComponent),
  },
  {
    path: '**',
    redirectTo: 'landing',
  },
];
