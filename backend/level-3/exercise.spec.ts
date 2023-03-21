import request from 'supertest'
import { expect } from 'chai'
import express from 'express';
import * as dotenv from 'dotenv'
import mongoose, { model, Schema } from 'mongoose'
import { exit } from 'process';

/**
 * DO NOT TOUCH THIS PART
 */

dotenv.config()

if (!process.env.MONGOOSE_CONNECTION_STRING) {
    console.log('You need to provide a `MONGOOSE_CONNECTION_STRING` in your .env file.')
    exit(1)
}

mongoose.connect(process.env.MONGOOSE_CONNECTION_STRING as string)
mongoose.connection
    .once('open', () => console.log('Connected to MongoDB.'))
    .on('error', (error: any) => console.error(`Error thrown by Mongoose: ${error.toString()}`))

const app = express();

/**
 * END
 */

/**
 * Exercise 1:
 * 
 * Define the basic interface for our Contracts that will be saved on MongoDB.
 * Each contract has an address (string), a name (string) and an ABI (list of objects).
 */
interface IContract {
    address : string, 
    name : string, 
    abi : Record<string, unknown>[]
}

/**
 * Exercise 2:
 * 
 * Define the contract schema and model that will be saved into MongoDB.
 * NOTE: make sure to use the interface above! 
 */
const contractSchema = new Schema<IContract>({
    address: String,
    name: String,
    abi: [{ type: Schema.Types.Mixed }]
})

const Contract = model<IContract>('Contract', contractSchema)

/** Exercise 3:
 * 
 * Define the following APIs:
 * - GET /: returns all the contracts available
 * - GET /:address : returnss the contract with the given address, returns 404 if not found
 */
app.get('/', async (req: unknown, res: unknown) => {
    const myRes = res as express.Response
    try{
        const contracts = await Contract.find()
        myRes.send(contracts)
    } catch(error) {
        myRes.status(500).send(error)
    }
})

app.get('/:address', async (req: unknown, res: unknown) => {
    const myRes = res as express.Response
    const myReq = req as express.Request
    const address = myReq.params.address
    try{
        const contract = await Contract.findOne({address : address})
        if(!contract){
            myRes.status(404).send('Address not found')
        } else {
            myRes.send(contract)
        }
    } catch(error){
        myRes.status(500).send(error)
    }
})

describe('[Backend] Level 3', () => {
    beforeEach(async () => {
        await mongoose.connection.collections.contracts.deleteMany({})
        //done();
    })
    it('[Exercise 3a] GET / should return a list of contracts', async () => {
        const contract = new Contract({ name: 'test', address: 'test123', abi: [{ functionName: "testFunction" }]});
        await contract.save();
        const contract2 = new Contract({ name: 'test2', address: 'test456', abi: [{ functionName: "testFunction2" }]});
        await contract2.save()
        const res = await request(app).get('/').expect(200)
        expect(res.body).eql([{ ...contract.toJSON(), _id: contract._id.toHexString()}, { ...contract2.toJSON(), _id: contract2._id.toHexString()}])
    })
    it('[Exercise 3b] GET /:address should return a given contract or 404', async () => {
        const contract = new Contract({ name: 'test', address: 'test123', abi: [{ functionName: "testFunction" }]});
        await contract.save();
        const res = await request(app).get('/test123').expect(200)
        expect(res.body).eql({...contract.toJSON(), _id: contract._id.toHexString()})
        await request(app).get('/test789').expect(404)
    })
})