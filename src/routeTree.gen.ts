/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as DashboardRouteImport } from './routes/dashboard'
import { Route as SectionRouteImport } from './routes/$section'
import { Route as LoginRouteImport } from './routes/login'
const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const DashboardRoute = DashboardRouteImport.update({ id: '/dashboard', path: '/dashboard', getParentRoute: () => rootRouteImport } as any)
const SectionRoute = SectionRouteImport.update({ id: '/$section', path: '/$section', getParentRoute: () => rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id: '/login', path: '/login', getParentRoute: () => rootRouteImport } as any)
export interface FileRoutesByFullPath { '/': typeof IndexRoute; '/dashboard': typeof DashboardRoute; '/$section': typeof SectionRoute; '/login': typeof LoginRoute }
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById { __root__: typeof rootRouteImport; '/': typeof IndexRoute; '/dashboard': typeof DashboardRoute; '/$section': typeof SectionRoute; '/login': typeof LoginRoute }
export interface FileRouteTypes { fileRoutesByFullPath: FileRoutesByFullPath; fullPaths: '/' | '/dashboard' | '/$section' | '/login'; fileRoutesByTo: FileRoutesByTo; id: '__root__' | '/' | '/dashboard' | '/$section' | '/login'; fileRoutesById: FileRoutesById }
export interface RootRouteChildren { IndexRoute: typeof IndexRoute; DashboardRoute: typeof DashboardRoute; SectionRoute: typeof SectionRoute; LoginRoute: typeof LoginRoute }
declare module '@tanstack/react-router' { interface FileRoutesByPath {
'/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
'/dashboard': { id: '/dashboard'; path: '/dashboard'; fullPath: '/dashboard'; preLoaderRoute: typeof DashboardRouteImport; parentRoute: typeof rootRouteImport }
'/$section': { id: '/$section'; path: '/$section'; fullPath: '/$section'; preLoaderRoute: typeof SectionRouteImport; parentRoute: typeof rootRouteImport }
'/login': { id: '/login'; path: '/login'; fullPath: '/login'; preLoaderRoute: typeof LoginRouteImport; parentRoute: typeof rootRouteImport }
} }
const rootRouteChildren: RootRouteChildren = { IndexRoute, DashboardRoute, SectionRoute, LoginRoute }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' { interface Register { ssr: true; router: Awaited<ReturnType<typeof getRouter>>; config: Awaited<ReturnType<typeof startInstance.getOptions>> } }
