# Contributing

This document is designed to act as an outline for the process of contributing to the project. You will find some workflow tips, naming conventions, and other useful information. A standard process will increase productivity.

## Outline

As you begin adding code to the repository you will notice there is a lot of code. And we have a standard naming convention for folders and files that you should follow.

1. Fork the repository, and keep your `master` branch the same as `messari/subgraphs`, before creating a feature branch in your repository **pull** upstream changes.
2. Create your feature branch `branch-name`.
3. Once you begin to **push** changes create a Pull Request (PR) in `messari/subgraphs` and set it as a draft until you it is ready for review.

![How to convert to draft](./images/contributing/convert-to-draft.png)

> See "Naming Conventions" for how to name your PR

4. Once your PR is ready for review go ahead and click "Ready for review". As a courtesy it is nice to let the reviewer know that it is ready through a DM.

At this point you will just need to follow the "Reviewing" process until your PR is merged.

## Reviewing

### Reviewee

- Generally you will need to make changes, either respond to a change/comment with a question, rebuttle, or comment. Otherwise, make the change and resolve the issue.
- When you feel changes are sufficient, let the reviewer know again that the PR is ready for another round of reviews.
- Do not make a new PR for changes, this will make it harder for the reviewer to track their progress.

### Reviewer

- This part is straight forward, and if you are reviewing you know what to do.
- It is courtesy to let the developer know that you are done with the review.

> This is an iterative process that takes time, so don't think it will always be easy.

## Rebasing

There are multiple ways to do this. Most of the time you will rebase onto `master`, so you should make sure your `master` branch is up to date with the upstream `master` (ie, Messari's repo).

Go into your feature-branch and make the following call.

```bash
git pull --rebase origin master
```

This will initiate a rebase. Sometimes you will have to resolve conflicts. And then `git add .` and `git rebase --continue` or `git rebase --skip`.

Following this method, after rebasing you can do the command `git push --force` to update your remote repo.

## Naming Convention

### Pull Requests

It is nice to have a consistent naming convention for pull requests. Oftentimes there are dozens of PRs out on `messari/subgraphs` so being able to know exactly what a PR is is important.

PR names also drive the commit name once a PR is merged into `master`. In this way it is easier to tell what was changed in each commit.

An impact-level identifier:

### 1️⃣

- Subgraphs: change impacts an entire fork directory / multiple protocols
- Dashboard: change impacts the entire dashboard / multiple objects

### 2️⃣

- Subgraphs: change impacts a single protocol
- Dashboard: change impacts a single object

### 3️⃣

- Subgraphs: change impacts a single network of a single protocol
- Dashboard: change impacts is a minor enhancement / bug fix

### How to name a PR

"`impact-level` `subgraph-name`: `description`"

Examples:

- "1️⃣ Compound Forks: upgrade to 2.0.1 schema"
- "3️⃣ Dashboard: fix reward calculation"
- "1️⃣ Dashboard: support 2.0.1 schemas"
- "2️⃣ Abracadabra: fixing issue #420"
