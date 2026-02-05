---
description: Build, Commit, and Push changes to GitHub automatically
---

This workflow automates the process of saving your work to GitHub. It ensures the code builds, commits all changes, and pushes to the 'deploy/agenda-v3' branch (the stable channel).

// turbo-all

1. **Build Verification**
   Ensure the project compiles without errors.
   `npm run build`

2. **Stage Changes**
   Add all modified files to git.
   `git add .`

3. **Commit**
   Commit changes with a clear update message.
   `git commit -m "chore: automatic project update"`

4. **Push to Remote**
   Send changes to the origin deploy/agenda-v3 branch.
   `git push origin deploy/agenda-v3`
