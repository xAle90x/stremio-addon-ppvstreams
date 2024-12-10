import Redis from "ioredis";

const redis = new Redis({ host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT?.toString()), password: process.env.REDIS_PASSWORD, name: process.env.REDIS_DB, username: "default" })


export const saveToCache = async (id: string, data: string,expiry:number) => {
    await redis.set(id, data,'EX',expiry)
}

export const getFromCache = async (id: string) => {
    const record = await redis.get(id)
    if (!record) {
        return null
    }
    return JSON.parse(record)
}
