# Gunakan Node.js 18 sebagai base image
FROM node:18-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy semua file aplikasi
COPY . .

# Expose port 3000 (default Express)
EXPOSE 3000

# Command untuk start aplikasi
CMD ["npm", "start"]