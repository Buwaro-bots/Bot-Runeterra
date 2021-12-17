const config = require('./config.json'); // This file contains the connection tokens and other necessary infos

const Discord = require("discord.js");
const client = new Discord.Client();

let userList = require('./data/user-list.json');
const fs = require('fs');

const axios = require('axios');
const { info } = require('console');

let prefix = config.prefix; 

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
  });



console.log("Ready!");

client.on("message", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;     // Exit and stop if the prefix is not there or if user is a bot
    
    process.stdout.write(`${message.author.username}#${message.author.discriminator} ${message.content} => `);

    let commandBody = message.content.slice(prefix.length);
    let args = commandBody.split(/ +/);
    let command = args.shift().toLowerCase();
    try {

        if(command === "register") {
            const username = args[0].replace('#', '/')
            const url = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${username}`;			
            axios.get(url, {
                params: {
                    "api_key" : config.riotToken
                }
              })			
            .then(function(response) {			
                return response.data; // response.data instead of response.json() with fetch			
            })			
            .then(function(response) {		
                console.log(response);

                userList[message.author.id] = response.puuid;

                let writer = JSON.stringify(userList, null, 4);
                fs.writeFileSync('./data/user-list.json', writer);
            })
        }

        else if (command === "match") {
            if (!userList.hasOwnProperty(message.author.id)) {
                message.channel.send(`${message.author.toString()}: Register first with **${prefix} username#tag**.`);
                throw("erreur");
            }
            const user = userList[message.author.id];
            const urlMatches = `https://europe.api.riotgames.com/lor/match/v1/matches/by-puuid/${user}/ids`;
            
            const numberOfGame = args.length > 0 ? parseInt(args[0]) - 1 : 0;
            axios.get(urlMatches, {
                params: {
                    "api_key" : config.riotToken
                }
            })			
            .then(function(listMatches) {			
                return listMatches.data; // response.data instead of response.json() with fetch			
            })			
            .then(function(listMatches) {	
                const matchID = listMatches[numberOfGame];
                const urlSingle = `https://europe.api.riotgames.com/lor/match/v1/matches/${matchID}`;
                axios.get(urlSingle, {
                    params: {
                        "api_key" : config.riotToken
                    }
                })			
                .then(function(singleMatch) {			
                    return singleMatch.data; // response.data instead of response.json() with fetch			
                })			
                .then(function(singleMatch) {		
                    console.log(singleMatch);
                    player = singleMatch.info.players[0].puuid === user ? singleMatch.info.players[1] : singleMatch.info.players[0];
                    
                    urlMobalytics = `https://lor.mobalytics.gg/fr_fr/decks/code/${player.deck_code}`;
                    message.channel.send(`${message.author.toString()}: ${urlMobalytics}`);
                })
            })
        }


        else if (false /*command === "last"*/) {
            const user = userList[message.author.id];
            const urlMatches = `https://europe.api.riotgames.com/lor/match/v1/matches/by-puuid/${user}/ids`;			
            axios.get(urlMatches, {
                params: {
                    "api_key" : config.riotToken
                }
              })			
            .then(function(listMatches) {			
                return listMatches.data; // response.data instead of response.json() with fetch			
            })			
            .then(function(listMatches) {		
                console.log(listMatches);
                listMatches.forEach(matchID => {
                    try{
                    const urlSingle = `https://europe.api.riotgames.com/lor/match/v1/matches/${matchID}`;
                                axios.get(urlSingle, {
                                    params: {
                                        "api_key" : config.riotToken
                                    }
                                })			
                                .then(function(singleMatch) {			
                                    return singleMatch.data; // response.data instead of response.json() with fetch			
                                })			
                                .then(function(singleMatch) {		
                                    console.log(singleMatch);
                                })
                    } catch (e){}
                })
            })
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