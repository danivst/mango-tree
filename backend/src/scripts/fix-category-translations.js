require('dotenv').config();
const { MongoClient } = require('mongodb');

async function addTranslations() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('MangoTree');
    const cats = await db.collection('categories').find({}).toArray();

    console.log('Updating categories with translations...');
    for (const cat of cats) {
      const name = cat.name;
      const updates = {
        'translations.name.en': name.charAt(0).toUpperCase() + name.slice(1),
        'translations.name.bg': name.charAt(0).toUpperCase() + name.slice(1),
      };
      await db.collection('categories').updateOne(
        { _id: cat._id },
        { $set: updates }
      );
      console.log(`✓ Updated category "${name}" with translations`);
    }

    // Verify
    const updated = await db.collection('categories').find({}).toArray();
    console.log('\nFinal categories:');
    updated.forEach(c => console.log(c));

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
addTranslations();
