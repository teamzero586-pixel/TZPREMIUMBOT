import mongoose from 'mongoose'

// Reads the connection string from an environment variable.
// Never hardcode real credentials in source files — set MONGODB_URI
// as a Heroku Config Var (or in a local .env file that is gitignored).
export async function connectDB() {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        console.warn('⚠️  MONGODB_URI is not set. Pairing requests will not be saved.')
        return
    }
    try {
        await mongoose.connect(uri)
        console.log('✅ Connected to MongoDB')
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message)
    }
}

const pairingRecordSchema = new mongoose.Schema({
    number: { type: String, required: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
})

export const PairingRecord = mongoose.model('PairingRecord', pairingRecordSchema)
