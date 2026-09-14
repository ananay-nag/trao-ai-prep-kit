import { connectDB } from './client.js';
import { UserModel } from './models/User.js';
import { KitModel } from './models/Kit.js';

async function resetDB() {
  try {
    await connectDB();
    
    await UserModel.deleteMany({});
    console.log('✅ Cleared all User records.');
    
    await KitModel.deleteMany({});
    console.log('✅ Cleared all Kit records.');

    console.log('🎉 Database re-initiated successfully!');
    process.exit(0);
  } catch (err: any) {
    console.error('Error resetting database:', err);
    process.exit(1);
  }
}

resetDB();

