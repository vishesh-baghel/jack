# Manual E2E Test Plan for Jack X Content Agent

**Purpose:** Step-by-step manual testing guide for all Jack features using the Claude Code browser extension.

**Test Environment:** Local development at http://localhost:3001
**Tester:** Manual testing via browser
**Date:** 2026-01-14

---

## Pre-Test Setup

### Prerequisites
- [ ] Jack is running and accessible via browser (localhost:3001)
- [ ] Database is migrated with latest schema
- [ ] Environment variables are configured (API keys, DB URL, etc.)
- [ ] Fresh database OR known test user state

### Browser Setup
- [ ] Use Chrome (latest version)
- [ ] Clear cookies and local storage before testing
- [ ] Open browser dev tools (Network tab) to monitor API calls

---

## Test Suite 1: Authentication & User Management

### Test 1.1: Owner Login (Existing Account)
**Route:** `/auth`

| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Navigate to app root URL | Redirects to `/auth` if not logged in | [ ] |
| 2 | Observe login page | Shows "welcome back" with passphrase input | [ ] |
| 3 | Enter wrong passphrase | Shows spicy error message (rate limited after 5 attempts) | [ ] |
| 4 | Enter correct passphrase | Redirects to home page (Ideas Dashboard) | [ ] |
| 5 | Check URL | URL is `/` (home page) | [ ] |

### Test 1.2: Owner Signup (When Allowed)
**Route:** `/auth`
**Note:** Only works if ALLOW_SIGNUP=true or no owner exists

| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check signup form visibility | Form shows email, name, passphrase, confirm fields | [ ] |
| 2 | Enter invalid email | Shows validation error | [ ] |
| 3 | Enter passphrase < 8 chars | Shows "Minimum 8 characters" error | [ ] |
| 4 | Enter mismatched confirm | Shows "Passphrases don't match" error | [ ] |
| 5 | Enter valid data and submit | Creates account, redirects to home | [ ] |

### Test 1.3: Visitor/Guest Mode
**Route:** `/auth`

| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check if visitor button exists | Shows "see what I'm cooking" button (if enabled) | [ ] |
| 2 | Click visitor button | Creates guest session | [ ] |
| 3 | Observe redirect | Redirects to home page | [ ] |
| 4 | Try to generate ideas | Should show tooltip "this feature is for the owner" | [ ] |
| 5 | Try to save draft | Should show tooltip restriction | [ ] |

### Test 1.4: Session Persistence
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Login as owner | Session created | [ ] |
| 2 | Refresh page (F5) | Still logged in, no redirect to auth | [ ] |
| 3 | Close browser tab, reopen app | Still logged in (session persists) | [ ] |
| 4 | Navigate to protected route directly | Access granted, no auth redirect | [ ] |

### Test 1.5: Logout
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Click logout button in navigation | Session cleared | [ ] |
| 2 | Check redirect | Redirects to `/auth` | [ ] |
| 3 | Try to access home page | Redirects back to `/auth` | [ ] |

---

## Test Suite 2: Ideas Dashboard

### Test 2.1: Ideas Page Load
**Route:** `/` (home)

| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Navigate to home page | Ideas Dashboard loads | [ ] |
| 2 | Check page elements | Shows "Generate Ideas" button, filters, ideas list | [ ] |
| 3 | Check status filter | Shows dropdown with: suggested, accepted, rejected, used | [ ] |
| 4 | Check date filter | Shows: Last week, Last month, All time options | [ ] |

### Test 2.2: Generate Ideas
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Click "Generate Ideas" button | Shows loading state | [ ] |
| 2 | Wait for generation (10-30 sec) | Ideas appear in list | [ ] |
| 3 | Check idea count | 3-5 new ideas generated | [ ] |
| 4 | Check idea structure | Each idea has: title, description, rationale, pillar, engagement | [ ] |
| 5 | Check status | New ideas have status "suggested" | [ ] |

### Test 2.3: Idea Filtering
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Select "suggested" status | Shows only suggested ideas | [ ] |
| 2 | Select "accepted" status | Shows only accepted ideas (or empty) | [ ] |
| 3 | Select "rejected" status | Shows only rejected ideas (or empty) | [ ] |
| 4 | Select "All time" date filter | Shows all ideas regardless of date | [ ] |
| 5 | Select "Last week" filter | Shows only recent ideas | [ ] |

### Test 2.4: Idea Actions
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Click "Accept" on an idea | Status changes to "accepted" | [ ] |
| 2 | Verify UI update | Idea card reflects accepted status | [ ] |
| 3 | Click "Reject" on another idea | Status changes to "rejected" | [ ] |
| 4 | Click "Generate Outline" on accepted idea | Navigates to outline page | [ ] |

### Test 2.5: Pagination
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Generate enough ideas (12+) | Pagination appears | [ ] |
| 2 | Click "Next" page | Shows next set of ideas | [ ] |
| 3 | Click "Previous" page | Returns to first page | [ ] |
| 4 | Check page indicator | Shows current page number | [ ] |

---

## Test Suite 3: Creators Management

### Test 3.1: Creators Page Load
**Route:** `/creators`

| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Navigate to `/creators` | Creators page loads | [ ] |
| 2 | Check page elements | Shows add creator form, creator list, daily limit | [ ] |
| 3 | Check empty state | If no creators, shows appropriate message | [ ] |

### Test 3.2: Add Creator
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Enter X handle without @ | Input accepts text | [ ] |
| 2 | Enter X handle with @ | Input accepts text | [ ] |
| 3 | Click "Add Creator" | Shows loading state | [ ] |
| 4 | Wait for validation | Creator appears in list (or error if invalid) | [ ] |
| 5 | Check creator card | Shows handle, active status, tweet count | [ ] |

### Test 3.3: Invalid Creator Handling
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Enter invalid handle (e.g., "!!!invalid") | Shows error toast | [ ] |
| 2 | Enter duplicate handle | Shows "already tracking" error | [ ] |
| 3 | Enter empty handle | Button disabled or shows error | [ ] |

### Test 3.4: Creator Actions
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Click toggle on active creator | Creator becomes inactive | [ ] |
| 2 | Click toggle again | Creator becomes active (triggers scrape) | [ ] |
| 3 | Update tweet count input | Count updates in database | [ ] |
| 4 | Click delete creator | Confirmation dialog appears | [ ] |
| 5 | Confirm delete | Creator removed from list | [ ] |

### Test 3.5: Daily Tweet Limit
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check current daily limit display | Shows configured limit | [ ] |
| 2 | Check requested tweets total | Shows sum of all creator tweet counts | [ ] |
| 3 | Update daily limit | New limit saved | [ ] |
| 4 | Check scaling indicator | Shows if requests exceed limit | [ ] |

---

## Test Suite 4: Outline Generation & Viewing

### Test 4.1: Generate Outline
**Route:** `/outline/[id]`

| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | From Ideas page, click "Generate Outline" on accepted idea | Shows loading state | [ ] |
| 2 | Wait for generation | Navigates to outline page | [ ] |
| 3 | Check outline structure | Shows format, sections, tone reminders | [ ] |

### Test 4.2: Outline Display
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check idea title at top | Displays correctly | [ ] |
| 2 | Check content pillar badge | Shows pillar category | [ ] |
| 3 | Check format type | Shows "Thread", "Tweet", etc. | [ ] |
| 4 | Check estimated length | Shows character estimate | [ ] |
| 5 | Check sections | Multiple sections with headings | [ ] |
| 6 | Check key points | Bullet list per section | [ ] |
| 7 | Check tone reminders | List of writing style reminders | [ ] |

### Test 4.3: Draft Writing
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check writing area | Large textarea visible on right | [ ] |
| 2 | Type content in textarea | Text appears, character count updates | [ ] |
| 3 | Check placeholder text | Shows "start writing here..." when empty | [ ] |
| 4 | Type very long content | Textarea handles overflow | [ ] |

### Test 4.4: Save Draft
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Write content in textarea | Content ready | [ ] |
| 2 | Click "Save as draft" | Shows loading state | [ ] |
| 3 | Wait for save | Shows success, redirects to /posts | [ ] |
| 4 | Try to save empty content | Should show validation error | [ ] |

### Test 4.5: Copy Outline
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Click "Copy outline" button | Outline copied to clipboard | [ ] |
| 2 | Paste in external app | Outline structure visible | [ ] |

---

## Test Suite 5: Posts/Drafts Management

### Test 5.1: Posts Page Load
**Route:** `/posts`

| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Navigate to `/posts` | Posts page loads | [ ] |
| 2 | Check page elements | Shows drafts list, filters | [ ] |
| 3 | Check filters | All drafts, Good posts only, Posted only | [ ] |

### Test 5.2: Draft Display
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check draft card | Shows content preview (first 100 chars) | [ ] |
| 2 | Check content type | Shows format from outline | [ ] |
| 3 | Check content pillar | Shows pillar category | [ ] |
| 4 | Check creation date | Shows timestamp | [ ] |

### Test 5.3: Edit Draft
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Click edit on a draft | Textarea becomes editable | [ ] |
| 2 | Modify content | Changes visible in textarea | [ ] |
| 3 | Click update/save | Shows loading, then success | [ ] |
| 4 | Verify changes persisted | Content reflects edits | [ ] |

### Test 5.4: Delete Draft
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Click delete on a draft | Confirmation dialog appears | [ ] |
| 2 | Click cancel | Dialog closes, draft remains | [ ] |
| 3 | Click delete again, confirm | Draft removed from list | [ ] |

### Test 5.5: Mark as Good (Learning Loop)
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Click "Mark as good" on a draft | Shows loading state | [ ] |
| 2 | Wait for processing | Success indicator shown | [ ] |
| 3 | Check "marked good" timestamp | Displays when marked | [ ] |
| 4 | Mark 3+ posts as good | Pattern learning should trigger | [ ] |
| 5 | Check Settings page | Learned patterns should update | [ ] |

### Test 5.6: Mark as Posted
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Click "Mark as posted" | Shows loading state | [ ] |
| 2 | Wait for update | Posted timestamp appears | [ ] |
| 3 | Filter by "Posted only" | Shows only posted drafts | [ ] |

### Test 5.7: Posts Filtering
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Select "All drafts" | Shows all drafts | [ ] |
| 2 | Select "Good posts only" | Shows only marked good | [ ] |
| 3 | Select "Posted only" | Shows only posted | [ ] |
| 4 | Use date range filter | Filters by date | [ ] |

---

## Test Suite 6: Settings & Tone Configuration

### Test 6.1: Settings Page Load
**Route:** `/settings`

| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Navigate to `/settings` | Settings page loads | [ ] |
| 2 | Check tone config section | Displays current settings | [ ] |
| 3 | Check custom rules section | Shows rules input and list | [ ] |
| 4 | Check learned patterns section | Shows patterns (if any) | [ ] |

### Test 6.2: Tone Configuration Display
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check lowercase setting | Shows enabled/disabled | [ ] |
| 2 | Check no emojis setting | Shows enabled/disabled | [ ] |
| 3 | Check no hashtags setting | Shows enabled/disabled | [ ] |
| 4 | Check show failures setting | Shows enabled/disabled | [ ] |
| 5 | Check include numbers setting | Shows enabled/disabled | [ ] |

### Test 6.3: Custom Rules Management
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Enter new custom rule | Text accepted | [ ] |
| 2 | Click add/save rule | Rule appears in list | [ ] |
| 3 | Click delete on a rule | Rule removed from list | [ ] |
| 4 | Save custom rules | Changes persisted | [ ] |

### Test 6.4: Learned Patterns Display
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check average post length | Shows character count | [ ] |
| 2 | Check common phrases | Shows list of phrases | [ ] |
| 3 | Check successful pillars | Shows content pillars | [ ] |
| 4 | Check style notes | Shows extracted style info | [ ] |
| 5 | Check last updated timestamp | Shows when patterns were learned | [ ] |

### Test 6.5: Visitor Mode Toggle (Owner Only)
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check visitor mode toggle visibility | Shows only for owner | [ ] |
| 2 | Toggle visitor mode on | Enables guest access | [ ] |
| 3 | Toggle visitor mode off | Disables guest access | [ ] |
| 4 | As guest, try to access visitor toggle | Should not be visible | [ ] |

---

## Test Suite 7: Navigation & Layout

### Test 7.1: Desktop Navigation
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check navigation bar | Shows logo, nav items, logout | [ ] |
| 2 | Check nav items | Ideas, Posts, Creators, Settings | [ ] |
| 3 | Click Ideas | Navigates to home | [ ] |
| 4 | Click Posts | Navigates to /posts | [ ] |
| 5 | Click Creators | Navigates to /creators | [ ] |
| 6 | Click Settings | Navigates to /settings | [ ] |
| 7 | Check active state | Current page highlighted | [ ] |

### Test 7.2: Mobile Navigation
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Resize to mobile width (<768px) | Hamburger menu appears | [ ] |
| 2 | Click hamburger menu | Navigation sheet opens | [ ] |
| 3 | Click nav item | Navigates and closes sheet | [ ] |
| 4 | Click outside sheet | Sheet closes | [ ] |

### Test 7.3: Logo and Branding
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Check logo text | Shows "jack" | [ ] |
| 2 | Click logo | Navigates to home | [ ] |
| 3 | Check dark mode | App uses dark theme | [ ] |

---

## Test Suite 8: Error Handling & Edge Cases

### Test 8.1: Network Errors
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Disable network (DevTools), try to generate ideas | Error toast displayed | [ ] |
| 2 | Re-enable network | App recovers | [ ] |
| 3 | Disable network, try to save draft | Error displayed | [ ] |

### Test 8.2: Invalid Routes
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Navigate to `/outline/invalid-id` | 404 or error page | [ ] |
| 2 | Navigate to `/nonexistent-page` | 404 page displayed | [ ] |

### Test 8.3: Rate Limiting
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Try wrong passphrase 5 times | Rate limit error appears | [ ] |
| 2 | Wait 1 minute | Can try again | [ ] |

### Test 8.4: Concurrent Operations
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Rapidly click Generate Ideas | Only one request sent | [ ] |
| 2 | Rapidly click Save Draft | No duplicate saves | [ ] |

### Test 8.5: Empty States
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | View Ideas with no ideas | Shows empty state message | [ ] |
| 2 | View Posts with no drafts | Shows empty state message | [ ] |
| 3 | View Creators with none added | Shows empty state message | [ ] |

---

## Test Suite 9: Responsive Design

### Test 9.1: Mobile View (< 768px)
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Resize browser to mobile width | Layout adapts | [ ] |
| 2 | Check navigation | Collapses to hamburger menu | [ ] |
| 3 | Check ideas cards | Stack vertically | [ ] |
| 4 | Check outline page | Writing area below outline | [ ] |
| 5 | Check buttons | Touch-friendly size | [ ] |

### Test 9.2: Tablet View (768px - 1024px)
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Resize to tablet width | Layout adapts | [ ] |
| 2 | Check two-column layouts | May adjust | [ ] |
| 3 | Check readability | All text readable | [ ] |

---

## Test Suite 10: Guest User Restrictions

### Test 10.1: Guest Action Restrictions
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Login as guest | Guest session created | [ ] |
| 2 | Try Generate Ideas button | Shows "this feature is for the owner" tooltip | [ ] |
| 3 | Try Accept/Reject idea | Shows restriction tooltip | [ ] |
| 4 | Try Generate Outline | Shows restriction tooltip | [ ] |
| 5 | Try Save Draft | Shows restriction tooltip | [ ] |
| 6 | Try Add Creator | Shows restriction tooltip | [ ] |
| 7 | Try Mark as Good | Shows restriction tooltip | [ ] |

### Test 10.2: Guest View Access
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | View Ideas Dashboard | Can see owner's demo ideas | [ ] |
| 2 | View Creators page | Can see owner's creators | [ ] |
| 3 | View Posts page | Can see owner's drafts | [ ] |
| 4 | View Settings page | Can see tone config (read-only) | [ ] |

---

## Test Suite 11: Data Integrity & Persistence

### Test 11.1: Idea Persistence
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Generate ideas | Ideas created | [ ] |
| 2 | Refresh page | Ideas still visible | [ ] |
| 3 | Logout and login | Ideas persist | [ ] |

### Test 11.2: Draft Persistence
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Save draft | Draft created | [ ] |
| 2 | Navigate away | Draft saved | [ ] |
| 3 | Return to Posts | Draft visible | [ ] |
| 4 | Refresh page | Draft persists | [ ] |

### Test 11.3: Creator Persistence
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Add creator | Creator saved | [ ] |
| 2 | Toggle active status | Status persists | [ ] |
| 3 | Update tweet count | Count persists | [ ] |
| 4 | Logout and login | All changes persist | [ ] |

---

## Test Suite 12: Learning Loop Verification

### Test 12.1: Pattern Learning Trigger
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Mark 1st post as good | Marked, no learning yet | [ ] |
| 2 | Mark 2nd post as good | Marked, no learning yet | [ ] |
| 3 | Mark 3rd post as good | Pattern learning triggers | [ ] |
| 4 | Check Settings page | Learned patterns should appear | [ ] |

### Test 12.2: Learned Patterns Impact
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | After marking 3+ good posts | Patterns learned | [ ] |
| 2 | Generate new ideas | Ideas should reflect learned style | [ ] |
| 3 | Check idea quality | Should align with marked good posts | [ ] |

---

## Test Suite 13: Security & Authorization

### Test 13.1: Route Protection
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Without login, navigate to `/` | Redirects to `/auth` | [ ] |
| 2 | Without login, navigate to `/posts` | Redirects to `/auth` | [ ] |
| 3 | Without login, navigate to `/creators` | Redirects to `/auth` | [ ] |
| 4 | Without login, call API directly | Returns 401 Unauthorized | [ ] |

### Test 13.2: Session Security
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | Modify localStorage session data | Should not grant elevated access | [ ] |
| 2 | Try to access owner features as guest | Properly blocked | [ ] |

---

## Test Suite 14: API Endpoint Testing

### Test 14.1: Ideas API
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | GET /api/ideas | Returns user's ideas | [ ] |
| 2 | POST /api/ideas/generate | Generates new ideas | [ ] |
| 3 | PATCH /api/ideas/{id} | Updates idea status | [ ] |

### Test 14.2: Creators API
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | GET /api/creators | Returns user's creators | [ ] |
| 2 | POST /api/creators | Adds new creator | [ ] |
| 3 | PATCH /api/creators/{id}/toggle | Toggles active status | [ ] |
| 4 | DELETE /api/creators/{id} | Deletes creator | [ ] |

### Test 14.3: Drafts API
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | POST /api/drafts | Creates draft | [ ] |
| 2 | PATCH /api/drafts/{id} | Updates draft | [ ] |
| 3 | DELETE /api/drafts/{id} | Deletes draft | [ ] |

### Test 14.4: Posts API
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1 | GET /api/posts | Returns user's posts | [ ] |
| 2 | PATCH /api/posts/{id}/mark-good | Marks post as good | [ ] |

---

## Test Execution Summary

| Suite | Tests | Passed | Failed | Blocked |
|-------|-------|--------|--------|---------|
| 1. Authentication | 5 | | | |
| 2. Ideas Dashboard | 5 | | | |
| 3. Creators Management | 5 | | | |
| 4. Outline Generation | 5 | | | |
| 5. Posts/Drafts | 7 | | | |
| 6. Settings | 5 | | | |
| 7. Navigation | 3 | | | |
| 8. Error Handling | 5 | | | |
| 9. Responsive Design | 2 | | | |
| 10. Guest Restrictions | 2 | | | |
| 11. Data Integrity | 3 | | | |
| 12. Learning Loop | 2 | | | |
| 13. Security | 2 | | | |
| 14. API Endpoints | 4 | | | |
| **TOTAL** | **55** | | | |

---

## Notes & Observations

_Record any bugs, unexpected behavior, or improvement suggestions here:_

1.
2.
3.

---

## Sign-Off

**Tester:** _______________
**Date:** _______________
**Overall Result:** [ ] PASS  [ ] FAIL
**Blocking Issues:** _______________
