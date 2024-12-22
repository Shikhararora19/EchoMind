const express = require('express');
const app = express();

app.use(express.static(__dirname + '/views')); // html
app.use(express.static(__dirname + '/public')); // js, css, images

const server = app.listen(5000);
app.get('/', (req, res) => {
  res.sendFile('index.html');
});

const { Configuration, OpenAIApi } = require('openai');
const io = require('socket.io')(3000); // Adjust the port as needed

// Initialize OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your OpenAI API key
});
const openai = new OpenAIApi(configuration);

io.on('connection', (socket) => {
  socket.on('audio message', async (audioBuffer) => {
    try {
      // Step 1: Transcribe audio using OpenAI Whisper API
      const transcriptionResponse = await openai.createTranscription(
        audioBuffer,
        'whisper-1', // Whisper model
        { response_format: 'text' } // Get plain text transcription
      );
      const userText = transcriptionResponse.data.text;

      // Step 2: Get a response from OpenAI ChatGPT
      const chatResponse = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo', // Or 'gpt-4'
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: userText },
        ],
      });

      const aiText = chatResponse.data.choices[0].message.content;

      // Step 3: Send the AI response back to the client
      socket.emit('bot reply', aiText);
    } catch (error) {
      console.error(error);
      socket.emit('bot reply', 'Sorry, something went wrong.');
    }
  });
});
