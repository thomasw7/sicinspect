FROM nginx:1.27.0

RUN rm /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx
COPY . /app

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY . /app

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y nodejs \
    npm
    
RUN npm install --no-progress
RUN npm install --no-progress -g @angular/cli
RUN ng build --output-path=/app/dist --base-href=/