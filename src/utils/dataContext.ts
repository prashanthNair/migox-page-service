import AWS, { DynamoDB } from "aws-sdk";
import { ResponseMessage } from "../enums/response-message.enum";
import { StatusCode } from "../enums/status-code.enum";
import IConfig from "../interfaces/iConfig";
import ResponseModel from "../models/common/response";
import { Logger } from "./logger";

export type PutItem = AWS.DynamoDB.DocumentClient.PutItemInput;
export type PutItemOutput = AWS.DynamoDB.DocumentClient.PutItemOutput;

export type BatchWrite = AWS.DynamoDB.DocumentClient.BatchWriteItemInput;
export type BatchWriteOutput = AWS.DynamoDB.DocumentClient.BatchWriteItemOutput;

export type UpdateItem = AWS.DynamoDB.DocumentClient.UpdateItemInput;
export type UpdateItemOutput = AWS.DynamoDB.DocumentClient.UpdateItemOutput;

export type QueryItem = AWS.DynamoDB.DocumentClient.QueryInput;
export type QueryItemOutput = AWS.DynamoDB.DocumentClient.QueryOutput;

export type GetItem = AWS.DynamoDB.DocumentClient.GetItemInput;
export type GetItemOutput = AWS.DynamoDB.DocumentClient.GetItemOutput;

export type DeleteItem = AWS.DynamoDB.DocumentClient.DeleteItemInput;
export type DeleteItemOutput = AWS.DynamoDB.DocumentClient.DeleteItemOutput;

type Item = Record<string, string>;


const { X_STAGE, X_AWS_ACCESS_KEY_ID, X_AWS_SECRET_ACCESS_KEY } = process.env;
const config: IConfig = {
    region: "ap-south-1",
};
config.accessKeyId = X_AWS_ACCESS_KEY_ID;
config.secretAccessKey = X_AWS_SECRET_ACCESS_KEY;

if (X_STAGE === "local") {
    config.accessKeyId = "";
    config.secretAccessKey = "";
} else {
    console.log("running dynamodb on aws on", X_STAGE);
}
AWS.config.update(config);

const documentClient = new AWS.DynamoDB.DocumentClient();

export default class DBContext {
    getItem = async ({
        hash,
        hashValue,
        range,
        rangeValue,
        tableName,
    }: Item): Promise<GetItemOutput> => {
        const params: DynamoDB.DocumentClient.GetItemInput = {
            TableName: tableName,
            Key: {},
        };

        // Add the hash key with its value to the Key object
        params.Key[hash] = hashValue;

        // If range key is provided, add it to the Key object
        if (range && rangeValue) {
            params.Key[range] = rangeValue;
        }

        try {
            const { Item } = await this.get(params)
            console.log('Item', Item)
            if (Item) {
                // Return the item if found
                return Item as GetItemOutput;
            } else {
                // If item not found, throw an error
                throw new Error('Item not found');
            }
        } catch (error) {
            // Handle any errors
            console.error('Error fetching item:', error);
            throw error;
        }
    };


    existsItem = async ({
        key,
        hash,
        hashValue,
        tableName,
    }: Item): Promise<boolean> => {
        try {
            await this.getItem({ key, hash, hashValue, tableName });
            return true;
        } catch (e) {
            if (e instanceof ResponseModel) {
                return e.code !== StatusCode.NOT_FOUND;
            } else {
                throw e;
            }
        }
    };

    create = async (params: PutItem, service = "", source = ""): Promise<PutItemOutput> => {
        try {
            const response = await documentClient.put(params).promise();
            Logger.info({ Message: "Create Method Response", Request: params, Method: "PUT", Response: response, Error: null, HttpMethod: "PUT", Service: service, Source: source, StatusCode: StatusCode.CREATED })
            return response
        } catch (error) {
            console.error("create-error", error);
            Logger.info({ Message: "Create Error", Request: params, Method: "BatchWrite", Response: null, Error: error, HttpMethod: "PUT", Service: service, Source: source, StatusCode: StatusCode.ERROR })

            throw new ResponseModel({}, StatusCode.ERROR, `create-error: ${error}`);
        }
    };

    batchCreate = async (params: BatchWrite, service = "", source = ""): Promise<BatchWriteOutput> => {
        try {
            const response = await documentClient.batchWrite(params).promise();
            Logger.info({ Message: "BatchWrite Response", Request: params, Method: "BatchWrite", Response: response, Error: null, HttpMethod: "PUT", Service: service, Source: source, StatusCode: StatusCode.CREATED })
            return response

        } catch (error) {
            Logger.info({ Message: "BatchWrite Response", Request: params, Method: "BatchWrite", Response: null, Error: error, HttpMethod: "PUT", Service: service, Source: source, StatusCode: StatusCode.ERROR })

            throw new ResponseModel(
                {},
                StatusCode.ERROR,
                `batch-write-error: ${error}`
            );
        }
    };

    update = async (params: UpdateItem, service = "", source = ""): Promise<UpdateItemOutput> => {
        try {
            Logger.info({ Message: "Update Request", Request: params, Method: "Update", Response: null, Error: null, HttpMethod: "Update", Service: service, Source: source, StatusCode: StatusCode.OK })

            const response = await documentClient.update(params).promise();
            Logger.info({ Message: "Update Response", Request: params, Method: "Update", Response: JSON.stringify(response), Error: null, HttpMethod: "Update", Service: service, Source: source, StatusCode: StatusCode.OK })

            return response
        } catch (error) {
            Logger.error({ Message: "Update Response", Request: params, Method: "Update", Response: null, Error: JSON.stringify(error), HttpMethod: "Update", Service: service, Source: source, StatusCode: StatusCode.ERROR })

            throw new ResponseModel({}, StatusCode.ERROR, `update-error: ${error}`);
        }
    };

    query = async (params: QueryItem, service = "", source = ""): Promise<QueryItemOutput> => {
        try {
            Logger.info({ Message: "Query Request", Request: params, Method: "Query", Response: null, Error: null, HttpMethod: "GET", Service: service, Source: source, StatusCode: StatusCode.OK })

            const response = await documentClient.query(params).promise();

            Logger.info({ Message: "Query Response", Request: params, Method: "Query", Response: JSON.stringify(response?.Items), Error: null, HttpMethod: "GET", Service: service, Source: source, StatusCode: StatusCode.OK })

            return response;
        } catch (error) {
            Logger.error({ Message: "Query Response", Request: params, Method: "Query", Response: null, Error: error, HttpMethod: "GET", Service: service, Source: source, StatusCode: StatusCode.ERROR })

            throw new ResponseModel({}, StatusCode.ERROR, `query-error: ${error}`);
        }
    };

    get = async (params: GetItem): Promise<GetItemOutput> => {
        try {
            return await documentClient.get(params).promise();
        } catch (error) {
            throw new ResponseModel({}, StatusCode.ERROR, `get-error: ${error}`);
        }
    };

    delete = async (params: DeleteItem): Promise<DeleteItemOutput> => {
        try {
            return await documentClient.delete(params).promise();
        } catch (error) {
            throw new ResponseModel({}, StatusCode.ERROR, `delete-error: ${error}`);
        }
    };
}
