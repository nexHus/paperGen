import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * User Schema
 * Stores user account information and authentication details
 */
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'teacher', 'student'],
    default: 'user'
  },
  avatar: { type: String },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Don't include password in JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

mongoose.models = {}

export default mongoose.model("User", userSchema);