import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { updateTodo } from '../../businessLogic/todos'


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const item = updateTodo(event)
   
    return  {
        statusCode: 200,
        body: JSON.stringify({
         item
        })
    }
}
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
