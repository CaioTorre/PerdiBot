var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var xhr;
var fs = require('fs');

// Helper function
let getRand = function(arr) { return arr[Math.floor(Math.random() * arr.length)]; };
let minToMSeconds = function(minutes) { return minutes * 60 * 1000; };
let dayToMSeconds = function(days) { return minToMSeconds(days * 24 * 60); };
let getRandTimeout = function(dict) { return dict['min'] + Math.random() * (dict['max'] - dict['min']); };

//Config log settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {colorize: true});
logger.level = 'debug';

//Initialize Discord Bot
var bot = new Discord.Client();//({token: auth.token, autorun: true});

// Game patterns
let gamePatterns = [/ jogo/i, / perdi/i, /^perdi/i];
let gameRegexs = gamePatterns.map((reg) => new RegExp(reg));

let waitTimes = {'min':minToMSeconds(30), 'max':dayToMSeconds(2)};
//let waitTimes = {'min':minToMSeconds(1), 'max':minToMSeconds(2)}
let nextRandomPerdi;

var retriggerPerdi = function() {
    clearTimeout(nextRandomPerdi);
    var nextTimeout = getRandTimeout(waitTimes);
    logger.debug("Next perdi in " + nextTimeout + 'ms');
    nextRandomPerdi = setTimeout(perdiRandom, nextTimeout);
}

var montarMensagem = function() {
    var begin = ['Puts', 'Ou'];
    var end = ['mano', 'absurdo'];
    return getRand(begin) + ', perdi ' + getRand(end);
}

var perdiRandom = function() {
    // Choose a random channel the bot is connected to
    var channel;
    do {
        channel = bot.channels.random();
    } while (channel.type != 'text' && channel.guild.name != 'Marotagens' && channel.name != 'geral');
    logger.info("Sending to " + channel.name);
    var msg = montarMensagem();
    logger.debug('Perdi random: ' + msg);
    channel.send(msg);
    retriggerPerdi();
} 

bot.on('ready', () => {
	logger.info('Connected');
	logger.info('Logged in as: ' + bot.user.username + '-(' + bot.user.tag + ')');
    setTimeout(perdiRandom, 5000);
    retriggerPerdi();
});

bot.on('message', msg => {
    logger.info('Got message from channel ID ' + msg.channel);
	if (bot.user.id != msg.author.id) {
        var hasMatch = gameRegexs.reduce((acc, reg) => acc || reg.test(msg.content), false);
        logger.info('Match: ' + hasMatch);
		if (hasMatch) {
            // Reset timeout
            retriggerPerdi();
            // Reply
            var reply = montarMensagem();
            logger.info('Replying: ' + reply);
            msg.reply(reply).then((sent) => console.log(`Replied to ${sent.author.username} (${sent.author.id}`));
        }
	} else {
		logger.info('Received own message!');
	}
});

// Login to the server
bot.login(auth.token);