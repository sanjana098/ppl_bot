'use strict'

import express 	  from 'express';
import bodyParser from 'body-parser';
import request 	  from 'request';
import apiai 	  from 'apiai';

const app = express()
const asd = apiai("3793e4868a974eb5aa8e810282c302fd");

app.set('port', (5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }

    res.send('Error, wrong token'+ req.query['hub.verify_token'])
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        	if (event.message && event.message.text) {
        	    let text = event.message.text
        	    var request = asd.textRequest(text, {
        	    	sessionId: event.sender.id
        	    });
        	    request.on('response', function(response) {
        	    	console.log(response,"***");
    				sendTextMessage(sender,response.result.fulfillment.speech);
				});
				request.on('error', function(error) {
				    sendTextMessage(sender, "Oops! Something went wrong...");
				});
				request.end();
        	}
    }
    res.sendStatus(200)
})

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

const token = "EAAZAqdpVBz3QBAILC6VX64fS9veXiV83O1urepv7ye8ouddZApZCfIkzAnKFDttRx64aMBZBt42GY3ASvvhsi6BuIXgR2CJxems4gFD9iStNKlKJWkW3T32b2P5GUdSPLwFk6LlCMlrb5MPOaOnIcZAvvmsX7w8MJRX9uIWhtfwZDZD"
