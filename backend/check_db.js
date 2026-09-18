require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const Category = require('./models/Category');
  const Exam = require('./models/Exam');
  const Test = require('./models/Test');
  
  const cats = await Category.find();
  const exams = await Exam.find();
  const tests = await Test.find();
  
  console.log('Categories:', cats.length);
  console.log(cats.map(c => c.name));
  
  console.log('Exams:', exams.length);
  console.log(exams.map(e => e.name));
  
  console.log('Tests:', tests.length);
  console.log(tests.map(t => ({ name: t.name, status: t.status, examName: t.examName })));
  
  process.exit(0);
}
check();
