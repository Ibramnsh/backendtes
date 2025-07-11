import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  password?: string;
  role: "admin" | "user";
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "user"], default: "user" },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.password);
};

const User = model<IUser>("User", UserSchema);
export default User;
