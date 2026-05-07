---
title: Project Dashboard
tags:
  - dashboard
---

# Project Dashboard

## Ready to implement
```dataview
TABLE phase, complexity, model FROM "tickets"
WHERE status = "ready"
SORT phase ASC
```

## In progress
```dataview
TABLE phase, file.mtime as "Started" FROM "tickets"
WHERE status = "in_progress"
```

## Recently done
```dataview
TABLE phase, file.mtime as "Completed" FROM "tickets"
WHERE status = "done"
SORT file.mtime DESC
LIMIT 10
```

## Blocked — needs human review
```dataview
LIST FROM "tickets"
WHERE status = "blocked"
```

## All tickets
```dataview
TABLE status, phase, complexity FROM "tickets"
WHERE file.name != "index"
SORT phase ASC, status ASC
```
