const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');

dotenv.config();

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const categories = [
      { name: 'SSC Exams', slug: 'ssc-exams', description: 'Staff Selection Commission Exams', status: 'active' },
      { name: 'UP Police Exams', slug: 'up-police-exams', description: 'Uttar Pradesh Police Recruitment Exams', status: 'active' }
    ];

    // Clear existing categories
    await Category.deleteMany({});

    for (let cat of categories) {
      await Category.create(cat);
    }

    console.log('Categories seeded successfully with SSC and UP Police');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
