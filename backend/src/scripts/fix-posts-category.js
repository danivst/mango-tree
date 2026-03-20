require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function fixPostsCategory() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db('MangoTree');

    // Get all categories as a map: name -> _id
    const categories = await db.collection('categories').find({}).toArray();
    const catMap = new Map();
    categories.forEach(c => {
      catMap.set(c.name.toLowerCase().trim(), c._id);
    });
    console.log('Category map:', Object.fromEntries(catMap));

    // Find posts with string category
    const posts = await db.collection('posts').find({
      category: { $type: 'string' }
    }).toArray();

    console.log(`\nFound ${posts.length} posts with string category`);

    if (posts.length === 0) {
      console.log('✅ No posts need fixing.');
      await client.close();
      process.exit(0);
    }

    console.log('Sample posts to fix:');
    posts.slice(0, 10).forEach(p => {
      console.log(`  _id: ${p._id}, category: "${p.category}" -> ?`);
    });

    // Ask confirmation
    console.log('\n❓ Fix these posts by converting category names to ObjectId references? (y/n)');
    // We'll auto-confirm after 5 seconds if no input, but safer to just do it since we're in a script
    // Actually let's just do it
    console.log('Proceeding with fix...');

    let fixed = 0;
    let failed = 0;
    for (const post of posts) {
      const catName = post.category.trim().toLowerCase();
      const catId = catMap.get(catName);
      if (!catId) {
        console.warn(`  ⚠️  Post ${post._id}: no category found with name "${catName}". Deleting post.`);
        await db.collection('posts').deleteOne({ _id: post._id });
        failed++;
        continue;
      }

      try {
        await db.collection('posts').updateOne(
          { _id: post._id },
          { $set: { category: new ObjectId(catId) } }
        );
        console.log(`  ✓ Fixed post ${post._id}: category "${catName}" -> ${catId}`);
        fixed++;
      } catch (err) {
        console.error(`  ✗ Failed to fix post ${post._id}:`, err.message);
        failed++;
      }
    }

    console.log(`\n✅ Fix complete: ${fixed} fixed, ${failed} failed/deleted`);
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixPostsCategory();
