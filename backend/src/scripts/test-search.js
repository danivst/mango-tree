require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function testSearch() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('MangoTree');

    // Check all posts
    const posts = await db.collection('posts').find({}).limit(50).toArray();
    console.log(`Found ${posts.length} posts total\n`);

    // Look for any post containing 'british' (case insensitive)
    const britishPosts = posts.filter(p => {
      const title = (p.title || '').toLowerCase();
      const content = (p.content || '').toLowerCase();
      const tags = (p.tags || []).map(t => t.toLowerCase());
      return title.includes('british') || content.includes('british') || tags.includes('british');
    });

    if (britishPosts.length > 0) {
      console.log('Posts containing "british":');
      britishPosts.forEach(p => {
        console.log(`- ${p.title} (tags: ${p.tags?.join(', ')})`);
      });
    } else {
      console.log('❌ No posts contain the word "british"');
      // Show some sample titles to help user understand what's there
      console.log('\nSample post titles:');
      posts.slice(0, 10).forEach(p => console.log(`- ${p.title}`));
    }

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testSearch();
