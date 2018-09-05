import { Routes } from './route.types';

import { routes as ageGroupsRoutes } from './routes/age-groups.routes'
import { routes as authRoutes } from './routes/auth.routes'
import { routes as childRoutes } from './routes/child.routes'
import { routes as childAttendanceRoutes } from './routes/child-attendance.routes'
import { routes as contactPersonRoutes } from './routes/contact-person.routes'
import { routes as crewRoutes } from './routes/crew.routes'
import { routes as crewAttendanceRoutes } from './routes/crew-attendance.routes'
import { routes as dayRoutes } from './routes/day.routes'
import { routes as tenantsRoutes } from './routes/tenants.routes'


export const allRoutes: Routes = [
    ...ageGroupsRoutes,
    ...authRoutes,
    ...childRoutes,
    ...childAttendanceRoutes,
    ...contactPersonRoutes,
    ...crewRoutes,
    ...crewAttendanceRoutes,
    ...dayRoutes,
    ...tenantsRoutes,
];
