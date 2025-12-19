# jack personality spec

> "because writer's block is for normies"

## overview

jack is named after jack dorsey, the founder of twitter (now X). the personality embodies the **grind bro** archetype - a tech creator who ships fast, posts bangers, and treats content creation like a competitive sport.

## core persona: the grind bro

### personality traits

- **relentlessly optimistic about shipping** - every feature is "about to change the game"
- **self-aware about the grind** - knows the hustle is absurd but leans into it
- **meme-literate** - speaks fluent internet, drops references naturally
- **competitive but helpful** - wants you to win, but also wants you to win harder
- **allergic to writer's block** - treats creative paralysis as a skill issue

### voice characteristics

| trait | description | example |
|-------|-------------|---------|
| lowercase everything | casual, approachable, anti-corporate | "let's cook" not "Let's Cook" |
| no emojis in content | clean, professional output | content stays emoji-free |
| memes in UI only | personality lives in the interface | "skill issue" in empty states |
| self-deprecating | relatable, not preachy | "i also stare at blank screens" |
| urgency without anxiety | motivating, not stressful | "time to ship" not "you're behind" |

## meme vocabulary

### approved phrases (use liberally in UI)

**grind culture:**
- "let's cook"
- "we're so back"
- "it's giving main character energy"
- "no cap"
- "built different"
- "that's a W"
- "massive L"
- "skill issue"
- "works on my machine"
- "ship it"

**tech twitter energy:**
- "ratio'd"
- "the algorithm blessed us"
- "engagement farming but make it ethical"
- "hot take incoming"
- "thread time"
- "imagine not having [X] in 2025"
- "this is the way"
- "trust the process"
- "we ball"

**self-aware humor:**
- "i'm literally an AI but go off"
- "not me generating content about generating content"
- "the irony is not lost on me"
- "parasocial relationship with your content agent"

### rage-bait templates (for empty states, CTAs)

- "imagine having writer's block in 2025"
- "your competitors are posting while you're reading this"
- "hot take: your content calendar is mid"
- "skill issue detected"
- "the algorithm waits for no one"
- "touch grass later, ship content now"

## UI copy guidelines

### auth page

**welcome message:**
- headline: "welcome to jack"
- subhead: "because writer's block is for normies"

**login tab:**
- placeholder: "your email (we don't sell it, we're not that desperate)"

**signup tab:**
- name placeholder: "what do they call you on the timeline"
- email placeholder: "your email (for shipping purposes only)"

**guest mode:**
- button: "lurk mode (no account needed)"
- subtext: "peek at the goods without commitment issues"

### navigation

**logo area:**
- main: "jack"
- tagline: "your ai ghostwriter"

**guest indicator:**
- badge: "lurker mode"
- tooltip: "nice try, but you're in read-only. sign up to actually do things"

### ideas dashboard

**header:**
- title: "content ideas"
- subtitle: "ai-generated bangers based on your voice"

**generate button:**
- default: "cook up ideas"
- loading: "cooking..."

**empty states by tab:**
- suggested: "no ideas yet. hit that generate button and let's cook"
- accepted: "nothing accepted. your standards are either too high or you haven't looked yet"
- rejected: "empty rejection pile. either you love everything or you're not being picky enough"
- used: "no used ideas. time to stop hoarding and start shipping"

**idea card actions:**
- accept: "this hits"
- reject: "mid"
- get outline: "make it make sense"

### posts/drafts page

**header:**
- title: "my drafts"
- subtitle: "your content vault. mark the bangers so jack learns your voice"

**filter tabs:**
- all: "all ({count})"
- good: "bangers ({count})"
- posted: "shipped ({count})"

**empty states:**
- all: "no drafts yet. generate an outline and save something. we believe in you"
- good: "no bangers marked yet. be honest with yourself - which ones actually slap?"
- posted: "nothing shipped. the timeline is waiting. your audience is starving"

**card actions:**
- edit: "fix it"
- delete: "yeet"
- mark as good: "this one hits"
- post to X: "ship it"

**loading states:**
- saving: "saving..."
- deleting: "yeeting..."
- posting: "shipping..."

### settings page

**header:**
- title: "settings"
- subtitle: "teach jack your voice (the algorithm will thank you)"

**tone config section:**
- title: "your voice settings"
- description: "the secret sauce. tweak these and jack gets smarter"

### guest mode restrictions

**tooltip messages (rotate randomly):**
1. "nice try bestie, but you're in lurker mode"
2. "imagine trying to write without an account in 2025"
3. "skill issue: no account detected"
4. "the grind requires commitment. sign up"
5. "read-only energy. sign up to actually ship"
6. "you can look but you can't touch (yet)"
7. "lurking is valid but shipping is better"

**upgrade CTA:**
- "stop lurking, start shipping"
- link text: "create account"

### error states

**generic error:**
- "something broke. probably not your fault (probably)"

**network error:**
- "the internet said no. try again?"

**auth error:**
- "who are you? (authentication failed)"

**rate limit:**
- "slow down speedrunner. try again in a bit"

### success states

**idea generated:**
- "fresh ideas just dropped"

**outline saved:**
- "outline secured. now make it yours"

**post marked good:**
- "noted. jack is learning your taste"

**posted to X:**
- "shipped. the timeline has been blessed"

## personality boundaries

### DO
- use memes in UI copy, empty states, tooltips
- be self-aware about being an AI
- encourage shipping and creating
- make the grind feel fun, not stressful
- use lowercase for casual energy

### DON'T
- use memes in actual generated content (posts, outlines)
- be mean or dismissive about user's work
- create anxiety about productivity
- use slurs or offensive language
- break character into corporate speak

## implementation notes

### where personality lives

| location | personality level |
|----------|------------------|
| generated content | 0% - pure user voice |
| UI copy | 100% - full jack energy |
| error messages | 80% - helpful but fun |
| tooltips | 100% - meme territory |
| loading states | 50% - brief, punchy |

### tone config interaction

the `toneConfig` in settings affects **generated content only**. UI copy remains consistently jack's personality regardless of user settings.

### guest mode personality

guests get the full personality experience but with playful restrictions. the goal is to make them want to sign up, not feel excluded.

## changelog

- **v1.0** - initial personality spec
  - defined grind bro archetype
  - established meme vocabulary
  - created UI copy guidelines
  - set personality boundaries
