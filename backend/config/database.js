const mongoose = require('mongoose')


const databaseConnect = () => {
    mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex : true
    }).then(() => {
      console.log('MongoDB database connected');
    }).catch(err => {
      console.log(err);
    });
  };
  
module.exports = databaseConnect;