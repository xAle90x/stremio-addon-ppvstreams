import Redis from "ioredis";

const redis = new Redis({ host: "redis-12396.c245.us-east-1-3.ec2.redns.redis-cloud.com", port: 12396, password: "6zBhg6grpa4lVG00KZX0YK1wfMlIUhzn", name: "db-LYKF5ZB0", username: "default" })


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