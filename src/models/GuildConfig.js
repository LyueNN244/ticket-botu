import mongoose from "mongoose";

const guildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  supportRoleId: { type: String, required: true }
});

export default mongoose.model("GuildConfig", guildConfigSchema);
