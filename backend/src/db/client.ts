import '../config.js';
import mongoose, { ConnectOptions } from 'mongoose';



export function getMongoUri(): string {
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trao_interview_prep';
  const user = process.env.MONGODB_USER || process.env.MONGO_USER;
  const password = process.env.MONGODB_PASSWORD || process.env.MONGO_PASSWORD;

  if (user && password) {
    const encodedUser = encodeURIComponent(user);
    const encodedPass = encodeURIComponent(password);

    if (uri.includes('<db_username>') || uri.includes('<db_password>') || uri.includes('<username>') || uri.includes('<password>')) {
      uri = uri
        .replace(/<db_username>|<username>/g, encodedUser)
        .replace(/<db_password>|<password>/g, encodedPass);
    }
  }

  return uri;
}

export async function connectDB(): Promise<void> {
  const uri = getMongoUri();
  
  // Set Stable API options per MongoDB Atlas requirements
  const clientOptions: ConnectOptions = {
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true
    },
    dbName: process.env.MONGODB_DB_NAME || 'trao_interview_prep'
  };

  try {
    // Connect Mongoose client with clientOptions
    await mongoose.connect(uri, clientOptions);

    // Ping deployment to verify connection
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().command({ ping: 1 });
      console.log('🍃 Pinged your deployment. You successfully connected to MongoDB!');
    } else {
      console.log(`🍃 Connected to MongoDB: ${uri.replace(/:([^@]+)@/, ':****@')}`);
    }
  } catch (err: any) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('🍃 Disconnected from MongoDB');
  } catch (err: any) {
    console.error(`Error disconnecting from MongoDB: ${err.message}`);
  }
}




// const mongoose = require('mongoose');
// const uri = "mongodb+srv://<db_username>:<db_password>@cluster0.fag0dxt.mongodb.net/?appName=Cluster0";

// const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

// async function run() {
//   try {
//     // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
//     await mongoose.connect(uri, clientOptions);
//     await mongoose.connection.db.admin().command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await mongoose.disconnect();
//   }
// }
// run().catch(console.dir);
