const config = require('./config.json'); // This file contains the connection tokens and other necessary infos

const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');

let prefix = config.prefix; 

console.log("Ready!");

client.on("message", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;     // Exit and stop if the prefix is not there or if user is a bot
    
    process.stdout.write(`${message.author.username}#${message.author.discriminator} ${message.content} => `);

    let commandBody = message.content.slice(prefix.length);
    let args = commandBody.split(/ +/);
    let command = args.shift().toLowerCase();
    try {

        if(command === "test") {
            console.log("Test.");
        }


        else {
            console.log("Nothing.")
        }

    }

    catch(err) {
        message.react('❌');
        console.log(err/*.substring(0, 200)*/);
        }

})

client.login(config.discordToken);