const Product = require("../models/product");
const dotenv = require("dotenv");
const connectDatabase = require("../config/database");

const products_data = require("../data/product.json");

// Setting Up config files
dotenv.config({ path: "server/config/config.env" });

// connect database
connectDatabase();

const seedProducts = async () => {
  try {
    await Product.deleteMany();
    console.log("products are deleted");
    await Product.insertMany(products_data);
    console.log("All products are added");
    process.exit();
  } catch (err) {
    console.log(err.message);
    process.exit();
  }
};

seedProducts();
