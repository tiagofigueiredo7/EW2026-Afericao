
FROM node:22
 
WORKDIR /app
 
COPY package*.json ./
 
RUN npm install
 
COPY . .
 
EXPOSE 16025
 
CMD ["node", "server_data.js"]