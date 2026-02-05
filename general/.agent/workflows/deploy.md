---
description: Build, Commit, and Push changes to GitHub automatically
---

<<<<<<< HEAD
This workflow automates the process of saving your work to GitHub. It ensures the code builds, commits all changes, and pushes to the main branch.
=======
This workflow automates the process of saving your work to GitHub. It ensures the code builds, commits all changes, and pushes to the 'deploy/agenda-v3' branch (the stable channel).
>>>>>>> d3c87db2148eee7ba56d57ea7dddb0a652e6abc5

// turbo-all

1. **Build Verification**
<<<<<<< HEAD
   Ensure the project compiles without errors before pushing.
=======
   Ensure the project compiles without errors.
>>>>>>> d3c87db2148eee7ba56d57ea7dddb0a652e6abc5
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
