const config = require('./config.json'); // This file contains the connection tokens and other necessary infos

const { decode, encode } = require('lorguardian-deckcode');

let userList = require('./data/user-list.json');
const cardSet1 = require('./data/cardlist/en_us/data/set1-en_us.json');
const cardSet2 = require('./data/cardlist/en_us/data/set2-en_us.json');
const cardSet3 = require('./data/cardlist/en_us/data/set3-en_us.json');
const cardSet4 = require('./data/cardlist/en_us/data/set4-en_us.json');
const cardSet5 = require('./data/cardlist/en_us/data/set5-en_us.json');
const cardSets = cardSet1.concat(cardSet2).concat(cardSet3).concat(cardSet4).concat(cardSet5);

let cardListbyCode = [];
cardSets.forEach(card => {
    cardListbyCode[card.cardCode] = card;
});
const orderSupertypes =  ["Champion", ""];
const orderType = ["Unit", "Spell", "Landmark"];
const manaCost = {0:"⓪", 1:"①", 2:"②", 3:"③", 4:"④", 5:"⑤", 6:"⑥", 7:"⑦", 8:"⑧", 9:"⑨", 10:"⑩", 11:"⑪", 12:"⑫", 13:"⑬"}// 14+: ⑭ ⑮ ⑯ ⑰ ⑱ ⑲ ⑳

const fs = require('fs');

const axios = require('axios');
//const { info } = require('console');

const Discord = require("discord.js");
const client = new Discord.Client();

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

        if (command === "token" && args.length === 1 && message.author.id == config.admin ) {
            config.riotToken = args[0];
            let writer = JSON.stringify(config, null, 4);
            fs.writeFileSync('./config.json', writer);
            message.react('👍');
            console.log("Token successfully changed.")
        }

        else if(command === "register") {

            if (!args.length == 1 || !args[0].includes("#")) {
                message.channel.send(`${message.author.toString()}: Username not valid, the format is username#tag.`);
            }

            else {

                const username = args[0].replace('#', '/')
                const url = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${username}`;			
                axios.get(url, {
                    params: {
                        "api_key" : config.riotToken
                    }
                })
                .catch(function (error) {
                    if (error.response) {
                    console.log(error.response.data);
                    if(error.response.data.status.status_code == 403) {
                        message.channel.send(`${message.author.toString()}: Api token not valid, please contact the admin of this bot.`);
                    }
                    else {
                        message.channel.send(`${message.author.toString()}: Username not valid, the format is username#tag.`);
                    }
                    }})		
                .then(function(response) {
                    return response.data; // response.data instead of response.json() with fetch
                })
                .then(function(response) {
                    console.log(response);

                    userList[message.author.id] = response.puuid;

                    let writer = JSON.stringify(userList, null, 4);
                    fs.writeFileSync('./data/user-list.json', writer);
                    message.react('👍');
                })
            }
        }

        else if (command === "match") {
            if (!userList.hasOwnProperty(message.author.id)) {
                message.channel.send(`${message.author.toString()}: Register first with **${prefix} register username#tag**.`);
                throw("Error");
            }
            const user = userList[message.author.id];
            const urlMatches = `https://europe.api.riotgames.com/lor/match/v1/matches/by-puuid/${user}/ids`;
            
            let numberOfGame = args.length > 0 ? parseInt(args[0]) - 1 : 0;
            axios.get(urlMatches, {
                params: {
                    "api_key" : config.riotToken
                }
            })			
            .then(function(listMatches) {			
                return listMatches.data; // response.data instead of response.json() with fetch			
            })
            .catch(function (error) {
                if (error.response) {
                  console.log(error.response.data);
                  if(error.response.data.status.status_code == 403) {
                    message.channel.send(`${message.author.toString()}: Api token not valid, please contact the admin of this bot.`);
                  }
                  else {
                    message.react('❌');
                  }
                }})
            .then(function(listMatches) {	
                numberOfGame = Math.min(numberOfGame, listMatches.length -1 );
                const matchID = listMatches[numberOfGame];
                const urlSingle = `https://europe.api.riotgames.com/lor/match/v1/matches/${matchID}`;
                axios.get(urlSingle, {
                    params: {
                        "api_key" : config.riotToken
                    }
                })	
                .catch(function (error) {
                    if (error.response) {
                      console.log(error.response.data);
                      if(error.response.data.status.status_code == 404) {
                        message.channel.send(`${message.author.toString()}: This game cannot be found, probably a game against a friend.`);
                      }
                      else {
                        message.react('❌');
                      }
                    }})
                .then(function(singleMatch) {	
                    return singleMatch.data; // response.data instead of response.json() with fetch			
                })			
                .then(function(singleMatch) {		
                    console.log(singleMatch);

                    if(singleMatch.info.game_mode !== "Constructed") {
                        message.channel.send(`${message.author.toString()}: This game wasn't a constructed game.`);
                        throw("Error.");
                    }
                    player = singleMatch.info.players[0].puuid === user ? singleMatch.info.players[1] : singleMatch.info.players[0];

                    const deckArray = decode(player.deck_code);

                    deckArray.sort(function(a, b) {
                        return b.count - a.count;
                    });
                    deckArray.sort(function(a, b) {
                        return cardListbyCode[a.code].cost - cardListbyCode[b.code].cost;
                    });

                    deckArray.sort(function(a, b){
                        return orderType.indexOf(cardListbyCode[a.code].type) - orderType.indexOf(cardListbyCode[b.code].type);
                    });

                    deckArray.sort(function(a, b){
                        return orderSupertypes.indexOf(cardListbyCode[a.code].supertype) - orderSupertypes.indexOf(cardListbyCode[b.code].supertype);
                    });

                    console.log(deckArray);

                    let deckList = "";
                    deckArray.forEach(card => {
                        deckList += `${manaCost[cardListbyCode[card.code].cost]}X${card.count} => ${cardListbyCode[card.code].name}\n`
                    });
                    
                    urlMobalytics = `https://lor.mobalytics.gg/fr_fr/decks/code/${player.deck_code}`;
                    message.channel.send(`${message.author.toString()}: Deckcode: ${player.deck_code}\n${urlMobalytics}\n${deckList}`);
                })
                .catch(function (error) {
                    message.react('❌');
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