import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)
    let userId = getUserId(event)

    const items = await getTodosForUser(userId)
  
    return {
      statusCode: 200,
      body: JSON.stringify({
        items
      })
    }
    
})

handler.use(
  cors({
    credentials: true
  })
)
