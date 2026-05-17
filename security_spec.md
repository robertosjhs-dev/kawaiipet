# Security Specification for Kawaii PET

## Data Invariants
1. A post must have a valid `authorId` matching the creator's UID.
2. `likesCount` and `commentsCount` must be non-negative.
3. Users can only edit their own profile and posts.
4. Users cannot modify their own point balance directly (should be handled via server-side or strictly validated challenge completion).
5. Only verified emails can participate in contests (if applicable).

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Create post as another user.
   - Payload: `{ "authorId": "attacker", "petImage": "cat.jpg", "createdAt": request.time }` where `auth.uid != 'attacker'`.
2. **Resource Poisoning**: Use a 2MB string as `caption`.
3. **Ghost Field Injection**: Add `isAdmin: true` to user profile during registration.
4. **Invalid Type**: Set `likesCount` to a string `"lots"`.
5. **Timestamp Trust**: Set `createdAt` to a date in the future.
6. **Orphaned Write**: Create a comment for a post that doesn't exist.
7. **Privilege Escalation**: Update another user's points.
8. **Negative Values**: Set `points` to `-1000`.
9. **Update Gap**: Modify the `createdAt` of a post after it's been created.
10. **ID Poisoning**: Use a path-traversal ID like `../../secrets`.
11. **Metadata Manipulation**: Remove required fields like `authorId` during update.
12. **Unauthorized Deletion**: Delete a post owned by another user.

## Test Runner Plan
I will create `firestore.rules.test.ts` to verify these protections.
