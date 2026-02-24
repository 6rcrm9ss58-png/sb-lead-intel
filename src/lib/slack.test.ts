import * as assert from 'assert';
import {
  parseLeadMessage,
  validateParsedMessage,
  isLeadAlertMessage,
} from './slack';

console.log('Running Slack parser tests...\n');

// Test 1: Welding lead with all fields
console.log('Test 1: Welding lead with all fields');
const weldingMessage = `*Company:* Acme Manufacturing
*Contact Name:* John Doe
*Job Title:* VP Operations
*Phone:* 555-123-4567
*Email:* john@acme.com
*State:* California
*Country / Region:* United States
*Use Case:* Welding
*Timeline:* 30-60 Days
*Lead Source:* Google
*Overall Lead Score:* 75
*Tell Us More:* We are looking for automated welding solutions for our production line.`;

const parsed1 = parseLeadMessage(weldingMessage);
assert.strictEqual(parsed1.company, 'Acme Manufacturing', 'Company name mismatch');
assert.strictEqual(parsed1.contactName, 'John Doe', 'Contact name mismatch');
assert.strictEqual(parsed1.jobTitle, 'VP Operations', 'Job title mismatch');
assert.strictEqual(parsed1.phone, '555-123-4567', 'Phone mismatch');
assert.strictEqual(parsed1.email, 'john@acme.com', 'Email mismatch');
assert.strictEqual(parsed1.useCase, 'Welding', 'Use case mismatch');
assert.strictEqual(parsed1.leadScore, 75, 'Lead score should be 75');
assert.strictEqual(parsed1.timeline, '30-60 Days', 'Timeline mismatch');

const validation1 = validateParsedMessage(parsed1);
assert.strictEqual(validation1.valid, true, 'Message should be valid');
console.log('PASS: All fields parsed correctly\n');

// Test 2: Material handling lead with negative score
console.log('Test 2: Material handling lead with negative score');
const materialHandlingMessage = `*Company:* Tech Logistics Inc
*Contact Name:* Jane Smith
*Job Title:* Logistics Director
*Phone:* 555-987-6543
*Email:* jane@techlogistics.com
*State:* Texas
*Country / Region:* United States
*Use Case:* Material Handling
*Timeline:* 60-90 Days
*Lead Source:* LinkedIn
*Overall Lead Score:* -30
*Tell Us More:* Interested in automated material handling but budget concerns.`;

const parsed2 = parseLeadMessage(materialHandlingMessage);
assert.strictEqual(parsed2.company, 'Tech Logistics Inc', 'Company name mismatch');
assert.strictEqual(parsed2.contactName, 'Jane Smith', 'Contact name mismatch');
assert.strictEqual(parsed2.useCase, 'Material Handling', 'Use case mismatch');
assert.strictEqual(parsed2.leadScore, -30, 'Lead score should be -30');

const validation2 = validateParsedMessage(parsed2);
assert.strictEqual(validation2.valid, true, 'Message should be valid');
console.log('PASS: Negative lead score handled correctly\n');

// Test 3: Education lead with long "Tell Us More" spanning multiple lines
console.log('Test 3: Education lead with multi-line Tell Us More');
const educationMessage = `*Company:* State University Foundation
*Contact Name:* Dr. Robert Wilson
*Job Title:* Department Head
*Phone:* 555-555-5555
*Email:* robert@university.edu
*State:* New York
*Country / Region:* United States
*Use Case:* Education
*Timeline:* 90+ Days
*Lead Source:* Referral
*Overall Lead Score:* 45
*Tell Us More:* We are exploring robotic solutions for our engineering lab.
This would be used for student training and research projects.
Budget is available in Q2 2026. We need flexibility and support.`;

const parsed3 = parseLeadMessage(educationMessage);
assert.strictEqual(parsed3.company, 'State University Foundation', 'Company name mismatch');
assert.strictEqual(parsed3.contactName, 'Dr. Robert Wilson', 'Contact name mismatch');
assert.strictEqual(parsed3.useCase, 'Education', 'Use case mismatch');
assert.strictEqual(parsed3.leadScore, 45, 'Lead score should be 45');

// Verify multi-line Tell Us More is captured
assert(
  parsed3.tellUsMore.includes('exploring robotic solutions'),
  'Should contain first line of Tell Us More'
);
assert(
  parsed3.tellUsMore.includes('Budget is available'),
  'Should contain last line of Tell Us More'
);

const validation3 = validateParsedMessage(parsed3);
assert.strictEqual(validation3.valid, true, 'Message should be valid');
console.log('PASS: Multi-line Tell Us More field parsed correctly\n');

// Test 4: Channel and bot filtering
console.log('Test 4: Channel and bot filtering');
assert.strictEqual(
  isLeadAlertMessage('C05B5QBJVAM', 'B02JNJTTULW'),
  true,
  'Should accept lead-alerts channel and HubSpot bot'
);
assert.strictEqual(
  isLeadAlertMessage('C05B5QBJVAM'),
  true,
  'Should accept lead-alerts channel without bot ID'
);
assert.strictEqual(
  isLeadAlertMessage('C00000000000', 'B02JNJTTULW'),
  false,
  'Should reject wrong channel'
);
assert.strictEqual(
  isLeadAlertMessage('C05B5QBJVAM', 'B00000000000'),
  false,
  'Should reject wrong bot'
);
console.log('PASS: Channel and bot filtering works correctly\n');

console.log('All tests passed!');
