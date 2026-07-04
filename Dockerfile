FROM node:20-alpine
WORKDIR /app

# Cài dependencies (bỏ devDependencies như nodemon)
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy source (db.json sẽ được mount volume đè lên lúc chạy để giữ dữ liệu)
COPY . .

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "main.js"]
