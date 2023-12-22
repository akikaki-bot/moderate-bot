import {
    Client,
    Events,
    GatewayIntentBits,
    Interaction
} from "discord.js"
import { commands } from "./constants/commands"
import { MakeOwnVoiceChannel } from "./components/makeavoice"
import { BotToken } from "./secrets/data"

const client = new Client({
    intents : [ 
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
})

client.on('ready', async ( ) => {
    console.log(` Client ready at ${client.user?.username} `)
    client.application?.commands.set( commands )
})

client.login(BotToken)

const vcCommand = new MakeOwnVoiceChannel( client )

client.on(Events.VoiceStateUpdate, async ( oldState, newState ) => {
    vcCommand.VoiceStateUpdate( oldState, newState )
})

client.on('interactionCreate', async ( interaction : Interaction ) => {
    if(interaction.isCommand()){
        if(interaction.commandName === "vcpanel") {
            await vcCommand.commandInput(interaction)
            return;
        }
    }
    if(interaction.isStringSelectMenu()){
        if(interaction.customId === "run.makevc"){
            await vcCommand.showmodalMessage(interaction)
            return;
        }
    }
})
