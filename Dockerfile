# Установка базового образа
FROM node:18

# Установка рабочей директории
WORKDIR /usr/src/app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование всех файлов
COPY . .

# Копирование .env.example в контейнер
COPY .env.example .env

# Открытие порта для приложения
EXPOSE 3000

# Запуск приложения
CMD ["npm", "run", "start"]
