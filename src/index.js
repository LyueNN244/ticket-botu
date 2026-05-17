import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import GuildConfig from "./models/GuildConfig.js";

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB bağlantısı başarılı!"))
  .catch(err => console.error("MongoDB bağlantı hatası:", err));

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
  PermissionFlagsBits
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const supportRoleIds = (process.env.SUPPORT_ROLE_IDS || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);

client.once("ready", () => {
  client.user.setPresence({
    activities: [{
      name: "🎫 Managing support tickets",
      type: 0
    }],
    status: "online"
  });

  console.log(`${client.user.tag} aktif!`);
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "destek-rol-ayarla") {
        const role = interaction.options.getRole("rol");
        
        await GuildConfig.findOneAndUpdate(
          { guildId: interaction.guild.id },
          { supportRoleId: role.id },
          { upsert: true, new: true }
        );

        return interaction.reply({
          content: `Destek rolü başarıyla ${role} olarak ayarlandı!`,
          ephemeral: true
        });
      }

      if (interaction.commandName === "ticket-kur") {
        const embed = new EmbedBuilder()
          .setTitle("NTE Türkiye Destek Sistemi")
          .setDescription("Destek talebi oluşturmak için aşağıdaki butona bas.")
          .setColor("Purple");

        const button = new ButtonBuilder()
          .setCustomId("ticket_create")
          .setLabel("Create Ticket")
          .setEmoji("📩")
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        return interaction.reply({
          embeds: [embed],
          components: [row]
        });
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "ticket_create") {
        const menu = new StringSelectMenuBuilder()
          .setCustomId("ticket_type_select")
          .setPlaceholder("Ticket türünü seç")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Destek")
              .setDescription("Genel destek almak için")
              .setValue("destek")
              .setEmoji("🛠️"),

            new StringSelectMenuOptionBuilder()
              .setLabel("Şikayet")
              .setDescription("Şikayet ticketı")
              .setValue("sikayet")
              .setEmoji("⚠️"),

            new StringSelectMenuOptionBuilder()
              .setLabel("Yetkili Başvuru")
              .setDescription("Yetkili başvurusu")
              .setValue("yetkili")
              .setEmoji("📝"),

            new StringSelectMenuOptionBuilder()
              .setLabel("Diğer")
              .setDescription("Diğer konular")
              .setValue("diger")
              .setEmoji("❓")
          );

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.reply({
          content: "Ticket türünü seç:",
          components: [row],
          ephemeral: true
        });
      }

      if (interaction.customId === "ticket_close") {
        await interaction.reply({
          content: "Ticket 3 saniye içinde kapatılıyor..."
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 3000);

        return;
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "ticket_type_select") {
        await interaction.deferReply({ ephemeral: true });

        const ticketType = interaction.values[0];

        const typeNames = {
          destek: "Destek",
          sikayet: "Şikayet",
          yetkili: "Yetkili Başvuru",
          diger: "Diğer"
        };

        const safeUsername = interaction.user.username
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        const channelName = `ticket-${ticketType}-${safeUsername}`;

        const existingChannel = interaction.guild.channels.cache.find(
          channel => channel.name === channelName
        );

        if (existingChannel) {
          return interaction.editReply(
            `Zaten açık bir ticketın var: ${existingChannel}`
          );
        }

        let guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        let serverSupportRoleId = guildConfig ? guildConfig.supportRoleId : null;

        const permissionOverwrites = [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: interaction.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ];

        // Add server-specific support role from DB
        if (serverSupportRoleId) {
          permissionOverwrites.push({
            id: serverSupportRoleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          });
        }

        // Add fallback support roles from .env
        for (const roleId of supportRoleIds) {
          if (!permissionOverwrites.find(p => p.id === roleId)) {
            permissionOverwrites.push({
              id: roleId,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ]
            });
          }
        }

        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites
        });

        const closeButton = new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("Ticket Kapat")
          .setEmoji("🔒")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        const embed = new EmbedBuilder()
          .setTitle(`${typeNames[ticketType]} Ticket`)
          .setDescription(
            `${interaction.user}, ticket oluşturuldu.\nYetkililer kısa sürede seninle ilgilenecek.`
          )
          .setColor("Green");

        const roleMentions = [];
        if (serverSupportRoleId) roleMentions.push(`<@&${serverSupportRoleId}>`);
        supportRoleIds.forEach(id => roleMentions.push(`<@&${id}>`));
        const uniqueMentions = [...new Set(roleMentions)].join(" ");

        await channel.send({
          content: `${interaction.user} ${uniqueMentions}`,
          embeds: [embed],
          components: [row]
        });

        return interaction.editReply(`Ticket açıldı: ${channel}`);
      }
    }
  } catch (error) {
    console.error("Ticket hatası:", error);

    if (interaction.replied || interaction.deferred) {
      return interaction.editReply("Bir hata oluştu.");
    }

    return interaction.reply({
      content: "Bir hata oluştu.",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);

const app = express();

app.get("/", (req, res) => {
  res.send("Ticket bot aktif!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Web server ${PORT} portunda çalışıyor.`);
});