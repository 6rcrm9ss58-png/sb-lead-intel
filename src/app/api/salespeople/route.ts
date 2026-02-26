import { NextResponse } from 'next/server';

// Standard Bots sales team — sourced from Slack workspace profiles
// This is a static list; in production, you'd pull from an HR system or Slack API
const SALES_TEAM = [
  // Leadership & Operations
  { name: 'Danny OMahony', title: 'GTM Sales', email: 'daniel@standardbots.com', slack_id: 'U05620MD9PD', region: 'Go-to-Market lead', group: 'Leadership' },
  { name: 'Steve Boswell', title: 'Inside Sales Manager', email: 'steve@standardbots.com', slack_id: 'U03NSBLKH6V', region: 'Manages ISE team', group: 'Leadership' },
  { name: 'Kristen Bricker', title: 'Sales Operations', email: 'kristen@standardbots.com', slack_id: 'U07UBEX9VPH', region: 'Ops (EU timezone)', group: 'Leadership' },
  { name: 'Nathan Beadle', title: 'Sales', email: 'nathan@standardbots.com', slack_id: 'U083UPQDCKB', region: '#project-ai-sales-team', group: 'Leadership' },

  // Regional Sales Managers (Field)
  { name: 'Connor Carroll', title: 'Regional Sales Manager', email: 'connorcarroll@standardbots.com', slack_id: 'U0A9TQ59132', region: '', group: 'Field' },
  { name: 'Brian Kobus', title: 'Regional Sales Manager — Southeast', email: 'bkobus@standardbots.com', slack_id: 'U08CMUG5LRY', region: 'Southeast', group: 'Field' },
  { name: 'Jake Tomkinson', title: 'Regional Sales Manager — East', email: 'jtomkinson@standardbots.com', slack_id: 'U08J96Q1916', region: 'East', group: 'Field' },
  { name: 'Sam Tenoever', title: 'Regional Sales Manager', email: 'samtenoever@standardbots.com', slack_id: 'U0A70KAQAFJ', region: '', group: 'Field' },
  { name: 'Johnny Leak', title: 'Regional Sales Manager', email: 'johnleak@standardbots.com', slack_id: 'U0A9TQ3PNJC', region: '', group: 'Field' },

  // Inside Sales Engineers
  { name: 'Zach Horvath', title: 'Inside Sales Engineer', email: 'zachhorvath@standardbots.com', slack_id: 'U09JK9JTMK6', region: '', group: 'ISE' },
  { name: 'Brianna Villalobos', title: 'Inside Sales Engineer', email: 'briannavillalobos@standardbots.com', slack_id: 'U0ACBJA81L3', region: '', group: 'ISE' },
  { name: 'Julian Gjonaj', title: 'Inside Sales Engineer', email: 'juliangjonaj@standardbots.com', slack_id: 'U0ABFKM0WMB', region: '', group: 'ISE' },
  { name: 'Will Boswell', title: 'Inside Sales Engineer', email: 'willboswell@standardbots.com', slack_id: 'U09PU99C4AD', region: '', group: 'ISE' },
  { name: 'Given Brown', title: 'Inside Sales Engineer', email: 'given@standardbots.com', slack_id: 'U09E74W2SM9', region: '', group: 'ISE' },
  { name: 'Morgan Chang', title: 'Inside Sales Engineer', email: 'morgan@standardbots.com', slack_id: 'U07S3A4SD5K', region: '', group: 'ISE' },
];

export async function GET() {
  return NextResponse.json({ salespeople: SALES_TEAM });
}
