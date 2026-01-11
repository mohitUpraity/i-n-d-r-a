# Firestore Composite Indexes Required

This document lists all Firestore composite indexes required for the state/city filtering feature to work properly.

## Why Indexes Are Needed

Firestore requires composite indexes when you:

1. Use `orderBy` with `where` clauses on different fields
2. Use multiple `where` clauses on different fields with `orderBy`

Our new query functions use these patterns, so indexes are mandatory.

## How to Create Indexes

When you run the app and trigger these queries for the first time, Firestore will:

1. Detect the missing index
2. Log an error in the browser console
3. Provide a clickable link to create the index automatically

**OR** you can create them manually in the Firebase Console.

## Required Indexes

### 1. State + CreatedAt Index

**Collection:** `reports`  
**Fields:**

- `state` (Ascending)
- `createdAt` (Descending)

**Used by:** `getReportsByState()` function

**Manual Creation:**

```
Firebase Console → Firestore Database → Indexes → Create Index
Collection ID: reports
Fields to index:
  - state: Ascending
  - createdAt: Descending
```

---

### 2. State + City + CreatedAt Index

**Collection:** `reports`  
**Fields:**

- `state` (Ascending)
- `city` (Ascending)
- `createdAt` (Descending)

**Used by:** `getReportsByCity()` function

**Manual Creation:**

```
Firebase Console → Firestore Database → Indexes → Create Index
Collection ID: reports
Fields to index:
  - state: Ascending
  - city: Ascending
  - createdAt: Descending
```

---

### 3. State + City Index (for utility functions)

**Collection:** `reports`  
**Fields:**

- `state` (Ascending)
- `city` (Ascending)

**Used by:** `getUniqueCitiesForState()` function

**Manual Creation:**

```
Firebase Console → Firestore Database → Indexes → Create Index
Collection ID: reports
Fields to index:
  - state: Ascending
  - city: Ascending
```

---

### 4. State Index (for utility functions)

**Collection:** `reports`  
**Fields:**

- `state` (Ascending)

**Used by:** `getUniqueStates()` function

**Note:** This is a single-field index and should be created automatically by Firestore.

---

## Index Build Time

- Small datasets (<1000 documents): ~1-2 minutes
- Medium datasets (1000-10000 documents): ~5-10 minutes
- Large datasets (>10000 documents): ~15-30 minutes

You can check index status in Firebase Console → Firestore Database → Indexes.

## Testing After Index Creation

After all indexes are built (status shows "Enabled"), test each filter mode:

1. **GPS Only** - Should work (uses existing geohash index)
2. **State Only** - Requires Index #1
3. **City Only** - Requires Index #2
4. **GPS + State** - Uses GPS query + client-side filtering (no new index)
5. **GPS + City** - Uses GPS query + client-side filtering (no new index)

## Troubleshooting

**Error:** "The query requires an index"

- **Solution:** Click the link in the console error or create the index manually

**Error:** "Index is still building"

- **Solution:** Wait for the index to finish building (check Firebase Console)

**Error:** "Missing or insufficient permissions"

- **Solution:** Update Firestore security rules to allow the query

## Production Considerations

For production deployments:

1. **Pre-create indexes** before deploying to avoid user-facing errors
2. **Use Firebase CLI** to deploy indexes from `firestore.indexes.json`:
   ```bash
   firebase deploy --only firestore:indexes
   ```
3. **Monitor index usage** in Firebase Console to optimize performance
4. **Consider pagination** for queries returning >100 results
