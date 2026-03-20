require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkCategories() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('MangoTree');
    const cats = await db.collection('categories').find({}).toArray();
    console.log('Categories with translations:');
    cats.forEach(c => {
      console.log(JSON.stringify(c, null, 2));
    });
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkCategories();
