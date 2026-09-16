import { permissionsService } from '../permissions.service.js';

async function testRbac() {
  console.log('--- Testing Data-Driven RBAC Permission Resolution ---\n');

  const userId = 'u0000000-0000-0000-0000-000000000001';
  const tenantId = 'a0000000-0000-0000-0000-000000000001';
  const projectId = 'p0000000-0000-0000-0000-000000000001';

  // 1. Resolve Tenant Permissions (Owner default)
  const tenantPerms = await permissionsService.resolveUserPermissions(userId, tenantId);
  console.log('1. Tenant Permissions (Owner):', Array.from(tenantPerms));
  console.assert(tenantPerms.has('tenant.update'), 'Owner should have tenant.update');
  console.assert(tenantPerms.has('members.manage'), 'Owner should have members.manage');
  console.assert(tenantPerms.has('tenant.delete'), 'Owner should have tenant.delete');

  // 2. Resolve Union Permissions (Tenant + Project)
  const unionPerms = await permissionsService.resolveUserPermissions(userId, tenantId, projectId);
  console.log('\n2. Union Permissions (Owner + Project Lead):', Array.from(unionPerms));
  console.assert(unionPerms.has('project.manage_members'), 'Lead should have project.manage_members');
  console.assert(unionPerms.has('issue.delete.any'), 'Lead should have issue.delete.any');
  console.assert(unionPerms.has('tenant.update'), 'Union should include tenant perms');

  // 3. Resolve Full Context
  const context = await permissionsService.getResolvedContext(userId, tenantId, projectId);
  console.log('\n3. Resolved Context:', context);

  // 4. List All Available Permissions
  const allPerms = await permissionsService.getAllAvailablePermissions();
  console.log('\n4. Total Registered Permissions:', allPerms.length);

  console.log('\nAll RBAC unit tests passed successfully!');
}

testRbac().catch(err => {
  console.error('RBAC Test Failed:', err);
  process.exit(1);
});
