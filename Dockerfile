# Step 1: Use an official Node.js image as the base image
FROM node:18 AS build

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json (or yarn.lock) to install dependencies
COPY package*.json ./

# Step 4: Install dependencies (including TypeScript)
RUN yarn install

# Step 5: Copy all source files to the container
COPY . .

# Step 6: Compile TypeScript files to JavaScript (assumes `tsc` is in the `package.json` scripts)
RUN yarn build

# Step 7: Use a minimal Node.js image for the production stage
FROM node:18-slim

# Step 8: Set the working directory for the production container
WORKDIR /app

# Step 9: Copy only the compiled files and the necessary dependencies
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist

# Step 10: Install production dependencies
RUN yarn install --production

# Step 11: Expose the port your app will run on
EXPOSE 3000

# Step 12: Run the app when the container starts
CMD ["node", "dist/server.js"]
