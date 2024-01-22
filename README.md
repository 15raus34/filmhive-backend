# Flim Hive (Backend)

### Film Hive - We review the movies, so you don't have to

* Running in 8000 Port

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

#### Mongo DB URL
`MONGO_URI`

#### [Mailtrap](https://mailtrap.io/) For Email-Notification
`MAILER_USER` 
`MAILER_PASSWORD`

#### [JWT](https://jwt.io/) Secret Key:
`JWTOKEN_SECRET`

#### [Cloudinary](https://cloudinary.com/) For File Storage 
`CLOUD_NAME`
`CLOUD_API_KEY`  
`CLOUD_API_SECRET` 

## Run Locally

Install dependencies

```bash
  npm i
```

Start the server

```bash
  npm run server
```

