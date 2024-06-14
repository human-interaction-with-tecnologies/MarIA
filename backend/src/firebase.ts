import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

const firebaseConfig = {
  credential: admin.credential.cert(process.env.FB_SERVICE_ACCOUNT as string)
}
  
const firebase = admin.initializeApp(firebaseConfig)
const auth = firebase.auth()
const firestore = firebase.firestore()

function authentication (req: any, res: any, next: any) {
  const token = req.headers.authorization?.split('Bearer ')[1]

  auth.verifyIdToken(token.toString())
    .then(resolved => {
      res.locals.user = resolved
      next()
    })
    .catch(err => {
      res.status(401).send('Unauthorized')
    })
}

async function deleteCollection (collectionName: string): Promise<void> {
  await firestore.collection(collectionName).get()
    .then(snapshot => {
      snapshot.forEach(async doc => {
        await doc.ref.delete()
      })
    })
    .catch(err => console.log(err))
}

async function getCollection (collectionName: string): Promise<any> {
  let document: Object = {}
  
  await firestore.collection(collectionName).get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        document = doc.data()
      })
    })
    .catch(err => console.log(err))
    
  return document
}

export {
  authentication,
  firebase,
  firestore,
  deleteCollection,
  getCollection
}