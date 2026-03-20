require('dotenv').config();
const { MongoClient } = require('mongodb');

async function setDefaults() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('MangoTree');

    // Set default theme and language for all users that don't have them
    const result = await db.collection('users').updateMany(
      { $or: [{ theme: { $exists: false } }, { theme: null }] },
      { $set: { theme: 'cream', language: 'en' } }
    );

    console.log(`✓ Updated ${result.modifiedCount} users with default theme/language`);

    // Show all users
    const users = await db.collection('users').find({}).project({ username: 1, theme: 1, language: 1 }).toArray();
    console.log('\nCurrent users:');
    users.forEach(u => console.log(`- ${u.username}: theme=${u.theme}, language=${u.language}`));

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
setDefaults();
