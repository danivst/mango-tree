/**
 * @file seed-posts.ts
 * @description Database seeding script for initial Post content.
 * Populates the database with 'recipe', 'question', and 'flex' posts using 
 * reliable high-quality images from Unsplash.
 * Run via: `npm run seed:posts` or `ts-node src/scripts/seed-posts.ts`
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user-model";
import Post from "../models/post-model";
import Category from "../models/category-model";
import Tag from "../models/tag-model";
import { MONGO_URI } from "../config/env";

dotenv.config();

// Reliable Image Assets
const IMG_QUERY = "auto=format&fit=crop&q=80&w=1200";

const RECIPE_DATA = [
  {
    title: "Vibrant Thai Green Curry",
    content: "This curry hits all four pillars of Thai cuisine: spicy, sweet, sour, and salty. The secret is frying the paste in coconut cream until the oil separates.\n\n### Ingredients\n- 2tbsp Green curry paste\n- 400ml Full-fat coconut milk\n- 300g Chicken thigh, sliced\n- Thai basil, bamboo shoots, and fish sauce\n\n### Instructions\n1. Fry the curry paste in a small amount of coconut milk until fragrant.\n2. Add chicken and cook until opaque.\n3. Pour in remaining milk and simmer with veggies for 15 minutes.\n4. Finish with a squeeze of lime and fresh basil.",
    tagNames: ["thai", "main course", "high-protein"],
    imageUrl: `https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?${IMG_QUERY}`
  },
  {
    title: "Pan-Seared Lemon Garlic Salmon",
    content: "A 15-minute meal that tastes like a $40 entree. Perfect for weeknights when you still want to feel fancy.\n\n### Ingredients\n- 2 Salmon fillets (skin-on)\n- 3 cloves Garlic, minced\n- 1 Lemon (zested and sliced)\n- 2 tbsp Butter\n\n### Instructions\n1. Pat salmon dry (essential for crispy skin!).\n2. Sear skin-side down in a hot pan for 5 mins.\n3. Flip, add butter and garlic, and baste the fish for 2 more minutes.\n4. Garnish with lemon slices and parsley.",
    tagNames: ["seafood", "healthy", "quick & easy"],
    imageUrl: `https://images.unsplash.com/photo-1467003909585-2f8a72700288?${IMG_QUERY}`
  },
  {
    title: "Authentic Roman Pasta Carbonara",
    content: "Forget the cream. This is the real deal. The sauce is created through an emulsion of pasta water, egg yolks, and sharp cheese.\n\n### Ingredients\n- 200g Spaghetti\n- 100g Guanciale (or Pancetta)\n- 3 Large egg yolks\n- 50g Pecorino Romano\n\n### Instructions\n1. Fry guanciale until the fat renders and it's crispy.\n2. Whisk eggs and cheese in a separate bowl.\n3. Toss hot pasta with guanciale, then remove from heat completely.\n4. Stir in the egg mixture rapidly to create a creamy sauce without scrambling the eggs.",
    tagNames: ["italian", "pasta", "comfort food"],
    imageUrl: `https://images.unsplash.com/photo-1612874742237-6526221588e3?${IMG_QUERY}`
  },
  {
    title: "Beef Bourguignon: French Slow-Cook",
    content: "Experience the soulful depths of French country cooking. This stew is even better the next day.\n\n### Ingredients\n- 1kg Beef chuck, cubed\n- 750ml Red wine (Pinot Noir preferred)\n- 200g Bacon lardons\n- Carrots, onions, and beef stock\n\n### Instructions\n1. Sear beef in bacon fat until browned.\n2. Deglaze the pot with wine.\n3. Add veggies and stock, then braise at 150°C for 3-4 hours.",
    tagNames: ["french", "stew", "hard"],
    imageUrl: `https://images.unsplash.com/photo-1534939561126-855b8675edd7?${IMG_QUERY}`
  },
  {
    title: "Crispy Korean Fried Chicken",
    content: "Double-fried for extra crunch with a spicy, sticky gochujang glaze.\n\n### Ingredients\n- 1kg Chicken wings\n- Potato starch (for dredging)\n- Glaze: Gochujang, Soy sauce, Honey, Ginger\n\n### Instructions\n1. Fry chicken at 160°C for 7 mins. Remove.\n2. Increase heat to 190°C and fry again for 2 mins.\n3. Toss in warm glaze and top with sesame seeds.",
    tagNames: ["asian", "main course", "comfort food"],
    imageUrl: `https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?${IMG_QUERY}`
  },
  {
    title: "Vegetarian Buddha Bowl",
    content: "A balanced, plant-based power bowl featuring roasted chickpeas and a creamy tahini dressing.\n\n### Ingredients\n- Quinoa, Roasted chickpeas, Kale, Avocado\n- Dressing: Tahini, Lemon juice, Garlic, Maple syrup\n\n### Instructions\n1. Roast chickpeas at 200°C with cumin and salt.\n2. Massage kale with lemon juice to soften.\n3. Assemble grains, veggies, and dressing in a deep bowl.",
    tagNames: ["vegetarian", "vegan", "healthy"],
    imageUrl: `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?${IMG_QUERY}`
  },
  {
    title: "Classic French Onion Soup",
    content: "The key is the caramelization. You cannot rush the onions.\n\n### Ingredients\n- 5 Large yellow onions\n- 1L Beef bone broth\n- Gruyère cheese and Baguette slices\n\n### Instructions\n1. Sauté onions on low for 45 mins until mahogany.\n2. Add broth and simmer.\n3. Top with bread and cheese, then broil until bubbly.",
    tagNames: ["french", "soup", "hard"],
    imageUrl: `https://images.unsplash.com/photo-1510629954389-c1e0da47d414?${IMG_QUERY}`
  },
  {
    title: "Blueberry Lemon Pancakes",
    content: "Light, airy, and bursting with fresh berries. A weekend morning favorite.\n\n### Ingredients\n- 2 cups Flour, 1 cup Buttermilk, 2 Eggs\n- 1 cup Fresh blueberries, Lemon zest\n\n### Instructions\n1. Whisk wet and dry ingredients separately, then combine.\n2. Fold in blueberries gently.\n3. Cook on a buttered griddle until golden brown.",
    tagNames: ["breakfast", "kids friendly"],
    imageUrl: `https://images.unsplash.com/photo-1528207776546-365bb710ee93?${IMG_QUERY}`
  },
  { title: "Mexican Street Corn (Elote)", content: "Grilled corn smothered in mayo, chili, and cotija cheese.\n\n### Ingredients\n- Corn, Mayo, Lime, Cotija, Chili powder.", tagNames: ["mexican", "appetizer"], imageUrl: `https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?${IMG_QUERY}` },
  { title: "Shrimp Scampi Linguine", content: "Garlicky, lemony, and buttery shrimp served over pasta.\n\n### Ingredients\n- Shrimp, Linguine, Garlic, White wine, Butter.", tagNames: ["seafood", "pasta"], imageUrl: `https://images.unsplash.com/photo-1633504581786-316c8002b1b9?${IMG_QUERY}` },
  { title: "Authentic Beef Pho", content: "12-hour simmered bone broth with charred ginger.\n\n### Ingredients\n- Beef bones, Star anise, Rice noodles, Sliced steak.", tagNames: ["vietnamese", "soup", "hard"], imageUrl: `https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?${IMG_QUERY}` },
  { title: "Tiramisu from Scratch", content: "Espresso-soaked ladyfingers and whipped mascarpone cream.\n\n### Ingredients\n- Espresso, Mascarpone, ladyfingers, Cocoa.", tagNames: ["italian", "dessert"], imageUrl: `https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?${IMG_QUERY}` },
  { title: "Lamb Gyros with Tzatziki", content: "Tender roasted lamb wrapped in warm, fluffy pita.\n\n### Ingredients\n- Lamb shoulder, Pita, Cucumber, Greek yogurt.", tagNames: ["mediterranean", "dinner"], imageUrl: `https://images.unsplash.com/photo-1565557623262-b51c2513a641?${IMG_QUERY}` },
  { title: "Roasted Whole Chicken", content: "Crispy herb skin and juicy meat with root vegetables.", tagNames: ["main course", "baked"], imageUrl: `https://images.unsplash.com/photo-1598103442097-8b74394b95c6?${IMG_QUERY}` },
  { title: "Miso Glazed Cod", content: "Buttery cod with a sweet and savory Japanese glaze.", tagNames: ["japanese", "seafood", "healthy"], imageUrl: `https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?${IMG_QUERY}` },
  { title: "Classic Steak Frites", content: "Perfectly seared ribeye with crispy house-made fries.", tagNames: ["french", "main course"], imageUrl: `https://images.unsplash.com/photo-1600891964599-f61ba0e24092?${IMG_QUERY}` },
  { title: "Japanese Pork Ramen", content: "Rich tonkotsu broth with 6-minute marinated egg.", tagNames: ["japanese", "soup", "hard"], imageUrl: `https://images.unsplash.com/photo-1569718212165-3a8278d5f624?${IMG_QUERY}` },
  { title: "Greek Moussaka", content: "Layered eggplant and spiced lamb with bechamel topping.", tagNames: ["mediterranean", "comfort food"], imageUrl: `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?${IMG_QUERY}` },
  { title: "Chicken Tikka Masala", content: "Smoky tandoori chicken in a creamy spiced tomato gravy.", tagNames: ["indian", "main course"], imageUrl: `https://images.unsplash.com/photo-1565557623262-b51c2513a641?${IMG_QUERY}` },
  { title: "Classic Ratatouille", content: "Provencal vegetable stew with herbs de Provence.", tagNames: ["french", "vegetarian"], imageUrl: `https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?${IMG_QUERY}` },
  { title: "Butter Chicken (Murgh Makhani)", content: "Smooth, velvety, and mildly spiced Indian classic.", tagNames: ["indian", "comfort food"], imageUrl: `https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?${IMG_QUERY}` },
  { title: "Wild Mushroom Gnocchi", content: "Potato gnocchi in a truffle and wild mushroom cream.", tagNames: ["italian", "pasta"], imageUrl: `https://images.unsplash.com/photo-1551183053-bf91a1d81141?${IMG_QUERY}` },
  { title: "Beef Wellington", content: "Fillet steak wrapped in mushroom duxelles and puff pastry.", tagNames: ["french", "hard"], imageUrl: `https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?${IMG_QUERY}` },
  { title: "Andalucian Gazpacho", content: "Refreshing chilled tomato and cucumber soup.", tagNames: ["spanish", "soup", "vegetarian"], imageUrl: `https://images.unsplash.com/photo-1547592166-23ac45744acd?${IMG_QUERY}` },
  { title: "Sticky Toffee Pudding", content: "Rich date cake with warm, buttery toffee sauce.", tagNames: ["dessert", "comfort food"], imageUrl: `https://images.unsplash.com/photo-1587314168485-3236d6710814?${IMG_QUERY}` },
  { title: "Classic Pesto Genovese", content: "Freshly pounded basil, pine nuts, and parmesan.", tagNames: ["italian", "pasta", "easy"], imageUrl: `https://images.unsplash.com/photo-1473093226795-af9932fe5856?${IMG_QUERY}` },
  { title: "BBQ Baby Back Ribs", content: "Dry-rubbed and slow-smoked until tender.", tagNames: ["bbq", "american"], imageUrl: `https://images.unsplash.com/photo-1544025162-d76694265947?${IMG_QUERY}` },
  { title: "Ahi Tuna Poke Bowl", content: "Raw tuna with soy, sesame, and scallions over rice.", tagNames: ["japanese", "seafood", "healthy"], imageUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?${IMG_QUERY}` },
  { title: "Quinoa Salad with Feta", content: "Mediterranean grains with cucumber and lemon.", tagNames: ["mediterranean", "healthy"], imageUrl: `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?${IMG_QUERY}` },
  { title: "Spicy Chicken Quesadillas", content: "Golden tortillas with pepper jack and chipotle chicken.", tagNames: ["mexican", "easy"], imageUrl: `https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?${IMG_QUERY}` },
  { title: "Red Lentil Dal", content: "Hearty Indian lentils with tempered whole spices.", tagNames: ["indian", "soup", "vegan"], imageUrl: `https://images.unsplash.com/photo-1547592166-23ac45744acd?${IMG_QUERY}` },
  { title: "Honey Nut Baklava", content: "Layered filo pastry with walnuts and spiced syrup.", tagNames: ["mediterranean", "dessert"], imageUrl: `https://images.unsplash.com/photo-1519676867240-f03562e64548?${IMG_QUERY}` },
  { title: "Artisan Sourdough Baguettes", content: "Traditional French technique for a crisp crust.", tagNames: ["french", "baked", "hard"], imageUrl: `https://images.unsplash.com/photo-1509440159596-0249088772ff?${IMG_QUERY}` },
  { title: "Vegetarian Mushroom Stroganoff", content: "Rich mushroom ragu served over wide egg noodles.", tagNames: ["vegetarian", "comfort food"], imageUrl: `https://images.unsplash.com/photo-1476124369491-e7addf5db371?${IMG_QUERY}` },
  { title: "Hand-Rolled Maki Sushi", content: "Fresh salmon and cucumber in seasoned sushi rice.", tagNames: ["japanese", "hard"], imageUrl: `https://images.unsplash.com/photo-1579871494447-9811cf80d66c?${IMG_QUERY}` },
  { title: "Street Style Birria Tacos", content: "Slow-cooked beef with a rich dipping consommé.", tagNames: ["mexican", "hard"], imageUrl: `https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?${IMG_QUERY}` },
  { title: "Fluffy Sourdough Pancakes", content: "Using your discard for tangy, bubbly breakfast cakes.", tagNames: ["breakfast", "easy"], imageUrl: `https://images.unsplash.com/photo-1528207776546-365bb710ee93?${IMG_QUERY}` },
  { title: "Roasted Whole Cauliflower", content: "Whole-headed roast with spiced tahini drizzle.", tagNames: ["vegetarian", "healthy"], imageUrl: `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?${IMG_QUERY}` },
  { title: "Classic Crème Brûlée", content: "Vanilla bean custard with a torch-fired sugar crust.", tagNames: ["french", "dessert", "hard"], imageUrl: `https://images.unsplash.com/photo-1519676867240-f03562e64548?${IMG_QUERY}` }
];

const QUESTION_DATA = [
  { title: "Substitutes for heavy cream?", content: "I've run out of heavy cream for my pasta sauce. Can I use Greek yogurt or milk + butter?", tagNames: ["easy", "vegetarian"], imageUrl: `https://images.unsplash.com/photo-1550583724-b2692b85b150?${IMG_QUERY}` },
  { title: "Sourdough isn't rising?", content: "Starter is bubbly, but the final loaf is a pancake. Is it an over-proofing issue?", tagNames: ["hard", "baked"], imageUrl: `https://images.unsplash.com/photo-1585478259715-876acc5be8eb?${IMG_QUERY}` },
  { title: "Cast Iron vs Stainless Steel?", content: "Which pan gives a better sear on a ribeye steak? Looking for heat retention tips.", tagNames: ["grill", "main course"], imageUrl: `https://images.unsplash.com/photo-1527324688151-0e627063f2b1?${IMG_QUERY}` },
  { title: "Baking Soda vs Powder?", content: "Can I use them interchangeably in cookies, or will the texture change?", tagNames: ["easy", "baked"], imageUrl: `https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?${IMG_QUERY}` },
  { title: "How to fix salty soup?", content: "I accidentally added way too much salt. Can a potato really soak it up?", tagNames: ["easy", "soup"], imageUrl: `https://images.unsplash.com/photo-1547592166-23ac45744acd?${IMG_QUERY}` },
  { title: "Fresh vs Dried Herbs?", content: "What is the conversion ratio? Some say 1:3, others say it depends on the herb.", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?${IMG_QUERY}` },
  { title: "Easiest way to peel garlic?", content: "Is the 'shaking in a jar' trick actually effective or just a mess?", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?${IMG_QUERY}` },
  { title: "Crispy chicken skin tips?", content: "Mine always comes out rubbery when roasting. Should I use baking powder?", tagNames: ["medium", "baked"], imageUrl: `https://images.unsplash.com/photo-1598103442097-8b74394b95c6?${IMG_QUERY}` },
  { title: "What is deglazing?", content: "Recipes say 'deglaze with wine.' What exactly am I scraping off the pan?", tagNames: ["medium"], imageUrl: `https://images.unsplash.com/photo-1527324688151-0e627063f2b1?${IMG_QUERY}` },
  { title: "Stock vs Broth?", content: "Is there a real difference when making a risotto? Which has more collagen?", tagNames: ["easy", "soup"], imageUrl: `https://images.unsplash.com/photo-1547592166-23ac45744acd?${IMG_QUERY}` },
  { title: "Rice food safety?", content: "How long can cooked rice sit out before it becomes dangerous? Hearing mixed info.", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1543339308-43e59d6b73a6?${IMG_QUERY}` },
  { title: "High smoke point oils?", content: "Olive oil keeps smoking in my pan. Should I switch to Grapeseed or Avocado?", tagNames: ["medium", "grill"], imageUrl: `https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?${IMG_QUERY}` },
  { title: "Perfect soft boiled eggs?", content: "Is it 6 minutes or 7 for a jammy yolk? Cold or boiling water start?", tagNames: ["easy", "breakfast"], imageUrl: `https://images.unsplash.com/photo-1525351484163-7529414344d8?${IMG_QUERY}` },
  { title: "Is MSG safe?", content: "I want to use it for extra umami but I'm worried about health myths.", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1594911774882-a1b71499a3c3?${IMG_QUERY}` },
  { title: "Fixing acidic sauce?", content: "My tomato sauce tastes too sharp. Should I add sugar or a pinch of baking soda?", tagNames: ["medium", "pasta"], imageUrl: `https://images.unsplash.com/photo-1510629954389-c1e0da47d414?${IMG_QUERY}` },
  { title: "What is blooming spices?", content: "Should I toast dry spices in a dry pan or in oil before adding liquid?", tagNames: ["medium"], imageUrl: `https://images.unsplash.com/photo-1596040033229-a9821ebd058d?${IMG_QUERY}` },
  { title: "How to roast garlic?", content: "I want that sweet, spreadable texture for bread. What temperature is best?", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?${IMG_QUERY}` },
  { title: "Egg substitutes in baking?", content: "Baking for a vegan friend. Flax eggs vs applesauce?", tagNames: ["medium", "vegetarian"], imageUrl: `https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?${IMG_QUERY}` },
  { title: "Importance of resting meat?", content: "I'm always too hungry to wait. Does it really lose that much juice?", tagNames: ["medium", "grill"], imageUrl: `https://images.unsplash.com/photo-1600891964599-f61ba0e24092?${IMG_QUERY}` },
  { title: "Fluffy rice tips?", content: "My jasmine rice always ends up as a clump. Am I using too much water?", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1516684732162-798a0062be99?${IMG_QUERY}` },
  { title: "Softening butter fast?", content: "I forgot to take butter out for cookies. Any hacks besides the microwave?", tagNames: ["easy", "baked"], imageUrl: `https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?${IMG_QUERY}` },
  { title: "Best potatoes for mashing?", content: "Yukon Gold vs Russets. Which creates a fluffier texture?", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1518977676601-b53f82aba655?${IMG_QUERY}` },
  { title: "Can I use water instead of stock?", content: "Will my soup be bland? What can I add to water to make it better?", tagNames: ["easy", "soup"], imageUrl: `https://images.unsplash.com/photo-1547592166-23ac45744acd?${IMG_QUERY}` },
  { title: "Keeping cilantro fresh?", content: "It wilts in the fridge within a day. Jar of water vs paper towel?", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?${IMG_QUERY}` },
  { title: "Tofu pressing worth it?", content: "I never get it crispy. How long do I actually need to press extra-firm tofu?", tagNames: ["medium", "vegetarian"], imageUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?${IMG_QUERY}` },
  { title: "Why is my cake dry?", content: "I followed the recipe, but it's crumbly. Did I overmix or overbake?", tagNames: ["medium", "baked"], imageUrl: `https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?${IMG_QUERY}` },
  { title: "What is umami flavor?", content: "How do I add it to a vegetarian stew without using meat?", tagNames: ["medium"], imageUrl: `https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?${IMG_QUERY}` },
  { title: "Cleaning cast iron skillet?", content: "I heard you should never use soap. Is that actually true for modern pans?", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1527324688151-0e627063f2b1?${IMG_QUERY}` },
  { title: "Slow cooker vs Oven?", content: "Can I convert a Dutch oven recipe to a crockpot easily?", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1432139555190-58524dae6a55?${IMG_QUERY}` },
  { title: "Saving overcooked pasta?", content: "Is mushy pasta salvageable, or do I have to start over?", tagNames: ["easy", "pasta"], imageUrl: `https://images.unsplash.com/photo-1612874742237-6526221588e3?${IMG_QUERY}` },
  { title: "What is braising?", content: "I see it in recipes for short ribs. How is it different from stewing?", tagNames: ["medium", "stew"], imageUrl: `https://images.unsplash.com/photo-1534939561126-855b8675edd7?${IMG_QUERY}` },
  { title: "Tempering chocolate at home?", content: "It keeps blooming and turning white. What am I doing wrong?", tagNames: ["hard", "dessert"], imageUrl: `https://images.unsplash.com/photo-1548907040-4baa42d10919?${IMG_QUERY}` },
  { title: "Cutting grain in steak?", content: "Which way do the lines go on a flank steak? Does it affect chewiness?", tagNames: ["medium", "grill"], imageUrl: `https://images.unsplash.com/photo-1600891964599-f61ba0e24092?${IMG_QUERY}` },
  { title: "Emulsifying vinaigrette?", content: "My oil and vinegar keep separating. What is a good natural binder?", tagNames: ["medium"], imageUrl: `https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?${IMG_QUERY}` },
  { title: "When to season meat?", content: "Salt right before cooking or hours earlier? Hearing mixed opinions.", tagNames: ["medium"], imageUrl: `https://images.unsplash.com/photo-1600891964599-f61ba0e24092?${IMG_QUERY}` },
  { title: "Runny risotto fix?", content: "I added too much stock at the end. Can I thicken it without more rice?", tagNames: ["medium", "italian"], imageUrl: `https://images.unsplash.com/photo-1476124369491-e7addf5db371?${IMG_QUERY}` },
  { title: "What are mother sauces?", content: "I want to learn the basics of French cooking. Which one is easiest?", tagNames: ["hard", "french"], imageUrl: `https://images.unsplash.com/photo-1510629954389-c1e0da47d414?${IMG_QUERY}` },
  { title: "Why soak beans?", content: "Is the overnight soak mandatory for digestion or just for speed?", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1551462147-37885acc3c41?${IMG_QUERY}` },
  { title: "Best wood for smoking?", content: "Hickory vs Applewood for pork ribs. Which is more subtle?", tagNames: ["hard", "bbq"], imageUrl: `https://images.unsplash.com/photo-1544025162-d76694265947?${IMG_QUERY}` },
  { title: "Is non-stick safe?", content: "My pan is scratched. Should I throw it away immediately?", tagNames: ["easy"], imageUrl: `https://images.unsplash.com/photo-1527324688151-0e627063f2b1?${IMG_QUERY}` }
];

const FLEX_DATA = [
  { title: "3-Day Croissants!", content: "Finally achieved those 27 layers of lamination. My kitchen is covered in flour, but look at that shatter-crisp crust!", tagNames: ["french", "baked", "hard"], imageUrl: `https://images.unsplash.com/photo-1555507036-ab1f4038808a?${IMG_QUERY}` },
  { title: "12-Hour Smoked Brisket", content: "Woke up at 4am to start the offset smoker. Look at that smoke ring! The jiggle is real.", tagNames: ["bbq", "american", "hard"], imageUrl: `https://images.unsplash.com/photo-1588347818036-558601350947?${IMG_QUERY}` },
  { title: "Plating Game: Scallops", content: "Pan-seared scallops with a pea purée and mint oil. Precision cooking at its finest.", tagNames: ["seafood", "appetizer", "hard"], imageUrl: `https://images.unsplash.com/photo-1599458252573-56ae36120de1?${IMG_QUERY}` },
  { title: "Wagyu A5 Dinner", content: "Melt-in-your-mouth marbling. Just a quick sear with flakey salt. Life-changing.", tagNames: ["japanese", "hard"], imageUrl: `https://images.unsplash.com/photo-1558030006-450675393462?${IMG_QUERY}` },
  { title: "Hand-Pulled Noodles", content: "Finally mastered the biang-biang technique. The stretch and snap were perfect.", tagNames: ["asian", "hard"], imageUrl: `https://images.unsplash.com/photo-1585032226651-759b368d7246?${IMG_QUERY}` },
  { title: "Molecular Gastronomy night", content: "Balsamic caviar on caprese salad. Experimenting with spherification was a blast.", tagNames: ["hard"], imageUrl: `https://images.unsplash.com/photo-1546039907-7fa05f864c02?${IMG_QUERY}` },
  { title: "Cured Salami Flex", content: "After 6 months in the curing chamber, my first homemade salami is ready. Taste is unreal.", tagNames: ["hard"], imageUrl: `https://images.unsplash.com/photo-1543339308-43e59d6b73a6?${IMG_QUERY}` },
  { title: "Perfect Soufflé", content: "It stayed up for the whole photo shoot! Grand Marnier flavor with a light vanilla cream.", tagNames: ["french", "baked", "hard"], imageUrl: `https://images.unsplash.com/photo-1628191010210-a59de33e5941?${IMG_QUERY}` },
  { title: "Dry-Aged Ribeye Home Flex", content: "60-day home aged ribeye. The concentration of flavor is incredible. Just look at that crust.", tagNames: ["hard", "grill"], imageUrl: `https://images.unsplash.com/photo-1600891964599-f61ba0e24092?${IMG_QUERY}` },
  { title: "Tiny Tortellini", content: "Hand-forming these is meditative. Served in a simple brodo to let the pasta shine.", tagNames: ["italian", "pasta", "hard"], imageUrl: `https://images.unsplash.com/photo-1551183053-bf91a1d81141?${IMG_QUERY}` },
  { title: "Latte Art Swan", content: "Finally got a clean swan after weeks of pouring blobs. Microfoam was perfect today.", tagNames: ["hard"], imageUrl: `https://images.unsplash.com/photo-1517701604599-bb29b565090c?${IMG_QUERY}` },
  { title: "Ramen from Scratch", content: "Made the noodles and the tonkotsu broth from scratch. 18 hours of simmering.", tagNames: ["japanese", "soup", "hard"], imageUrl: `https://images.unsplash.com/photo-1569718212165-3a8278d5f624?${IMG_QUERY}` },
  { title: "Traditional Christmas Goose", content: "A Dickensian feast! Slow roasted to render all that delicious fat.", tagNames: ["hard", "baked"], imageUrl: `https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?${IMG_QUERY}` },
  { title: "Sushi Platter for 10", content: "Home sushi night. 100 pieces of nigiri and maki. My back hurts but my belly is full.", tagNames: ["japanese", "hard"], imageUrl: `https://images.unsplash.com/photo-1579871494447-9811cf80d66c?${IMG_QUERY}` },
  { title: "Handmade Shrimp Har Gow", content: "Getting that translucent skin is the hardest part of dim sum. I finally nailed it.", tagNames: ["asian", "hard"], imageUrl: `https://images.unsplash.com/photo-1496116218417-1a781b1c416c?${IMG_QUERY}` },
  { title: "Backyard Tandoor Oven", content: "Built this clay oven over the weekend. Authentic naan and chicken tikka at last.", tagNames: ["indian", "hard"], imageUrl: `https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?${IMG_QUERY}` },
  { title: "Tempered Chocolate Decorations", content: "Practicing my professional finishes. That snap and shine is what I was looking for.", tagNames: ["dessert", "hard"], imageUrl: `https://images.unsplash.com/photo-1548907040-4baa42d10919?${IMG_QUERY}` },
  { title: "Chicago Deep Dish Flex", content: "3-inch thick masterpiece. The sauce-on-top technique worked perfectly.", tagNames: ["american", "baked", "hard"], imageUrl: `https://images.unsplash.com/photo-1513104890138-7c749659a591?${IMG_QUERY}` },
  { title: "Baked Alaska", content: "Torched the meringue right at the table. Cold ice cream, hot cake. Perfection.", tagNames: ["dessert", "hard"], imageUrl: `https://images.unsplash.com/photo-1519676867240-f03562e64548?${IMG_QUERY}` },
  { title: "Artisan Baguette 'Ear'", content: "Look at that expansion. The scoring was perfect. The crackle of the crust is music.", tagNames: ["french", "baked", "hard"], imageUrl: `https://images.unsplash.com/photo-1509440159596-0249088772ff?${IMG_QUERY}` },
  { title: "1-Year Aged Vanilla", content: "Finally ready for baking season. The smell is incredibly deep and complex.", tagNames: ["easy", "hard"], imageUrl: `https://images.unsplash.com/photo-1595908129746-57ca1a63dd4d?${IMG_QUERY}` },
  { title: "Farm to Table Harvest", content: "Everything in this photo was grown in my garden. Roasted with simple olive oil.", tagNames: ["healthy", "hard"], imageUrl: `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?${IMG_QUERY}` },
  { title: "Wellington Cross-Section", content: "The moment of truth... Perfect medium rare from edge to edge.", tagNames: ["hard"], imageUrl: `https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?${IMG_QUERY}` },
  { title: "Birria Taco Jiggle", content: "The consommé was rich and fatty. Best thing I've made this year.", tagNames: ["mexican", "hard"], imageUrl: `https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?${IMG_QUERY}` },
  { title: "Mirror Glaze reflection", content: "Galaxy theme mirror glaze. You can literally see my phone in the reflection.", tagNames: ["dessert", "hard"], imageUrl: `https://images.unsplash.com/photo-1578985545062-69928b1d9587?${IMG_QUERY}` },
  { title: "Croquembouche Tower", content: "Pate a choux filled with salted caramel cream. 50 puffs tall.", tagNames: ["french", "dessert", "hard"], imageUrl: `https://images.unsplash.com/photo-1519676867240-f03562e64548?${IMG_QUERY}` },
  { title: "Focaccia Garden", content: "Used peppers, olives, and herbs to create a landscape on my bread. Almost too pretty to eat.", tagNames: ["baked", "hard"], imageUrl: `https://images.unsplash.com/photo-1513104890138-7c749659a591?${IMG_QUERY}` },
  { title: "Sashimi Skills Platter", content: "Practicing my fish butchery. Bluefin tuna and Hamachi slices.", tagNames: ["japanese", "seafood", "hard"], imageUrl: `https://images.unsplash.com/photo-1546039907-7fa05f864c02?${IMG_QUERY}` },
  { title: "Venison Stew", content: "Slow braised venison I hunted myself. Hearty, rich, and soulful.", tagNames: ["stew", "hard"], imageUrl: `https://images.unsplash.com/photo-1547592166-23ac45744acd?${IMG_QUERY}` },
  { title: "Salt-Crusted Snapper", content: "Cracking the salt crust is so satisfying. The fish inside is incredibly moist.", tagNames: ["seafood", "hard"], imageUrl: `https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?${IMG_QUERY}` },
  { title: "Souvlaki Platter for the neighborhood", content: "Fed 20 people today. Grilled 50 skewers of lemon-garlic pork.", tagNames: ["mediterranean", "hard"], imageUrl: `https://images.unsplash.com/photo-1565557623262-b51c2513a641?${IMG_QUERY}` },
  { title: "Classic Mille-Feuille", content: "Puff pastry from scratch. The layers are perfectly crisp and the pastry cream is rich.", tagNames: ["french", "dessert", "hard"], imageUrl: `https://images.unsplash.com/photo-1587314168485-3236d6710814?${IMG_QUERY}` },
  { title: "24-hour Brined Turkey", content: "Juicy holiday turkey. No dry meat here. Every piece was perfectly seasoned.", tagNames: ["american", "hard"], imageUrl: `https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?${IMG_QUERY}` },
  { title: "Dry-Aged Burger Blend", content: "Ground the brisket, short rib, and chuck myself. Best burger I've ever eaten.", tagNames: ["american", "hard"], imageUrl: `https://images.unsplash.com/photo-1568901346375-23c9450c58cd?${IMG_QUERY}` },
];

const seedPosts = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const users = await User.find();
    const categories = await Category.find();
    const allTags = await Tag.find();

    if (!users.length || !categories.length) {
      console.error("Missing Users or Categories. Seed those first!");
      process.exit(1);
    }

    const catMap = {
      recipe: categories.find(c => c.name === "recipe")?._id,
      question: categories.find(c => c.name === "question")?._id,
      flex: categories.find(c => c.name === "flex")?._id,
    };

    const allPosts = [];

    for (const user of users) {
      const postCount = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < postCount; i++) {
        const typeRand = Math.random();
        let source, catId;

        if (typeRand < 0.34) { source = RECIPE_DATA; catId = catMap.recipe; }
        else if (typeRand < 0.67) { source = QUESTION_DATA; catId = catMap.question; }
        else { source = FLEX_DATA; catId = catMap.flex; }

        const template = source[Math.floor(Math.random() * source.length)];

        const tagIds = allTags
          .filter(t => template.tagNames?.includes(t.name))
          .map(t => t._id);

        const hasImage = catId !== catMap.question || Math.random() > 0.5;
        const images = hasImage && template.imageUrl ? [template.imageUrl] : [];

        allPosts.push({
          title: template.title,
          content: template.content,
          translations: {
            title: { en: template.title, bg: "" },
            content: { en: template.content, bg: "" },
          },
          authorId: user._id,
          category: catId,
          tags: tagIds,
          image: images,
          isApproved: true,
          isVisible: true,
          likes: []
        });
      }
    }

    await Post.deleteMany({});
    
    const createdPosts = await Post.insertMany(allPosts);
    console.log(`✅ ${createdPosts.length} posts created with ObjectId references`);

    // Add random likes
    for (const post of createdPosts) {
      const likeCount = Math.floor(Math.random() * users.length);
      const shuffled = [...users].sort(() => 0.5 - Math.random());
      post.likes = shuffled.slice(0, likeCount).map(u => u._id) as any;
      await post.save();
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedPosts();
