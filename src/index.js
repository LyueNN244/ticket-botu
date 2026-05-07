import "dotenv/config";

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

const supportRoleIds = process.env.SUPPORT_ROLE_IDS
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);

client.once("ready", () => {
  console.log(`${client.user.tag} aktif!`);
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ticket-kur") {
        const embed = new EmbedBuilder()
          .setTitle("Destek Sistemi")
          .setDescription("Destek talebi oluşturmak için aşağıdaki butona bas.")
          .setColor("Blue");

        const createButton = new ButtonBuilder()
          .setCustomId("ticket_create")
          .setLabel("Create Ticket")
          .setEmoji("📩")
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
          .addComponents(createButton);

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
              .setDescription("Bir kullanıcıyı veya durumu şikayet etmek için")
              .setValue("sikayet")
              .setEmoji("⚠️"),

            new StringSelectMenuOptionBuilder()
              .setLabel("Yetkili Başvuru")
              .setDescription("Yetkili başvurusu yapmak için")
              .setValue("yetkili-basvuru")
              .setEmoji("📝"),

            new StringSelectMenuOptionBuilder()
              .setLabel("Diğer")
              .setDescription("Diğer konular için")
              .setValue("diger")
              .setEmoji("❓")
          );

        const row = new ActionRowBuilder()
          .addComponents(menu);

        return interaction.reply({
          content: "Lütfen ticket türünü seç:",
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
        const ticketType = interaction.values[0];

        const typeNames = {
          "destek": "Destek",
          "sikayet": "Şikayet",
          "yetkili-basvuru": "Yetkili Başvuru",
          "diger": "Diğer"
        };

        const safeUsername = interaction.user.username
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        const channelName = `ticket-${ticketType}-${safeUsername}`;

        const existingChannel = interaction.guild.channels.cache.find(
          channel =>
            channel.name === channelName &&
            channel.type === ChannelType.GuildText
        );

        if (existingChannel) {
          return interaction.reply({
            content: `Zaten açık ticketın var: ${existingChannel}`,
            ephemeral: true
          });
        }

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
              PermissionFlagsBits.ManageChannels
            ]
          },
          ...supportRoleIds.map(roleId => ({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }))
        ];

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

        const row = new ActionRowBuilder()
          .addComponents(closeButton);

        const embed = new EmbedBuilder()
          .setTitle(`${typeNames[ticketType]} Ticket`)
          .setDescription(
            `${interaction.user}, ticket oluşturuldu.\nYetkililer kısa sürede seninle ilgilenecek.`
          )
          .setColor("Green");

        await channel.send({
          content: `${interaction.user} ${supportRoleIds.map(id => `<@&${id}>`).join(" ")}`,
          embeds: [embed],
          components: [row]
        });

        return interaction.reply({
          content: `Ticket açıldı: ${channel}`,
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error(error);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply("Bir hata oluştu.");
    }

    return interaction.reply({
      content: "Bir hata oluştu.",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);