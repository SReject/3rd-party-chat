const { ChatClient } = require('@twurple/chat');

const processMessage = require('./process-message');

const SOURCE_ID = 'sreject-3rd-party-chat';
const EVENT_ID = 'sreject-3rd-party-chat-messge';

module.exports = {

    getScriptManifest: () => {
        return {
            name: "3rd Party Chat",
            description: "Watches for and emits events related to a Twitch 3rd party's channel chat",
            author: "SReject",
            version: "1.0",
            firebotVersion: "5",
            startupOnly: true
        };
    },

    getDefaultParameters: () => {
        return {
            channel: {
                type: "string",
                default: "SReject",
                description: "The twitch channel chat to monitor"
            },
            prefix: {
                type: "string",
                default: "[3PC]",
                description: "The prefix to apply to chat messages displayed in the dashboard that come from the 3rd party's channel"
            }
        };
    },

    run: ({ parameters, modules, firebot }) => {

        const { eventManager, frontendCommunicator, logger, replaceVariableManager } = modules

        // register event
        eventManager.registerEventSource({
            id: SOURCE_ID,
            name: '3rd Party Chat',
            events: [{
                id: EVENT_ID,
                name: '3rd Party Chat Message Received',
                description: 'When a 3rd party chat message is received'
            }]
        });


        // register $thirdPartyChatMessage
        replaceVariableManager.registerReplaceVariable({
            definition: {
                handle: 'thirdPartyChatMessage',
                triggers: { event: [`${SOURCE_ID}:${EVENT_ID}`] },
                description: 'Returns the chat message received',
                possibleDataOutput: ["text"],
            },
            evaluator: async meta => meta.eventData.rawText
        })


        const chat = new ChatClient({
            channels: [parameters.channel]
        });

        chat.onMessage((...evt) => {

            const msg = processMessage(evt[3], modules.logger);
            if (msg == null) {
                return;
            }

            logger.debug('[3pc] raw text:', msg.rawText);

            eventManager.triggerEvent(SOURCE_ID, EVENT_ID, {
                username: msg.username,
                rawText: msg.rawText,
                chatMessage: msg
            });

            if (parameters.prefix != null && parameters.prefix !== '') {
                const len = 1 + parameters.prefix.length;

                msg.parts.forEach(part => {
                    if (part.position != null) {
                        part.position += len;
                    }
                });

                msg.parts.unshift({
                    type: 'text',
                    position: 0,
                    length: len,
                    text: `${parameters.prefix} `
                });
            }

            frontendCommunicator.send('twitch:chat:message', msg);
        });

        chat
            .connect()
            .catch(err => {
                modules.logger.warn('[3PC] Error:', err)
            });
    }
};