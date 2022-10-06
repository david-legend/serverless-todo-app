import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { getUserId } from '../lambda/utils';
import { TodosAccess } from '../dataLayer/todosAccess';
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';

const todosAccess = new TodosAccess()
const bucketName = process.env.ATTACHMENT_S3_BUCKET

async function createTodo(todoId: string, userId: string, event: APIGatewayProxyEvent) {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    const item = {
        todoId: todoId,
        userId: userId,
        createdAt: new Date().toISOString(),
        done: false,
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`,
        ...newTodo
    } as TodoItem
    
    await todosAccess.createTodo(item)

    return item
}


async function getTodosForUser(userId: string) {
    return await todosAccess.getAllTodos(userId)
}

function createAttachmentPresignedUrl(imageId: string) {
    return todosAccess.createAttachmentPresignedUrl(imageId)
}


async function deleteTodo(event) {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    await todosAccess.deleteTodo(userId, todoId)
}


async function updateTodo(event: APIGatewayProxyEvent) {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    
    const item = {
        ...updatedTodo
    } as TodoUpdate
    
    await todosAccess.updateTodo(item, userId, todoId)

    return item
}
  
export {
    createTodo, getTodosForUser, createAttachmentPresignedUrl, updateTodo, deleteTodo
}