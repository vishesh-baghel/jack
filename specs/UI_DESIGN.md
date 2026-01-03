# UI Design Specification

**Purpose:** Define Jack's web interface, layouts, and user interactions

---

## Design Principles

1. **Simplicity First** - No calendar, no complexity, just content creation
2. **Fast Feedback** - Show loading states, complete actions in <2s
3. **Mobile-Friendly** - Responsive but desktop-optimized
4. **Focus Mode** - Minimize distractions during content creation
5. **Progressive Disclosure** - Show only what's needed per page

---

## Pages & Layouts

### Page 1: Ideas Dashboard (`/`)

**Purpose:** Main landing, shows content ideas with filtering

**Layout:**
```
┌────────────────────────────────────────────────┐
│  Jack              vishesh@example.com  [⚙️]   │
├────────────────────────────────────────────────┤
│                                                │
│  content ideas                  [generate ideas]│
│  ai-generated ideas based on your voice        │
│                                                │
│  ┌───────────────────────────────┐ [Past 7 days ▾]
│  │suggested│accepted│rejected│used│             │
│  └───────────────────────────────┘              │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 💡 MCP Server Debugging Patterns         │ │
│  │                                          │ │
│  │ Share the 6-hour debugging session      │ │
│  │ where console.info broke the protocol   │ │
│  │                                          │ │
│  │ Why this works:                          │ │
│  │ • MCP trending (12 creators mentioned)  │ │
│  │ • You recently solved this              │ │
│  │ • Matches your "show struggle" pattern  │ │
│  │                                          │ │
│  │ Thread · Lessons Learned · High eng.    │ │
│  │                                          │ │
│  │ [Get Outline]  [Skip]                   │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 💡 Postgres Performance Optimization     │ │
│  │ ...                                      │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [+3 More Ideas]                               │
│                                                │
│  ────────────────────────────────────────────  │
│                                                │
│  Quick Actions                                 │
│  • Update current projects                     │
│  • View trending topics                        │
│  • View my drafts                              │
│                                                │
└────────────────────────────────────────────────┘
```

**Learning Indicator:**
- Shows ⭐ "Learned from X posts" when user has marked posts as good
- Clicking opens modal showing learned patterns
- Updates automatically when new posts are marked as good

**Components:**

**Idea Card:**
```tsx
<Card>
  <CardHeader>
    <h3>{idea.title}</h3>
    <Badge>{idea.contentPillar}</Badge>
  </CardHeader>
  <CardContent>
    <p>{idea.description}</p>
    <div className="rationale">
      {idea.rationale.split('\n').map(line => (
        <p>• {line}</p>
      ))}
    </div>
    <div className="meta">
      <span>{idea.suggestedFormat}</span>
      <span>{idea.estimatedEngagement}</span>
    </div>
  </CardContent>
  <CardFooter>
    <Button onClick={createDraft}>Create Draft</Button>
    <Button variant="ghost" onClick={skip}>Skip</Button>
  </CardFooter>
</Card>
```

---

### Page 2: Outline Viewer (`/outline/[id]`)

**Purpose:** View structured outline and write content

**Layout:**
```
┌────────────────────────────────────────────────┐
│  ← Back to Ideas                    [⚙️]       │
├────────────────────────────────────────────────┤
│                                                │
│  Outline: MCP Server Debugging Patterns        │
│  Thread · 5-8 tweets · Lessons Learned         │
│  ⭐ Tone: show struggle, include hours         │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 1. Hook (Attention-grabbing)             │ │
│  │                                          │ │
│  │ Key Points:                              │ │
│  │ • Mention 6-hour debugging session       │ │
│  │ • Tease the silly mistake                │ │
│  │ • Create curiosity                       │ │
│  │                                          │ │
│  │ Example:                                 │ │
│  │ "spent 6 hours debugging my mcp server"  │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 2. Problem Context                       │ │
│  │                                          │ │
│  │ Key Points:                              │ │
│  │ • What you were trying to build          │ │
│  │ • Expected behavior vs actual            │ │
│  │ • Initial confusion                      │ │
│  │                                          │ │
│  │ Tone: honest, show the struggle          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [+4 More Sections]                            │
│                                                │
│  ────────────────────────────────────────────  │
│                                                │
│  Writing Area                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ Start writing your content here...       │ │
│  │                                          │ │
│  │ (Use outline above as structure)         │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [Save Draft]  [Copy Outline]                 │
│                                                │
└────────────────────────────────────────────────┘
```

**Components:**

**Outline Section:**
```tsx
<Card>
  <CardHeader>
    <h3>{section.heading}</h3>
  </CardHeader>
  <CardContent>
    <div className="key-points">
      <p className="font-medium">Key Points:</p>
      <ul>
        {section.keyPoints.map(point => (
          <li key={point}>• {point}</li>
        ))}
      </ul>
    </div>
    
    {section.toneGuidance && (
      <Alert>
        <AlertDescription>
          <strong>Tone:</strong> {section.toneGuidance}
        </AlertDescription>
      </Alert>
    )}
    
    {section.examples && section.examples.length > 0 && (
      <div className="examples">
        <p className="font-medium">Example:</p>
        {section.examples.map(ex => (
          <p key={ex} className="text-muted-foreground italic">
            "{ex}"
          </p>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

**Actions:**
- Save Draft → Saves content written in writing area
- Copy Outline → Copies outline structure to clipboard

---

### Page 3: Settings (`/settings`)

**Purpose:** Configure Jack's behavior

**Layout:**
```
┌────────────────────────────────────────────────┐
│  ← Back                                [⚙️]    │
├────────────────────────────────────────────────┤
│                                                │
│  Settings                                      │
│                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                │
│  Visitor Mode                     [Active]     │
│                                                │
│  let others explore your jack in read-only mode│
│  visitor mode is on             [Toggle ━●]    │
│  visitors can browse your content without      │
│  making changes                                │
│                                                │
│  guest access url: http://localhost:3000/auth  │
│  visitors can click "continue as guest" to     │
│  explore your jack                             │
│                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                │
│  Tone Configuration                            │
│                                                │
│  Writing Style                                 │
│  [x] Lowercase (except proper nouns)           │
│  [ ] Use emojis                                │
│  [ ] Use hashtags                              │
│  [x] Direct, casual tone                       │
│                                                │
│  Technical Depth                               │
│  ( ) Light  (•) Moderate  ( ) Deep             │
│                                                │
│  Storytelling Elements                         │
│  [x] Mention no degree, no big tech            │
│  [x] Show build-in-public journey              │
│  [x] Share failures and struggles              │
│  [x] Include real numbers (time, cost)         │
│                                                │
│  Learned Patterns                              │
│  Jack has analyzed 12 of your posts            │
│  • Avg length: 180 characters                  │
│  • Common phrases: "spent X hours", "saved $Y" │
│  • Success pattern: sharing failures (680 avg) │
│                                                │
│  [Save Changes]                                │
│                                                │
└────────────────────────────────────────────────┘
```

**Projects Tab:**
```
┌──────────────────────────────────────────────┐
│  Current Projects                            │
│                                              │
│  What are you building right now?            │
│  Jack uses this context for content ideas    │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Portfolio v2             [Active] [✎]  │ │
│  │ Redesigning portfolio with AI agent    │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ MCP Experiments          [Active] [✎]  │ │
│  │ Building MCP servers for experiments   │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [+ Add Project]                             │
│                                              │
└──────────────────────────────────────────────┘
```

**Creators Tab (Page: `/creators`):**
```
┌──────────────────────────────────────────────┐
│  watchlist                                   │
│  content creators inspiring your agent       │
│                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                              │
│  daily tweet budget                          │
│  maximum tweets to scrape per day across     │
│  all creators                                │
│                                              │
│  tweets per day                              │
│  [____50____]  [save]                        │
│                                              │
│  total requested: 30/50                      │
│  ✓ within budget - no scaling needed        │
│                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                              │
│  actively stalking 2                         │
│                                              │
│  [+ track new creator]                       │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ● @levelsio                            │ │
│  │   added 2 days ago                     │ │
│  │                                        │ │
│  │   (scaled to 7)  [10] tweets           │ │
│  │                      [chill] [yeet]    │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ● @swyx                                │ │
│  │   added 2 days ago                     │ │
│  │                                        │ │
│  │   (scaled to 14) [20] tweets [save]   │ │
│  │                      [chill] [yeet]    │ │
│  └────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
```

**Tweet Count Behavior:**
- Each creator has configurable tweet count (1-100 tweets/day)
- Number input shows requested tweets
- "save" button appears only when value changes
- When total requested > daily limit: proportional scaling applies
- Scaling message "(scaled to X)" shown LEFT of input when active
- Amber color indicates proportional scaling is active

**Daily Budget:**
- Global limit controls max tweets/day across all creators
- Range: 1-1000 tweets
- Live calculation shows: `total requested / daily limit`
- Visual indicators:
  - Green ✓ "within budget" when under limit
  - Amber ⚠ "proportional scaling active" when exceeding limit

**Proportional Scaling Example:**
- User A requests 40 tweets, User B requests 30 tweets (Total: 70)
- Daily limit: 50 tweets
- Scaling factor: 50/70 = 0.714
- User A gets: floor(40 × 0.714) = 28 tweets
- User B gets: floor(30 × 0.714) = 21 tweets
- Minimum 1 tweet per active creator guaranteed

**Creator Actions:**
- **chill:** Pause creator (toggle isActive = false)
- **yeet:** Delete creator with confirmation
- Green dot = active, Gray dot = paused

---

### Page 4: My Drafts (`/posts`)

**Purpose:** View saved drafts, manage content, and mark successful posts as "good" for learning

**Layout:**
```
┌────────────────────────────────────────────────┐
│  Jack              vishesh@example.com  [⚙️]   │
├────────────────────────────────────────────────┤
│                                                │
│  my drafts                                     │
│  saved drafts from your outlines               │
│                                                │
│  ┌─────────────────────────┐  [Past 7 days ▾] │
│  │ all │ good │ posted     │                   │
│  └─────────────────────────┘                   │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │ [lessons_learned]  thread              │   │
│  │ 2 hours ago                            │   │
│  │                                        │   │
│  │ ┌────────────────────────────────────┐ │   │
│  │ │ spent 6 hours debugging my mcp     │ │   │
│  │ │ server. turns out console.info()...│ │   │
│  │ └────────────────────────────────────┘ │   │
│  │                                        │   │
│  │ [edit] [delete]     [mark as good] [post to X] │
│  └────────────────────────────────────────┘   │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │ [helpful_content]  post  [good] [posted]│   │
│  │ yesterday · marked good 1 hour ago     │   │
│  │ · posted 2 hours ago                   │   │
│  │                                        │   │
│  │ ┌────────────────────────────────────┐ │   │
│  │ │ postgres indexes saved me 2 secs...│ │   │
│  │ └────────────────────────────────────┘ │   │
│  │                                        │   │
│  │ [edit] [delete]                        │   │
│  └────────────────────────────────────────┘   │
│                                                │
└────────────────────────────────────────────────┘
```

**Filter Tabs:**
- **all:** Show all drafts
- **good:** Show only drafts marked as good
- **posted:** Show only posted drafts

**Date Range Filter:**
- Dropdown on right side of tabs
- Options: Past 7 days (default), Past 15 days, Past month, Custom range
- Custom range shows date pickers
- Persists across page navigation via localStorage

**Draft Card Actions:**
- **edit:** Opens inline textarea for editing (disabled if posted)
- **delete:** Removes draft with confirmation
- **mark as good:** Marks for learning (only if not already marked)
- **post to X:** Changes status to posted (future: actual X integration)

**States & Badges:**
- **Draft:** No badges, all actions available
- **Posted:** Shows "posted" badge, edit disabled
- **Marked as good:** Shows "good" badge

**"Mark as Good" Criteria:**
- User manually decides after posting
- Typically: high engagement, resonated well, authentic voice
- Jack will analyze these for patterns

---

### Page 5: Analytics (V2 - Not MVP)

**Purpose:** Show performance patterns (Post-MVP feature)

**Note:** Performance tracking and analytics deferred to V2.
In MVP, focus is on the learning loop (mark as good → analyze patterns → improve ideas).

---

## Component Library

### Using shadcn/ui + Tailwind

**Core Components:**
- `<Card>` - For idea cards, drafts
- `<Button>` - Primary actions
- `<Textarea>` - Draft editing
- `<Badge>` - Content pillars, status
- `<Tabs>` - Settings navigation
- `<Dialog>` - Confirmations
- `<Skeleton>` - Loading states

**Custom Components:**

**IdeaCard:**
```tsx
interface IdeaCardProps {
  idea: ContentIdea;
  onCreateDraft: () => void;
  onSkip: () => void;
}

export function IdeaCard({ idea, onCreateDraft, onSkip }: IdeaCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium">{idea.title}</h3>
          <Badge variant="secondary">
            {idea.contentPillar.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground">{idea.description}</p>
        
        <div className="text-sm space-y-1">
          <p className="font-medium">Why this works:</p>
          {idea.rationale.split('\n').map((line, i) => (
            <p key={i} className="text-muted-foreground">• {line}</p>
          ))}
        </div>
        
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{idea.suggestedFormat}</span>
          <span>·</span>
          <span>{idea.estimatedEngagement} engagement</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={onCreateDraft}>Create Draft</Button>
        <Button variant="ghost" onClick={onSkip}>Skip</Button>
      </CardFooter>
    </Card>
  );
}
```

**TweetEditor:**
```tsx
interface TweetEditorProps {
  content: string;
  index: number;
  onChange: (content: string) => void;
  onRegenerate: () => void;
}

export function TweetEditor({ 
  content, 
  index, 
  onChange, 
  onRegenerate 
}: TweetEditorProps) {
  const charCount = content.length;
  const isOverLimit = charCount > 280;
  
  return (
    <div className="space-y-2 p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <span className="font-medium">Tweet {index}</span>
        <span className={cn(
          "text-sm",
          isOverLimit ? "text-destructive" : "text-muted-foreground"
        )}>
          ({charCount})
        </span>
      </div>
      
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={cn(isOverLimit && "border-destructive")}
      />
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onRegenerate}
      >
        Regenerate This Tweet
      </Button>
    </div>
  );
}
```

---

## Loading States

**Ideas Loading:**
```tsx
<div className="space-y-4">
  <Skeleton className="h-8 w-48" />
  <Skeleton className="h-48 w-full" />
  <Skeleton className="h-48 w-full" />
  <Skeleton className="h-48 w-full" />
</div>
```

**Draft Generating:**
```tsx
<Card>
  <CardContent className="p-8 text-center">
    <Loader2 className="animate-spin mx-auto mb-4" />
    <p>Jack is creating your draft...</p>
    <p className="text-sm text-muted-foreground">This takes about 10 seconds</p>
  </CardContent>
</Card>
```

---

## Mobile Responsive

**Breakpoints:**
- `sm:` 640px - Stack idea cards
- `md:` 768px (768px+) - Desktop navigation appears
- `lg:` 1024px - Optimal desktop view
- `xl:` 1280px - Max width container

**Navigation Responsive Behavior:**

**Desktop (≥768px):**
```
┌────────────────────────────────────────────────┐
│ jack  visitor mode  ideas  posts  creators  settings  [logout] │
└────────────────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌────────────────────────────────────────────────┐
│ jack  visitor mode                      [☰]    │
└────────────────────────────────────────────────┘
```

Clicking hamburger opens slide-in sheet from right with all nav links.

**Mobile Adjustments:**
- Hamburger menu for navigation (< 768px)
- Single column layout
- Smaller cards
- Bottom sheet for draft editor
- Touch-optimized button sizes

---

## Keyboard Shortcuts

- `Cmd/Ctrl + K` - Quick actions
- `Cmd/Ctrl + R` - Refresh ideas
- `Cmd/Ctrl + N` - New project
- `Escape` - Close dialog/modal

---

## Error States

**No Ideas Generated:**
```tsx
<Card>
  <CardContent className="p-8 text-center">
    <AlertCircle className="mx-auto mb-4 text-muted-foreground" />
    <p>No ideas generated yet</p>
    <Button onClick={generateIdeas} className="mt-4">
      Generate Ideas
    </Button>
  </CardContent>
</Card>
```

**Failed to Fetch:**
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Failed to fetch trending topics</AlertTitle>
  <AlertDescription>
    Check your internet connection and try again.
    <Button variant="outline" size="sm" onClick={retry}>
      Retry
    </Button>
  </AlertDescription>
</Alert>
```

---

## Accessibility

- Semantic HTML (`<main>`, `<nav>`, `<article>`)
- ARIA labels for icons
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- Color contrast WCAG AA compliant
