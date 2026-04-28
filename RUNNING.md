# Running the Project Locally

This page is for anyone who just wants to run the project on their own machine. It assumes no prior development experience.

## What you will need

1. **Node.js version 20 or newer.** Download from https://nodejs.org/ and accept all defaults during install.
2. **A free MongoDB Atlas account.** Sign up at https://www.mongodb.com/cloud/atlas/register
3. **A terminal.** On macOS the built-in Terminal app is fine. On Windows, use PowerShell or Git Bash. On Linux, your default terminal.
4. **A text editor.** VS Code is recommended (https://code.visualstudio.com/) but anything that opens plain text files works.

## One-time MongoDB Atlas setup (5 minutes)

1. Sign in to https://cloud.mongodb.com.
2. Create a free M0 cluster (Atlas walks you through this on first sign-in).
3. Go to **Security > Database Access > Add New Database User**.
   - Authentication Method: Password.
   - Username: pick anything, for example `snakeuser`.
   - Password: click **Autogenerate Secure Password**, then copy and save the generated password somewhere. Make sure it contains only letters and digits. If it contains symbols like `@` or `/`, click the dice icon to regenerate until you get an alphanumeric one.
   - Database User Privileges: select **Read and write to any database**.
   - Click **Add User**.
4. Go to **Security > Network Access > Add IP Address**.
   - Click **Add Current IP Address**.
   - Click **Confirm**.
5. Go to **Database > Connect > Drivers > Node.js**.
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://snakeuser:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - You will paste this into the project in a moment, with `<db_password>` replaced by the password you saved in step 3, and a database name added.

## Run the project

### Step 1. Get the code

```bash
git clone https://github.com/<your-username>/timeloop-snake-.git
cd timeloop-snake-
```

### Step 2. Run the setup script

```bash
npm run dev:full
```

This first run will end with an error message saying `Action required` and instructions to edit `server/.env`. That is expected.

### Step 3. Edit server/.env

Open the file `server/.env` in VS Code (or your text editor of choice).

Find the line that starts with `MONGO_URI=`. Replace the entire value after the `=` with your Atlas connection string from the Atlas setup section above. Use this template, with your real username, password, and cluster host substituted:

```
MONGO_URI=mongodb+srv://snakeuser:YOURPASSWORD@cluster0.abcde.mongodb.net/timeloopsnake
```

Three rules:

1. The entire `MONGO_URI=...` value must stay on one line. Do not press Enter in the middle of it.
2. Add `/timeloopsnake` right before any `?` if your copied string had query parameters, or just at the end if it did not. `timeloopsnake` is the database name the project uses.
3. The query parameters `?retryWrites=true&w=majority&appName=Cluster0` are optional. The project works without them, and a shorter URI is less likely to break when you paste it.

Save the file. In VS Code: `Cmd+S` on macOS, `Ctrl+S` on Windows or Linux.

### Step 4. Run the setup script again

```bash
npm run dev:full
```

You should see:

```
[ok]    Prerequisites present.
[ok]    server/.env already exists; leaving it untouched.
[info]  Installing server dependencies...
[ok]    Server dependencies installed.
[info]  Installing client dependencies...
[ok]    Client dependencies installed.
[info]  Starting backend on http://localhost:3000 ...
[info]  Starting frontend on http://localhost:5173 ...
[info]  Waiting for backend health (up to 20 seconds)...
[ok]    Backend running.
[ok]    Database connected.
[ok]    Frontend running.

[ok]    Ready to test in browser:
[ok]      http://localhost:5173            (the app)
[ok]      http://localhost:3000/api/health (backend health)
```

### Step 5. Use the app

1. Open http://localhost:5173 in your browser.
2. Click Register and create an account.
3. After registering you land on the Play page. Use the arrow keys (or W A S D) to move the snake. Eat the red food. Avoid your own tail. Every 14 seconds a ghost of your past movements appears.
4. When you die, your score is automatically saved.
5. Click Leaderboard to see the top scores.

### Step 6. Stopping the project

In the terminal where `npm run dev:full` is running, press `Ctrl+C`. Both processes stop.

If your terminal got closed or the script seems stuck, open a fresh terminal in the project folder and run:

```bash
npm run stop
```

## Common problems

| Symptom | Fix |
|---|---|
| The script says `bad auth : authentication failed` | The password in `server/.env` does not match the one set on the Atlas user. Reset the password in Atlas (Security > Database Access > Edit > Edit Password) and update `server/.env` accordingly. |
| The script says `URI option ... cannot be specified with no value` | The `MONGO_URI` line in `server/.env` got broken across two lines. Open the file and make sure the value is on a single line. |
| The browser shows `connection refused` for http://localhost:5173 | The script may not have finished starting yet, or it hit an error. Look at the terminal output. |
| The Leaderboard or Admin page is empty | Play and finish a game first to create at least one score. |
| You cannot connect to MongoDB | In Atlas, Security > Network Access. Make sure your current IP address is allowlisted. If you switched networks recently, your IP may have changed. |

## Optional: become an administrator

The default admin account is created with the email `admin@example.com` and password `ChangeMe123!`. Log in with those credentials to access the Admin page (top right of the navbar) where you can view all users and delete entries. To use a different admin email or password, edit those lines in `server/.env` BEFORE the first run, or stop the server, edit them, and start again.

## What is happening under the hood

The `npm run dev:full` command runs the bash script at `scripts/dev-setup.sh`. That script:

1. Verifies that Node.js, npm, openssl, and curl are on your system.
2. If `server/.env` does not exist, creates one with safe defaults and a randomly generated `JWT_SECRET`.
3. Installs the server's dependencies (`npm install` inside `server/`).
4. Installs the client's dependencies (`npm install` inside `client/`).
5. Starts the backend on port 3000 in the background, with logs going to `server.log`.
6. Starts the frontend on port 5173 in the background, with logs going to `client.log`.
7. Polls `http://localhost:3000/api/health` until it gets a `{"status":"ok","db":"connected"}` response, or fails after 20 seconds.
8. Prints the URLs and waits for `Ctrl+C`.

Logs:

- `server.log` contains everything the backend printed.
- `client.log` contains everything Vite (the frontend dev server) printed.

You can `tail -f server.log` from another terminal to watch backend output in real time.
