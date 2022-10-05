
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { getUserId } from '../lambda/utils';
import * as AWS  from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
// const todosCreatedAtIndex = process.env.TODOS_CREATED_AT_INDEX

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

const s3 = new AWS.S3({
    signatureVersion: 'v4'
})

async function createTodo(todoId: string, userId: string, event: APIGatewayProxyEvent) {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    const item = {
        todoId: todoId,
        userId: userId,
        createdAt: new Date().toISOString(),
        done: false,
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`,
        ...newTodo
    }
    
    await docClient.put({
        TableName: todosTable,
        Item: item
    }).promise()

    return item
}


async function getTodosForUser(userId: string) {
    const result = await docClient.query({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false
    }).promise()

    
    return result.Items
}

function createAttachmentPresignedUrl(imageId: string) {
    const url = s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: imageId,
      Expires: Number(urlExpiration)
    })

    return url
}


async function deleteTodo(event) {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    await  docClient.delete({
        TableName: todosTable, 
        Key : {
          todoId: todoId,
          userId: userId
        },
        ConditionExpression: '#todoId = :todoIdValue and #userId = :userIdValue',
        ExpressionAttributeValues: { ':todoIdValue': todoId, ':userIdValue': userId  },
        ExpressionAttributeNames: { '#todoId': 'todoId', '#userId': 'userId'  }
    }).promise();

}


async function updateTodo(event: APIGatewayProxyEvent) {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    
    const item = {
        ...updatedTodo
    }
    
    await docClient.update({
        TableName: todosTable,
        Key : {
            todoId: todoId,
            userId: userId
        },
        UpdateExpression: "set #done = :done, #dueDate = :dueDate",
        ExpressionAttributeValues: {
            ":done": item.done,
            ":dueDate": item.dueDate,
        },
        ExpressionAttributeNames: { '#done': 'done', '#dueDate': 'dueDate' }
    }).promise()

    return item
}
  
export {
    createTodo, getTodosForUser, createAttachmentPresignedUrl, updateTodo, deleteTodo
}