require('dotenv').config();
const { MongoClient } = require('mongodb');

async function addProperTranslations() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('MangoTree');

    const translations = {
      recipe: { en: 'Recipe', bg: 'Рецепта' },
      flex: { en: 'Flex', bg: 'Фитнес' },
      question: { en: 'Question', bg: 'Въпрос' }
    };

    const cats = await db.collection('categories').find({}).toArray();
    console.log('Updating category translations with proper Bulgarian...');

    for (const cat of cats) {
      const trans = translations[cat.name];
      if (!trans) {
        console.warn(`No translation mapping for category: ${cat.name}`);
        continue;
      }
      await db.collection('categories').updateOne(
        { _id: cat._id },
        { $set: { 'translations.name.en': trans.en, 'translations.name.bg': trans.bg } }
      );
      console.log(`✓ ${cat.name}: en="${trans.en}", bg="${trans.bg}"`);
    }

    // Verify
    const updated = await db.collection('categories').find({}).toArray();
    console.log('\nUpdated categories:');
    updated.forEach(c => console.log(`${c.name}: ${JSON.stringify(c.translations)}`));

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
addProperTranslations();
