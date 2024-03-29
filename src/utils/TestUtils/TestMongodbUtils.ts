import bcrypt from "bcrypt";
import mongoose from "mongoose";

import Chat from "src/models/Chat";
import RefreshToken from "src/models/RefreshToken";
import User, { UserDocument } from "src/models/User";
import { DatabaseChat } from "src/types/db";
import JWT from "src/utils/JWT";

import { Credentials, execMongodbCallback } from "./TestUtils";

export class TestMongodbUtils {
  public static async execMongodbOperation<T>(
    func: execMongodbCallback<T>
  ): Promise<T> {
    await mongoose.connect(process.env.MONGODB_HOST as string);
    const result = await func();
    await mongoose.disconnect();
    return result;
  }

  public static async createChat(userId: string) {
    return this.execMongodbOperation(async () => {
      const newChat = new Chat({
        members: new mongoose.Types.ObjectId(userId)
      });
      await newChat.save();
    });
  }

  public static async createUser(credentials: Credentials): Promise<string> {
    return await this.execMongodbOperation<string>(async () => {
      const { name, password } = credentials;
      const newUser = new User({
        name,
        password: await bcrypt.hash(password, 10)
      });
      await newUser.save();
      return newUser.id;
    });
  }

  public static async createRefreshToken(userId: string): Promise<string> {
    return await this.execMongodbOperation<string>(async () => {
      const newToken = new RefreshToken({
        token: JWT.createRefreshToken(userId),
        userId
      });
      await newToken.save();

      return newToken.token;
    });
  }

  public static async getChat(
    userId: string,
    peerId?: string
  ): Promise<DatabaseChat> {
    return this.execMongodbOperation<DatabaseChat>(async () => {
      const chats = await Chat.find({
        members: {
          $in: peerId
            ? [
                new mongoose.Types.ObjectId(userId),
                new mongoose.Types.ObjectId(peerId)
              ]
            : [new mongoose.Types.ObjectId(userId)]
        }
      });

      return chats[0];
    });
  }

  public static async getUser(name: string): Promise<UserDocument | void> {
    return await this.execMongodbOperation<UserDocument | void>(async () => {
      return await User.findByName(name);
    });
  }

  public static async deleteUser(name: string): Promise<void> {
    await this.execMongodbOperation(async () => {
      await User.deleteByName(name);
    });
  }

  public static async deleteRefreshToken(userId: string) {
    await this.execMongodbOperation(async () => {
      await RefreshToken.deleteByUserId(userId);
    });
  }

  public static async deleteChat(userId: string) {
    return this.execMongodbOperation(async () => {
      await Chat.deleteOne({
        members: { $in: [new mongoose.Types.ObjectId(userId)] }
      });
    });
  }
}
