const mongoose = require('mongoose');
const TeamHub = require('./Model/TeamHubModel.js');

// Test the notification system
async function testNotifications() {
  try {
    console.log('Testing workspace notification system...');
    
    // Test 1: Check if the readMessages field exists in the schema
    const teamSchema = TeamHub.schema;
    const hasReadMessages = teamSchema.paths.readMessages;
    
    if (hasReadMessages) {
      console.log('✅ readMessages field exists in TeamHub schema');
    } else {
      console.log('❌ readMessages field missing from TeamHub schema');
    }
    
    // Test 2: Check if the schema structure is correct
    const readMessagesPath = teamSchema.path('readMessages');
    if (readMessagesPath && readMessagesPath.instance === 'Array') {
      console.log('✅ readMessages is properly defined as an array');
    } else {
      console.log('❌ readMessages is not properly defined as an array');
    }
    
    console.log('Workspace notification system test completed!');
    
  } catch (error) {
    console.error('Error testing notification system:', error);
  }
}

// Run the test
testNotifications();
