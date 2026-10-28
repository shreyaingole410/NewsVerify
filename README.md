# Truthtrail Evidence Check

Build NewsVerify — AI-Powered Fake News Detection Website

Build a complete, responsive, functional website called NewsVerify, with the tagline:

"Question the News. Discover the Truth."

The purpose of this website is to help users determine whether online news claims and articles are supported by credible evidence, false, misleading, or unverified.

This is a college-level misinformation detection project. Build a real working application with external data sources, evidence-based verification, and URL-based article checking. Do not create only a static UI or a fake demonstration.

1. TECHNOLOGY STACK

Use:

React with TypeScript.

Tailwind CSS for styling.

Supabase Edge Functions for secure backend operations where necessary.

Supabase database for optional verification history.

Free public APIs and accessible news feeds for evidence retrieval.

Server-side environment variables for optional API keys.

Do not create a Python Flask application. Implement the project using the technology stack supported by Lovable.

2. WEBSITE COLOR SCHEME AND DESIGN

Use a distinctive premium theme based on deep emerald, teal, and champagne gold.

Color palette:

Primary background: #071F1A (deep emerald-black).

Secondary background: #0D2B24.

Card background: #12372E.

Primary accent: #2DD4BF (bright teal).

Secondary accent: #34D399 (emerald green).

Premium highlight: #E9C46A (champagne gold).

Main text: #F3F7F4.

Secondary text: #A9C3B8.

Borders: #285247.

Verified / supported: #34D399.

False / debunked: #FB7185.

Misleading / missing context: #FBBF24.

Unverified: #94A3B8.

Design requirements:

Create a modern, premium AI-tech aesthetic.

Use subtle emerald-to-teal gradients.

Use champagne gold sparingly for highlights and important details.

Use rounded cards, subtle shadows, thin borders, and smooth transitions.

Use clear, readable typography and consistent spacing.

Add subtle glowing effects to the main verification button.

Include attractive loading animations while searching for evidence.

Avoid excessive neon effects, visual clutter, and distracting animations.

Make the website responsive on desktop, tablet, and mobile.

Maintain accessible text contrast and clear form labels.

The website should look like a polished technology startup product, not a generic template.

3. NAVIGATION BAR

Create a responsive navigation bar with:

NewsVerify logo using a shield and checkmark icon.

Home.

Verify News.

How It Works.

History.

About.

Include a prominent "Start Verification" button.

Keep the navbar consistent across all pages.

4. HOMEPAGE HERO SECTION

Create an attractive homepage with the headline:

"Not Every Headline Tells the Truth."

Subtitle:

"Investigate news claims, check article sources, and discover what credible evidence actually says."

Include two verification modes:

A. Check a News Claim:

A multiline text box where users can enter a headline, statement, or claim.

A "Verify Claim" button.

B. Verify an Article URL:

An input field for a complete news article URL.

A "Analyze Article" button.

Allow users to switch between the two modes using attractive tabs.

Add:

Example claims users can try.

A loading animation with messages such as "Searching news sources", "Checking available fact-checks", and "Comparing evidence".

A brief note explaining that results depend on the availability and quality of evidence.

A How It Works section.

A section showing the types of sources searched.

A footer with project information and limitations.

Do not show fabricated verification results on the homepage.

5. REAL-TIME NEWS CLAIM VERIFICATION

When users submit a claim, the backend must search real external sources and analyze the evidence.

Prioritize the following sources:

Wikipedia MediaWiki API

Search for relevant entities and topics.

Retrieve background information and related articles.

Use it for context, not as the sole source of truth.

GDELT DOC API

Search global news coverage.

Find relevant articles and source URLs.

Retrieve available publication dates and metadata.

Google News RSS

Discover news articles related to the submitted claim.

Extract article titles, publisher information, and links where available.

Google Fact Check Tools API

Integrate optionally when an API key and required access are available.

Search existing fact-checks for matching claims.

Display the fact-check publisher, rating, article title, and original link when available.

Also support discovery of relevant published fact-checks from reputable organizations such as Reuters Fact Check, AFP Fact Check, PolitiFact, and Snopes, where accessible.

Requirements:

Use real API responses.

Do not generate random verdicts.

Do not invent source titles, quotations, dates, or links.

Handle unavailable APIs gracefully.

Do not require a paid AI API to use the basic search functionality.

Show which sources were successfully searched.

6. CLAIM ANALYSIS AND VERDICT SYSTEM

After retrieving evidence, identify the central factual claim and compare the available information.

Use these verdict categories:

Supported by Evidence — Credible evidence strongly supports the claim.

Likely True — Available evidence supports the claim, but verification is incomplete.

False / Debunked — Reliable evidence contradicts the claim or an applicable, credible fact-check has debunked it.

Misleading / Missing Context — The claim omits important context or presents information in a materially misleading way.

Unverified / Insufficient Evidence — There is not enough reliable evidence to reach a conclusion.

Verification logic:

Look for direct matches to existing fact-checks.

Compare the claim with retrieved source material.

Separate supporting evidence from contradicting evidence.

Consider the dates and context of articles.

Prefer original documents, official records, credible investigations, and independent reporting.

Avoid counting syndicated copies of the same report as independent confirmation.

Distinguish publisher reputation from the truth of a specific claim.

Never assume that a claim is false because no matching articles are found.

Never assume that a claim is true because Wikipedia or one news website mentions it.

Return "Unverified" when evidence is weak, conflicting, unavailable, or inconclusive.

If an AI model is used for claim analysis, require it to rely on retrieved evidence, clearly identify uncertainty, and use only source links actually returned by the search system.

Do not display an arbitrary confidence percentage. Show a confidence score only if its calculation is documented and meaningful. Otherwise, display a qualitative evidence-strength indicator.

7. ARTICLE URL VERIFICATION

Users must be able to paste a real news article URL and analyze its contents.

Workflow:

Validate the URL.

Accept only HTTP and HTTPS URLs.

Fetch the article using a secure server-side function.

Extract the title, publisher, publication date, canonical URL, and main article text when available.

Identify important factual claims in the article.

Search external sources for those claims.

Compare retrieved evidence with the article's statements.

Check for existing fact-checks.

Display the article information, verdict, explanation, and source links.

Use suitable server-side article extraction tools or libraries supported by the deployment environment.

Security requirements:

Prevent SSRF attacks.

Block localhost, private IP addresses, and internal network addresses.

Validate DNS resolution and redirects.

Allow only permitted HTTP/HTTPS requests.

Apply timeouts and response-size limits.

Restrict processing to supported text or HTML responses.

Never execute scripts from submitted URLs.

Rate-limit requests where practical.

If the article is blocked by a paywall, requires login, or cannot be extracted, ask the user to paste its text instead.

Do not mark an article as false or true based only on its domain, HTTPS connection, URL, or website design.

8. VERIFICATION RESULTS DASHBOARD

Create an attractive results page using the deep emerald and teal theme.

Display:

Final verdict badge.

Submitted claim or extracted article headline.

Publisher and publication date, if available.

A clear explanation of the verdict.

Evidence supporting the claim.

Evidence contradicting the claim.

Related published fact-checks.

Source cards with title, publisher, date, and clickable URL.

Evidence strength and known limitations.

A list of sources searched and any sources that failed.

A "Verify Another Claim" button.

Use:

Emerald green for supported claims.

Rose red for false or debunked claims.

Champagne amber for misleading claims.

Muted grey for unverified claims.

Keep results easy to understand for non-technical users.

Add buttons to copy a summary and open source articles in a new tab safely.

9. VERIFICATION HISTORY

Create a History page showing previous verification checks.

Each history record should include:

Submitted claim.

Article URL, if provided.

Verdict.

Date and time of verification.

A button to reopen the result.

Use Supabase for persistent history if configured.

Basic verification must not require account registration.

Allow users to delete individual records or clear their history. Avoid storing unnecessary personal information.

If database configuration is unavailable, the verification functionality should still work without persistent history.

10. HOW IT WORKS PAGE

Explain the verification process in four steps:

Submit a headline, claim, or article URL.

Search relevant news coverage and fact-checking sources.

Compare the available evidence.

Review the verdict and open the original sources.

Include a simple visual flow showing the process.

11. ABOUT AND METHODOLOGY PAGE

Explain:

The purpose of NewsVerify.

The external sources used.

How evidence is compared.

Why missing search results do not prove that a claim is false.

Why an article being published by a reputable outlet does not automatically make every statement correct.

Why AI-generated assessments can make mistakes.

Why users should review the original source material.

Clearly state that NewsVerify is an assistance tool, not an absolute guarantee of truth.

12. ERROR HANDLING AND ACCESSIBILITY

Implement:

Input validation.

Empty-input warnings.

Invalid URL warnings.

Loading states.

Retry options.

API failure messages.

No-results messages.

Network error handling.

Mobile-responsive layouts.

Keyboard-accessible forms and buttons.

Visible focus indicators.

Accessible color contrast.

Appropriate loading and error announcements.

Never present an API error or empty result as a completed verification.

13. PROJECT STRUCTURE AND IMPLEMENTATION

Organize the code into reusable components, services, pages, and backend functions.

Suggested components:

Navbar.

HeroSection.

VerificationTabs.

ClaimInput.

ArticleURLInput.

VerificationLoader.

VerdictBadge.

EvidenceCard.

SourceCard.

ResultsDashboard.

HistoryList.

Footer.

Suggested backend functions:

verify-claim

verify-article-url

search-news

search-fact-checks

extract-article

Use Supabase Edge Functions or equivalent server-side functions for secure external requests.

Keep all secrets on the server. Never expose private API keys in browser code.

Provide setup instructions for optional API keys and database configuration.

14. FINAL ACCEPTANCE REQUIREMENTS

The completed website must:

Have a consistent deep emerald, teal, and champagne gold design.

Allow users to submit a news claim.

Allow users to submit an article URL.

Search real external sources.

Display evidence and working source links.

Produce cautious, evidence-based verdicts.

Distinguish false claims from unverified claims.

Handle unavailable sources and failed requests.

Avoid fabricated news, sources, and verification results.

Work without a mandatory paid AI API.

Preserve a clean, professional, mobile-responsive design.

Build the project in stages, beginning with the full UI and navigation, then implement real API integrations and secure backend functionality.

Do not stop after creating the frontend. Continue implementing the actual verification workflows, connect them to real external sources, and test the main features. If a feature requires external credentials or deployment configuration, explain exactly what is needed rather than pretending it already works.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
