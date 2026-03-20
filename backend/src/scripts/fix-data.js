require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function fixData() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db('MangoTree'); // adjust db name if different

    // Check categories
    console.log('\n=== Categories ===');
    const categories = await db.collection('categories').find({}).toArray();
    console.log(`Total categories: ${categories.length}`);
    categories.forEach(c => {
      console.log(`  _id: ${c._id} (type: ${typeof c._id}), name: ${c.name}`);
    });

    // Find corrupt categories (string _id or _id === 'flex')
    const corruptCats = categories.filter(c => typeof c._id === 'string' || c._id === 'flex');
    if (corruptCats.length > 0) {
      console.log('\n❌ Corrupt categories found:');
      corruptCats.forEach(c => console.log(c));
      for (const c of corruptCats) {
        await db.collection('categories').deleteOne({ _id: c._id });
        console.log(`  ✓ Deleted category: ${c.name} (_id: ${c._id})`);
      }
    } else {
      console.log('\n✅ No corrupt categories.');
    }

    // Check posts
    console.log('\n=== Posts (sample 10) ===');
    const posts = await db.collection('posts').find({}).limit(10).toArray();
    posts.forEach(p => {
      console.log(`  _id: ${p._id}, category: ${p.category} (type: ${typeof p.category}), title: ${p.title.substring(0, 50)}`);
    });

    // Find posts with category that is a string (particularly 'flex')
    const badPosts = await db.collection('posts').find({
      $or: [
        { category: { $type: 'string' } },
        { category: 'flex' }
      ]
    }).toArray();

    if (badPosts.length > 0) {
      console.log('\n❌ Found posts with string category:');
      badPosts.forEach(p => {
        console.log(`  _id: ${p._id}, category: ${p.category} (type: ${typeof p.category}), title: ${p.title.substring(0, 50)}`);
      });

      // Ask for confirmation before deleting
      console.log('\n⚠️  These posts have invalid category references. Delete them? (y/n)');
      // For safety, we'll just warn, not auto-delete in this script
    } else {
      console.log('\n✅ No posts with string category.');
    }

    await client.close();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixData();
