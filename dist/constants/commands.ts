import { SlashCommandBuilder } from "discord.js";


export const commands : SlashCommandBuilder[] = [
    new SlashCommandBuilder().setName('vcpanel').setDescription(`ボイスチャンネルの作成うんぬんのやつ。`).setDMPermission(false)
]