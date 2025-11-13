# Schnoor

///npm init -y
C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>npm init -y
Wrote to C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend\package.json:

{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "cookie-parser": "^1.4.7",      
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-rate-limit": "^8.2.1", 
    "helmet": "^8.1.0"
  },
  "devDependencies": {}
}

//runtime dependencies
///npm install express helmet cors cookie-parser express-rate-limit dotenv

C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>npm install express helmet cors cookie-parser express-rate-limit dotenv

up to date, audited 77 packages in 2s

18 packages are looking for funding 
  run `npm fund` for details        

found 0 vulnerabilities

C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>

///dev dependencies
////npm install -D typescript ts-node-dev @types/node @types/express @types/cookie-parser
C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>npm install -D typescript ts-node-dev @types/node@@types/express @types/cookie-parser  
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported

added 73 packages, and audited 150 packages in 8s

26 packages are looking for funding 
  run `npm fund` for details        

found 0 vulnerabilities


//create tsconfig.json
///npx tsc --init
C:\Users\ADMIN\source\repos\Schnoor-passkey-demo\backend>npx tsc --init

Created a new tsconfig.json         
                                 TS 
You can learn more at https://aka.ms/tsconfig





////
C:\Users\ADMIN\source\repos\Schnorr-passkey-demo>node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
2863040a0165fcaf092007e61dd563b6501cce3b98db49734537a5a3ae2c533a
->SESION_SECRET