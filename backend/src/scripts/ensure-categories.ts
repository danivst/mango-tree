import mongoose from 'mongoose';
import Category from '../models/category';
import Translation from '../models/translation';

// Note: Make sure MONGO_URI is set in environment or use default
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mangotree';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    const requiredCategories = ['recipe', 'flex', 'question'];

    console.log('=== Ensuring Required Categories ===\n');

    for (const name of requiredCategories) {
      const existing = await Category.findOne({ name });
      if (existing) {
        console.log(`✓ Category "${name}" already exists`);
        continue;
      }

      // Create translation entry
      const translation = new Translation({
        key: `category:${name}`,
        translations: {
          en: name.charAt(0).toUpperCase() + name.slice(1),
          bg: name.charAt(0).toUpperCase() + name.slice(1),
        },
      });
      await translation.save();

      // Create category
      const category = new Category({
        name,
        translations: {
          name: {
            en: name.charAt(0).toUpperCase() + name.slice(1),
            bg: name.charAt(0).toUpperCase() + name.slice(1),
          },
        },
      });
      await category.save();

      console.log(`✓ Created category: "${name}"`);
    }

    const finalCount = await Category.countDocuments();
    console.log(`\n✓ Total categories: ${finalCount}`);
    console.log('Categories are ready for your posts!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
