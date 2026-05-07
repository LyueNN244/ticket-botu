import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ticket-kur")
    .setDescription("Ticket paneli kurar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());