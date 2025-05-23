import mongoose, { Schema } from "mongoose"
import { IDataFile } from "./dataFile"

export interface IUser extends mongoose.Document {
  email: string
  password: string
  role: "admin" | "user"
  userType: "workmate" | "general"
  title?: string
  credits: number
  dataFiles: {
    fileId: mongoose.Types.ObjectId | IDataFile
    title: string
    createdAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    userType: {
      type: String,
      enum: ["workmate", "general"],
      required: true,
    },
    title: {
      type: String,
    },
    credits: {
      type: Number,
      default: 0,
    },
    dataFiles: [{
      fileId: {
        type: Schema.Types.ObjectId,
        ref: "DataFile",
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  { timestamps: true },
)

// Safely create the model
let User: mongoose.Model<IUser>

try {
  if (mongoose.models.User) {
    User = mongoose.model<IUser>("User")
  } else {
    User = mongoose.model<IUser>("User", userSchema)
  }
} catch (error) {
  User = mongoose.model<IUser>("User", userSchema)
}

export { User }

