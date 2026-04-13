require('dotenv').config();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function assignProperties() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb'
  });

  try {
    console.log('🔗 Assigning properties to agents...\n');

    // Get agent IDs
    const [agents] = await connection.execute(
      'SELECT id, name, email FROM users WHERE role = ? ORDER BY created_at ASC',
      ['agent']
    );

    if (agents.length < 2) {
      console.error('❌ Need at least 2 agents to assign properties. Found:', agents.length);
      return;
    }

    const agent1 = agents[0];
    const agent2 = agents[1];
    console.log(`✅ Found agents:`);
    console.log(`   Agent 1: ${agent1.name} (${agent1.email})`);
    console.log(`   Agent 2: ${agent2.name} (${agent2.email})\n`);

    // Get all properties sorted by creation date and keep the demo split at 10 total.
    const [properties] = await connection.execute(
      'SELECT id, title FROM properties ORDER BY created_at ASC'
    );

    if (properties.length < 2) {
      console.error('❌ Need at least 2 properties. Found:', properties.length);
      return;
    }

    console.log(`✅ Found ${properties.length} properties\n`);

    const demoProperties = properties.slice(0, 10);
    const extraProperties = properties.slice(10);

    for (const prop of extraProperties) {
      await connection.execute(
        `UPDATE properties
         SET primary_agent_id = NULL, assigned_to_agent_at = NULL, assigned_by_admin_id = NULL, assignment_reason = NULL
         WHERE id = ?`,
        [prop.id]
      );
      console.log(`  ℹ️  Left extra property unassigned: "${prop.title}"`);
    }

    // Assign first half to agent1, second half to agent2
    const midpoint = Math.ceil(demoProperties.length / 2);
    const adminId = uuidv4(); // Generate admin ID for assignment

    let assignmentCount = 0;

    // Assign first half to agent1
    for (let i = 0; i < midpoint; i++) {
      const prop = demoProperties[i];
      await connection.execute(
        `UPDATE properties 
         SET primary_agent_id = ?, assigned_to_agent_at = NOW(), assigned_by_admin_id = ?, assignment_reason = ?
         WHERE id = ?`,
        [agent1.id, adminId, 'Initial demo data setup - property ownership assignment', prop.id]
      );
      assignmentCount++;
      console.log(`  ✅ Assigned "${prop.title}" to ${agent1.name}`);
    }

    console.log();

    // Assign second half to agent2
    for (let i = midpoint; i < demoProperties.length; i++) {
      const prop = demoProperties[i];
      await connection.execute(
        `UPDATE properties 
         SET primary_agent_id = ?, assigned_to_agent_at = NOW(), assigned_by_admin_id = ?, assignment_reason = ?
         WHERE id = ?`,
        [agent2.id, adminId, 'Initial demo data setup - property ownership assignment', prop.id]
      );
      assignmentCount++;
      console.log(`  ✅ Assigned "${prop.title}" to ${agent2.name}`);
    }

    console.log(`\n✨ Successfully assigned ${assignmentCount} properties to agents!`);
    console.log(`   ${agent1.name}: ${midpoint} properties`);
    console.log(`   ${agent2.name}: ${demoProperties.length - midpoint} properties`);
    if (extraProperties.length > 0) {
      console.log(`   Unassigned extras: ${extraProperties.length}`);
    }

  } catch (error) {
    console.error('❌ Error assigning properties:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

assignProperties();
