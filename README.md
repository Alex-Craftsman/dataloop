# Build

`yarn compile`

# CLI usage

`node dist/src/cli.js <start_url: string> <depth: number>`

# Description

Given a URL, the crawler will scan the webpage for any images and continue to every link inside that page and scan it as well.

The crawling should stop once <depth> is reached. depth=3 means we can go as deep as 3 pages from the source URL (denoted by the <start_url> param), and depth=0 is just the first page.

# TODO

- Multiple threads
- Rate limiter