#!/usr/bin/env node

import { ActionTracker } from './action-tracker.js';

/**
 * Initialize Neo4j schema for action tracking
 */
async function initializeNeo4j() {
  const neo4jUri = process.env.NEO4J_URI;
  const neo4jUsername = process.env.NEO4J_USERNAME;
  const neo4jPassword = process.env.NEO4J_PASSWORD;

  if (!neo4jUri || !neo4jUsername || !neo4jPassword) {
    console.error('Missing Neo4j configuration:');
    console.error('NEO4J_URI:', neo4jUri ? 'set' : 'missing');
    console.error('NEO4J_USERNAME:', neo4jUsername ? 'set' : 'missing');
    console.error('NEO4J_PASSWORD:', neo4jPassword ? 'set' : 'missing');
    process.exit(1);
  }

  try {
    console.log('Initializing Neo4j schema...');
    const actionTracker = new ActionTracker(neo4jUri, neo4jUsername, neo4jPassword);

    await actionTracker.connect();
    console.log('Neo4j schema initialized successfully!');

    await actionTracker.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Failed to initialize Neo4j schema:', error);
    process.exit(1);
  }
}

initializeNeo4j();
