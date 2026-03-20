require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function testTextSearch() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('MangoTree');
    const posts = db.collection('posts');

    // Check if text index exists
    const indexes = await posts.indexes();
    console.log('Indexes on posts collection:');
    indexes.forEach(idx => {
      console.log(`- ${idx.name}:`, idx.key);
    });

    // Try the exact query the backend uses
    console.log('\nTesting $text search for "british":');
    const query = { $text: { $search: 'british' }, isVisible: true };
    const results = await posts.find(query).limit(10).toArray();
    console.log(`Found ${results.length} posts via $text search:`);
    results.forEach(p => console.log(`- ${p.title} (tags: ${p.tags?.join(', ')})`));

    // Also test with a simpler approach (no $text) to see if data is there
    console.log('\nAll posts with british in tags or title (regex fallback):');
    const regexResults = await posts.find({
      $or: [
        { title: /british/i },
        { content: /british/i },
        { tags: /british/i }
      ],
      isVisible: true
    }).limit(10).toArray();
    console.log(`Found ${regexResults.length} posts via regex:`);
    regexResults.forEach(p => console.log(`- ${p.title}`));

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testTextSearch();
