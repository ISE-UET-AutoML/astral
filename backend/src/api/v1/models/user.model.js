import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar_url: { type: String },
  password: { type: String, required: true },
  refresh_token: { type: String, default: null },
  chatHistory: [{
    role: { type: String },
    content: { type: String },
    displayMessage: { type: String },
  }],
  jsonSumm: { type: String, default: null },
})

const User = mongoose.model('User', schema)
export default User
