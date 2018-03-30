'use strict';

const Alexa = require('alexa-sdk');

//const db = require('./db');
const co = require('co');
const mongoose = require('mongoose');
const uri = "mongodb://conor1123:test123@testcluster-shard-00-00-h2vrz.mongodb.net:27017,testcluster-shard-00-01-h2vrz.mongodb.net:27017,testcluster-shard-00-02-h2vrz.mongodb.net:27017/test?ssl=true&replicaSet=testCluster-shard-0&authSource=admin"
var conn = null;

const AppController = require('./controllers/app.controller');

const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var dbConnected = false;



const handlers = {
    'LaunchRequest': function () {
        let speechOutput = "Welcome to loanstars. You can ask me about the status of your loan applications or start a new loan."
        let repromptSpeech = "What do you want to do?"
        this.emit(':ask', speechOutput, repromptSpeech);
        //let accessToken = this.event.session.user.accessToken;
        //let speechOutput = "";
        //const self = this;
    /*
        AppController.getApp(accessToken, function(err, val){
            console.log("Value in then: " + val);
            speechOutput = val;
            self.emit(':tell', speechOutput);
        })*/

/*
        AppController.getApp(accessToken, function(err, res){
            if(err){
                speechOutput = err;
            }
            else{
                speechOutput = "YOOO " + res;
            }
            alexa.emit(':tell', speechOutput);
        })*/

    },
    'SayHiIntent': function() {
        const reqObj = this.event.request;
        const sessionObj = this.event.session;

        if(sessionObj.new !== false){
            var speechOutput = "Yo, what up <say-as interpret-as='spell-out'>CIS4</say-as>40. Has Professor Simon told you about his favorite band Rush yet?";
            this.emit(':ask', speechOutput);
        }
        else{
            var speechOutput = "<amazon:effect name='whispered'>You're lying....</amazon:effect>.";
            this.emit(':tell', speechOutput);
        }
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        const message = 'Stuff broke';
        this.emit(':tell', message)
    },
    'CheckAppStatusIntent': function () {
        const intentObj = this.event.request.intent;
        const sessionObj = this.event.session;
        var currentSlots = intentObj.slots;
        var appType = currentSlots.appType.value;
        var speechOutput = "";
        var accessToken = this.event.session.user.accessToken;
        var test = "";
        var lookupAmount = currentSlots.lookupAmount.value;
        const self = this;
        var currentApps = null;

        //Always check for access token since we require it for DB calls.
        if(!accessToken) {
            speechOutput = "Please link your Loanstars account with Alexa";
            this.emit(':tellWithLinkAccountCard', speechOutput);
        } 
        else { //Else, account is linked
            //Check if appType is provided in the intent, if not, get it.
            if (!appType) {
                var slotToElicit = 'appType';
                speechOutput = 'Sure thing, What kind of application?';
                var repromptSpeech = speechOutput;
                this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
            } 
            else { //Else, intent included appType
                //Check if appType slot matches predefined values.
                if(currentSlots.appType.resolutions.resolutionsPerAuthority[0].status.code === "ER_SUCCESS_MATCH") {
                    //Logic switch based on what app type.
                    switch(appType){
                        case "mortgage":
                            //Check if lookupAmount is provided (usually this is the last step in the dialog with the else being
                            //executed first. Only will get here if there is multiple applications in the search).
                            if(lookupAmount) {
                                //Get apps from session
                                currentApps = sessionObj.attributes.apps;

                                //Find the app in the array and assign it 
                                var lookupApp = findObjectByKey(currentApps, 'amount', parseInt(lookupAmount));

                                self.emit(':tell', createSingleAppOutputSpeech(lookupApp));
                            }
                            else { // With no lookupAmount, take the app type and access token and get the applications
                                AppController.getApp(accessToken, function(err, apps){

                                    currentApps = apps;
    
                                    //If there is only 1 app returned, output it right away.
                                    if(currentApps.length === 1){
                                        //speechOutput = "Your " + currentApps[0].type + " application for, <say-as interpret-as='unit'>$" + currentApps[0].amount + "</say-as>, ";
                                        self.emit(':tell', createSingleAppOutputSpeech(currentApps[0]));
                                    }
                                    else{ //Else, output what we found and ask them which one to lookup (by amount at the moment)
                                        self.attributes['apps'] = apps;
                                        speechOutput = createMultiAppOutputSpeech(apps, appType);
                                        repromptSpeech = "Which amount do you want to lookup?"
                                        self.emit(':elicitSlot', 'lookupAmount', speechOutput, repromptSpeech);    
                                    }
                                });
                            }                 
                            break;
                    }
                }
                else{ //Else, appType is not recognized. AppType intent status code did not indicate a match.
                    var slotToElicit = 'appType';
                    speechOutput = 'You did not specify a valid application type. Try: mortgage or auto.';
                    var repromptSpeech = speechOutput;
                    this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
                }
            }
        }
    }/*,
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    }*/
};

exports.handler = function (event, context, callback) {

    console.log("In handler");

    //Used for performance since we are using AWS and connecting to a DB
    context.callbackWaitsForEmptyEventLoop = false;

    //Connect to the DB
    connect()
        .then(function(){
    });

    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

//Db connection function
var connect = co.wrap(function* () {
    //Checks if connection is made, if not, connect.
    if (conn === null) {
        conn = yield mongoose.connect(uri, {
            maxIdleTimeMS: 600000
        });
        console.log("Not connected....Connecting");
    }
    else {
        console.log("Connected already!");
    }
});

//Used when an application lookup returns multiple of the same time.
//This function will build the output speech based off of the provided apps array.
function createMultiAppOutputSpeech(retrievedApps, appTypeVar) {
    let speech = "We found " + retrievedApps.length + " " + appTypeVar + " applications."

    retrievedApps.forEach((app, index) => {
        //This means it is the last one in the array.
        if(index === retrievedApps.length - 1){
            speech += "and one for <say-as interpret-as='unit'>$" + app.amount + "</say-as>."
        }
        else if (index === 0){
            speech += " One for <say-as interpret-as='unit'>$" + app.amount + "</say-as>, "
        }
        else{
            speech += " one for <say-as interpret-as='unit'>$" + app.amount + "</say-as>, "
        }
    });

    speech += " Which amount would you like to lookup?"

    return speech;
}

function createSingleAppOutputSpeech(app) {

    let speech = "Your " + app.type + " application for <say-as interpret-as='unit'>$" + app.amount + "</say-as> ";

    switch(app.status){
        case "approved":
            speech += "was approved."
        break;

        case "canceled":
            speech += "was canceled by you. Please start a new application on our website."
        break;

        case "declined":
            speech += "has been declined. Please check the website for more information."
        break;

        case "incomplete":
            speech += "is still incomplete. Please fill out the remaining info on our website."
        break;

        case "pending":
            speech += "is currently pending under review."
        break;

        case "submitted":
            speech += "was submitted and is awaiting review."
        break;
    }

    return speech;
}

//Finds object in aray based on a property.
function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}