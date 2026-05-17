import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("ticket-kur")
    .setDescription("Ticket sistemini kurar"),

  new SlashCommandBuilder()
    .setName("destek-rol-ayarla")
    .setDescription("Destek rolünü ayarlar")
    .addRoleOption(option =>
      option
        .setName("rol")
        .setDescription("Destek rolü")
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

try {
  console.log("Global slash komutları yükleniyor...");

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("Global slash komutları başarıyla yüklendi!");
} catch (error) {
  console.error(error);
}