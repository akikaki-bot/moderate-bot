import { ActionRowBuilder, ChannelType, Client, Colors, CommandInteraction, EmbedBuilder, Message, ModalBuilder, ModalSubmitInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle, VoiceState } from "discord.js";
import { voiceCategorys } from "../constants/voice_categorys";
import { voiceCategoryChannel } from "../secrets/data";


export class MakeOwnVoiceChannel {

    /**
     * Discord.js のClient
     */
    private client: Client;
    /**
     * カテゴリーのID
     */
    private parentCategory: string;

    constructor(client: Client) {
        this.client = client;
        this.parentCategory = voiceCategoryChannel
    }

    public async commandInput(interaction: CommandInteraction): Promise<Message | void> {

        await interaction.deferReply({ ephemeral: true })

        const error_parentCateory = new EmbedBuilder().setTitle('ボイスチャンネル作成 - 環境エラー').setDescription(`環境設定 parentCategory が未定義です。`).setColor(Colors.DarkRed)
        if (typeof this.parentCategory === "undefined") return await interaction.editReply({ embeds: [error_parentCateory] })

        const panel = new EmbedBuilder().setTitle('みんなのボイスチャンネル作成').setDescription(`下のメニューからボイスチャンネルのカテゴリを選んで、タイトルを入力し作成しましょう！`)
        const menu = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            new StringSelectMenuBuilder().setCustomId('run.makevc').setOptions(voiceCategorys).setPlaceholder('ここから選んでね')
        )

        await interaction.editReply({ content: "VCパネルは正常に作成されたよ。" })
        return await interaction.channel?.send({
            embeds: [panel],
            components: [menu]
        })

    }

    public async showmodalMessage(interaction: StringSelectMenuInteraction): Promise<Message | void> {

        const GameCategory = interaction.values[0]

        const modalMessage = new ModalBuilder().setTitle('タイトルを入力しましょう！').setCustomId('run.settitle')

        const Row = new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder().setLabel('タイトル (15文字ぐらいまで) ').setMaxLength(15).setRequired(true).setPlaceholder(`e.g. ゲームします`).setStyle(TextInputStyle.Paragraph).setCustomId('input.title')
        )

        modalMessage.setComponents(Row);
        await interaction.showModal(modalMessage);

        const ModalInput = await interaction.awaitModalSubmit({
            time: 60000,
            filter: i => i.user.id === interaction.user.id,
        }).catch(error => {
            const embed = new EmbedBuilder().setTitle('ボイスチャンネル作成 - タイムアウト').setDescription(`タイムアウトしたようです、、、もっかいやってくださいな。`).setColor(`DarkRed`);
            return interaction.editReply({ embeds: [embed] });
        })

        if (ModalInput) {
            const ModalTitle = ModalInput instanceof ModalSubmitInteraction && ModalInput.fields.getTextInputValue(`input.title`)

            if (!ModalTitle) {
                const embed = new EmbedBuilder().setTitle('ボイスチャンネル作成 - 作成エラー').setDescription(`インプットを解決できませんでした。`).setColor('DarkRed');
                ModalInput.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            const ParentCategory = await interaction.guild?.channels.fetch(this.parentCategory);
            if (!ParentCategory || ParentCategory === null) {
                const embed = new EmbedBuilder().setTitle('ボイスチャンネル作成 - 作成エラー').setDescription(`カテゴリを解決できませんでした。`).setColor('DarkRed');
                ModalInput.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            const VoiceChannel = await interaction.guild?.channels.create({
                name: `${this.categoryResolve(GameCategory).label}(${ModalTitle})`,
                topic: `カテゴリ : ${ModalTitle}`,
                type: ChannelType.GuildVoice,
                parent: ParentCategory.id
            }).catch(async (reason) => {
                const embed = new EmbedBuilder().setTitle('ボイスチャンネル作成 - 作成エラー').setDescription(`以下の理由でチャンネル作成に失敗しました。\n ${reason ?? "Unknown Reason"}`)
                await ModalInput.reply({ embeds: [embed], ephemeral: true });
                return;
            })

            if (typeof VoiceChannel !== "object") return;

            const guildInteractionuser = interaction.guild?.members.cache.find((user) => user.id === interaction.user.id)
            if (guildInteractionuser) {
                await guildInteractionuser.voice.setChannel(VoiceChannel.id, "作成者のため").catch(() => { })
            }

            await ModalInput.reply({
                content: `<#${VoiceChannel.id}>を作成しました！`,
                ephemeral: true
            })
            return;
        }
    }

    public async VoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {

        const CheckState =
            oldState.serverDeaf === newState.serverDeaf &&
            oldState.serverMute === newState.serverMute &&
            oldState.selfDeaf   === newState.selfDeaf   &&
            oldState.selfMute   === newState.selfMute   &&
            oldState.selfVideo  === newState.selfVideo  &&
            oldState.streaming  === newState.streaming;

        if (CheckState && oldState.channel) {
            const ParentCategory = await oldState.guild?.channels.fetch(this.parentCategory);
            if (!ParentCategory || ParentCategory === null) return console.log(`ParentCateory is Null or Undefined`)
            const VoiceChannel = this.client.channels.cache.get(oldState.channel.id)
            if (!VoiceChannel || !VoiceChannel.isVoiceBased()) return console.log(`VoiceChannel is Undefined or isn't voiceBased channel.`)

            const CategoryVC = VoiceChannel.parentId === ParentCategory.id
            if (!CategoryVC) return console.log(`CategoryId is mismatched.`)

            const memberCount = VoiceChannel.members.filter((member) => !member.user.bot).size
            if (memberCount <= 1) {
                VoiceChannel.deletable && await VoiceChannel.delete("誰もいなくなっちゃったし、、、").catch(() => { })
            }
        }
    }


    private categoryResolve(categoryValue: string) {
        return voiceCategorys.find((val) => val.value === categoryValue) ?? { label: categoryValue }
    }
}