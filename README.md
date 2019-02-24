# Node OAuth 2.0 Server Demo
This is a fully-functioning OAuth 2.0 Authorization / Resource server supporting the `authorization_code`, `client_credentials`, `refresh_token` and `password` grant types.

It is based on version `3.0.0` of the [node-oauth2-server](https://github.com/oauthjs/node-oauth2-server) library.

## Requirements
* Node.js 8.0 or higher
* An SQL database. Although the project has been tested with MySQL, any SQL database engine should work in principle. 
 
 The quickest way to get a database running is to use docker. The following command will start a MySQL instance locally
 
  ```docker run -d --name oauth-db -e MYSQL_ROOT_PASSWORD=rooter -e MYSQL_DATABASE=oAuthTest -e MYSQL_USER=oauthTester -e MYSQL_PASSWORD=password -p 3306:3306 mysql:5.5```

## Installation
* Clone this project.
* Within the project directory, create a `.env` file with the following content

  ```
  DB_URI=<dialect>://<username>:<password>@<dbServer>:<dbServerPort>/<database>
  ```
  Where:
   - **dialect** is one of `mysql`, `mssql`, `sqlite` or `postgres`
   - **username** is the user for the database connection
   - **password** is the password for the database user
   - **dbServer** is the hostname of the database server
   - **dbServerPort** is the port on the database server on which the database is exposed; and
   - **database** is the name of the database to be used by the application.
  
   If you started a database using the docker command in the previous section, the content of this file would be

   >DB_URI=mysql://oauthTester:password@localhost:3306/oAuthTest
  
* Install project dependencies with `npm install`
* Finally, start the server with:
    -  `npm run start` to simply start the server; or
    - `npm run dev` to enable live-reload after file changes are detected 

The server runs on `http://localhost:3000`. You can override the port number by specifying a `PORT` variable in the `.env` file.

## Database migration
The following npm scripts can be executed to migrate the database schema:
* `npm run migrate`: Runs any unexecuted migrations in ``./migrations``. If using a clean database, all migrations in that folder will be run.
* `npm run migrate:undo:all`: Undoes all migrations.
* `npm run seed`: Runs all unexecuted seed files in `./seeders`.

Executing `npm run cold-start` will clean the database, run the migrations from scratch and then insert the seed data. Using this script is recommended during development, as it ensures that you're working against the most up-to-date data schema.


## Database seeding
The database is seeded with the following test data by default.


#### GrantTypes
id  |value  |
---|------------| 
1| password   |
2| client_credentials    |
3| authorization_code   |
4| refresh_token  |


## Testing
*Git Bash can be used to issue cURL commands on Windows*

#### User Registration
Register a user with the following command:
```
curl -X POST \
  http://localhost:3000/api/user/register \
  -H 'Content-Type: application/json' \
  -d '{
	"username": "new_user",
	"password": "new_password"
}'
```
This should result in the following response
>{"message":"Registration successful","user":{"id":1,"username":"new_user"}}

Passwords are hashed with [bcrypt](https://en.wikipedia.org/wiki/Bcrypt) before database insertion.

#### Client Registration 
To register a client, issue:
```
curl -X POST \
  http://localhost:3000/api/client/register \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Demo Client",
  "redirectUri": "http://localhost:8081",
  "grants": ["password","authorization_code","refresh_token"]
}'
```

This command also assigned the password, client_credentials and authorization code grants to the client by including `grants=[1,3,4]`, which are the ids of those grants in the GrantTypes table. 

You should receive a similar response to the following:
>{
    "client": {
        "id": "35833868-cd34-4991-a422-fe00e87dc6f7",
        "secret": "029e845c-8077-43da-90a3-db447f26f9e1",
        "redirectUri": "http://localhost:8081",
        "user": {}
    }
}

#### Client Registration (with associated user)
The [Client Credentials grant](https://www.oauth.com/oauth2-servers/access-tokens/client-credentials/) enables clients to request an access token to access their own resource. The `node-oauth2-server` library expects these clients to have an associated user entity. 

To register a client with an associated user, issue the following command

```
curl -X POST \
  http://localhost:3000/api/client/register \
  -H 'Content-Type: application/json' \
  -d '{
   "name": "Demo Client with User",
  "redirectUri": "http://localhost:8081",
  "grants": ["password","client_credentials","authorization_code","refresh_token"],
  "user": {
    "username": "clientuserapp",
    "password": "clientuserpw"
  }
}'
```

This creates a client entity and a user to be associated with it.

Response from server should be:
>{"client":{"id":<clientID>,"secret":<clientSecret>,"redirectUri":"http://localhost:8081","user":{"id":3,"username":"clientuserapp"}}}


### OAuth Flows

#### Client Credentials
To test the client credentials grant type, a client with an associated user will be used to request an access token. This grant type requires the Client ID and Client Secret to be included with the request, which should be encoded to Base64 in the form `client_id:client_secret`. 

Issue the following command to request an access token:

```
curl -X POST \
  http://localhost:3000/oauth/token \
  -H 'Authorization: Basic <base64Encoding(clientID:clientSecret)>' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d grant_type=client_credentials
```
*replace `<base64Encoding(clientID:clientSecret)>` with the [base64 encoding](https://www.base64encode.org/) of the credentials you received during client registration, in the form `clientID:clientSecret`*.

The following should be returned by the server.

>{"access_token":\<access token\>,"token_type":"Bearer","expires_in":14399}


Using this access token, we can issue a request to the server requesting the user's information:

```
curl -X GET \
  http://localhost:3000/api/user \
  -H 'Authorization: Bearer <paste access token here>' 
```
*Replace \<paste access token here\> with the access token you received from the server*.

The server should return the user for which the access token was created. 

>{
    "user": {
        "id": 3,
        "username": "clientuserapp"
    }
}

#### Password Grant
To request an access token using the password grant, issue the following command:

```
curl -X POST \
  http://localhost:3000/oauth/token \
  -H 'Authorization: Basic <paste base64Encoding(clientID:clientSecret)>' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password&username=new_user&password=new_password'
```
*replace base64Encoding(clientID:clientSecret)* with the [base64 encoding](https://www.base64encode.org/) of the credentials for a client registered with the `password` grant.

We are requesting a token for a user as the *New Client* client registered in the previous section, and have encoded the Client ID and Client Secret in the request header. The user's username and password are included in the POST request, in line with the password grant definition.

This should return the following:

>{"access_token":\<access token\>,"token_type":"Bearer","expires_in":14399,"refresh_token":\<refresh token\>}

Like before, a subsequent request can be made with the access token to access the user's information

```
curl -X GET \
  http://localhost:3000/api/user \
  -H 'Authorization: Bearer <paste access token here>' 
```

To return
>{"user":{"id":3,"username":"new_user"}}


#### Authorization Code Grant
An access token cannot be directly requested with the Authorization Code grant. The client application needs to request for an *authorization code* and then exchange that code for a token.

To simplify testing, a test JavaScript client application has been written in the `auth_grant_client` directory. We will use this application to obtain an authorization code from the server.

Amend the **clientId**, **clientSecret** and **redirectUri** variables at the top of `auth_grant_client/script.js` file to correspond with the details obtained during client registration.

```
var authServer = "http://localhost:3000";

var clientId = '';
// DON'T DO THIS! Secret only included as this is a demo
var clientSecret = '';

var redirectUri = 'http://localhost:8081';

...

```

[http-server](https://www.npmjs.com/package/http-server) can be used to serve the test client application. Install the library by running `npm install http-server -g`

Run the following command (from the project directory) to start the server

```
http-server ./auth_grant_client -p 8081
```

The test client application should be available on `http://localhost:8081`. Note that this corresponds to the *redirectUri* used while registering the client with the server.



To receive an access token via the authorization code grant:

*  Go to http://localhost:8081

   ![](./readme_assets/demo_page_small.png)

* Click on the *Login with OAuth* button on the demo page. You will be redirected to a login page on the OAuth 2 server. 

* Enter a valid username and password in login form

  ![](./readme_assets/sign_in_page.png)
     
* *Your browser will be redirected back to the test client application with an authorization code*.
* *The script in `auth_grant_client/script.js` automatically uses the code received from the OAuth server to make a follow-up request for an access token.*
* The access and refresh tokens are sent by the server to the test client, which then displays them on the page.

    ![](./readme_assets/token_received_small.png)


Using the access token received from the server, you can issue a GET request for the user's information as before

```
curl -X GET \
  http://localhost:3000/api/user \
  -H 'Authorization: Bearer <paste access token here>' 
```

This should return 

>{"user":{"id":3,"username":"new_user"}}

    
#### Refresh Token Grant
The password and authorization code grants return a refresh token which can be used by clients to refresh an access token. To refresh the access token received in the previous section, issue the following request

```
curl -X POST \
  http://localhost:3000/oauth/token \
  -H 'Authorization:  Basic <paste base64Encoding(clientID:clientSecret)>' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=refresh_token&refresh_token=<paste refresh token here>'
```
 * Replace base64Encoding(clientID:clientSecret)* with the [base64 encoding](https://www.base64encode.org/) of the credentials for a client registered with the `refresh_token` grant.
 * Replace *\<paste refresh token here\>* with the refresh token you received from the server.

The server should respond with a new access and refresh tokens
>{"access_token":"\<new access token\>","token_type":"Bearer","expires_in":14399,"refresh_token":"\<new refresh token\>"}

The OAuth protocol does not specify what should be done with old access tokens after they have been refreshed by clients via this grant. The `node-oauth2-server` library does not delete or invalidate old access tokens after they have been refreshed — these tokens will still be accepted by the server until they expire.

Clicking **Get new token** on the test client page will also request a new access token from the server.