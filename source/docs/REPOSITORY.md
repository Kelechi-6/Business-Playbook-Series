# Use the repository export independently

The delivered ZIP includes a complete `source/` folder and a `repository.bundle` Git repository export. The bundle includes the version history and committed source without stored Git credentials.

With Git installed, from the extracted ZIP's folder:

```
git clone repository.bundle my-publishing-website
cd my-publishing-website
git remote remove origin
git remote add origin YOUR_OWN_GIT_REMOTE_URL
git push -u origin main
```

Alternatively work directly in `source/` and initialise your own repository using README.md. The bundle is a snapshot; it does not automatically synchronise future local edits to Sites. You control your new Git repository and hosting workflow.

The archive does not include any real `.env` file, service key, hosted account, private editor session credential or customer data. Runtime secrets must be recreated securely on a new host. The current `.openai/hosting.json` is an optional Sites adapter and can be ignored outside Sites.
