/**
 * Drop tenant property from given object
 */
// const dropTenant :<T>(obj : T & { tenant: string }) => T = (obj: T & { tenant: string }) => {
//   const { tenant, ...withoutTenant } = obj;
//   return withoutTenant;
// };
// TODO
export default function dropTenant<T>(obj: T & { tenant: string }): Omit<T, 'tenant'> {
  const { tenant, ...withoutTenant } = obj;
  return withoutTenant;
}
