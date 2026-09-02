# Deployment Guide - AWS EC2

## Overview

This guide takes you from a fresh AWS account to a live HTTPS URL with automatic deployment on every push to `main`. The first time through, budget 60 to 90 minutes. Subsequent deploys are fully automated by GitHub Actions and take about two minutes.

## Prerequisites

- An AWS account with billing alerts configured
- A GitHub repository containing this project
- A MongoDB Atlas cluster (free M0 tier is fine)
- The PEM key file from when you created the EC2 key pair, saved locally (e.g., `~/Downloads/time-loop-snake-key.pem`)

---

## 1. Launch an EC2 instance

1. Open the AWS Console and navigate to EC2 -> Instances -> Launch instances.
2. Name the instance `timeloop-snake`.
3. Select the AMI: **Ubuntu Server 22.04 LTS (64-bit x86)**.
4. Choose instance type: **t2.micro** or **t3.micro** (both are free-tier eligible).
5. Under Key pair, select the key pair whose `.pem` file you have saved locally.
6. Under Network settings, click **Edit**:
   - VPC: default
   - Auto-assign public IP: **Enable**
   - Security group: create new, name it `timeloop-snake-sg`
     - Add rule: SSH (port 22), Source: My IP
     - Add rule: HTTP (port 80), Source: Anywhere (0.0.0.0/0)
     - Add rule: HTTPS (port 443), Source: Anywhere (0.0.0.0/0)
7. Storage: leave the default 8 GB gp3 volume.
8. Click **Launch instance**.

The instance's public IPv4 address is referred to as `<EC2_HOST>` throughout the rest of this guide. If you stop and restart the instance, this IP address can change. Allocate an Elastic IP and associate it with the instance to get a stable address (EC2 -> Elastic IPs -> Allocate, then Actions -> Associate).

---

## 2. SSH in

```bash
chmod 400 ~/Downloads/time-loop-snake-key.pem
ssh -i ~/Downloads/time-loop-snake-key.pem ubuntu@<EC2_HOST>
```

If the connection is refused, wait 30 seconds after launch for the instance to finish booting, then try again.

If you see "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED", remove the stale entry:

```bash
ssh-keygen -R <EC2_HOST>
```

---

## 3. Install Node.js 20 and basic tools

```bash
sudo apt update
sudo apt -y upgrade
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs git rsync
node -v
npm -v
```

`node -v` should print `v20.x.x`. If it does not, re-run the `nodesource` curl command and try again.

---

## 4. Install Nginx

```bash
sudo apt -y install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Open `http://<EC2_HOST>` in a browser. The default Nginx welcome page should appear. If the security group is set up correctly and the page does not load, check that the instance is in a running state.

---

## 5. Install PM2

```bash
sudo npm install -g pm2
pm2 -v
```

---

## 6. Clone the project on EC2

```bash
mkdir -p /home/ubuntu/timeloop-snake
git clone https://github.com/Knight-Frost/timeloop-snake.git /home/ubuntu/timeloop-snake
```

If the repository is private, set up a GitHub deploy key or use HTTPS with a personal access token before running this step.

---

## 7. Build the client (one-time, before CI takes over)

```bash
cd /home/ubuntu/timeloop-snake/client
npm ci
npm run build
ls dist/
sudo chmod -R o+rX /home/ubuntu/timeloop-snake/client/dist
```

`ls dist/` should show `index.html` and an `assets/` directory. The `chmod` command lets Nginx read the built files.

---

## 8. Configure server environment

```bash
cd /home/ubuntu/timeloop-snake/server
cp .env.example .env
nano .env
```

Fill in the following values and save the file:

```
PORT=3000
NODE_ENV=production
MONGO_URI=<your Atlas SRV connection string with the password URL-encoded>
JWT_SECRET=<a long random string, generate with: openssl rand -hex 32>
CLIENT_ORIGIN=https://<EC2_HOST>
ADMIN_EMAIL=<your admin email>
ADMIN_PASSWORD=<a strong password>
```

Lock the file so only the `ubuntu` user can read it:

```bash
chmod 600 .env
```

Install production dependencies:

```bash
npm ci --omit=dev
```

**Atlas network access:** In MongoDB Atlas, go to Security -> Network Access -> Add IP Address, and add the EC2 instance's public IP. Without this step, the server cannot connect to Atlas.

---

## 9. Start the server with PM2

```bash
cd /home/ubuntu/timeloop-snake/server
pm2 start ecosystem.config.cjs
pm2 logs timeloop-snake --lines 30
```

Look for `MongoDB connected` and `Server running on port 3000` in the logs. Press `Ctrl+C` to stop following logs.

Make PM2 restart automatically after a reboot:

```bash
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Run the `sudo env PATH=...` command that PM2 prints as output.

Confirm the API is responding:

```bash
curl http://127.0.0.1:3000/api/health
```

Expected response: `{"status":"ok","db":"connected"}`.

---

## 10. Configure Nginx as a reverse proxy

```bash
sudo cp /home/ubuntu/timeloop-snake/nginx.conf /etc/nginx/sites-available/timeloop-snake
sudo ln -sf /etc/nginx/sites-available/timeloop-snake /etc/nginx/sites-enabled/timeloop-snake
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` must print `syntax is ok` and `test is successful` before reloading. If it prints errors, re-check the copy command and the contents of the config file.

---

## 11. Enable HTTPS

Choose one option depending on whether you have a registered domain name.

### Option A - Let's Encrypt (requires a real domain)

1. Create an A record on your domain pointing to `<EC2_HOST>`. DNS propagation can take a few minutes.
2. Edit the Nginx config and set `server_name your-domain.com;` on both server blocks (replacing the underscore `_`):
   ```bash
   sudo nano /etc/nginx/sites-available/timeloop-snake
   ```
3. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```
4. Install Certbot:
   ```bash
   sudo apt -y install certbot python3-certbot-nginx
   ```
5. Issue and install the certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```
6. When Certbot asks whether to redirect HTTP to HTTPS, select **Redirect**.
7. Certbot installs a systemd timer for automatic renewal. Verify it works:
   ```bash
   sudo certbot renew --dry-run
   ```
8. Visit `https://your-domain.com`. A valid padlock icon should appear.

### Option B - Self-signed certificate (when you only have an EC2 IP)

1. Generate a self-signed certificate valid for 365 days:
   ```bash
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/nginx-selfsigned.key \
     -out /etc/ssl/certs/nginx-selfsigned.crt \
     -subj "/CN=<EC2_HOST>"
   ```
2. The `nginx.conf` in this repository already references those paths. Test and reload:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. Visit `https://<EC2_HOST>`. The browser will show a security warning because the certificate is self-signed. Click **Advanced** -> **Proceed** (or equivalent in your browser) to continue.

---

## 12. Open the firewall on the instance (optional defense-in-depth)

Ubuntu on EC2 ships with UFW disabled. The EC2 security group already enforces ports. Enabling UFW adds a second layer:

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
sudo ufw status
```

---

## 13. Smoke test the live deployment

Run through these checks to confirm everything is working:

- `https://<EC2_HOST or domain>/api/health` should return `{"status":"ok","db":"connected"}`.
- Navigate to `https://<EC2_HOST or domain>/register` and create an account.
- Log in, click Play, and confirm the embedded Canvas game loads and is playable.
- Submit a score and check it appears on `/leaderboard`.
- Log out and try to access `/admin` - confirm you are redirected away.
- Log in as the seeded admin account and navigate to `/admin` - confirm the page loads.

---

## 14. Set up GitHub Actions for automatic deployment

In the GitHub repository, go to **Settings -> Secrets and variables -> Actions -> New repository secret** and add each of the following:

| Secret name | Value |
|---|---|
| `EC2_HOST` | the public IP or domain name of the instance |
| `EC2_USERNAME` | `ubuntu` |
| `EC2_SSH_KEY` | the full contents of the `.pem` file, including the `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` lines |
| `MONGO_URI` | the same Atlas SRV string used in `server/.env` |
| `JWT_SECRET` | the same value used in `server/.env` |
| `CLIENT_ORIGIN` | `https://<EC2_HOST or domain>` |
| `ADMIN_EMAIL` | the admin account email |
| `ADMIN_PASSWORD` | the admin account password |

Also create a GitHub Environment: **Settings -> Environments -> New environment**, name it `production`. The deploy job in the workflow is gated by `environment: production`, so this environment must exist.

Push any commit to `main` and watch the **Actions** tab. The workflow:

1. Builds the React client.
2. Uploads the `dist` folder as a workflow artifact.
3. SSHes into the EC2 instance.
4. Uses `rsync` to transfer updated server code and the built `dist` folder.
5. Writes `/home/ubuntu/timeloop-snake/server/.env` from repository secrets via `scp`.
6. Runs `npm ci --omit=dev` and `pm2 startOrReload ecosystem.config.cjs --update-env`.
7. Probes `/api/health` up to 6 times (with a brief pause between retries) until it returns `status: ok`.

If the workflow fails at the health probe step, SSH in and inspect the logs:

```bash
pm2 logs timeloop-snake --lines 100
```

---

## 15. Operational tips

- **Billing alert:** Set a CloudWatch billing alarm for $5 or $10 so you are notified if costs increase unexpectedly.
- **Stable IP:** Allocate an Elastic IP and associate it with the instance to prevent the IP from changing on stop/start.
- **Let's Encrypt renewal:** Set a calendar reminder 60 days after issuing the certificate to verify auto-renewal: `sudo certbot renew --dry-run`.
- **Watch API logs:** `pm2 logs timeloop-snake`
- **Watch Nginx logs:** `sudo journalctl -u nginx -f`
- **Restart only the API:** `pm2 restart timeloop-snake`
- **Reload Nginx after config change:** `sudo nginx -t && sudo systemctl reload nginx`

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| 502 Bad Gateway from Nginx | The Express server is not running | Run `pm2 status` and `pm2 logs timeloop-snake` to diagnose |
| `MongooseServerSelectionError` in PM2 logs | EC2 IP not in Atlas allowlist, or wrong password in `.env` | Add the EC2 public IP in Atlas -> Network Access; re-check `MONGO_URI` in `server/.env` |
| CORS error in browser | `CLIENT_ORIGIN` in `.env` does not exactly match the URL in the browser | Set `CLIENT_ORIGIN` to the exact origin (scheme, hostname, port if non-standard) and restart PM2 |
| Health probe times out in CI | MongoDB Atlas can be slow to accept the first connection after a cold start | Re-run the workflow; if the issue persists, check that the EC2 IP is in the Atlas allowlist and that both services are in compatible regions |
| Browser warns about certificate | Self-signed certificate in use (Option B) | Expected behavior - click Advanced -> Proceed. For a real domain, use Option A (Let's Encrypt) |
