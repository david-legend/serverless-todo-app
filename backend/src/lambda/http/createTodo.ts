import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import * as uuid from 'uuid'
import { getUserId } from '../utils';
import { createTodo } from '../../businessLogic/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const todoId = uuid.v4()
    const userId = getUserId(event)

    const item = await createTodo(todoId, userId, event)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item
      })
    }
    
})

handler.use(
  cors({
    credentials: true
  })
)
