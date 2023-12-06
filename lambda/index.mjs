import { KMS } from "@aws-sdk/client-kms";
import axios, {isCancel, AxiosError} from 'axios';

const kms = new KMS();

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
const clientId = process.env['UNSPLASH_APP_ID']
const encryptedAccessKey = process.env['UNSPLASH_ACCESS_KEY'];
const encryptedSecretKey = process.env['UNSPLASH_SECRET_KEY'];
let decryptedAccessKey;
let decryptedSecretKey;


async function processEvent(event) {
  console.log("Pulling photo list for query '" + event.queryStringParameters.query)
  const res = await axios.get("https://api.unsplash.com/search/photos", {
    headers: {
      "Authorization": "Client-ID " + decryptedAccessKey
    },
    params: {
      ...event.queryStringParameters
    }
  })
  
  let expected = event.queryStringParameters.total || 20
  if(expected > 50) {
    expected = 50
  }
  console.log("Copying " + expected + " entries into results array...")
  
  let results = []
  for(let result of res.data.results) {
    results.push({
      url: result.urls.full,
      link: result.links.html,
      author: {
        name: result.user.name,
        link: result.user.links.html
      }
    })
    
    if(results.length >= expected) {
      break
    }
  }
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(results)
  };
}

export const handler = async (event) => {
  if (!decryptedAccessKey) {
    // Decrypt code should run once and variables stored outside of the
    // function handler so that these are decrypted once per container
    try {
      const req = {
        CiphertextBlob: Buffer.from(encryptedAccessKey, 'base64'),
        EncryptionContext: { LambdaFunctionName: functionName },
      };
      const data = await kms.decrypt(req);
      decryptedAccessKey = new TextDecoder().decode(data.Plaintext);
    } catch (err) {
      console.log('Decrypt error:', err);
      throw err;
    }
  }
  
  if (!decryptedSecretKey) {
    // Decrypt code should run once and variables stored outside of the
    // function handler so that these are decrypted once per container
    try {
      const req = {
        CiphertextBlob: Buffer.from(encryptedSecretKey, 'base64'),
        EncryptionContext: { LambdaFunctionName: functionName },
      };
      const data = await kms.decrypt(req);
      decryptedSecretKey = new TextDecoder().decode(data.Plaintext);
    } catch (err) {
      console.log('Decrypt error:', err);
      throw err;
    }
  }
  
  return processEvent(event);
};