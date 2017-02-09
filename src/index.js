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
                // Typing sign (...)
                request({
                    url: 'https://graph.facebook.com/v2.6/me/messages',
                    qs: {access_token:token},
                    method: 'POST',
                    json: {
                        recipient: {id:sender},
                        sender_action:"typing_on"
                    }
                }, function(error, response, body) {
                    if (error) {
                        console.log('Error sending messages: ', error)
                    } else if (response.body.error) {
                        console.log('Error: ', response.body.error)
                    }
                })

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

        if(response.result.metadata.intentName == 'round') {        // Current round               
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
        else if(response.result.metadata.intentName == 'round_time') {   // If asked for date of a particular match
            
            if(response.result.fulfillment.speech == 'timings') {

                request({
                    url: 'https://graph.facebook.com/v2.6/me/messages',
                    qs: {access_token:token},
                    method: 'POST',
                    json: {
                        recipient: {id:sender},
                        message: {
                            text: "Pick a match number",
                            quick_replies:[
                                {
                                  "content_type":"text",
                                  "title":"Match 1",
                                  "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ABOUT"
                                },
                                {
                                  "content_type":"text",
                                  "title":"Match 2",
                                  "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ROUND_DETAILS"
                                },
                                {
                                  "content_type":"text",
                                  "title":"Match 3",
                                  "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ROUND_DETAILS"
                                },
                                {
                                  "content_type":"text",
                                  "title":"Match 4",
                                  "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ROUND_DETAILS"
                                },
                                {
                                  "content_type":"text",
                                  "title":"Match 5",
                                  "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ROUND_DETAILS"
                                },
                                {
                                  "content_type":"text",
                                  "title":"Match 6",
                                  "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ROUND_DETAILS"
                                },
                                {
                                  "content_type":"text",
                                  "title":"Match 7",
                                  "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ROUND_DETAILS"
                                },
                                {
                                  "content_type":"text",
                                  "title":"Match 8",
                                  "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ROUND_DETAILS"
                                }
                            ]
                        }
                    }
                })

            }

            else {
                var date = new Array();
                date['1'] = "18";
                date['2'] = "19";
                date['3'] = "20";
                date['4'] = "21";
                date['5'] = "22";
                date['6'] = "23";
                date['7'] = "24";
                date['8'] = "25";

                var message = "";
                if(response.result.fulfillment.speech>=1 && response.result.fulfillment.speech<=8){
                    message = "It happens on Feb "+(date[response.result.fulfillment.speech])+", 2017";
                }
                else{
                    message = "There is no such round ";
                }

                sendTextMessage(sender, message);
            }
            

        }
        else if(response.result.metadata.intentName == 'play_ppl') {
            sendURL(sender);
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

function sendURL(sender) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: {
                attachment: {
                  type: "template",
                  payload: {
                    template_type: "button",
                    text: "Click the link to play",
                    buttons:[{
                      type: "web_url",
                      url: "https://ppl.pragyan.org",
                      title: "Pragyan Premier League",
                      webview_height_ratio: "full",
                      messenger_extensions: true
                    }]
                  }
                },
                quick_replies:[
                    {
                      "content_type":"text",
                      "title":"What is PPL ?",
                      "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ABOUT"
                    },
                    {
                      "content_type":"text",
                      "title":"Match timings",
                      "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ROUND_DETAILS"
                    }
                ]
            }
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
function sendTextMessage(sender, text) {

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: {
                text: text,
                quick_replies:[
                    {
                      "content_type":"text",
                      "title":"What is PPL ?",
                      "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ABOUT"
                    },
                    {
                      "content_type":"text",
                      "title":"Match timings",
                      "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_ASKING_ROUND_DETAILS"
                    }
                ]
            }
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
