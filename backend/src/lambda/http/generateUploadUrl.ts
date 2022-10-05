import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createAttachmentPresignedUrl } from '../../businessLogic/todos'


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    
    const todoId = event.pathParameters.todoId
    const url = createAttachmentPresignedUrl(todoId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl:url
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