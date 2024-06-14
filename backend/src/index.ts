// src/index.ts
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import axios from 'axios'
import multer from 'multer'
import chalk from 'chalk'
import { ChromaClient, OllamaEmbeddingFunction } from "chromadb"
import { firestore, authentication, deleteCollection, getCollection } from './firebase'
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { Entry, parse } from "@retorquere/bibtex-parser"

dotenv.config()

const app = express()
const port = 3000
const upload = multer({
  storage: multer.memoryStorage()
})
app.disable('x-powered-by')
app.use(cors({
  origin: 'http://localhost:9000'
}))
app.use(express.json())

const client = new ChromaClient({
  path: process.env.CHROMADB_HOST
})
const ollamaEmbedder = new OllamaEmbeddingFunction({
  url: `${process.env.OLLAMA_API_HOST}/api/embeddings`,
  model: process.env.OLLAMA_EMBEDDING_MODEL as string
})

app.post('/chat', authentication, async (req, res) => {
  const user: DecodedIdToken = res.locals.user as DecodedIdToken

  const messageCollection = await client.getOrCreateCollection({
    name: `messages-${user.uid}`,
    embeddingFunction: ollamaEmbedder
  })

  const chatHistory = await messageCollection.query({
    queryTexts: [req.body.message],
    nResults: 5
  })

  await messageCollection.add({
    ids: [Date.now().toString()],
    metadatas: [{
      sentByUser: true
    }],
    documents: [req.body.message]
  })

  const messages = chatHistory.documents[0].map((document, index) => {
    return {
      role: 'user',
      content: `This is a previous message from our chat, it was sent by ${chatHistory.metadatas[0][index]?.sentByUser ? 'me' : 'you'}: ${document}`
    }
  })

  messages.push({
    role: 'user',
    content: req.body.message
  })

  console.log(chalk.bgCyan('got chat request:', req.body.message))

  const response = await axios.post(`${process.env.OLLAMA_API_HOST}/api/chat`, {
    model: process.env.OLLAMA_LLM as string,
    messages
  }, {
    responseType: 'stream'
  })

  const stream = response.data
  let fullData = ''
  stream.on('data', async (data: any) => { 
    const chunk = JSON.parse(data.toString())
    res.write(chunk.message.content)
    fullData += chunk.message.content

    if(chunk.done) {
      await messageCollection.add({
        ids: [Date.now().toString()],
        metadatas: [{
          sentByUser: false
        }],
        documents: [fullData]
      })
      res.end()
    }
  })
})

app.get('/history', authentication, async (req, res) => {
  client.getCollection({
    name: `messages-${(res.locals.user as DecodedIdToken).uid}`
  })
    .then(async (messageCollection) => {
      const history = await messageCollection.get()

      res.json({
        history: history.documents.map((document, index) => {
          return {
            sentByUser: history.metadatas[index]?.sentByUser,
            content: document
          }
        })
      })
    })
    .catch(() => {
      res.status(200).json({
        history: []
      })
    })
})

app.post('/bibtex', authentication, upload.single('file'), async (req, res) => {
  const fileContents = req.file?.buffer.toString() || ''
  const collectionName = `bibtex-${(res.locals.user as DecodedIdToken).uid}`
  const parsed = parse(fileContents)
  
  try {
    parsed.entries.sort(function (a, b) {
      if (a.fields.title < b.fields.title) {
        return -1
      }
      if (a.fields.title > b.fields.title) {
        return 1
      }
      return 0;
    })
    res.json(parsed.entries)
    console.log(`Parsed bibtex file of ${req.file?.size} bytes`)
  } catch {
    res.status(400).send('Error parsing file')
  }

  const bibDb = await client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: ollamaEmbedder
  })

  await bibDb.delete({
    where: {
      auxValue: 1
    }
  })
  
  firestore.collection(collectionName).add(parsed)

  const promises: Promise<any>[] = []
  parsed.entries.forEach(async (entry, index) => {
    promises.push(bibDb.add({
      ids: [entry.key],
      metadatas: [{
        auxValue: 1,
        type: entry.type,
        fullstring: entry.input,
        fields: JSON.stringify(entry)
      }],
      documents: [entry.fields.abstract || '']
    })
      .then((data) => {
        console.log(chalk.bgMagentaBright('chromadb:', `${index+1}/${parsed.entries.length}`), entry.fields.title)
      })
      .catch(() => {
        console.log(chalk.bgMagentaBright('chromadb:', `${index+1}/${parsed.entries.length}`), chalk.bgRed('ERROR'), entry.fields.title)
      }))
  })

  Promise.all(promises)
    .finally(async () => {
      console.log(chalk.bgMagentaBright('chromadb:'), 'Done')
      await deleteCollection(collectionName)
    })

  console.log(await bibDb.get({}))
})

app.get('/bibtex', authentication, async (req, res) => {
  const collectionName = `bibtex-${(res.locals.user as DecodedIdToken).uid}`
  const fbResult = await getCollection(collectionName)
  const chromeResult = await (await client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: ollamaEmbedder
  })).get()
  let result = []

  if (fbResult.entries) {
    result = fbResult.entries
    console.log('Returned bibdata from', chalk.bgRed('firebase'))
  } else {
    result = chromeResult.metadatas.map((metadata) => {
      return JSON.parse(metadata?.fields as string)
    })
    console.log('Returned bibdata from', chalk.bgMagenta('chromadb'))
  }

  result.sort(function (a: Entry, b: Entry) {
    if (a.fields.title < b.fields.title) {
      return -1;
    }
    if (a.fields.title > b.fields.title) {
      return 1;
    }
    return 0;
  })

  res.json(result)
})

app.listen(port, () => {
  console.log(chalk.blue(`Server is running on http://localhost:${port}`))
})