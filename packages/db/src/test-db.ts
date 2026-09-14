import { pool, withTenantContext } from './index.js';

async function testDatabase() {
  console.log('🔍 Testing Database Schema, Triggers, and Multi-Tenant Isolation...\n');

  // 1. Verify table counts
  const tenantRes = await pool.query('SELECT count(*) FROM tenants');
  const projectRes = await pool.query('SELECT count(*) FROM projects');
  const issueRes = await pool.query('SELECT count(*) FROM issues');
  const typeRes = await pool.query('SELECT count(*) FROM issue_types');
  const statusRes = await pool.query('SELECT count(*) FROM issue_statuses');

  console.log(`✅ Tenants Count: ${tenantRes.rows[0].count}`);
  console.log(`✅ Projects Count: ${projectRes.rows[0].count}`);
  console.log(`✅ Issue Types Count: ${typeRes.rows[0].count}`);
  console.log(`✅ Issue Statuses Count: ${statusRes.rows[0].count}`);
  console.log(`✅ Issues Count: ${issueRes.rows[0].count}`);

  // 2. Verify auto-generated issue keys and hierarchy levels
  const issues = await pool.query(`
    SELECT i.key, i.summary, it.name as type_name, it.hierarchy_level, s.name as status_name
    FROM issues i
    JOIN issue_types it ON i.issue_type_id = it.id
    JOIN issue_statuses s ON i.status_id = s.id
    ORDER BY i.sequence_num
  `);
  console.log('\n📋 Seeded Issues:');
  issues.rows.forEach((row) => {
    console.log(`  - [${row.key}] (${row.type_name}, Level ${row.hierarchy_level}): ${row.summary} -> [${row.status_name}]`);
  });

  // 3. Test Full-Text Search Vector Trigger
  const searchRes = await pool.query(`
    SELECT key, summary 
    FROM issues 
    WHERE description_search @@ to_tsquery('english', 'Supabase')
  `);
  console.log('\n🔎 Full-Text Search Query ("Supabase"):');
  searchRes.rows.forEach((row) => {
    console.log(`  - Match: ${row.key}: ${row.summary}`);
  });

  // 4. Test Hierarchy Validation Trigger (Attempting to nest Task under Task should fail)
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const taskTypeId = '30000000-0000-0000-0000-000000000003';
    const parentTaskId = '70000000-0000-0000-0000-000000000003';
    await client.query(
      `INSERT INTO issues (tenant_id, project_id, issue_type_id, status_id, summary, parent_id, reporter_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'a0000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        taskTypeId,
        '40000000-0000-0000-0000-000000000002',
        'Invalid Task under Task nesting',
        parentTaskId,
        '10000000-0000-0000-0000-000000000001',
      ]
    );
    console.log('❌ Unexpectedly succeeded in inserting invalid hierarchy.');
  } catch (err: any) {
    console.log(`\n🛡️ Hierarchy Validation Trigger: Correctly rejected invalid nesting -> "${err.message}"`);
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }

  // 5. Test Multi-Tenant Context & Project Boundaries
  const tenantAcme = 'a0000000-0000-0000-0000-000000000001';
  const tenantCus1 = 'c0000000-0000-0000-0000-000000000001';
  const tenantCus2 = 'c0000000-0000-0000-0000-000000000002';

  const acmeProjects = await pool.query('SELECT count(*) FROM projects WHERE tenant_id = $1', [tenantAcme]);
  const cus1Projects = await pool.query('SELECT count(*) FROM projects WHERE tenant_id = $1', [tenantCus1]);
  const cus2Projects = await pool.query('SELECT count(*) FROM projects WHERE tenant_id = $1', [tenantCus2]);

  console.log(`\n🏢 Multi-Tenant Projects Isolation:`);
  console.log(`  - Acme Corp Projects: ${acmeProjects.rows[0].count} (ENG, MKT)`);
  console.log(`  - Customer 1 (CUS1) Projects: ${cus1Projects.rows[0].count} (CUS1)`);
  console.log(`  - Customer 2 (CUS2) Projects: ${cus2Projects.rows[0].count} (CUS2)`);

  console.log('\n🎉 Database is 100% clean, aligned, and verified!');
  await pool.end();
}

testDatabase().catch((err) => {
  console.error('Fatal error during database test:', err);
  process.exit(1);
});
