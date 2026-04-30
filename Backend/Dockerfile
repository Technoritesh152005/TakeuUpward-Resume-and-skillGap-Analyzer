FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

COPY src ./src

RUN mkdir -p uploads/resume logs

ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["npm", "start"]

# - uses a Linux Node image                                                                                                   
#   - installs python3, python3-pip, and tesseract-ocr                                                                          
#   - installs Node production dependencies                                                                                     
#   - installs OCR Python dependencies from requirements.txt                                                                    
#   - copies backend source
#   - creates uploads/resume and logs                                                                                           
#   - starts the backend with npm start