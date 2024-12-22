'use strict';

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dialogflow = require('@google-cloud/dialogflow');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Path to your service account JSON key file
const keyFilename = path.join(__dirname, 'service-account-key.json');
const projectId = 'small-talk-huiw'; // Replace with your Dialogflow project ID

// Dialogflow client
const sessionClient = new dialogflow.SessionsClient();

// Serve static files
app.use(express.static(__dirname));
app.use(express.static(__dirname + '/public'));

// Serve the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('chat message', async (message) => {
    try {
      // Step 1: Set up Dialogflow session
      const sessionId = socket.id; // Use the socket ID as a session ID
      const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

      // Step 2: Send user message to Dialogflow
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: message,
            languageCode: 'en-US', // Change to your desired language
          },
        },
      };

      const [response] = await sessionClient.detectIntent(request);

      // Step 3: Get Dialogflow's response
      const aiReply = response.queryResult.fulfillmentText;

      // Step 4: Send the reply back to the client
      socket.emit('bot reply', aiReply || '(No response)');
    } catch (error) {
      console.error('Dialogflow API error:', error);
      socket.emit('bot reply', 'Sorry, something went wrong.');
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server running on port 3000');
});
