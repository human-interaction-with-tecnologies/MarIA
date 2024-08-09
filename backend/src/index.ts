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
  origin: process.env.ALLOWED_ORIGIN
}))
app.use(express.json())

console.log(
  `
${chalk.bgGreen('language model:')} ${process.env.OLLAMA_LLM}
${chalk.bgGreen('embedding model:')} ${process.env.OLLAMA_EMBEDDING_MODEL}
  `
)

interface ReviewedEntry extends Entry {
  accepted?: boolean | 'null'
}

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

  const bibCollection = await client.getOrCreateCollection({
    name: `bibtex-${user.uid}`,
    embeddingFunction: ollamaEmbedder
  })

  const relevantPapers = await bibCollection.query({
    queryTexts: [req.body.message],
    nResults: 5,
    where: {
      "$or": [{
        accepted: true
      }, {
        accepted: 'null'
      }]
    }
  })

  await messageCollection.add({
    ids: [Date.now().toString()],
    metadatas: [{
      sentByUser: true
    }],
    documents: [req.body.message]
  })

  const prompt = `
You are a helpful assistant helping a researcher with their systematic review of the literature, use information provided bellow to answer their question.
Try to adhere to the context as much as possible.

Relevant papers: ${
  relevantPapers.documents[0].map((document, index) => {
    const bibData: ReviewedEntry = JSON.parse(relevantPapers.metadatas[0][index]?.fields as string)

    return `
Title: ${bibData.fields.title}
Abstract: ${bibData.fields.abstract}
    `
  }).join('\n')
}

User query: ${req.body.message}
Answer:
  `

  console.log(prompt)

  const messages = [
    {
      role: 'system',
      content: prompt
    }
  ]

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
    const _data = data.toString().replace(/}{/g, '},{')
    try {
      const chunk = JSON.parse(_data)
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
    } catch (e) {
      console.log(chalk.bgRed('error:'), e)
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
  const parsed: ReviewedEntry[] = parse(fileContents).entries
  
  try {
    parsed.sort(function (a, b) {
      a.accepted = 'null'
      if (a.fields.title < b.fields.title) {
        return -1
      }
      if (a.fields.title > b.fields.title) {
        return 1
      }
      return 0;
    })
    res.json(parsed)
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
  
  firestore.collection(collectionName).add({entries: parsed})

  const promises: Promise<any>[] = []
  parsed.forEach(async (entry, index) => {
    promises.push(bibDb.add({
      ids: [entry.key],
      metadatas: [{
        auxValue: 1,
        type: entry.type,
        fullstring: entry.input,
        accepted: 'null',
        fields: JSON.stringify(entry)
      }],
      documents: [entry.fields.abstract || '']
    })
      .then((data) => {
        console.log(chalk.bgMagentaBright('chromadb:', `${index+1}/${parsed.entries.length}`), entry.fields.title, data)
      })
      .catch((error) => {
        console.log(chalk.bgMagentaBright('chromadb:', `${index+1}/${parsed.entries.length}`), chalk.bgRed(error), entry.fields.title)
      }))
  })

  Promise.all(promises)
    .finally(async () => {
      console.log(chalk.bgMagentaBright('chromadb:'), 'Done')
      const fbCollection = await getCollection(collectionName)

      fbCollection.entries.forEach(async (entry: ReviewedEntry) => {
        if (typeof entry.accepted === 'boolean') {
          await bibDb.update({
            ids: [entry.key],
            metadatas: [{
              fields: JSON.stringify(entry),
              accepted: entry.accepted
            }]
          }).then(() => console.log(chalk.bgMagenta('chromadb:'), 'Updated accepted status of document with key', entry.fields.title))
        }
      })

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
    console.log('Returned bibdata from', chalk.bgRed('firebase'))
    result = fbResult.entries
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

app.post('/review', authentication, async (req, res) => {
  const collectionName = `bibtex-${(res.locals.user as DecodedIdToken).uid}`
  const fbResult = await getCollection(collectionName)
  const chromeResult = (await client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: ollamaEmbedder
  }))

  if (fbResult.entries) {
    fbResult.entries.forEach(async (entry: ReviewedEntry) => {
      if (entry.key === req.body.key) {
        entry.accepted = req.body.accepted
      }
    })
  
    await deleteCollection(collectionName)
    firestore.collection(collectionName).add({entries: fbResult.entries})
    console.log(chalk.bgRed('firebase:'), 'Updated accepted status of document with key', req.body.key)
    res.status(200).json({
      message: 'ok'
    })
  } else {
    let document = await chromeResult.get({
      ids: [req.body.key]
    })

    const newFields = JSON.parse(document.metadatas[0]?.fields as string)
    newFields.accepted = req.body.accepted

    await chromeResult.update({
      ids: [req.body.key],
      metadatas: [{
        accepted: req.body.accepted,
        fields: JSON.stringify(newFields)
      }]
    })
    console.log(chalk.bgMagenta('chromadb:'),'Updated accepted status of document with key', req.body.key)
    res.status(200).json({
      message: 'ok'
    })
  }
})

app.listen(port, () => {
  console.log(chalk.blue(`Server is running on http://localhost:${port}`))
})