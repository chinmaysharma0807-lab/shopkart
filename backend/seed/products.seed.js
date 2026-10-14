// Fills the products collection with sample data.
// Run with:  npm run seed
// It deletes existing products first, so it's safe to run more than once.
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/product.model");

const img = (path) => `https://cdn.dummyjson.com/product-images/${path}/thumbnail.webp`;
const book = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const products = [
  // Electronics
  {
    name: "iPhone 13 Pro",
    description: "6.1-inch Super Retina XDR display with ProMotion, A15 Bionic chip and a pro triple-camera system.",
    price: 89999,
    category: "Electronics",
    image: img("smartphones/iphone-13-pro"),
    stock: 12,
  },
  {
    name: "Apple MacBook Pro 14 Inch",
    description: "Space grey MacBook Pro with a Liquid Retina XDR display, all-day battery life and a fast SSD.",
    price: 169999,
    category: "Electronics",
    image: img("laptops/apple-macbook-pro-14-inch-space-grey"),
    stock: 5,
  },
  {
    name: "Apple AirPods Max",
    description: "Over-ear wireless headphones with active noise cancellation and spatial audio.",
    price: 59900,
    category: "Electronics",
    image: img("mobile-accessories/apple-airpods-max-silver"),
    stock: 8,
  },
  {
    name: "Apple AirPods",
    description: "True wireless earbuds with quick pairing, clear sound and a charging case.",
    price: 12900,
    category: "Electronics",
    image: img("mobile-accessories/apple-airpods"),
    stock: 30,
  },
  {
    name: "Samsung Galaxy Tab S8 Plus",
    description: "12.4-inch sAMOLED tablet with S Pen included, great for notes, drawing and streaming.",
    price: 74999,
    category: "Electronics",
    image: img("tablets/samsung-galaxy-tab-s8-plus-grey"),
    stock: 0,
  },

  // Fashion
  {
    name: "Nike Air Jordan 1 Red And Black",
    description: "Iconic high-top sneakers with premium leather upper and Air cushioning.",
    price: 12995,
    category: "Fashion",
    image: img("mens-shoes/nike-air-jordan-1-red-and-black"),
    stock: 15,
  },
  {
    name: "Puma Future Rider Trainers",
    description: "Retro-inspired running trainers with a soft, lightweight midsole.",
    price: 5999,
    category: "Fashion",
    image: img("mens-shoes/puma-future-rider-trainers"),
    stock: 22,
  },
  {
    name: "Man Plaid Shirt",
    description: "Regular-fit cotton plaid shirt, comfortable for everyday wear.",
    price: 1499,
    category: "Fashion",
    image: img("mens-shirts/man-plaid-shirt"),
    stock: 40,
  },
  {
    name: "Brown Leather Belt Watch",
    description: "Analog wristwatch with a brown genuine-leather strap and a minimal dial.",
    price: 3499,
    category: "Fashion",
    image: img("mens-watches/brown-leather-belt-watch"),
    stock: 3,
  },
  {
    name: "Classic Sun Glasses",
    description: "UV-protected classic sunglasses with a lightweight frame.",
    price: 999,
    category: "Fashion",
    image: img("sunglasses/classic-sun-glasses"),
    stock: 50,
  },

  // Books
  {
    name: "Atomic Habits",
    description: "James Clear's guide to building good habits and breaking bad ones, one small step at a time.",
    price: 499,
    category: "Books",
    image: book("9780735211292"),
    stock: 60,
  },
  {
    name: "Clean Code",
    description: "Robert C. Martin's handbook of agile software craftsmanship and writing readable code.",
    price: 899,
    category: "Books",
    image: book("9780132350884"),
    stock: 18,
  },
  {
    name: "The Pragmatic Programmer",
    description: "Classic advice for software developers on writing flexible, maintainable code (20th anniversary edition).",
    price: 1299,
    category: "Books",
    image: book("9780135957059"),
    stock: 9,
  },
  {
    name: "Sapiens",
    description: "Yuval Noah Harari's brief history of humankind, from the Stone Age to the present.",
    price: 599,
    category: "Books",
    image: book("9780062316097"),
    stock: 25,
  },

  // Home
  {
    name: "Bedside Table African Cherry",
    description: "Solid-wood bedside table with a drawer, finished in African cherry.",
    price: 7999,
    category: "Home",
    image: img("furniture/bedside-table-african-cherry"),
    stock: 6,
  },
  {
    name: "House Showpiece Plant",
    description: "Artificial potted plant that brightens up any shelf or desk, no watering needed.",
    price: 799,
    category: "Home",
    image: img("home-decoration/house-showpiece-plant"),
    stock: 35,
  },
  {
    name: "Family Tree Photo Frame",
    description: "Wall-mounted photo frame shaped like a tree, holds multiple family photos.",
    price: 1199,
    category: "Home",
    image: img("home-decoration/family-tree-photo-frame"),
    stock: 14,
  },
  {
    name: "Bamboo Spatula",
    description: "Eco-friendly bamboo spatula, safe for non-stick cookware.",
    price: 249,
    category: "Home",
    image: img("kitchen-accessories/bamboo-spatula"),
    stock: 80,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    const created = await Product.insertMany(products);
    console.log(`Seeded ${created.length} products into ${mongoose.connection.name}`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
