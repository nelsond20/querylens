import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'workspace',
  },
  {
    path: 'workspace',
    loadComponent: () =>
      import('./pages/workspace-page/workspace-page.component').then(
        (module) => module.WorkspacePageComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then(
        (module) => module.SettingsPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'workspace',
  },
];
