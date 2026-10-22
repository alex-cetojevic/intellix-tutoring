---
name: blog-post
description: Quality and overlap checks for blog posts and guides on intellixtutoring.com, in English and Italian. Use it whenever you pick a topic for, plan, draft, edit, translate, refresh, review or publish a post on this site, even when the user only says "next post", "write the syllabus post", "is this post good" or "can we publish this". It checks what is already published so a new post does not repeat it, lists what makes a post bad, and holds the publishing checklist.
---

# Blog posts for intellixtutoring.com

The rule the user agreed: post as often as each post can get about an hour of their real teaching experience. One good post beats two rushed ones. Google judges the site as a whole, and the site is still new to it, so a few thin posts can make it trust the good pages less. Readers are parents and students, and many are not native English speakers.

## 1. Check what is already published, before any draft

```
python3 .claude/skills/blog-post/scripts/inventory.py                  # English posts: title, summary, In short, sections, FAQ
python3 .claude/skills/blog-post/scripts/inventory.py --pages          # plus service and school pages
python3 .claude/skills/blog-post/scripts/inventory.py --search WORD..  # every page, EN and IT, that mentions a word
```

Search with the topic's main words in both languages and a few synonyms (for example `syllabus programma argomenti topics`). Service pages count too. The Bocconi, IB Maths, IB Physics and SAT pages already cover format, scoring and a syllabus overview.

Then tell the user, before writing anything:
- the main question of the new post, in one line, as the reader would search it;
- which pages already touch it, and how much;
- the decision: **new post** (no page answers this question), **refresh** (a page already answers it, so improve that one instead), or **new angle** (say exactly what is different).

Two pages that answer the same question compete with each other, and both rank worse. When a new post only partly overlaps an old one, cover the shared part in a sentence or two and link to the old page. Then add a link from the old page to the new one.

Also read the blog plan memory (`project-blog-content-plan`). It has the agreed calendar, the ideas that were dropped and why, and the posts that must not be rewritten.

## 2. What makes a post bad

Check the draft against each of these:

1. **It says what everyone says.** "Do past papers, manage your time." If 50 sites already say it, Google has no reason to show this one. Every section needs something specific: a worked example, a real mark, a real trap.
2. **No real experience in it.** See section 3.
3. **Wrong or out of date facts.** One wrong date makes a parent doubt the whole site. See section 4.
4. **Slow to answer.** The reader searched a question. The "In short" box and the first paragraph answer it.
5. **Padded.** Length follows the question. Cut anything that repeats.
6. **Repeats one of our own pages.** See section 1.
7. **The title promises what the page does not give.** For example "formula booklet PDF" with no PDF. People click, leave fast, and the page drops.
8. **The Italian reads like a translation.** Italian parents notice at once.

## 3. The user's experience: leave gaps, never invent

What makes a post rank is what the user has seen in real lessons. You have not taught these students. Never write a lesson story, a student result, or a claim like "most of my students" or "the mistake I see most". It would be false, and it is exactly the thin content this skill is here to stop.

Leave a visible gap with a precise question instead, in the HTML text so it shows in the preview:

```
[ALEX: Which mistake do you see most on this topic? One real example, no names.]
```

Put 2 to 4 gaps where experience helps most: the opening, the hardest section, and the advice at the end. Keep names, schools and anything private out of every post, because most students are minors.

## 4. Facts

- Every number, date and rule comes from the official source: ibo.org, unibocconi.it, collegeboard.org, or the school's own site. Check it on the day and link the source in the text.
- If only forums support a claim, say so in the text ("students on forums report...") or leave it out.
- No IB copyright material on the site: no formula or data booklet PDFs, no copied past paper questions. Write original examples.
- Tell the user which facts you checked and where.

## 5. How to write it

- **Title:** the words people search, and only what the page delivers. Build the Italian title from Italian search phrasing, not by translating (for example "Punteggio test Bocconi: quanto serve per entrare").
- **"In short" box:** answers the main question in 2 to 4 sentences. Someone who reads only the box should leave with the answer.
- **Language:** simple words, short sentences, no em dashes (—). Use a full stop, comma or colon instead.
- **Dropcap paragraph:** at least 4 lines at desktop width. On a shorter one, the list beside it wraps around the big letter.
- **Italian:** write it the way an Italian tutor would explain it to an Italian parent. Rewrite sentences, do not map them word for word. Keep IB terms in English, as the existing Italian posts do (Paper 1, IA, HL, markscheme).

## 6. Before showing the draft to the user

Give honest answers to the three-question test:
1. Could only the user have written this? (Not until the gaps are filled. Say so.)
2. Does the first paragraph answer the question?
3. Is every fact checked against an official source?

Add the overlap decision from section 1 and the list of facts checked.

## 7. Publishing checklist

Copy the newest post as the template: front matter, BlogPosting and FAQPage JSON-LD, hero, "In short", dropcap, "Where to go next".

- [ ] `blog/<slug>.html` and `it/blog/<slug>.html`, same slug, the hreflang pair in both front matters.
- [ ] JSON-LD headline, description, dates and wordCount match the page. The FAQ JSON-LD matches the visible FAQ.
- [ ] Meta descriptions are whole sentences, not cut off mid-phrase.
- [ ] A row at the top of `blog.html` and `it/blog.html`, with date, read time and tag.
- [ ] Two `<url>` entries in `sitemap.xml`, and a new `<lastmod>` on every other page you changed.
- [ ] One line each in `llms.txt`, in the right section, English and Italian.
- [ ] Links to the new post from 2 or 3 related pages that Google has already indexed, in both languages.
- [ ] No gaps left: `grep -rn "\[ALEX" blog it/blog` prints nothing.
- [ ] No em dashes: `grep -n "—" blog/<slug>.html it/blog/<slug>.html` prints nothing.
- [ ] Local preview: `ruby tools/preview.rb . <scratchpad>/site`, serve that folder, and check both pages at desktop and phone width.
- [ ] Commit and push only when the user says so.

After the push:
- Put both URLs at the top of `~/Documents/intellix-request-indexing.md`, to be requested before anything else that day.
- Update the blog plan memory: what shipped, the date, and the facts checked.
