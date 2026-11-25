# Vercel hosting limits, Hobby plan

Date read: 2026-11-25 (UTC). All pages were read on that date. Quotes are word for word from the page named beside them. Table rows are quoted as rendered, with the column order given. Markdown bold and link markup inside the source text has been dropped, the words are unchanged. The Limits page and the Fair Use Guidelines page were fetched live, the other pages may have come from the fetch tool's recent cache.

Scope: a static Vite build, about 95 MB of output, no server code, deployed on the free Hobby plan as a personal portfolio piece.

## Sources

Official pages (vercel.com):

1. Limits. https://vercel.com/docs/limits (page says "Last updated September 16, 2026")
2. Hobby plan. https://vercel.com/docs/plans/hobby (last updated November 12, 2026)
3. Account plans. https://vercel.com/docs/plans (last updated November 12, 2026)
4. Fair Use Guidelines. https://vercel.com/docs/limits/fair-use-guidelines (last updated November 12, 2026)
5. Terms of Service. https://vercel.com/legal/terms ("Last Updated October 19, 2026")
6. Pricing. https://vercel.com/pricing (Markdown copy at https://vercel.com/pricing.md)
7. Builds. https://vercel.com/docs/builds (last updated September 3, 2026)
8. Managing Builds. https://vercel.com/docs/builds/managing-builds (last updated September 17, 2026)
9. Troubleshoot a build. https://vercel.com/docs/deployments/troubleshoot-a-build (last updated September 21, 2026)
10. vercel deploy (CLI). https://vercel.com/docs/cli/deploy (last updated November 14, 2026)
11. Deploying Git Repositories. https://vercel.com/docs/git (last updated September 18, 2026)
12. CDN pricing and usage. https://vercel.com/docs/manage-cdn-usage (last updated September 14, 2026)
13. Vercel CDN Cache. https://vercel.com/docs/caching/cdn-cache (also served at https://vercel.com/docs/cdn-cache, last updated September 14, 2026)
14. Cache-Control headers. https://vercel.com/docs/caching/cache-control-headers (also served at https://vercel.com/docs/headers/cache-control-headers, last updated March 5, 2026)
15. vercel.json configuration. https://vercel.com/docs/project-configuration/vercel-json (last updated August 14, 2026)
16. Deployment Storage. https://vercel.com/docs/deployment-storage (last updated August 21, 2026)
17. Changelog, Hobby deployment retention. https://vercel.com/changelog/hobby-projects-now-retain-fewer-deployments-to-free-up-storage (16 Sep 2026)
18. Deploying with Vercel Drop. https://vercel.com/docs/drop (last updated June 16, 2026)
19. Deploying without logging in. https://vercel.com/docs/deployments/deploy-without-logging-in
20. Knowledge base, How to reduce build costs. https://vercel.com/kb/guide/how-to-reduce-build-costs (dated 2026-11-03)
21. llms.txt index. https://vercel.com/llms.txt

Not an official docs page, kept for context only:

22. Vercel Community forum thread, reply by Vercel staff, April 23. https://community.vercel.com/t/clarification-on-commercial-use-for-a-community-chess-tournament-project-rexher-cup-5/39083

## 1. Static file upload limit

General limits table, columns are Hobby, Pro, Enterprise:
"|Static File uploads|100 MB|1 GB|N/A|"
https://vercel.com/docs/limits

Section "Static file uploads":
"When using the CLI to deploy, the maximum size of the source files that can be uploaded is limited to 100 MB for Hobby and 1 GB for Pro. If the size of the source files exceeds this limit, the deployment will fail."
https://vercel.com/docs/limits

How a Git deployment gets its source (a clone on Vercel, not an upload from the user's machine):
"Push to Git: When you connect a GitHub, GitLab, or Bitbucket repository, each commit to a tracked branch initiates a new build and deployment. By default, Vercel performs a shallow clone of your repo (`git clone --depth=10`) to speed up build times."
https://vercel.com/docs/builds

The build report treats the two inputs as separate things:
"The input size in the report corresponds to the size of your checked-out repository or files uploaded by CLI."
https://vercel.com/docs/deployments/troubleshoot-a-build

The CLI can also upload a finished build instead of source:
"The `--prebuilt` option can be used to upload and deploy the results of a previous `vc build` execution located in the .vercel/output directory."
https://vercel.com/docs/cli/deploy

Notes. The limit is worded as the total size of the source files uploaded with the CLI. It is not worded as a per file limit, and it is not worded as a limit on build output. No page read says in so many words whether it applies or does not apply to a build from a Git repository, and no page read gives a size limit for a Git checkout. No page read says whether a `--prebuilt` upload counts against the same 100 MB.

## 2. Size of the build output, size of a single static file

No page read gives a maximum size for the build output of one deployment on Hobby, and no page read gives a maximum size for a single static file served from a signed-in account. What the pages do say:

After the build:
"Vercel uploads your build artifacts (static files, Vercel Functions, and other assets) to the CDN."
https://vercel.com/docs/builds

Stored output is metered across all kept deployments. Pricing table, section Deployments, columns are Hobby, Pro, Enterprise:
"| Deployment Storage | 10 GB included | $0.10 per GB-month | Custom |"
https://vercel.com/pricing.md

"Hobby teams get 10GB of Deployment Storage. Every deployment you keep uses some of it, and going over the limit can block you from deploying until you free some up."
https://vercel.com/changelog/hobby-projects-now-retain-fewer-deployments-to-free-up-storage

"Each Hobby project now keeps its 3 most recent production deployments, plus its 3 most recent deployments of any type, regardless of age."
https://vercel.com/changelog/hobby-projects-now-retain-fewer-deployments-to-free-up-storage

"If your team is over the 10GB limit, deployments outside those exceptions are now deleted immediately instead of after 30 days."
https://vercel.com/changelog/hobby-projects-now-retain-fewer-deployments-to-free-up-storage

Deployment Storage is defined as:
"| Deployment Storage | Build outputs and static assets |"
https://vercel.com/docs/deployment-storage

A build log report flags large files. This is a report, not a stated limit:
"This report helps you detect hidden Out of Memory (OOM) events, and provides insights into disk usage by breaking down the sizes of your source code, `node_modules`, and output, and flagging files over 100 MB."
https://vercel.com/docs/deployments/troubleshoot-a-build

Limits that look similar but apply to other things:

Drops made without an account only:
"Without an account, you can only drop static sites. Each file can be up to 100 MB, and the whole drop up to 1 GB."
https://vercel.com/docs/drop

Vercel Function responses only, not static files:
"The following caching limits apply to Vercel Function responses:" followed by "Max cacheable response size: 10MB"
https://vercel.com/docs/caching/cdn-cache

The fast path that skips the build step, CLI only. A larger site still deploys, through the normal flow:
"This optimization supports deployments containing HTML, Markdown, and other static assets, with up to 100 files and a total size of up to 25 MB."
"Deployments that exceed these limits, include JavaScript or other unsupported files, or are triggered by Git use the standard deployment flow."
https://vercel.com/docs/cli/deploy

## 3. Build time, build cache, build container

"The maximum duration of the Build Step is 45 minutes. When the limit is reached, the Build Step will be interrupted and the Deployment will fail."
https://vercel.com/docs/limits

"Build timeout: The maximum build time is 45 minutes. If your build exceeds this limit, it will be terminated, and the deployment fails."
https://vercel.com/docs/builds

"The maximum size of the build cache is 5 GB for every build machine type, including Elastic build machines."
"The cache is retained for one month and applies at the level of each Build cache key."
https://vercel.com/docs/limits

Container resources table, columns are Hobby, Pro, Enterprise:
"|Memory|8192 MB|8192 MB|Custom|"
"|Disk Space|64 GB|64 GB|64 GB|"
"|CPUs|2|4|Custom|"
https://vercel.com/docs/builds

"Hobby teams always use the Basic build machine. Basic has 2 vCPUs and 8 GB of memory."
https://vercel.com/docs/builds/managing-builds

Build machine table, columns are type, vCPUs, Memory (GB), Disk size (GB):
"| Basic              | 2               | 8           | 64             |"
https://vercel.com/docs/builds/managing-builds

General limits table, columns are Hobby, Pro, Enterprise:
"|Disk Size (GB)|64|64|64|"
https://vercel.com/docs/limits

Conflict between Vercel pages. A knowledge base article gives a smaller disk for the Basic machine. Table columns are Machine type, vCPUs, Memory (GB), Disk (GB):
"|Basic|2|8|32|"
https://vercel.com/kb/guide/how-to-reduce-build-costs

Other Hobby build limits on the same pages:
"Hobby: 1 concurrent deployment. Builds beyond this run sequentially."
https://vercel.com/docs/builds/managing-builds

"You are able to build `100` Deployments every `3600` seconds (1 hour)."
"You are able to deploy `100` times every `86400` seconds (1 day)."
https://vercel.com/docs/limits

## 4. Number of files in a deployment

"The maximum number of files that can be uploaded when creating a CLI Deployment is `15,000` for source files. If you upload more files than the limit, Vercel rejects the request and does not create the deployment. To deploy more files, use the `--archive=tgz` option."
https://vercel.com/docs/limits

"Although there is no upper limit for output files created during a build, you can expect longer build times as a result of having many thousands of output files (100,000 or more, for example). If the build time exceeds 45 minutes then the build will fail."
https://vercel.com/docs/limits

Related count limit, columns are Hobby, Pro, Enterprise:
"|Routes created per Deployment|2048|2048|Custom|"
"If you are using a `vercel.json` configuration file, each rewrite, redirect, or header is counted as a Route"
https://vercel.com/docs/limits

## 5. Monthly data transfer on Hobby, and what happens past it

Hobby included usage table:
"|Fast Data Transfer|First 100 GB|"
"|Fast Origin Transfer|First 10 GB|"
"|CDN Requests|First 1,000,000|"
https://vercel.com/docs/plans/hobby

Pricing page, Fast Data Transfer, columns are Hobby, Pro, Enterprise:
"| 100 GB / month included | 1TB / month included; then starting at $0.15 per GB | Custom |"
https://vercel.com/pricing.md

What is counted:
"When a user visits your site, the data transfer between Vercel's CDN and the user's device gets measured as Fast Data Transfer. The data transferred gets measured based on data volume transferred, and can include assets such as your homepage, images, and other static files."
"Fast Data Transfer is calculated based on the full size of each HTTP request and response transmitted to or from Vercel's CDN. This includes the body, all headers, the full URL and any compression."
https://vercel.com/docs/manage-cdn-usage

"Requests to static assets incur the same Fast Data Transfer usage if the response is cached or uncached."
https://vercel.com/pricing.md

What happens when it is passed:
"As the Hobby plan is a free tier there are no billing cycles. In most cases, if you exceed your usage limits on the Hobby plan, you will have to wait until 30 days have passed before you can use the feature again."
https://vercel.com/docs/plans/hobby

"All plans receive notifications by email and on the dashboard when they are approaching and exceed their usage limits."
"Hobby plans will be paused when they exceed the included free tier usage"
https://vercel.com/docs/plans

"If you have a free Hobby account, you are limited to the usage caps and cannot purchase additional usage."
https://vercel.com/pricing.md

The Fair Use Guidelines page lists the same figure as a guideline:
"As a guideline for our community, we expect most users to fall within the below ranges for each plan."
"|Fast Data Transfer|First 100 GB|Flat Rate CDN|" (columns are Resource, Hobby Included, Pro Included)
"Where possible, we'll reach out before taking action to address unreasonable usage and work with you to correct it."
https://vercel.com/docs/limits/fair-use-guidelines

Arithmetic, not a quote: 100 GB divided by 95 MB is about 1,050 complete downloads of the whole site per month if nothing were cached in the browser.

## 6. Personal and non-commercial use

Terms of Service, section 4, Hobby Plan:
"We offer a free Hobby plan at our sole discretion. The Hobby plan is subject to all provisions of these Terms of Service, unless expressly stated otherwise. You shall only use the Services under a Hobby plan for your personal or non-commercial use."
https://vercel.com/legal/terms

Same section:
"We reserve the right to disable or remove any Project or website deployment on the Hobby plan with or without notice at our sole discretion. We may shut down and terminate projects or deployments using the Hobby plan without notice for any reason or no reason."
https://vercel.com/legal/terms

Vercel's own index of its docs describes the plan this way:
"Vercel Hobby plan: Free plan for non-commercial personal projects."
https://vercel.com/llms.txt

How the paid plan is described:
"The Pro plan is designed for professional developers, freelancers, and businesses who need enhanced features and team collaboration."
https://vercel.com/docs/plans

Fair Use Guidelines, examples of fair use (list items): "Static sites", "Frontend apps", "Single page applications". Never fair use (list items): "Media hosting for hot-linking".
https://vercel.com/docs/limits/fair-use-guidelines

"Circumventing or otherwise misusing Vercel's limits or usage guidelines is a violation of our fair use guidelines."
https://vercel.com/docs/limits/fair-use-guidelines

Hobby and Git repositories owned by an organization. This matters if the repository sits in a company's Git organization:
"Vercel does not support connecting a project on your Hobby team to Git repositories owned by Git organizations. You can either switch to an existing Team or create a new one."
https://vercel.com/docs/limits

"You cannot deploy to a Hobby team from a private repository in a GitHub organization, GitLab group, or Bitbucket workspace. Consider making the repository public or upgrading to Pro."
"To deploy commits under a Hobby team, the commit author must be the owner of the Hobby team containing the Vercel project connected to the Git repository."
https://vercel.com/docs/git

Hobby content and model training, same Terms:
"In addition, if you are on a Hobby plan or trial Pro plan, you agree that we may use Your Content to train our artificial intelligence (“AI”) and machine learning models, and we may share Your Content with third parties for the purpose of developing and improving their products, including training and improving their AI and machine learning models (collectively, “Model Training”)."
https://vercel.com/legal/terms

Notes. The Fair Use Guidelines page as read on 2026-11-25 contains no section on commercial usage and does not contain the word "commercial". The Terms give no definition of "personal" or "non-commercial", and no page read mentions portfolios or employees. A Vercel staff reply on the community forum, dated April 23, quotes a definition and attributes it to the Fair Use Guidelines. That sentence is not on the page as read, so treat it as secondhand:
"Commercial usage is defined as any Deployment that is used for the purpose of financial gain of anyone involved in any part of the production of the project"
https://community.vercel.com/t/clarification-on-commercial-use-for-a-community-chess-tournament-project-rexher-cup-5/39083

## 7. Cache headers for static files through vercel.json

"With `headers`, this is no longer necessary since that is the default behavior. The following example is equivalent to the `routes` usage above, but uses `headers` instead:"
https://vercel.com/docs/project-configuration/vercel-json

The example that follows on that page, word for word:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/favicon.ico",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31556952, immutable"
        }
      ]
    }
  ]
}
```

Static files caching, Browser, accepted forms: "`max-age=N, public`" and "`max-age=N, immutable`", then:
"Where `N` is the number of seconds the response should be cached."
https://vercel.com/docs/caching/cdn-cache

"Static files are automatically cached on Vercel's global network for the lifetime of the deployment after the first request."
https://vercel.com/docs/caching/cdn-cache

"The default value is `cache-control: public, max-age=0, must-revalidate` which instructs both the CDN and the browser not to cache."
https://vercel.com/docs/caching/cache-control-headers

Recommended settings table, row for hashed assets, columns are Content type, Recommended header, When to use:
"| Immutable static assets (hashed JS, CSS, fonts) | `max-age=31536000, immutable` | Content-hashed assets. Frameworks like Next.js set this automatically. |"
https://vercel.com/docs/caching/cache-control-headers

"Custom headers can be configured with the `headers` property in `next.config.js` for Next.js projects, or it can be configured in `vercel.json` for all other projects."
https://vercel.com/docs/caching/cache-control-headers

Each header rule counts toward the 2048 routes per deployment quoted under point 4.

## Conclusions

1. STATED: the static file upload limit is 100 MB on Hobby and 1 GB on Pro, and it counts the total size of the source files uploaded when deploying with the CLI, not each file and not the build output. UNKNOWN: no page says in so many words whether it applies to a deployment built from a Git repository, where Vercel clones the repository itself, and no page gives a size limit for a Git checkout.
2. UNKNOWN: no page gives a maximum size for one deployment's build output or for a single static file served on Hobby. STATED nearby: Hobby includes 10 GB of Deployment Storage across kept deployments and going over can block deploying, the build disk is 64 GB, the build report flags files over 100 MB, and the 100 MB per file and 1 GB total limits apply only to drops made without an account.
3. STATED: maximum build time is 45 minutes, the build cache is at most 5 GB and kept one month, and the Hobby build container (Basic) has 2 vCPUs, 8 GB (8192 MB) of memory and 64 GB of disk. One knowledge base page lists 32 GB of disk for Basic, which conflicts with the three docs pages.
4. STATED: 15,000 source files is the limit for a CLI upload (more with `--archive=tgz`), and there is "no upper limit for output files created during a build", only the 45 minute build time.
5. STATED: Hobby includes 100 GB of Fast Data Transfer per month, plus 1,000,000 CDN requests. Past the included usage the Hobby account is paused and cannot buy more, and in most cases must wait until 30 days have passed.
6. STATED: the Terms say the Hobby plan is only for "your personal or non-commercial use" and Vercel may remove Hobby deployments at its sole discretion. UNKNOWN: no page read defines commercial use or says whether a portfolio that a company employee shows as their own work qualifies. STATED: a Hobby project cannot be connected to a Git repository owned by a Git organization.
7. STATED: cache lifetimes for static files are set in `vercel.json` under `headers`, with a `source` path pattern and a `Cache-Control` value such as `public, max-age=31556952, immutable`, where max-age is in seconds. Docs: https://vercel.com/docs/project-configuration/vercel-json

Does it fit: Yes, by the limits as stated. A 95 MB static build with no file over 20 MB, built on Vercel from a Git repository whose checkout is under 2 GB, exceeds no limit that the pages state for Hobby (no stated cap on output size or file size, 64 GB build disk, 45 minute build, 10 GB Deployment Storage). The closest stated limit is the 100 MB static file uploads cap, which the page words as applying to source files uploaded with the CLI, so it would bite only if the site were deployed by CLI with more than 100 MB of source. Among limits that do apply to a Git build, the nearest in practice is the 100 GB per month of Fast Data Transfer, about 1,050 full uncached downloads of the site. The fit rests on the absence of a stated output limit, and on the Git question in point 1 that the pages leave unstated.
