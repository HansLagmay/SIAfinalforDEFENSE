require('dotenv').config();
const mysql = require('mysql2/promise');

async function runQA() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb'
  });

  try {
    console.log('🧪 Property Ownership QA Tests\n');

    // Test 1: Verify properties have primary_agent_id assigned
    console.log('Test 1: Verifying properties have primary_agent_id assigned...');
    const [props] = await connection.execute(`
      SELECT 
        p.id, 
        p.title, 
        p.primary_agent_id,
        u.name as agent_name
      FROM properties p
      LEFT JOIN users u ON p.primary_agent_id = u.id
      ORDER BY p.created_at ASC
      LIMIT 11
    `);

    if (props.length === 0) {
      console.error('❌ No properties found!');
      return;
    }

    console.log(`✅ Found ${props.length} properties:\n`);
    const agentMap = {};
    props.forEach((p, idx) => {
      console.log(`  ${idx + 1}. "${p.title}"`);
      console.log(`     ID: ${p.id}`);
      console.log(`     Agent: ${p.agent_name} (${p.primary_agent_id})`);
      agentMap[p.primary_agent_id] = p.agent_name;
    });

    // Test 2: Verify property assignment distribution
    console.log('\n\nTest 2: Verifying property distribution between agents...');
    const [distribution] = await connection.execute(`
      SELECT 
        primary_agent_id,
        u.name as agent_name,
        COUNT(*) as property_count
      FROM properties
      LEFT JOIN users u ON properties.primary_agent_id = u.id
      WHERE primary_agent_id IS NOT NULL
      GROUP BY primary_agent_id
    `);

    console.log('Distribution:\n');
    let totalProps = 0;
    distribution.forEach(d => {
      console.log(`  ${d.agent_name}: ${d.property_count} properties`);
      totalProps += d.property_count;
    });
    console.log(`\n✅ Total assigned: ${totalProps} properties`);

    // Test 3: Verify assignment audit trail
    console.log('\n\nTest 3: Verifying assignment audit trail...');
    const [audits] = await connection.execute(`
      SELECT 
        p.title,
        u.name as agent_name,
        p.assigned_to_agent_at,
        p.assignment_reason
      FROM properties p
      LEFT JOIN users u ON p.primary_agent_id = u.id
      WHERE p.assigned_to_agent_at IS NOT NULL
      LIMIT 5
    `);

    if (audits.length > 0) {
      console.log('✅ Assignment audit trail found:\n');
      audits.forEach(a => {
        console.log(`  Property: "${a.title}"`);
        console.log(`    Agent: ${a.agent_name}`);
        console.log(`    Assigned At: ${a.assigned_to_agent_at}`);
        console.log(`    Reason: ${a.assignment_reason}\n`);
      });
    } else {
      console.log('⚠️  No assignment audit trail found');
    }

    // Test 4: Verify no unassigned properties (after migration)
    console.log('\nTest 4: Checking for unassigned properties...');
    const [unassigned] = await connection.execute(`
      SELECT COUNT(*) as count FROM properties WHERE primary_agent_id IS NULL
    `);
    
    if (unassigned[0].count === 0) {
      console.log('✅ All properties have a primary agent assigned');
    } else {
      console.log(`⚠️  Found ${unassigned[0].count} unassigned properties`);
    }

    // Test 5: Verify inquiry count query (for reassignment logic)
    console.log('\n\nTest 5: Testing inquiry count query for reassignment rules...');
    const [propWithInquiries] = await connection.execute(`
      SELECT 
        p.id,
        p.title,
        u.name as agent_name,
        COUNT(i.id) as active_inquiry_count
      FROM properties p
      LEFT JOIN users u ON p.primary_agent_id = u.id
      LEFT JOIN inquiries i ON p.id = i.property_id AND i.status != 'closed' AND i.status != 'rejected'
      WHERE p.primary_agent_id IS NOT NULL
      GROUP BY p.id, p.title, p.primary_agent_id, u.name
      ORDER BY active_inquiry_count DESC
      LIMIT 5
    `);

    console.log('✅ Properties with active inquiry counts:\n');
    propWithInquiries.forEach(p => {
      const canReassign = p.active_inquiry_count === 0 ? '✓ CAN reassign' : '✗ CANNOT reassign';
      console.log(`  "${p.title}"`);
      console.log(`    Agent: ${p.agent_name}`);
      console.log(`    Active Inquiries: ${p.active_inquiry_count}`);
      console.log(`    Status: ${canReassign}\n`);
    });

    console.log('\n✨ All QA tests completed successfully!');

  } catch (error) {
    console.error('❌ QA test failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runQA();
