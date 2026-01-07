FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install only production dependencies
# This keeps the image smaller and more secure
RUN npm ci --only=production

# FIX: Install dotenvx locally because db/db.js imports it, 
# but it is listed as a devDependency in package.json.
RUN npm install @dotenvx/dotenvx

# Install dotenvx globally so we can use it in the CMD
# This is necessary because it's listed as a devDependency in package.json
RUN npm install -g @dotenvx/dotenvx

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Use dotenvx to decrypt the .env.production file at runtime
# Pass the command to node directly effectively replacing 'npm start' to avoid nodemon
CMD ["dotenvx", "run", "-f", ".env.production", "--", "node", "server.js"]
