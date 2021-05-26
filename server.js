// importing
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js';
import Pusher from 'pusher'

// app config
const app = express();
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1209679",
    key: "757d8dbe153432c57d39",
    secret: "971fa027b3e17ddfac6e",
    cluster: "ap3",
    useTLS: true
  });

// middleware
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
})

// DB config
const connection_url = 'mongodb+srv://admin:dreamer22@cluster0.1mjsr.mongodb.net/chattingapp?retryWrites=true&w=majority';

mongoose
     .connect( connection_url, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
     .then(() => console.log( 'Database Connected' ))
     .catch(err => console.log( err ));

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                })
        } else {
            console.log('Error triggering Pusher');
        }
    });
})

// api routes
app.get('/', (req,res)=>res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    console.log('sync')
    Messages.find((err, data) => {
        if(err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
})

// listener
app.listen(port, ()=>console.log(`Listening on localhost:${port}`));