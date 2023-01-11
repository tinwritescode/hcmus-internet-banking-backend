# Internet Banking Backend

This is the backend repository of the Internet Banking Project. It is built using Node.js, Express.js, and PostgreSQL.

## Prerequisites

- Node.js
- Yarn
- PostgreSQL/Cockroachdb

## Installation

1. Clone the repository

``sh
git clone https://github.com/hcmus-internet-banking/backend.git
```

2. Install the dependencies

```sh
yarn install
```

3. Create a `.env` file in the root directory and set up the environment variables

```sh
DATABASE_URL="postgresql://tin:5_uz-EIzKE6W4CcMEep4ZQ@brassy-sealion-2849.6xw.cockroachlabs.cloud:26257/defaultdb?sslmode-verify-full"
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
ACCESS_TOKEN_EXPIRES_IN=15m
RESET_PASSWORD_TOKEN_EXPIRES_IN_MINUTE=15
JWT_SECRET=xINCka0C4cB4nL4iL4Ch40D4y
# Add the secret key here
RECAPTCHA_SECRET_KEY=6LdwoWQjAAAAAP3b-_gZcxGBO32ay-xrPfW2fUt7

# Google
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=hopthucuatin@gmail.com
EMAIL_PASSWORD=leckhgecarvsbmvr

BASE_FEE=0.005
TRANSFER_TOKEN_EXPIRES_IN_MINUTE=15

FRONTEND_URL=https://hcmus-internet-banking-frontend.vercel.app
API_NOTIFY_SERVICE=https://hcmus-banking-backend-notification.up.railway.app
```

4. Run the development server

```sh
yarn dev
```

5. Build the production version

```sh
yarn build
```

6. Start the production server

```sh
yarn start
```

## Usage

The backend exposes a set of REST APIs for the frontend application to interact with. The documentation for the APIs can be found in the [API Documentation](https://documenter.getpostman.com/view/10246845/Szt8fAqe?version=latest) page.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)