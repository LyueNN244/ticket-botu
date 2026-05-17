import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ticket-kur")
    .setDescription("Ticket paneli kurar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  new SlashCommandBuilder()
    .setName("destek-rol-ayarla")
    .setDescription("Ticketlar için destek rolünü ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option => 
      option.setName("rol")
        .setDescription("Destek rolü olarak ayarlanacak rolü seçin.")
        .setRequired(true)
    )
].map(command => command.toJSON());