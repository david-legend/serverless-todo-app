import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly s3 = createS3()) {
  }

  async getAllTodos(userId: string) {
    console.log('Getting all Todos')

    const result = await this.docClient.query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false
    }).promise()

    return result.Items
  }

  async createTodo(todo: TodoItem) {
    await this.docClient.put({
        TableName: this.todosTable,
        Item: todo
    }).promise()

  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    
    await this.docClient.delete({
        TableName: this.todosTable, 
        Key : {
          todoId: todoId,
          userId: userId
        },
        ConditionExpression: '#todoId = :todoIdValue and #userId = :userIdValue',
        ExpressionAttributeValues: { ':todoIdValue': todoId, ':userIdValue': userId  },
        ExpressionAttributeNames: { '#todoId': 'todoId', '#userId': 'userId'  }
    }).promise();

  }

  createAttachmentPresignedUrl(imageId: string): string {
    const url = this.s3.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: imageId,
        Expires: Number(this.urlExpiration)
    })
  
    return url
  }

  async updateTodo(todo: TodoUpdate, userId: string, todoId: string) {
    await this.docClient.update({
        TableName: this.todosTable,
        Key : {
            todoId: todoId,
            userId: userId
        },
        UpdateExpression: "set #done = :done, #dueDate = :dueDate",
        ExpressionAttributeValues: {
            ":done": todo.done,
            ":dueDate": todo.dueDate,
        },
        ExpressionAttributeNames: { '#done': 'done', '#dueDate': 'dueDate' }
    }).promise()

  }

}

function createDynamoDBClient() {
  return new XAWS.DynamoDB.DocumentClient()
}

function createS3() {
  return new XAWS.S3({
      signatureVersion: 'v4'
  })
}
