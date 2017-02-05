'use strict'

import http 	  from 'http';
import express 	  from 'express';
import bodyParser from 'body-parser';
import request 	  from 'request';
import apiai 	  from 'apiai';

const app = express()
const Apiai = apiai("3793e4868a974eb5aa8e810282c302fd");

app.set('port', 5000)

// Process application/json
app.use(bodyParser.json())

// for Facebook verification
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }

    res.send('Error, wrong token'+ req.query['hub.verify_token'])
})

app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook', function (req, res) {      // For Facebook messenger

    let messaging_events = req.body.entry[0].messaging

    for (let i = 0; i < messaging_events.length; i++) {

        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id

        	if (event.message && event.message.text) {

        	    let text = event.message.text
                getReply(sender, text);

        	}
    }
    res.sendStatus(200);
})

app.post('/pplBot', function (req, res) {       // For the PPL web app
    var message = req.message.text;
    var sender  = req.message.sender;

    getReply(sender, message);

    res.sendStatus(200);
})

function getReply(sender,text) {

    var req = Apiai.textRequest(text, {
                  sessionId: sender
              });

    req.on('response', function(response) {

        if(response.result.metadata.intentName == 'round') {                    
            request.post(
                'http://localhost:8000/api/bot/getRoundNum',
                {
                    json: {
                            message: 'round'
                          }
                },
                function(error,response,body) {
                    sendTextMessage(sender,body.message);
                }
            );
        }
        else {
            sendTextMessage(sender,response.result.fulfillment.speech);
        }
    });
    req.on('error', function(error) {
        sendTextMessage(sender, "Oops! Something went wrong...");
    });
    req.end();

}

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
